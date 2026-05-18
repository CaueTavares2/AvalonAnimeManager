const ANILIST_API_URL = 'https://graphql.anilist.co';

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
  }
};
