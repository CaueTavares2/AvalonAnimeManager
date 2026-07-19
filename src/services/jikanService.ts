import axios from 'axios';

const JIKAN_API_BASE = import.meta.env.VITE_JIKAN_API_URL || 'https://api.jikan.moe/v4';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const PERSISTENT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCachedData(url: string) {
  try {
    // 1. Try Persistent Cache (localStorage) for details/static content
    if (url.includes('/full') || url.includes('/top')) {
      const pCached = localStorage.getItem(`jikan_p_cache_${url}`);
      if (pCached) {
        const { data, timestamp } = JSON.parse(pCached);
        if (Date.now() - timestamp < PERSISTENT_CACHE_DURATION) {
          return data;
        }
      }
    }

    // 2. Try Session Cache
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
    // 1. Set Persistent Cache (localStorage) for details/static content
    if (url.includes('/full') || url.includes('/top')) {
      localStorage.setItem(`jikan_p_cache_${url}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    }

    // 2. Set Session Cache
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
  title_english?: string;
  title_japanese?: string;
  title_synonyms?: string[];
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
    const typeFilter = type === 'anime' ? '&type=tv' : ''; // Prioritize TV for trending animes
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/top/${type}?filter=${filter}${typeFilter}&limit=12`);
    return data.data;
  },

  getPopular: async (type: 'anime' | 'manga' = 'anime') => {
    const typeFilter = type === 'anime' ? '&type=tv' : '';
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/top/${type}?filter=bypopularity${typeFilter}&limit=18`);
    return data.data;
  },

  getUpcoming: async (type: 'anime' | 'manga' = 'anime') => {
    const filter = type === 'anime' ? 'upcoming' : 'upcoming';
    const typeFilter = type === 'anime' ? '&type=tv' : '';
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/top/${type}?filter=${filter}${typeFilter}&limit=12`);
    return data.data;
  },

  getTopRated: async (type: 'anime' | 'manga' = 'anime') => {
    const typeFilter = type === 'anime' ? '&type=tv' : '';
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/top/${type}?limit=10${typeFilter}`);
    return data.data;
  },

  getDetails: async (id: number, type: 'anime' | 'manga' = 'anime') => {
    try {
      const data = await fetchWithRetry(`${JIKAN_API_BASE}/${type}/${id}/full`);
      if (data && data.data) return data.data;
    } catch (e) {
      console.warn(`Jikan full details failed for ${type} ${id}, trying basic details fallback...`, e);
    }
    
    // Fallback to basic details without /full
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/${type}/${id}`);
    return data?.data || null;
  },

  search: async (query: string, type: 'anime' | 'manga' = 'anime', page: number = 1) => {
    // For search, we still allow more variety but prioritize popularity
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/${type}?q=${encodeURIComponent(query)}&page=${page}&limit=20&order_by=popularity&sort=desc&sfw=true`);
    
    // Client-side quality filter: exclude music and minor types if it's anime
    if (type === 'anime') {
      const filtered = data.data.filter((item: any) => 
        ['tv', 'movie', 'ova', 'ona'].includes(item.type?.toLowerCase())
      );
      return { data: filtered, pagination: data.pagination };
    }
    return { data: data.data, pagination: data.pagination };
  },

  getByYear: async (year: number, page: number = 1) => {
    // Only fetch TV and Movie to ensure "Quality over Quantity"
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/anime?start_date=${year}-01-01&end_date=${year}-12-31&order_by=popularity&sort=desc&limit=25&page=${page}&type=tv`);
    return data; 
  },
  
  searchCharacters: async (query: string) => {
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/characters?q=${query}&limit=12`);
    return data.data;
  },

  getCharacterDetails: async (id: number) => {
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/characters/${id}/full`);
    return data.data;
  },

  getExternalIds: async (id: number) => {
    const data = await fetchWithRetry(`${JIKAN_API_BASE}/anime/${id}/external`);
    return data.data;
  }
};
