const MANGADEX_API_URL = 'https://api.mangadex.org';

export const mangaService = {
  searchManga: async (title: string) => {
    try {
      const url = new URL(`${MANGADEX_API_URL}/manga`);
      url.searchParams.append('title', title);
      url.searchParams.append('limit', '5');
      url.searchParams.append('includes[]', 'cover_art');
      url.searchParams.append('order[relevance]', 'desc');
      url.searchParams.append('hasAvailableChapters', 'true');
      url.searchParams.append('availableTranslatedLanguage[]', 'pt-br');
      url.searchParams.append('availableTranslatedLanguage[]', 'pt');
      url.searchParams.append('availableTranslatedLanguage[]', 'en');
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("MangaDex Search Error:", error);
      return null;
    }
  },

  getMangaFeed: async (mangaId: string, page: number = 0) => {
    try {
      const url = new URL(`${MANGADEX_API_URL}/manga/${mangaId}/feed`);
      url.searchParams.append('limit', '500');
      url.searchParams.append('offset', (page * 500).toString());
      url.searchParams.append('translatedLanguage[]', 'pt-br');
      url.searchParams.append('translatedLanguage[]', 'pt');
      url.searchParams.append('translatedLanguage[]', 'en');
      url.searchParams.append('order[chapter]', 'asc');
      // Do not include external chapters if we can avoid it. MangaDex doesn't have a param for that, so we filter it later.

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("MangaDex Feed Error:", error);
      return null;
    }
  },

  getChapterPages: async (chapterId: string) => {
    try {
      const response = await fetch(`${MANGADEX_API_URL}/at-home/server/${chapterId}`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("MangaDex Pages Error:", error);
      return null;
    }
  }
};
