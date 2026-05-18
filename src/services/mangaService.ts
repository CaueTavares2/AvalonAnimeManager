const MANGADEX_API_URL = 'https://api.mangadex.org';
const CONSUMET_API_URL = 'https://api.consumet.org/manga/mangadex';

export const mangaService = {
  searchManga: async (title: string) => {
    try {
      const url = new URL(`${MANGADEX_API_URL}/manga`);
      url.searchParams.append('title', title);
      url.searchParams.append('limit', '5');
      url.searchParams.append('includes[]', 'cover_art');
      url.searchParams.append('order[relevance]', 'desc');
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("MangaDex Search Error, trying fallback:", error);
      // Fallback
      return mangaService.searchMangaFallback(title);
    }
  },

  searchMangaFallback: async (title: string) => {
    try {
      // Consumet API fallback
      const url = new URL(`${CONSUMET_API_URL}/${encodeURIComponent(title)}`);
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Fallback Status: ${response.status}`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
         // Map to MangaDex format to keep components working
         return {
           data: [
             {
               id: data.results[0].id,
               type: 'manga',
               attributes: {
                 title: { en: data.results[0].title }
               }
             }
           ]
         }
      }
      return null;
    } catch(err) {
      console.error("Fallback Search Error:", err);
      return null;
    }
  },

  getMangaFeed: async (mangaId: string, page: number = 0) => {
    try {
      const url = new URL(`${MANGADEX_API_URL}/manga/${mangaId}/feed`);
      url.searchParams.append('limit', '400');
      url.searchParams.append('offset', (page * 400).toString());
      url.searchParams.append('translatedLanguage[]', 'pt-br');
      url.searchParams.append('translatedLanguage[]', 'pt');
      url.searchParams.append('translatedLanguage[]', 'en');
      url.searchParams.append('order[chapter]', 'asc');
      url.searchParams.append('includes[]', 'scanlation_group');

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      
      // Filter out duplicate chapters locally if necessary, or just return them
      // E.g. we might have same chapter in 'pt-br' and 'en'. Let's return all, and the client will group them or filter
      return data;
    } catch (error) {
      console.error("MangaDex Feed Error, trying fallback:", error);
      return mangaService.getMangaFeedFallback(mangaId);
    }
  },

  getMangaFeedFallback: async (mangaId: string) => {
     try {
       const url = new URL(`${CONSUMET_API_URL}/info/${mangaId}`);
       const response = await fetch(url.toString());
       if (!response.ok) throw new Error(`Fallback Status: ${response.status}`);
       const data = await response.json();
       
       if (data.chapters && data.chapters.length > 0) {
         // Map to MangaDex format
         return {
           data: data.chapters.map((cap: any) => ({
             id: cap.id,
             attributes: {
               chapter: cap.chapterNumber,
               title: cap.title
             }
           }))
         };
       }
       return null;
     } catch (err) {
       console.error("Fallback Feed Error:", err);
       return null;
     }
  },

  getChapterPages: async (chapterId: string) => {
    try {
      const response = await fetch(`${MANGADEX_API_URL}/at-home/server/${chapterId}`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("MangaDex Pages Error, trying fallback:", error);
      return mangaService.getChapterPagesFallback(chapterId);
    }
  },

  getChapterPagesFallback: async (chapterId: string) => {
     try {
       const url = new URL(`${CONSUMET_API_URL}/read/${chapterId}`);
       const response = await fetch(url.toString());
       if (!response.ok) throw new Error(`Fallback Status: ${response.status}`);
       const data = await response.json();
       
       if (data && data.length > 0) {
         // Map to MangaDex format
         return {
           baseUrl: '',
           chapter: {
             hash: '',
             data: data.map((img: any) => img.img)
           }
         };
       }
       return null;
     } catch (err) {
       console.error("Fallback Pages Error:", err);
       return null;
     }
  }
};
