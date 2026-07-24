var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_stream = require("stream");

// server/scraper/BaseProvider.ts
var BaseScraperProvider = class {
  // Função utilitária opcional para requisições seguras com headers falsos
  async fetchHtml(url) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });
    if (!response.ok) throw new Error(`Scraper fetch failed: ${response.status}`);
    return await response.text();
  }
};

// server/scraper/providers/MuitoManga.ts
var MuitoMangaProvider = class extends BaseScraperProvider {
  constructor() {
    super(...arguments);
    this.sourceId = "muitomanga";
    this.sourceName = "MuitoManga";
  }
  async search(query) {
    return [];
  }
  async getChapters(mangaId) {
    return [];
  }
  async getPages(chapterId) {
    return [];
  }
};

// server/scraper/providers/MangaPlus.ts
var MangaPlusProvider = class extends BaseScraperProvider {
  constructor() {
    super(...arguments);
    this.sourceId = "mangaplus";
    this.sourceName = "MangaPlus";
  }
  async search(query) {
    return [];
  }
  async getChapters(mangaId) {
    return [];
  }
  async getPages(chapterId) {
    return [];
  }
};

// server/scraper/providers/NineManga.ts
var import_axios = __toESM(require("axios"), 1);
var cheerio = __toESM(require("cheerio"), 1);
var NineMangaProvider = class extends BaseScraperProvider {
  constructor() {
    super(...arguments);
    this.sourceId = "ninemanga";
    this.sourceName = "Nine Manga";
  }
  async search(query) {
    try {
      console.log(`[NineManga] Searching: ${query}`);
      const response = await import_axios.default.get(`http://localhost:3000/api/proxy?url=${encodeURIComponent(`https://ninemanga.com/search/?wd=${query}`)}`);
      const $ = cheerio.load(response.data);
      const results = [];
      $(".book_list_item").each((i, el) => {
        const title = $(el).find(".book_name").text().trim();
        const id = $(el).find("a").attr("href")?.split("/").pop() || "";
        results.push({
          id,
          title,
          source: this.sourceId
        });
      });
      console.log(`[NineManga] Search found ${results.length} results`);
      return results;
    } catch (e) {
      console.error("[NineManga] search error:", e);
      return [];
    }
  }
  async getChapters(mangaId) {
    try {
      console.log(`[NineManga] Getting chapters for: ${mangaId}`);
      const response = await import_axios.default.get(`http://localhost:3000/api/proxy?url=${encodeURIComponent(`https://ninemanga.com/manga/${mangaId}.html`)}`);
      const $ = cheerio.load(response.data);
      const chapters = [];
      $(".chapter_list tr").each((i, el) => {
        const link = $(el).find("a").attr("href");
        if (!link) return;
        const chapterNumber = $(el).find("a").text().split(" ").pop()?.replace(/[^0-9.]/g, "") || "";
        if (link && chapterNumber) {
          chapters.push({
            id: link,
            mangaId,
            chapterNumber,
            source: this.sourceName
          });
        }
      });
      console.log(`[NineManga] Found ${chapters.length} chapters`);
      return chapters;
    } catch (e) {
      console.error("[NineManga] chapter error:", e);
      return [];
    }
  }
  async getPages(chapterId) {
    try {
      console.log(`[NineManga] Getting pages for: ${chapterId}`);
      const response = await import_axios.default.get(`http://localhost:3000/api/proxy?url=${encodeURIComponent(chapterId)}`);
      const $ = cheerio.load(response.data);
      const pages = [];
      $(".chapter_img img").each((i, el) => {
        const url = $(el).attr("src") || "";
        if (url) {
          pages.push({ url });
        }
      });
      console.log(`[NineManga] Found ${pages.length} pages`);
      return pages;
    } catch (e) {
      console.error("[NineManga] pages error:", e);
      return [];
    }
  }
};

// server/scraper/providers/MangaDex.ts
var import_axios2 = __toESM(require("axios"), 1);
var MangaDexProvider = class extends BaseScraperProvider {
  constructor() {
    super(...arguments);
    this.sourceId = "mangadex";
    this.sourceName = "MangaDex";
  }
  async search(query) {
    try {
      console.log(`[MangaDex] Searching: ${query}`);
      const response = await import_axios2.default.get(`http://localhost:3000/api/proxy?url=${encodeURIComponent(`https://api.mangadex.org/manga?title=${query}&limit=5`)}`);
      const results = response.data.data.map((m) => ({
        id: m.id,
        title: m.attributes.title.en || m.attributes.title["ja-ro"],
        source: this.sourceId
      }));
      return results;
    } catch (e) {
      console.error("[MangaDex] search error:", e);
      return [];
    }
  }
  async getChapters(mangaId) {
    try {
      console.log(`[MangaDex] Getting chapters for: ${mangaId}`);
      const response = await import_axios2.default.get(`http://localhost:3000/api/proxy?url=${encodeURIComponent(`https://api.mangadex.org/manga/${mangaId}/feed?limit=500&translatedLanguage%5B%5D=pt-br&order%5Bchapter%5D=asc`)}`);
      const chapters = response.data.data.map((c) => ({
        id: c.id,
        mangaId,
        chapterNumber: c.attributes.chapter,
        title: c.attributes.title,
        source: this.sourceName
      }));
      return chapters;
    } catch (e) {
      console.error("[MangaDex] chapter error:", e);
      return [];
    }
  }
  async getPages(chapterId) {
    try {
      const response = await import_axios2.default.get(`http://localhost:3000/api/proxy?url=${encodeURIComponent(`https://api.mangadex.org/at-home/server/${chapterId}`)}`);
      const baseUrl = response.data.baseUrl;
      const hash = response.data.chapter.hash;
      const data = response.data.chapter.data;
      return data.map((filename) => ({
        url: `${baseUrl}/data/${hash}/${filename}`
      }));
    } catch (e) {
      console.error("[MangaDex] pages error:", e);
      return [];
    }
  }
};

// server/scraper/index.ts
var ScraperManager = class {
  constructor() {
    this.providers = /* @__PURE__ */ new Map();
    this.registerProvider(
      new MuitoMangaProvider(),
      new MangaPlusProvider(),
      new NineMangaProvider(),
      new MangaDexProvider()
    );
  }
  registerProvider(...providers) {
    for (const provider of providers) {
      this.providers.set(provider.sourceId, provider);
    }
  }
  getProvider(sourceId) {
    return this.providers.get(sourceId);
  }
  async getChapters(mangaId) {
    const promises = Array.from(this.providers.values()).map(async (provider) => {
      try {
        const chapters = await provider.getChapters(mangaId);
        return chapters.map((c) => ({
          ...c,
          // Normaliza o número do capítulo para comparação
          chapterNumber: c.chapterNumber.replace(/^0+/, "").toLowerCase()
        }));
      } catch (e) {
        console.error(`[Scraper] ${provider.sourceId} getChapters erro:`, e);
        return [];
      }
    });
    const results = await Promise.all(promises);
    const allChapters = results.flat();
    const uniqueChapters = /* @__PURE__ */ new Map();
    for (const chapter of allChapters) {
      const existing = uniqueChapters.get(chapter.chapterNumber);
      if (!existing || chapter.title && !existing.title) {
        uniqueChapters.set(chapter.chapterNumber, chapter);
      }
    }
    return Array.from(uniqueChapters.values());
  }
  async getPages(chapterId) {
    const promises = Array.from(this.providers.values()).map(async (provider) => {
      try {
        return await provider.getPages(chapterId);
      } catch (e) {
        return [];
      }
    });
    const results = await Promise.all(promises);
    return results.find((pages) => pages.length > 0) || [];
  }
  async searchAll(query) {
    const promises = Array.from(this.providers.values()).map(
      (p) => p.search(query).catch((e) => {
        console.error(`[Scraper] ${p.sourceId} search erro:`, e.message);
        return [];
      })
    );
    const results = await Promise.all(promises);
    return results.flat();
  }
};
var scraperManager = new ScraperManager();

// server.ts
var ALLOWED_PROXY_DOMAINS = [
  "mangadex.org",
  "uploads.mangadex.org",
  "api.mangadex.org",
  "mangafire.to",
  "mangalivre.net",
  "muitomanga.com",
  "lermanga.org",
  "supermangas.com",
  "ninemanga.com",
  "mangaplus.shueisha.co.jp",
  "images.weserv.nl",
  "i0.wp.com",
  "corsproxy.io",
  "api.allorigins.win",
  "strem.fun",
  "betterflix.click",
  "web.stremio.com",
  "myinstants.com",
  "image.tmdb.org"
];
function isAllowedProxyTarget(url) {
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") return false;
  const privatePrefixes = ["10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.", "192.168.", "169.254."];
  for (const prefix of privatePrefixes) {
    if (hostname.startsWith(prefix)) return false;
  }
  if (hostname.endsWith(".internal") || hostname.endsWith(".local")) return false;
  if (hostname.includes("169.254.169.254") || hostname.includes("metadata.google.internal")) return false;
  for (const domain of ALLOWED_PROXY_DOMAINS) {
    if (hostname === domain || hostname.endsWith("." + domain)) return true;
  }
  return false;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  const requestCounts = /* @__PURE__ */ new Map();
  function rateLimit(req, res, next) {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = requestCounts.get(ip);
    if (!entry || entry.resetAt < now) {
      requestCounts.set(ip, { count: 1, resetAt: now + 6e4 });
      next();
      return;
    }
    entry.count++;
    if (entry.count > 60) {
      res.status(429).json({ error: "Too many requests. Please slow down." });
      return;
    }
    next();
  }
  app.use("/api/", rateLimit);
  const cache = /* @__PURE__ */ new Map();
  const CACHE_TTL = 1e3 * 60 * 10;
  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).json({ error: "Missing url parameter" });
    }
    let urlObj;
    try {
      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        return res.status(400).json({ error: "Target URL must be absolute (start with http/https)" });
      }
      urlObj = new URL(targetUrl);
    } catch {
      return res.status(400).json({ error: "Invalid URL provided" });
    }
    if (!isAllowedProxyTarget(urlObj)) {
      console.warn(`[Proxy] Blocked unauthorized target: ${targetUrl}`);
      return res.status(403).json({ error: "Domain not in proxy allowlist" });
    }
    const isRetry = req.query.retry !== void 0;
    const rangeHeader = req.headers.range;
    const cached = !rangeHeader && !isRetry ? cache.get(targetUrl) : null;
    if (cached && cached.expiry > Date.now()) {
      console.log(`[Proxy] Cache hit: ${targetUrl}`);
      res.status(cached.status);
      if (cached.contentType) res.setHeader("Content-Type", cached.contentType);
      return res.send(cached.data);
    }
    console.log(`[Proxy] Requesting: ${targetUrl}${rangeHeader ? ` with Range: ${rangeHeader}` : ""}`);
    const controller = new AbortController();
    req.on("close", () => {
      controller.abort();
    });
    try {
      const referer = urlObj.origin + "/";
      const USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0"
      ];
      const fetchWithRetry = async (url, options, maxRetries = 3) => {
        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          const timeout = 15e3 + attempt * 5e3;
          const timeoutId = setTimeout(() => {
            controller.abort();
          }, timeout);
          try {
            const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
            const headers = {
              ...options.headers,
              "User-Agent": ua
            };
            const response2 = await fetch(url, {
              ...options,
              headers,
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (response2.status === 429) {
              const retryAfter = response2.headers.get("retry-after");
              const wait = retryAfter ? parseInt(retryAfter) * 1e3 : 2e3 * (attempt + 1);
              console.warn(`[Proxy] 429 for ${url}. Waiting ${wait}ms...`);
              await new Promise((r) => setTimeout(r, wait));
              continue;
            }
            if (!response2.ok && attempt < maxRetries - 1 && response2.status >= 500) {
              console.warn(`[Proxy] ${response2.status} for ${url}. Retrying...`);
              await new Promise((r) => setTimeout(r, 1e3 * (attempt + 1)));
              continue;
            }
            return response2;
          } catch (err) {
            clearTimeout(timeoutId);
            lastError = err;
            if (!err.message?.includes("fetch failed") && !err.message?.includes("getaddrinfo") && err.name !== "AbortError") {
              console.error(`[Proxy] Attempt ${attempt + 1} failed for ${url}: ${err.message}`);
            }
            if (err.name === "AbortError") {
              throw err;
            }
            if (attempt < maxRetries - 1) {
              const delay = 1e3 * (attempt + 1);
              await new Promise((r) => setTimeout(r, delay));
            }
          }
        }
        throw lastError;
      };
      const getHeaders = (simple = false) => {
        const base = {
          "Accept": "*/*",
          "Referer": targetUrl.includes("strem.fun") ? "https://web.stremio.com/" : targetUrl.includes("betterflix.click") ? "https://betterflix.click/" : referer,
          "Connection": "keep-alive"
        };
        if (rangeHeader) {
          base["Range"] = rangeHeader;
        }
        if (simple) return base;
        return {
          ...base,
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "Origin": targetUrl.includes("strem.fun") ? "https://web.stremio.com" : targetUrl.includes("betterflix.click") ? "https://betterflix.click" : referer.replace(/\/$/, ""),
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "sec-ch-ua": '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": targetUrl.includes("strem.fun") ? "empty" : "document",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site"
        };
      };
      let response;
      try {
        response = await fetchWithRetry(targetUrl, { headers: getHeaders() });
      } catch (err) {
        console.warn(`[Proxy] All standard attempts failed for ${targetUrl}. Trying simple headers fallback...`);
        response = await fetchWithRetry(targetUrl, { headers: getHeaders(true) }, 1);
      }
      console.log(`[Proxy] Response: ${response.status} ${response.statusText}`);
      res.status(response.status);
      const contentType = response.headers.get("content-type") || "";
      const contentLength = response.headers.get("content-length");
      const contentRange = response.headers.get("content-range");
      const acceptRanges = response.headers.get("accept-ranges");
      if (contentType) res.setHeader("Content-Type", contentType);
      if (contentLength) res.setHeader("Content-Length", contentLength);
      if (contentRange) res.setHeader("Content-Range", contentRange);
      res.setHeader("Accept-Ranges", acceptRanges || "bytes");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      const isVideo = contentType.startsWith("video/") || contentType.startsWith("audio/") || targetUrl.includes(".mp4") || targetUrl.includes(".ts") || targetUrl.includes(".mkv") || response.status === 206 || contentLength && parseInt(contentLength) > 10 * 1024 * 1024;
      if (isVideo) {
        console.log(`[Proxy] Streaming started for target: ${targetUrl} (Type: ${contentType}, Size: ${contentLength || "unknown"}, Code: ${response.status})`);
        if (response.body) {
          const stream = import_stream.Readable.fromWeb(response.body);
          stream.on("error", (err) => {
            if (err.name !== "AbortError") {
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
          if (contentType && !contentType.includes("text/html")) {
            console.log(`[Proxy] Error Response Body (${targetUrl}): ${buffer.toString("utf-8").slice(0, 500)}`);
          }
        }
        if (response.status === 200 && !rangeHeader) {
          cache.set(targetUrl, {
            data: buffer,
            contentType: contentType || "application/octet-stream",
            status: response.status,
            expiry: Date.now() + CACHE_TTL
          });
          if (cache.size > 2e3) {
            const now = Date.now();
            for (const [key, val] of cache.entries()) {
              if (val.expiry < now) cache.delete(key);
              if (cache.size <= 1500) break;
            }
          }
        }
        res.send(buffer);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log(`[Proxy] Request aborted by client/timeout: ${targetUrl}`);
        if (!res.headersSent) {
          res.status(499).json({ error: "Client closed request" });
        }
      } else {
        console.error(`[Proxy] Error for ${targetUrl}:`, error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to fetch target URL" });
        }
      }
    }
  });
  const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9_\-\/.:%=?#]+$/;
  function sanitizeQueryParam(value) {
    if (typeof value !== "string") return "";
    return value.slice(0, 2e3).replace(/[<>\n\r\t]/g, "").trim();
  }
  app.get("/api/scraper/search", async (req, res) => {
    const rawQ = sanitizeQueryParam(req.query.q);
    if (!rawQ) return res.status(400).json({ error: "Query required" });
    console.log(`[API] Scraper Search Request: ${rawQ}`);
    const results = await scraperManager.searchAll(rawQ);
    console.log(`[API] Scraper Search Results: ${results.length} found`);
    res.json(results);
  });
  app.get("/api/scraper/chapters", async (req, res) => {
    const source = sanitizeQueryParam(req.query.source);
    const rawId = sanitizeQueryParam(req.query.id);
    if (!rawId) return res.status(400).json({ error: "ID required" });
    if (!ALPHANUMERIC_REGEX.test(rawId)) return res.status(400).json({ error: "Invalid ID format" });
    console.log(`[API] Scraper Chapters Request: source=${source}, id=${rawId}`);
    if (source) {
      const provider = scraperManager.getProvider(source);
      if (!provider) return res.status(404).json({ error: "Source not found" });
      const chapters = await provider.getChapters(rawId);
      res.json({ chapters });
    } else {
      const chapters = await scraperManager.getChapters(rawId);
      res.json({ chapters });
    }
  });
  app.get("/api/scraper/pages", async (req, res) => {
    const source = sanitizeQueryParam(req.query.source);
    const rawId = sanitizeQueryParam(req.query.id);
    if (!rawId) return res.status(400).json({ error: "ID required" });
    if (!ALPHANUMERIC_REGEX.test(rawId)) return res.status(400).json({ error: "Invalid ID format" });
    console.log(`[API] Scraper Pages Request: source=${source}, id=${rawId}`);
    if (source) {
      const provider = scraperManager.getProvider(source);
      if (!provider) return res.status(404).json({ error: "Source not found" });
      const pages = await provider.getPages(rawId);
      res.json({ pages });
    } else {
      const pages = await scraperManager.getPages(rawId);
      res.json({ pages });
    }
  });
  app.get("/api/tmdb/search", async (req, res) => {
    const query = sanitizeQueryParam(req.query.query);
    const year = sanitizeQueryParam(req.query.year);
    const language = sanitizeQueryParam(req.query.language) || "pt-BR";
    if (!query) return res.status(400).json({ error: "Query required" });
    const tmdbApiKey = process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY;
    if (!tmdbApiKey) {
      console.warn("[TMDB] API key not configured");
      return res.status(503).json({ error: "TMDB integration not configured" });
    }
    try {
      const yearParam = year ? `&first_air_date_year=${year}&primary_release_year=${year}` : "";
      const url = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=${language}${yearParam}&include_adult=false`;
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.text();
        console.error("[TMDB] Search failed:", response.status, error);
        return res.status(response.status).json({ error: "TMDB search failed" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[TMDB] Search error:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.use(import_express.default.json());
  function sanitizeFeedbackInput(value) {
    if (typeof value !== "string") return "";
    return value.replace(/[<>\n\r]/g, " ").slice(0, 5e3).trim();
  }
  app.post("/api/feedback/github", async (req, res) => {
    const title = sanitizeFeedbackInput(req.body.title);
    const description = sanitizeFeedbackInput(req.body.description);
    const type = sanitizeFeedbackInput(req.body.type);
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }
    const token = process.env.GITHUB_FEEDBACK_TOKEN;
    const owner = process.env.GITHUB_REPO_OWNER;
    const repo = process.env.GITHUB_REPO_NAME;
    if (!token || !owner || !repo) {
      console.warn("[Feedback] GitHub integration not fully configured.");
      return res.status(503).json({ error: "GitHub integration not configured" });
    }
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "Avalon-Feedback-App"
        },
        body: JSON.stringify({
          title: `[${type || "geral"}] ${title}`,
          body: `**Tipo:** ${type || "geral"}

**Descri\xE7\xE3o:**
${description}

--- 
*Enviado via Avalon Feedback App*`,
          labels: [type?.toLowerCase() || "feedback", "feedback"].filter(Boolean)
        })
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      const data = await response.json();
      res.json({ success: true, url: data.html_url, number: data.number });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[Feedback] GitHub Error:", message);
      res.status(500).json({ error: "Failed to create GitHub issue" });
    }
  });
  app.patch("/api/feedback/github/:number", async (req, res) => {
    const { number } = req.params;
    const { state } = req.body;
    if (typeof state !== "string" || !["open", "closed"].includes(state)) {
      return res.status(400).json({ error: "Invalid state value" });
    }
    if (!/^\d+$/.test(number)) {
      return res.status(400).json({ error: "Invalid issue number" });
    }
    const token = process.env.GITHUB_FEEDBACK_TOKEN;
    const owner = process.env.GITHUB_REPO_OWNER;
    const repo = process.env.GITHUB_REPO_NAME;
    if (!token || !owner || !repo) {
      return res.status(503).json({ error: "GitHub integration not configured" });
    }
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${number}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "Avalon-Feedback-App"
        },
        body: JSON.stringify({ state })
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      const data = await response.json();
      res.json({ success: true, state: data.state });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[Feedback] GitHub Patch Error:", message);
      res.status(500).json({ error: "Failed to update GitHub issue" });
    }
  });
  app.get("/api/tmdb/search", async (req, res) => {
    const query = sanitizeQueryParam(req.query.query);
    if (!query) return res.status(400).json({ error: "Query required" });
    const tmdbApiKey = process.env.TMDB_API_KEY;
    if (!tmdbApiKey) {
      console.warn("[TMDB] API key not configured");
      return res.status(503).json({ error: "TMDB not configured" });
    }
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=pt-BR`
      );
      if (!response.ok) {
        console.error("[TMDB] Search failed:", response.status);
        return res.status(502).json({ error: "TMDB search failed" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[TMDB] Search Error:", message);
      res.status(500).json({ error: "Failed to search TMDB" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
