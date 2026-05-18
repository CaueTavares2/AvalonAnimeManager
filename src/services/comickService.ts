const COMICK_API_URL = 'https://api.comick.io'; // updated from .fun
const PROXY_URL = '/api/proxy?url=';

export const comickService = {
  searchManga: async (query: string) => {
    try {
      const url = `${COMICK_API_URL}/v1.0/search?q=${encodeURIComponent(query)}&limit=10&page=1`;
      const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : (data.data || data.results || []);
    } catch (error) {
      console.error("Comick Search Error:", error);
      return [];
    }
  },

  getMangaChapters: async (hid: string, limit: number = 1000) => {
    try {
      // Comick uses hid for series
      const url = `${COMICK_API_URL}/manga/${hid}/chapters?limit=${limit}&lang=pt-br,en`;
      const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.chapters || [];
    } catch (error) {
      console.error("Comick Chapters Error:", error);
      return [];
    }
  },

  getChapterDetails: async (hid: string) => {
    try {
      const url = `${COMICK_API_URL}/chapter/${hid}`;
      const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Comick Pages Error:", error);
      return null;
    }
  }
};
