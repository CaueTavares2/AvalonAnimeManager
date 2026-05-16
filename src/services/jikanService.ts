import axios from 'axios';

const JIKAN_API_BASE = import.meta.env.VITE_JIKAN_API_URL || 'https://api.jikan.moe/v4';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData(url: string) {
  try {
    const cached = sessionStorage.getItem(`jikan_cache_${url}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Cache read error', e);
  }
  return null;
}

function setCachedData(url: string, data: any) {
  try {
    sessionStorage.setItem(`jikan_cache_${url}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Cache write error', e);
  }
}

async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<any> {
  const cached = getCachedData(url);
  if (cached) return cached;

  try {
    const response = await axios.get(url);
    const data = response.data;
    setCachedData(url, data);
    return data;
  } catch (error: any) {
    if (error.response?.status === 429 && retries > 0) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} left)`);
      await sleep(delay);
      return fetchWithRetry(url, retries - 1, delay * 2);
    }
    throw error;
  }
}

export interface JikanAnime {
  mal_id: number;
  title: string;
  images: {
    webp: {
      image_url: string;
      large_image_url: string;
    };
  };
  score: number;
  episodes?: number;
  chapters?: number;
  volumes?: number;
  synopsis: string;
  genres: { name: string }[];
  year?: number;
  season?: string;
  status: string;
  rank: number;
  members: number;
  type?: string;
}

export const jikanService = {
  getTrending: async (type: 'anime' | 'manga' = 'anime') => {
    const filter = type === 'anime' ? 'airing' : 'publishing';
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/top/${type}?filter=${filter}&limit=6`);
    return data.data;
  },

  getPopular: async (type: 'anime' | 'manga' = 'anime') => {
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/top/${type}?filter=bypopularity&limit=12`);
    return data.data;
  },

  getUpcoming: async (type: 'anime' | 'manga' = 'anime') => {
    const filter = type === 'anime' ? 'upcoming' : 'upcoming'; // Both use upcoming
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/top/${type}?filter=${filter}&limit=6`);
    return data.data;
  },

  getTopRated: async (type: 'anime' | 'manga' = 'anime') => {
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/top/${type}?limit=1`);
    return data.data;
  },

  getDetails: async (id: number, type: 'anime' | 'manga' = 'anime') => {
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/${type}/${id}/full`);
    return data.data;
  },

  search: async (query: string, type: 'anime' | 'manga' = 'anime') => {
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/${type}?q=${query}&limit=10`);
    return data.data;
  },
  
  searchCharacters: async (query: string) => {
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/characters?q=${query}&limit=12`);
    return data.data;
  },

  getCharacterDetails: async (id: number) => {
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/characters/${id}/full`);
    return data.data;
  }
};
