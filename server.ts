import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Simple in-memory cache
  const cache = new Map<string, { data: Buffer, contentType: string, status: number, expiry: number }>();
  const CACHE_TTL = 1000 * 60 * 10; // 10 minutes
  const pendingRequests = new Map<string, Promise<any>>();

  // Proxy endpoint to bypass CORS and set headers
  app.get('/api/proxy', async (req, res) => {
    const targetUrlRaw = req.query.url as string;
    if (!targetUrlRaw) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    // Attempt to decode in case of double encoding
    let targetUrl = targetUrlRaw.trim();
    if (targetUrl.includes('%') && !targetUrl.toLowerCase().startsWith('http')) {
       try {
         targetUrl = decodeURIComponent(targetUrl);
       } catch (e) {
         console.warn(`[Proxy] Failed to decode targetUrl: ${targetUrlRaw}`);
       }
    }

    // Clean up potential double slashes (except after protocol)
    targetUrl = targetUrl.replace(/([^:]\/)\/+/g, "$1");

    // Check cache
    const isRetry = req.query.retry !== undefined;
    const isMetadata = targetUrl.includes('/v4/anime/') || targetUrl.includes('/v4/manga/') || (targetUrl.includes('mangadex') && !targetUrl.includes('/feed') && !targetUrl.includes('/at-home/'));
    const isImage = targetUrl.includes('/at-home/server/') || targetUrl.includes('.jpg') || targetUrl.includes('.png') || targetUrl.includes('.webp');
    
    // Adaptive TTL: Metadata (1hr), Images (24hrs), Others (10min)
    let dynamicTTL = CACHE_TTL;
    if (isMetadata) dynamicTTL = 1000 * 60 * 60; // 1 hour
    if (isImage) dynamicTTL = 1000 * 60 * 60 * 24; // 24 hours
    
    const cached = isRetry ? null : cache.get(targetUrl);
    
    if (cached && cached.expiry > Date.now()) {
      res.status(cached.status);
      if (cached.contentType) res.setHeader('Content-Type', cached.contentType);
      return res.send(cached.data);
    }

    // If there's already a pending request for this URL, wait for it
    if (pendingRequests.has(targetUrl)) {
      try {
        await pendingRequests.get(targetUrl);
        const secondAttemptCache = cache.get(targetUrl);
        if (secondAttemptCache) {
          res.status(secondAttemptCache.status);
          if (secondAttemptCache.contentType) res.setHeader('Content-Type', secondAttemptCache.contentType);
          return res.send(secondAttemptCache.data);
        }
      } catch (e) {
        // Fall through to try again if the pending one failed
      }
    }

    console.log(`[Proxy] Requesting: ${targetUrl}`);

    let urlObj: URL;
    try {
      if (!targetUrl.toLowerCase().startsWith('http')) {
        throw new Error(`Target URL must be absolute (starts with http/https). Received: "${targetUrl}"`);
      }
      urlObj = new URL(targetUrl);
    } catch (e: any) {
      console.error(`[Proxy] Invalid target URL: "${targetUrl}" - ${e.message}`);
      return res.status(400).json({ error: `Invalid URL provided: ${e.message}`, url: targetUrl });
    }

    const performFetch = async () => {
      const referer = urlObj.origin + '/';
      const isMangaDex = targetUrl.includes('mangadex');

      const USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
      ];

      const fetchWithRetry = async (url: string, options: any, maxRetries = 3) => {
        let lastError: any;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          const controller = new AbortController();
          const timeout = 15000 + (attempt * 5000); 
          const id = setTimeout(() => controller.abort(), timeout);
          
          try {
            const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
            const headers = { 
              ...options.headers, 
              'User-Agent': ua,
              'X-Forwarded-For': `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`
            };

            const response = await fetch(url, { ...options, headers, signal: controller.signal });

            if (response.status === 429) {
              const retryAfter = response.headers.get('retry-after');
              const wait = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * (attempt + 1);
              await new Promise(r => setTimeout(r, wait));
              continue;
            }

            if (!response.ok && attempt < maxRetries - 1 && response.status >= 500) {
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
              continue;
            }
            return response;
          } catch (err: any) {
            lastError = err;
            if (attempt < maxRetries - 1) {
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            }
          } finally {
            clearTimeout(id);
          }
        }
        throw lastError;
      };

      const getHeaders = (simple = false) => {
        const base: any = {
          'Accept': '*/*',
          'Referer': isMangaDex ? 'https://mangadex.org' : referer,
          'Connection': 'keep-alive',
        };
        if (simple) return base;
        return {
          ...base,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Origin': isMangaDex ? 'https://mangadex.org' : referer.replace(/\/$/, ''),
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Upgrade-Insecure-Requests': '1',
        };
      };

      let response;
      try {
        response = await fetchWithRetry(targetUrl, { headers: getHeaders() });
      } catch (err: any) {
        response = await fetchWithRetry(targetUrl, { headers: getHeaders(true) }, 1);
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const data = await response.arrayBuffer();
      const buffer = Buffer.from(data);
      const result = { data: buffer, contentType, status: response.status };
      
      if (response.status === 200) {
        cache.set(targetUrl, { ...result, expiry: Date.now() + dynamicTTL });
        if (cache.size > 2000) {
          const now = Date.now();
          for (const [key, val] of cache.entries()) {
            if (val.expiry < now) cache.delete(key);
            if (cache.size <= 1500) break;
          }
        }
      }
      return result;
    };

    const run = async () => {
      let result;
      if (pendingRequests.has(targetUrl)) {
        try {
          await pendingRequests.get(targetUrl);
          result = cache.get(targetUrl);
        } catch (e) {}
      }

      if (!result) {
        const p = performFetch();
        pendingRequests.set(targetUrl, p);
        try {
          result = await p;
        } finally {
          pendingRequests.delete(targetUrl);
        }
      }

      if (result) {
        res.status(result.status);
        res.setHeader('Content-Type', result.contentType);
        res.send(result.data);
      } else {
        res.status(500).json({ error: 'Failed to fetch target URL' });
      }
    };

    run().catch(err => {
      console.error(`[Proxy] Critical error for ${targetUrl}:`, err);
      if (!res.headersSent) res.status(500).json({ error: 'Internal Server Error' });
    });
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
