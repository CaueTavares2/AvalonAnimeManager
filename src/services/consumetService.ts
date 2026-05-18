const CONSUMET_API_URL = 'https://api.consumet.org'; // Official domain usually works or redirects
const PROXY_URL = '/api/proxy?url=';

export const consumetService = {
  searchManga: async (title: string, provider: string = 'mangadex') => {
    try {
      const url = `${CONSUMET_API_URL}/manga/${provider}/${encodeURIComponent(title)}`;
      const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Consumet search error:', error);
      return null;
    }
  },

  getMangaInfo: async (id: string, provider: string = 'mangadex') => {
    try {
      const url = `${CONSUMET_API_URL}/manga/${provider}/info?id=${encodeURIComponent(id)}`;
      const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Consumet info error:', error);
      return null;
    }
  },

  getChapterPages: async (chapterId: string, provider: string = 'mangadex') => {
    try {
      const url = `${CONSUMET_API_URL}/manga/${provider}/read?chapterId=${encodeURIComponent(chapterId)}`;
      const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Consumet pages error:', error);
      return null;
    }
  }
};
