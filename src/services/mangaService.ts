const MANGADEX_API_URL = 'https://api.mangadex.org';
const PROXY_URL = '/api/proxy?url=';

export const mangaService = {
  searchManga: async (title: string) => {
    try {
      const url = new URL(`${MANGADEX_API_URL}/manga`);
      url.searchParams.append('title', title);
      url.searchParams.append('limit', '20');
      url.searchParams.append('includes[]', 'cover_art');
      url.searchParams.append('order[relevance]', 'desc');
      
      // Add content ratings to get more results
      url.searchParams.append('contentRating[]', 'safe');
      url.searchParams.append('contentRating[]', 'suggestive');
      url.searchParams.append('contentRating[]', 'erotica');
      url.searchParams.append('contentRating[]', 'pornographic');
      
      // Filter by available languages to avoid finding entries with no chapters in PT/EN
      url.searchParams.append('availableTranslatedLanguage[]', 'pt-br');
      url.searchParams.append('availableTranslatedLanguage[]', 'pt');
      url.searchParams.append('availableTranslatedLanguage[]', 'en');
      
      const response = await fetch(`${PROXY_URL}${encodeURIComponent(url.toString())}`);
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
        
        const response = await fetch(`${PROXY_URL}${encodeURIComponent(url.toString())}`);
        if (!response.ok) break;
        const data = await response.json();
        
        if (data.data) {
          allChapters = [...allChapters, ...data.data];
        }
        
        total = data.total || 0;
        offset += 500;
        
        // Safety break
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
      const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
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
            return `${PROXY_URL}${encodeURIComponent(fullUrl)}`;
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
