import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Readable } from 'stream';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Simple in-memory cache
  const cache = new Map<string, { data: Buffer, contentType: string, status: number, expiry: number }>();
  const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

  // Proxy endpoint to bypass CORS and set headers with support for streaming/range requests
  app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    const isRetry = req.query.retry !== undefined;
    const rangeHeader = req.headers.range;

    // We only serve from cache if there is NO range requested
    const cached = (!rangeHeader && !isRetry) ? cache.get(targetUrl) : null;
    
    if (cached && cached.expiry > Date.now()) {
      console.log(`[Proxy] Cache hit: ${targetUrl}`);
      res.status(cached.status);
      if (cached.contentType) res.setHeader('Content-Type', cached.contentType);
      return res.send(cached.data);
    }

    console.log(`[Proxy] Requesting: ${targetUrl}${rangeHeader ? ` with Range: ${rangeHeader}` : ''}`);

    let urlObj: URL;
    try {
      if (!targetUrl.startsWith('http')) {
        throw new Error('Target URL must be absolute (start with http/https)');
      }
      urlObj = new URL(targetUrl);
    } catch (e: any) {
      console.error(`[Proxy] Invalid target URL: "${targetUrl}" - ${e.message}`);
      return res.status(400).json({ error: 'Invalid URL provided' });
    }

    // Abort controller linked to both time limits and client disconnect
    const controller = new AbortController();
    
    // If the client aborts, cancel the upstream fetch immediately to save bandwidth
    req.on('close', () => {
      controller.abort();
    });

    try {
      const referer = urlObj.origin + '/';

      const USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
      ];

      const fetchWithRetry = async (url: string, options: any, maxRetries = 3) => {
        let lastError: any;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          const timeout = 15000 + (attempt * 5000);
          const timeoutId = setTimeout(() => {
            controller.abort();
          }, timeout);
          
          try {
            const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
            const headers = { 
              ...options.headers, 
              'User-Agent': ua,
              'X-Forwarded-For': `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`
            };

            const response = await fetch(url, { 
              ...options, 
              headers,
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.status === 429) {
              const retryAfter = response.headers.get('retry-after');
              const wait = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * (attempt + 1);
              console.warn(`[Proxy] 429 for ${url}. Waiting ${wait}ms...`);
              await new Promise(r => setTimeout(r, wait));
              continue;
            }

            if (!response.ok && attempt < maxRetries - 1 && response.status >= 500) {
              console.warn(`[Proxy] ${response.status} for ${url}. Retrying...`);
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
              continue;
            }

            return response;
          } catch (err: any) {
            clearTimeout(timeoutId);
            lastError = err;
            if (!err.message?.includes('fetch failed') && !err.message?.includes('getaddrinfo') && err.name !== 'AbortError') {
              console.error(`[Proxy] Attempt ${attempt + 1} failed for ${url}: ${err.message}`);
            }
            if (err.name === 'AbortError') {
              throw err;
            }
            if (attempt < maxRetries - 1) {
              const delay = 1000 * (attempt + 1);
              await new Promise(r => setTimeout(r, delay));
            }
          }
        }
        throw lastError;
      };

      const getHeaders = (simple = false) => {
        const base: any = {
          'Accept': '*/*',
          'Referer': targetUrl.includes('strem.fun') ? 'https://web.stremio.com/' : referer,
          'Connection': 'keep-alive',
        };
        if (rangeHeader) {
          base['Range'] = rangeHeader;
        }
        if (simple) return base;
        
        return {
          ...base,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Origin': targetUrl.includes('strem.fun') ? 'https://web.stremio.com' : referer.replace(/\/$/, ''),
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': targetUrl.includes('strem.fun') ? 'empty' : 'document',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
        };
      };

      let response;
      try {
        response = await fetchWithRetry(targetUrl, { headers: getHeaders() });
      } catch (err: any) {
        // Final fallback with very simple headers
        console.warn(`[Proxy] All standard attempts failed for ${targetUrl}. Trying simple headers fallback...`);
        response = await fetchWithRetry(targetUrl, { headers: getHeaders(true) }, 1);
      }

      console.log(`[Proxy] Response: ${response.status} ${response.statusText}`);

      res.status(response.status);

      const contentType = response.headers.get('content-type') || '';
      const contentLength = response.headers.get('content-length');
      const contentRange = response.headers.get('content-range');
      const acceptRanges = response.headers.get('accept-ranges');

      if (contentType) res.setHeader('Content-Type', contentType);
      if (contentLength) res.setHeader('Content-Length', contentLength);
      if (contentRange) res.setHeader('Content-Range', contentRange);
      
      res.setHeader('Accept-Ranges', acceptRanges || 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');

      const isVideo = contentType.startsWith('video/') || 
                      contentType.startsWith('audio/') || 
                      targetUrl.includes('.mp4') || 
                      targetUrl.includes('.ts') || 
                      targetUrl.includes('.mkv') ||
                      response.status === 206 ||
                      (contentLength && parseInt(contentLength) > 10 * 1024 * 1024);

      if (isVideo) {
        console.log(`[Proxy] Streaming started for target: ${targetUrl} (Type: ${contentType}, Size: ${contentLength || 'unknown'}, Code: ${response.status})`);
        if (response.body) {
          const stream = Readable.fromWeb(response.body as any);
          stream.on('error', (err) => {
            if (err.name !== 'AbortError') {
              console.error(`[Proxy] Stream piping encountered error:`, err.message);
            }
          });
          stream.pipe(res);
        } else {
          res.end();
        }
      } else {
        const data = await response.arrayBuffer();
        const buffer = Buffer.from(data);
        
        if (response.status >= 400) {
          if (contentType && !contentType.includes('text/html')) {
            console.log(`[Proxy] Error Response Body (${targetUrl}): ${buffer.toString('utf-8').slice(0, 500)}`);
          }
        }
        
        if (response.status === 200 && !rangeHeader) {
          cache.set(targetUrl, {
            data: buffer,
            contentType: contentType || 'application/octet-stream',
            status: response.status,
            expiry: Date.now() + CACHE_TTL
          });

          if (cache.size > 2000) {
            const now = Date.now();
            for (const [key, val] of cache.entries()) {
              if (val.expiry < now) cache.delete(key);
              if (cache.size <= 1500) break;
            }
          }
        }
        res.send(buffer);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log(`[Proxy] Request aborted by client/timeout: ${targetUrl}`);
        if (!res.headersSent) {
          res.status(499).json({ error: 'Client closed request' });
        }
      } else {
        console.error(`[Proxy] Error for ${targetUrl}:`, error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to fetch target URL' });
        }
      }
    }
  });

  // Body parser for JSON
  app.use(express.json());

  // GitHub Feedback Endpoint
  app.post('/api/feedback/github', async (req, res) => {
    const { title, description, user, type } = req.body;
    
    const token = process.env.GITHUB_FEEDBACK_TOKEN;
    const owner = process.env.GITHUB_REPO_OWNER;
    const repo = process.env.GITHUB_REPO_NAME;

    if (!token || !owner || !repo) {
      console.warn('[Feedback] GitHub integration not fully configured.');
      return res.status(503).json({ error: 'GitHub integration not configured' });
    }

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Avalon-Feedback-App'
        },
        body: JSON.stringify({
          title: `[${type}] ${title}`,
          body: `**User:** ${user.name} (${user.email})\n**Type:** ${type}\n\n**Description:**\n${description}\n\n--- \n*Sent via Avalon Feedback App*`,
          labels: [type.toLowerCase(), 'feedback']
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      res.json({ success: true, url: data.html_url, number: data.number });
    } catch (error: any) {
      console.error('[Feedback] GitHub Error:', error);
      res.status(500).json({ error: 'Failed to create GitHub issue' });
    }
  });

  // GitHub Feedback Endpoint update
  app.patch('/api/feedback/github/:number', async (req, res) => {
    const { number } = req.params;
    const { state } = req.body; // e.g., 'closed'
    
    const token = process.env.GITHUB_FEEDBACK_TOKEN;
    const owner = process.env.GITHUB_REPO_OWNER;
    const repo = process.env.GITHUB_REPO_NAME;

    if (!token || !owner || !repo) {
      return res.status(503).json({ error: 'GitHub integration not configured' });
    }

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${number}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Avalon-Feedback-App'
        },
        body: JSON.stringify({ state })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      res.json({ success: true, state: data.state });
    } catch (error: any) {
      console.error('[Feedback] GitHub Patch Error:', error);
      res.status(500).json({ error: 'Failed to update GitHub issue' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
