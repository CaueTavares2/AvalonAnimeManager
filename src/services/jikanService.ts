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
    const response = await axios.get(url, { timeout: 8000 });
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
  popularity?: number;
  synopsis: string;
  genres: { name: string }[];
  year?: number;
  season?: string;
  status: string;
  rank: number;
  members: number;
  type?: string;
}

// Helper to fetch lists from AniList when Jikan is down
async function fetchAnilistList(type: 'anime' | 'manga', sort: string, limit: number): Promise<JikanAnime[]> {
  const anilistQuery = `
  query ($type: MediaType, $sort: [MediaSort], $perPage: Int) {
    Page (page: 1, perPage: $perPage) {
      media (type: $type, sort: $sort) {
        idMal
        title { romaji, english, native }
        coverImage { large }
        averageScore
        episodes
        chapters
        volumes
          popularity
        description
        genres
        seasonYear
        season
        status
        format
      }
    }
  }`;
  
  try {
    const response = await axios.post('https://graphql.anilist.co', {
      query: anilistQuery,
      variables: { type: type.toUpperCase(), sort: [sort], perPage: limit },
      timeout: 8000
    });
    
    return response.data.data.Page.media.filter((m: any) => m.idMal).map((m: any) => ({
      mal_id: m.idMal,
      title: m.title.romaji || m.title.english || m.title.native,
      title_english: m.title.english,
      title_japanese: m.title.native,
      images: { webp: { image_url: m.coverImage.large, large_image_url: m.coverImage.large } },
      score: m.averageScore ? m.averageScore / 10 : 0,
      episodes: m.episodes,
      chapters: m.chapters,
      volumes: m.volumes, 
          members: m.popularity || 0,
      synopsis: m.description?.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>?/gm, '') || '',
      genres: m.genres ? m.genres.map((g: string) => ({ name: g })) : [],
      year: m.seasonYear,
      season: m.season?.toLowerCase(),
      status: m.status,
      rank: 0,
      
      type: m.format === 'TV_SHORT' ? 'TV' : m.format
    }));
  } catch (err) {
    console.error("AniList list fallback failed", err);
    return [];
  }
}

export const jikanService = {
  getTrending: async (type: 'anime' | 'manga' = 'anime') => {
    try {
      const filter = type === 'anime' ? 'airing' : 'publishing';
      const typeFilter = type === 'anime' ? '&type=tv' : ''; // Prioritize TV for trending animes
      const data = await fetchWithRetry(`${JIKAN_API_BASE}/top/${type}?filter=${filter}${typeFilter}&limit=12`);
      if (!data || !data.data || data.data.length === 0) throw new Error("Empty");
      return data?.data || [];
    } catch (e) {
      console.warn("Jikan getTrending failed, falling back to AniList...");
      return fetchAnilistList(type, 'TRENDING_DESC', 12);
    }
  },

  getPopular: async (type: 'anime' | 'manga' = 'anime') => {
    try {
      const typeFilter = type === 'anime' ? '&type=tv' : '';
      const data = await fetchWithRetry(`${JIKAN_API_BASE}/top/${type}?filter=bypopularity${typeFilter}&limit=18`);
      if (!data || !data.data || data.data.length === 0) throw new Error("Empty");
      return data?.data || [];
    } catch (e) {
      console.warn("Jikan getPopular failed, falling back to AniList...");
      return fetchAnilistList(type, 'POPULARITY_DESC', 18);
    }
  },

  getUpcoming: async (type: 'anime' | 'manga' = 'anime') => {
    try {
      const filter = type === 'anime' ? 'upcoming' : 'upcoming';
      const typeFilter = type === 'anime' ? '&type=tv' : '';
      const data = await fetchWithRetry(`${JIKAN_API_BASE}/top/${type}?filter=${filter}${typeFilter}&limit=12`);
      if (!data || !data.data || data.data.length === 0) throw new Error("Empty");
      return data?.data || [];
    } catch (e) {
      console.warn("Jikan getUpcoming failed, falling back to AniList...");
      // For upcoming, we sort by POPULARITY_DESC but we'd need to filter by status NOT_YET_RELEASED, 
      // however TRENDING_DESC / POPULARITY_DESC works alright as a simple fallback if we can't do complex filters.
      // Let's use POPULARITY_DESC as fallback just so it doesn't break.
      return fetchAnilistList(type, 'POPULARITY_DESC', 12);
    }
  },

  getTopRated: async (type: 'anime' | 'manga' = 'anime') => {
    try {
      const typeFilter = type === 'anime' ? '&type=tv' : '';
      const data = await fetchWithRetry(`${JIKAN_API_BASE}/top/${type}?limit=10${typeFilter}`);
      if (!data || !data.data || data.data.length === 0) throw new Error("Empty");
      return data?.data || [];
    } catch (e) {
      console.warn("Jikan getTopRated failed, falling back to AniList...");
      return fetchAnilistList(type, 'SCORE_DESC', 10);
    }
  },

  getDetails: async (id: number, type: 'anime' | 'manga' = 'anime') => {
    try {
      const data = await fetchWithRetry(`${JIKAN_API_BASE}/${type}/${id}/full`);
      if (data && data.data) return data.data;
    } catch (e) {
      console.warn(`Jikan full details failed for ${type} ${id}, trying basic details fallback...`, e);
    }
    
    try {
      // Fallback to basic details without /full
      const data = await fetchWithRetry(`${JIKAN_API_BASE}/${type}/${id}`);
      if (data && data.data) return data.data;
    } catch (e) {
      console.warn("Jikan basic details also failed, falling back to AniList...", e);
      const anilistQuery = `
      query ($idMal: Int, $type: MediaType) {
        Media (idMal: $idMal, type: $type) {
          idMal
          title { romaji, english, native }
          coverImage { large }
          averageScore
          episodes
          chapters
          volumes
          popularity
          description
          genres
          seasonYear
          season
          status
          format
        }
      }`;
      try {
        const response = await axios.post('https://graphql.anilist.co', {
          query: anilistQuery,
          variables: { idMal: id, type: type.toUpperCase() },
          timeout: 8000
        });
        const m = response.data.data.Media;
        if (!m) return null;
        return {
          mal_id: m.idMal || id,
          title: m.title.romaji || m.title.english || m.title.native,
          title_english: m.title.english,
          title_japanese: m.title.native,
          images: { webp: { image_url: m.coverImage.large, large_image_url: m.coverImage.large } },
          score: m.averageScore ? m.averageScore / 10 : 0,
          episodes: m.episodes,
          chapters: m.chapters,
          volumes: m.volumes, 
          members: m.popularity || 0,
          synopsis: m.description?.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>?/gm, '') || '',
          genres: m.genres ? m.genres.map((g: string) => ({ name: g })) : [],
          year: m.seasonYear,
          season: m.season?.toLowerCase(),
          status: m.status,
          rank: 0,
          
          type: m.format === 'TV_SHORT' ? 'TV' : m.format
        };
      } catch (err) {
        console.error("AniList details fallback also failed", err);
        return null;
      }
    }
    return null;
  },

  search: async (query: string, type: 'anime' | 'manga' = 'anime', page: number = 1) => {
    try {
      const data = await fetchWithRetry(`${JIKAN_API_BASE}/${type}?q=${encodeURIComponent(query)}&page=${page}&limit=20&order_by=popularity&sort=desc&sfw=true`);
      if (!data || !data.data || data.data.length === 0) {
        throw new Error("Empty Jikan search result");
      }
      if (type === 'anime') {
        const items = data?.data || [];
        const filtered = items.filter((item: any) => 
          ['tv', 'movie', 'ova', 'ona'].includes(item.type?.toLowerCase())
        );
        return { data: filtered, pagination: data?.pagination };
      }
      return { data: data?.data || [], pagination: data?.pagination };
    } catch (e) {
      console.warn("Jikan search failed, falling back to AniList...", e);
      // Fallback to Anilist
      const anilistQuery = `
      query ($search: String, $page: Int, $type: MediaType) {
        Page (page: $page, perPage: 20) {
          pageInfo {
            lastPage
          }
          media (search: $search, type: $type, sort: POPULARITY_DESC) {
            idMal
            title { romaji, english, native }
            coverImage { large }
            averageScore
            episodes
            chapters
            volumes
          popularity
            description
            genres
            seasonYear
            season
            status
            format
          }
        }
      }`;
      try {
        const response = await axios.post('https://graphql.anilist.co', {
          query: anilistQuery,
          variables: { search: query, page: page, type: type.toUpperCase() }
        });
        const anilistData = response.data.data.Page;
        // Map Anilist format to JikanAnime format
        const mappedData = anilistData.media.filter((m: any) => m.idMal).map((m: any) => ({
          mal_id: m.idMal,
          title: m.title.romaji || m.title.english || m.title.native,
          title_english: m.title.english,
          title_japanese: m.title.native,
          images: { webp: { image_url: m.coverImage.large, large_image_url: m.coverImage.large } },
          score: m.averageScore ? m.averageScore / 10 : 0,
          episodes: m.episodes,
          chapters: m.chapters,
          volumes: m.volumes, 
          members: m.popularity || 0,
          synopsis: m.description?.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>?/gm, '') || '',
          genres: m.genres ? m.genres.map((g: string) => ({ name: g })) : [],
          year: m.seasonYear,
          season: m.season?.toLowerCase(),
          status: m.status,
          rank: 0,
          
          type: m.format === 'TV_SHORT' ? 'TV' : m.format
        }));
        
        return { 
          data: mappedData, 
          pagination: { last_visible_page: anilistData.pageInfo.lastPage } 
        };
      } catch (err) {
        console.error("AniList fallback also failed", err);
        return { data: [], pagination: { last_visible_page: 1 } };
      }
    }
  },

  getByYear: async (year: number, page: number = 1) => {
    try {
      const data = await fetchWithRetry(`${JIKAN_API_BASE}/anime?start_date=${year}-01-01&end_date=${year}-12-31&order_by=popularity&sort=desc&limit=25&page=${page}&type=tv`);
      if (!data || !data.data || data.data.length === 0) throw new Error("Empty");
      return data; 
    } catch (e) {
      console.warn("Jikan getByYear failed, falling back to AniList...", e);
      const anilistQuery = `
      query ($year: Int, $page: Int) {
        Page (page: $page, perPage: 25) {
          pageInfo {
            lastPage
          }
          media (type: ANIME, seasonYear: $year, sort: POPULARITY_DESC) {
            idMal
            title { romaji, english, native }
            coverImage { large }
            averageScore
            episodes
            chapters
            volumes
          popularity
            description
            genres
            seasonYear
            season
            status
            format
          }
        }
      }`;
      try {
        const response = await axios.post('https://graphql.anilist.co', {
          query: anilistQuery,
          variables: { year, page },
          timeout: 8000
        });
        const anilistData = response.data.data.Page;
        const mappedData = anilistData.media.filter((m: any) => m.idMal).map((m: any) => ({
          mal_id: m.idMal,
          title: m.title.romaji || m.title.english || m.title.native,
          title_english: m.title.english,
          title_japanese: m.title.native,
          images: { webp: { image_url: m.coverImage.large, large_image_url: m.coverImage.large } },
          score: m.averageScore ? m.averageScore / 10 : 0,
          episodes: m.episodes,
          chapters: m.chapters,
          volumes: m.volumes, 
          members: m.popularity || 0,
          synopsis: m.description?.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>?/gm, '') || '',
          genres: m.genres ? m.genres.map((g: string) => ({ name: g })) : [],
          year: m.seasonYear,
          season: m.season?.toLowerCase(),
          status: m.status,
          rank: 0,
          
          type: m.format === 'TV_SHORT' ? 'TV' : m.format
        }));
        
        return { 
          data: mappedData, 
          pagination: { last_visible_page: anilistData.pageInfo.lastPage } 
        };
      } catch (err) {
        console.error("AniList fallback also failed", err);
        return { data: [], pagination: { last_visible_page: 1 } };
      }
    }
  },
  
  getMediaCharacters: async (id: number, type: 'anime' | 'manga' = 'anime') => {
    try {
      const data = await fetchWithRetry(`${JIKAN_API_BASE}/${type}/${id}/characters`);
      if (!data || !data.data) throw new Error("Empty characters");
      return data.data;
    } catch (e) {
      console.warn(`Jikan characters failed for ${type} ${id}, falling back to AniList...`, e);
      const anilistQuery = `
      query ($idMal: Int, $type: MediaType) {
        Media (idMal: $idMal, type: $type) {
          characters(sort: [ROLE, RELEVANCE, ID], page: 1, perPage: 25) {
            edges {
              role
              node {
                id
                name { full }
                image { large }
              }
            }
          }
        }
      }`;
      try {
        const response = await axios.post('https://graphql.anilist.co', {
          query: anilistQuery,
          variables: { idMal: id, type: type.toUpperCase() },
          timeout: 8000
        });
        const chars = response.data.data.Media.characters.edges;
        return chars.map((c: any) => ({
          character: {
            mal_id: c.node.id,
            url: '',
            images: {
              webp: { image_url: c.node.image.large }
            },
            name: c.node.name.full
          },
          role: c.role === 'MAIN' ? 'Main' : 'Supporting'
        }));
      } catch (err) {
        console.error("AniList characters fallback also failed", err);
        return [];
      }
    }
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
