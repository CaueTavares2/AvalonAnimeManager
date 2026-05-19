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
    const targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).json({ error: 'Missing url parameter' });

    // Check cache
    const cached = cache.get(targetUrl);
    if (cached && cached.expiry > Date.now()) {
      if (cached.contentType) res.setHeader('Content-Type', cached.contentType);
      return res.status(cached.status).send(cached.data);
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
      } catch (e) {}
    }

    const performFetch = async () => {
      const urlObj = new URL(targetUrl);
      const isMangaDex = targetUrl.includes('mangadex');
      const isAnimeMetadata = targetUrl.includes('api.jikan.moe');
      
      const USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
      ];

      const fetchWithRetry = async (url: string, options: any, maxRetries = 2) => {
        let lastError: any;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          const controller = new AbortController();
          const timeout = 15000;
          const id = setTimeout(() => controller.abort(), timeout);
          
          try {
            const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
            const headers = { 
              ...options.headers, 
              'User-Agent': ua,
              'X-Forwarded-For': `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`
            };

            const response = await fetch(url, { ...options, headers, signal: controller.signal });
            if (response.status === 429 && attempt < maxRetries - 1) {
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); 
              continue;
            }
            return response;
          } catch (err: any) {
            lastError = err;
            if (attempt < maxRetries - 1) await new Promise(r => setTimeout(r, 500));
          } finally {
            clearTimeout(id);
          }
        }
        throw lastError;
      };

      const response = await fetchWithRetry(targetUrl, {
        headers: {
          'Referer': isMangaDex ? 'https://mangadex.org' : urlObj.origin + '/',
          'Accept': '*/*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        }
      });

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const buffer = Buffer.from(await response.arrayBuffer());
      
      const result = { data: buffer, contentType, status: response.status, expiry: Date.now() + CACHE_TTL };
      if (response.status === 200) {
        // Longer cache for metadata and images
        const isLongCache = isAnimeMetadata || targetUrl.includes('.jpg') || targetUrl.includes('.png') || targetUrl.includes('.webp');
        if (isLongCache) result.expiry = Date.now() + (CACHE_TTL * 6);
        
        cache.set(targetUrl, result);
        if (cache.size > 1000) {
          const firstKey = cache.keys().next().value;
          if (firstKey) cache.delete(firstKey);
        }
      }
      return result;
    };

    const p = performFetch();
    pendingRequests.set(targetUrl, p);
    try {
      const result = await p;
      res.status(result.status).setHeader('Content-Type', result.contentType).send(result.data);
    } catch (error) {
      console.error('[Proxy Error]', targetUrl, error);
      if (!res.headersSent) res.status(500).json({ error: 'Proxy failed', message: String(error) });
    } finally {
      pendingRequests.delete(targetUrl);
    }
  });

  // Image proxy
  app.get('/api/image-proxy', async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).send('Missing url');
    
    const cached = cache.get(url);
    if (cached && cached.expiry > Date.now()) {
      if (cached.contentType) res.setHeader('Content-Type', cached.contentType);
      return res.status(cached.status).send(cached.data);
    }

    try {
      const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const contentType = resp.headers.get('content-type') || 'image/jpeg';
      const buffer = Buffer.from(await resp.arrayBuffer());
      cache.set(url, { data: buffer, contentType, status: resp.status, expiry: Date.now() + (CACHE_TTL * 6) });
      res.status(resp.status).setHeader('Content-Type', contentType).send(buffer);
    } catch (e) { res.status(500).send('Fail'); }
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
