const MANGADEX_API_URL = 'https://api.mangadex.org';
const LOCAL_PROXY = '/api/proxy?url=';
const PUBLIC_PROXY = 'https://api.allorigins.win/raw?url=';

async function smartFetch(url: string) {
  // 1. Try direct fetch (best)
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (res.ok) return res;
  } catch (e) {
    console.warn(`Direct fetch failed for ${url}, trying local proxy...`);
  }

  // 2. Try local server proxy (Avalon backend)
  try {
    const res = await fetch(`${LOCAL_PROXY}${encodeURIComponent(url)}`);
    if (res.ok) return res;
  } catch (e) {
    console.warn(`Local proxy failed for ${url}, trying public fallback...`);
  }

  // 3. Try public proxy (Fallback for static hosts like GitHub Pages)
  try {
    return await fetch(`${PUBLIC_PROXY}${encodeURIComponent(url)}`);
  } catch (e) {
    throw new Error(`All fetch attempts failed for ${url}`);
  }
}

export const mangaService = {
  searchManga: async (title: string) => {
    try {
      const url = new URL(`${MANGADEX_API_URL}/manga`);
      url.searchParams.append('title', title);
      url.searchParams.append('limit', '50');
      url.searchParams.append('includes[]', 'cover_art');
      
      ['safe', 'suggestive', 'erotica', 'pornographic'].forEach(cr => {
        url.searchParams.append('contentRating[]', cr);
      });
      
      const response = await smartFetch(url.toString());
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("MangaDex Search Error:", error);
      return null;
    }
  },

  getMangaFeed: async (mangaId: string) => {
    try {
      let allChapters: any[] = [];
      let offset = 0;
      let total = 1;

      while (offset < total) {
        const url = new URL(`${MANGADEX_API_URL}/manga/${mangaId}/feed`);
        url.searchParams.append('limit', '500');
        url.searchParams.append('offset', offset.toString());
        url.searchParams.append('translatedLanguage[]', 'pt-br');
        url.searchParams.append('translatedLanguage[]', 'pt');
        url.searchParams.append('translatedLanguage[]', 'en');
        url.searchParams.append('order[chapter]', 'asc');
        
        ['safe', 'suggestive', 'erotica', 'pornographic'].forEach(cr => {
          url.searchParams.append('contentRating[]', cr);
        });
        
        const response = await smartFetch(url.toString());
        if (!response.ok) break;
        const data = await response.json();
        
        if (data.data) {
          allChapters = [...allChapters, ...data.data];
        }
        
        total = data.total || 0;
        offset += 500;
        if (offset > 5000) break;
      }
      
      return { data: allChapters };
    } catch (error) {
      console.error("MangaDex Feed Error:", error);
      return null;
    }
  },

  getChapterPages: async (chapterId: string, forceDataSaver = false) => {
    try {
      const url = `${MANGADEX_API_URL}/at-home/server/${chapterId}`;
      const response = await smartFetch(url);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      
      if (data.chapter) {
        const { baseUrl, chapter: chapData } = data;
        if (!baseUrl) throw new Error("Missing baseUrl from MangaDex");
        
        const h = chapData.hash;
        const images = forceDataSaver && chapData.dataSaver ? chapData.dataSaver : chapData.data;
        const path = forceDataSaver && chapData.dataSaver ? 'data-saver' : 'data';
        
        return {
          pages: images.map((file: string) => {
            const fullUrl = `${baseUrl}/${path}/${h}/${file}`;
            
            // Return multiple options for the reader to try
            // 1. Direct URL (good if MangaDex nodes allow it with no-referrer)
            // 2. Weserv.nl (excellent CDN/Proxy)
            // 3. Photon/Jetpack (i0.wp.com) - very reliable fallback
            // 4. Local Proxy (server-side bypass)
            // 5. AllOrigins (last resort)
            return {
              original: fullUrl,
              proxies: [
                `https://images.weserv.nl/?url=${encodeURIComponent(fullUrl)}&default=${encodeURIComponent(fullUrl)}&l=9&af`,
                `https://i0.wp.com/${fullUrl.replace(/^https?:\/\//, '')}?quality=90`,
                `${LOCAL_PROXY}${encodeURIComponent(fullUrl)}`,
                `https://api.allorigins.win/raw?url=${encodeURIComponent(fullUrl)}`
              ]
            };
          })
        };
      }
      return null;
    } catch (error) {
      console.error("MangaDex Pages Error:", error);
      return null;
    }
  }
};
