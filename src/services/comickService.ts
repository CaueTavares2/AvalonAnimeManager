const COMICK_API_URL = 'https://api.comick.cc'; // updated to cc
const PROXY_URL = '/api/proxy?url=';

const safeJsonFetch = async (url: string) => {
  const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
  if (!response.ok) return null;
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null;
  }
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const comickService = {
  searchManga: async (query: string) => {
    try {
      const url = `${COMICK_API_URL}/v1.0/search?q=${encodeURIComponent(query)}&limit=10&page=1`;
      const data = await safeJsonFetch(url);
      if (!data) return [];
      return Array.isArray(data) ? data : (data.data || data.results || []);
    } catch (error) {
      return [];
    }
  },

  getMangaChapters: async (hid: string, limit: number = 1000) => {
    try {
      const url = `${COMICK_API_URL}/comic/${hid}/chapters?limit=${limit}&lang=pt-br,en`;
      const data = await safeJsonFetch(url);
      if (!data) return [];
      return data.chapters || [];
    } catch (error) {
      return [];
    }
  },

  getChapterDetails: async (hid: string) => {
    try {
      const url = `${COMICK_API_URL}/chapter/${hid}`;
      return await safeJsonFetch(url);
    } catch (error) {
      return null;
    }
  }
};
