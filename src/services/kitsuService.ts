const KITSU_API_URL = 'https://kitsu.io/api/edge';

export const kitsuService = {
  searchManga: async (query: string) => {
    try {
      const response = await fetch(`${KITSU_API_URL}/manga?filter[text]=${encodeURIComponent(query)}&page[limit]=10`);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Kitsu Search Error:", error);
      return [];
    }
  },

  getMangaDetails: async (id: string) => {
    try {
      const response = await fetch(`${KITSU_API_URL}/manga/${id}`);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Kitsu Details Error:", error);
      return null;
    }
  },

  getMangaBySlug: async (slug: string) => {
     try {
      const response = await fetch(`${KITSU_API_URL}/manga?filter[slug]=${encodeURIComponent(slug)}`);
      const data = await response.json();
      return data.data?.[0] || null;
    } catch (error) {
      console.error("Kitsu Slug Error:", error);
      return null;
    }
  }
};
