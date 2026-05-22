const ANILIST_API_URL = 'https://graphql.anilist.co';

  const scheduleCache = new Map<string, { data: any, timestamp: number }>();
  
  export const aniListService = {

  searchManga: async (title: string) => {
    const query = `
      query ($search: String) {
        Page (page: 1, perPage: 10) {
          media (search: $search, type: MANGA) {
            id
            title {
              romaji
              english
              native
            }
            synonyms
            description
            coverImage {
              large
            }
          }
        }
      }
    `;

    const variables = {
      search: title
    };

    try {
      const response = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          variables: variables
        })
      });

      const data = await response.json();
      return data.data?.Page?.media || [];
    } catch (error) {
      console.error("AniList Search Error:", error);
      return [];
    }
  },

  getMangaByTitle: async (title: string) => {
    const query = `
      query ($search: String) {
        Media (search: $search, type: MANGA) {
          id
          title {
            romaji
            english
            native
          }
          synonyms
          description
          coverImage {
            large
          }
        }
      }
    `;

    const variables = {
      search: title
    };

    try {
      const response = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          variables: variables
        })
      });

      const data = await response.json();
      return data.data?.Media || null;
    } catch (error) {
      console.error("AniList Fetch Error:", error);
      return null;
    }
  },

  getRelationsByMalId: async (idMal: number, type: 'ANIME' | 'MANGA') => {
    const query = `
      query ($idMal: Int, $type: MediaType) {
        Media (idMal: $idMal, type: $type) {
          relations {
            edges {
              relationType
              node {
                idMal
                id
                title {
                  romaji
                  english
                }
                type
                coverImage {
                  large
                }
              }
            }
          }
        }
      }
    `;

    const variables = { idMal, type };

    try {
      const response = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables })
      });
      const data = await response.json();
      return data.data?.Media?.relations?.edges || [];
    } catch (error) {
      console.error("AniList Fetch Relations Error:", error);
      return [];
    }
  },

  getStatsByMalId: async (idMal: number, type: 'ANIME' | 'MANGA') => {
    const query = `
      query ($idMal: Int, $type: MediaType) {
        Media (idMal: $idMal, type: $type) {
          stats {
            statusDistribution {
              status
              amount
            }
            scoreDistribution {
              score
              amount
            }
          }
        }
      }
    `;

    const variables = { idMal, type };

    try {
      const response = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables })
      });
      const data = await response.json();
      return data.data?.Media?.stats || null;
    } catch (error) {
      console.error("AniList Fetch Stats Error:", error);
      return null;
    }
  },

  getAiringScheduleByMalId: async (idMal: number, type: 'ANIME' | 'MANGA' = 'ANIME') => {
    const cacheKey = `${type}-${idMal}`;
    const cached = scheduleCache.get(cacheKey);
    const now = Date.now();
    
    // Cache for 15 minutes (900000 ms)
    if (cached && (now - cached.timestamp < 900000)) {
      return cached.data;
    }

    const query = `
      query ($idMal: Int, $type: MediaType) {
        Media (idMal: $idMal, type: $type) {
          status
          nextAiringEpisode {
            airingAt
            timeUntilAiring
            episode
          }
        }
      }
    `;

    const variables = { idMal, type };

    try {
      const response = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables })
      });
      const data = await response.json();
      const result = data.data?.Media || null;
      if (result) {
        scheduleCache.set(cacheKey, { data: result, timestamp: now });
      }
      return result;
    } catch (error) {
      console.error("AniList Fetch Airing Schedule Error:", error);
      return null;
    }
  }
};
