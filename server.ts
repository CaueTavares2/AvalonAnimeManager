import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Simple in-memory cache
  const cache = new Map<string, { data: Buffer, contentType: string, status: number, expiry: number }>();
  const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

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

    try {
      const urlObj = new URL(targetUrl);
      const isMangaDex = targetUrl.includes('mangadex');
      
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Referer': isMangaDex ? 'https://mangadex.org' : urlObj.origin + '/',
          'Accept': '*/*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        }
      });

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const buffer = Buffer.from(await response.arrayBuffer());
      
      // Cache success responses
      if (response.status === 200) {
        cache.set(targetUrl, { 
          data: buffer, 
          contentType, 
          status: 200, 
          expiry: Date.now() + CACHE_TTL 
        });
        if (cache.size > 1000) {
          const firstKey = cache.keys().next().value;
          if (firstKey) cache.delete(firstKey);
        }
      }

      res.status(response.status).setHeader('Content-Type', contentType).send(buffer);
    } catch (error) {
      console.error('[Proxy Error]', targetUrl, error);
      if (!res.headersSent) res.status(500).json({ error: 'Proxy failed', message: String(error) });
    }
  });

  // Image proxy for faster loading and CORS bypass
  app.get('/api/image-proxy', async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).send('Missing url');
    
    const cached = cache.get(url);
    if (cached && cached.expiry > Date.now()) {
      if (cached.contentType) res.setHeader('Content-Type', cached.contentType);
      return res.status(cached.status).send(cached.data);
    }

    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const contentType = resp.headers.get('content-type') || 'image/jpeg';
      const buffer = Buffer.from(await resp.arrayBuffer());
      
      cache.set(url, { 
        data: buffer, 
        contentType, 
        status: resp.status, 
        expiry: Date.now() + (CACHE_TTL * 6) // 1 hour for images
      });

      res.status(resp.status).setHeader('Content-Type', contentType).send(buffer);
    } catch (e) { 
      res.status(500).send('Fail'); 
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
