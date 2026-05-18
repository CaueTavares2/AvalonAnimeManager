const COMICK_API_URL = 'https://api.comick.app';

export const comickService = {
  searchManga: async (title: string) => {
    try {
      const url = new URL(`${COMICK_API_URL}/v1.0/search`);
      url.searchParams.append('q', title);
      url.searchParams.append('limit', '3');
      const response = await fetch(url.toString());
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  },

  getMangaFeed: async (comicId: string) => {
     try {
       // get comic details to get hid
       const response = await fetch(`${COMICK_API_URL}/comic/${comicId}`);
       if (!response.ok) return null;
       const data = await response.json();
       const hid = data.comic.hid;
       
       // get chapters
       const chaptersRes = await fetch(`${COMICK_API_URL}/comic/${hid}/chapters?lang=pt-br,en&limit=300`);
       if (!chaptersRes.ok) return null;
       return await chaptersRes.json();
     } catch {
       return null;
     }
  },

  getChapterPages: async (hid: string) => {
     try {
       const response = await fetch(`${COMICK_API_URL}/chapter/${hid}`);
       if (!response.ok) return null;
       const data = await response.json();
       return data.chapter; // { images: [...] }
     } catch {
       return null;
     }
  }
};
