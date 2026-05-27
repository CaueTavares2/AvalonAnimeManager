export const internalScraperService = {
  searchManga: async (query: string) => {
    try {
      const res = await fetch(`/api/scraper/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },
  getChapters: async (sourceId: string, mangaId: string) => {
    try {
      const res = await fetch(`/api/scraper/chapters?source=${sourceId}&id=${encodeURIComponent(mangaId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.chapters && data.chapters.length > 0) return data.chapters;
      }
      
      const fallbackRes = await fetch(`/api/scraper/chapters?id=${encodeURIComponent(mangaId)}`);
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return data.chapters || [];
      }
      return [];
    } catch {
      return [];
    }
  },
  getPages: async (sourceId: string, chapterId: string) => {
    try {
      const res = await fetch(`/api/scraper/pages?source=${sourceId}&id=${encodeURIComponent(chapterId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.pages && data.pages.length > 0) return data.pages;
      }
      
      const fallbackRes = await fetch(`/api/scraper/pages?id=${encodeURIComponent(chapterId)}`);
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return data.pages || [];
      }
      return [];
    } catch {
      return [];
    }
  }
};
