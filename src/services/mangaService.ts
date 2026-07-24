const MANGADEX_API_URL = 'https://api.mangadex.org';
const LOCAL_PROXY = '/api/proxy?url=';
const PUBLIC_PROXY = 'https://api.allorigins.win/raw?url=';
const MAX_FETCH_OFFSET = 5000;

async function smartFetch(url: string): Promise<Response> {
  const direct = await fetch(url, { headers: { 'Accept': 'application/json' } }).catch(() => null);
  if (direct?.ok) return direct;

  const localProxy = await fetch(`${LOCAL_PROXY}${encodeURIComponent(url)}`).catch(() => null);
  if (localProxy?.ok) return localProxy;

  const publicProxy = await fetch(`${PUBLIC_PROXY}${encodeURIComponent(url)}`);
  if (publicProxy.ok) return publicProxy;

  throw new Error(`All fetch attempts failed for ${url}`);
}

function buildContentRatingParams(url: URL): void {
  for (const rating of ['safe', 'suggestive', 'erotica', 'pornographic']) {
    url.searchParams.append('contentRating[]', rating);
  }
}

interface ChapterPage {
  original: string;
  proxies: string[];
}

interface MangaFeedResult {
  data: unknown[];
}

interface ChapterPagesResult {
  pages: ChapterPage[];
}

async function searchManga(title: string) {
  const url = new URL(`${MANGADEX_API_URL}/manga`);
  url.searchParams.append('title', title);
  url.searchParams.append('limit', '50');
  url.searchParams.append('includes[]', 'cover_art');
  buildContentRatingParams(url);

  const response = await smartFetch(url.toString());
  if (!response.ok) throw new Error(`MangaDex search returned status ${response.status}`);
  return response.json();
}

async function getMangaFeed(mangaId: string): Promise<MangaFeedResult> {
  let allChapters: unknown[] = [];
  let offset = 0;
  let total = 1;

  while (offset < total && offset < MAX_FETCH_OFFSET) {
    const url = new URL(`${MANGADEX_API_URL}/manga/${mangaId}/feed`);
    url.searchParams.append('limit', '500');
    url.searchParams.append('offset', offset.toString());
    url.searchParams.append('translatedLanguage[]', 'pt-br');
    url.searchParams.append('translatedLanguage[]', 'pt');
    url.searchParams.append('translatedLanguage[]', 'en');
    url.searchParams.append('order[chapter]', 'asc');
    buildContentRatingParams(url);

    const response = await smartFetch(url.toString()).catch(() => null);
    if (!response?.ok) break;

    const data = await response.json();
    if (Array.isArray(data.data)) {
      allChapters = [...allChapters, ...data.data];
    }

    total = data.total || 0;
    offset += 500;
  }

  return { data: allChapters };
}

function buildChapterPage(baseUrl: string, path: string, hash: string, file: string): ChapterPage {
  const fullUrl = `${baseUrl}/${path}/${hash}/${file}`;
  return {
    original: fullUrl,
    proxies: [
      `https://images.weserv.nl/?url=${encodeURIComponent(fullUrl)}&default=${encodeURIComponent(fullUrl)}&l=9&af`,
      `https://i0.wp.com/${fullUrl.replace(/^https?:\/\//, '')}?quality=90`,
      `https://corsproxy.io/?url=${encodeURIComponent(fullUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(fullUrl)}`
    ]
  };
}

async function getChapterPages(chapterId: string, forceDataSaver = false): Promise<ChapterPagesResult | null> {
  const response = await smartFetch(`${MANGADEX_API_URL}/at-home/server/${chapterId}`);
  if (!response.ok) throw new Error(`MangaDex pages returned status ${response.status}`);

  const data = await response.json();
  if (!data.chapter) return null;

  const { baseUrl, chapter: chapData } = data;
  if (!baseUrl) throw new Error('Missing baseUrl from MangaDex');

  const hash = chapData.hash;
  const useDataSaver = Boolean(forceDataSaver && chapData.dataSaver);
  const images = useDataSaver ? chapData.dataSaver : chapData.data;
  const path = useDataSaver ? 'data-saver' : 'data';

  if (!Array.isArray(images)) return null;

  return {
    pages: images.map((file: string) => buildChapterPage(baseUrl, path, hash, file))
  };
}

export const mangaService = {
  searchManga: async (title: string) => {
    try {
      return await searchManga(title);
    } catch (error) {
      console.error('[MangaDex] Search error:', error);
      return null;
    }
  },

  getMangaFeed: async (mangaId: string) => {
    try {
      return await getMangaFeed(mangaId);
    } catch (error) {
      console.error('[MangaDex] Feed error:', error);
      return null;
    }
  },

  getChapterPages: async (chapterId: string, forceDataSaver = false) => {
    try {
      return await getChapterPages(chapterId, forceDataSaver);
    } catch (error) {
      console.error('[MangaDex] Pages error:', error);
      return null;
    }
  }
};
