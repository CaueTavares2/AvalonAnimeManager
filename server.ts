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

        try {
            const url = new URL(targetUrl);
            const isMangaDex = targetUrl.includes('mangadex');
            
            const response = await fetch(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                    'Referer': isMangaDex ? 'https://mangadex.org' : url.origin + '/',
                    'Accept': '*/*'
                }
            });

            const contentType = response.headers.get('content-type');
            if (contentType) res.setHeader('Content-Type', contentType);
            
            const buffer = Buffer.from(await response.arrayBuffer());
            res.status(response.status).send(buffer);
        } catch (error) {
            console.error('[Proxy Error]', targetUrl, error);
            if (!res.headersSent) res.status(500).json({ error: 'Proxy failed', message: String(error) });
        }
    });

    // Simple cache for images only to save bandwidth
    const imageCache = new Map();
    app.get('/api/image-proxy', async (req, res) => {
        const url = req.query.url as string;
        if (!url) return res.status(400).send('Missing url');
        
        if (imageCache.has(url)) return res.send(imageCache.get(url));

        try {
            const resp = await fetch(url);
            const buffer = Buffer.from(await resp.arrayBuffer());
            imageCache.set(url, buffer);
            if (imageCache.size > 500) imageCache.clear();
            res.send(buffer);
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
