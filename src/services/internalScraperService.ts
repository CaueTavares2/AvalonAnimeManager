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
      if (!res.ok) return [];
      const data = await res.json();
      return data.chapters || [];
    } catch {
      return [];
    }
  },
  getPages: async (sourceId: string, chapterId: string) => {
    try {
      const res = await fetch(`/api/scraper/pages?source=${sourceId}&id=${encodeURIComponent(chapterId)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.pages || [];
    } catch {
      return [];
    }
  }
};
