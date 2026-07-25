const MANGALIVRE_BASE = 'https://mangalivre.net';
const PROXY_URL = '/api/proxy?url=';

export const mangaLivreService = {
  searchManga: async (title: string) => {
    try {
      const url = `${MANGALIVRE_BASE}/lib/search/series.json?q=${encodeURIComponent(title)}`;
      const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
      if (!response.ok) return null;
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('MangaLivre search returned non-JSON response');
        return null;
      }

      const data = await response.json();
      const series = data.series || [];
      return series.map((s: any) => ({
        id: s.id_serie,
        title: s.name,
        attributes: {
          title: { en: s.name }
        }
      }));
    } catch (error) {
      console.error('MangaLivre search error:', error);
      return null;
    }
  },

  getChapters: async (serieId: string) => {
    try {
      let allChapters: any[] = [];
      let page = 1;
      let hasMore = true;
      const CHUNK_SIZE = 5;

      while (hasMore && page <= 500) { // Support even longer series
        const promises = [];
        const currentChunkSize = Math.min(CHUNK_SIZE, 501 - page);
        
        for (let i = 0; i < currentChunkSize; i++) {
          const p = page + i;
          const url = `${MANGALIVRE_BASE}/series/chapters_list.json?id_serie=${serieId}&page=${p}`;
          promises.push(
            fetch(`${PROXY_URL}${encodeURIComponent(url)}`)
              .then(async res => {
                if (!res.ok) {
                   if (res.status === 429) console.warn(`MangaLivre Rate Limited on page ${p}`);
                   return { chapters: [], error: true };
                }
                const text = await res.text();
                try { return { ...JSON.parse(text), error: false }; } catch { return { chapters: [], error: true }; }
              })
              .catch(() => ({ chapters: [], error: true }))
          );
        }

        const results = await Promise.all(promises);
        let totalChaptersInChunk = 0;
        let errorsInChunk = 0;

        for (const data of results) {
          const chapters = data?.chapters || [];
          if (data.error) errorsInChunk++;
          
          if (chapters.length > 0) {
            totalChaptersInChunk += chapters.length;
            allChapters = [...allChapters, ...chapters.map((c: any) => ({
              id: c.id_chapter,
              attributes: {
                chapter: c.number,
                translatedLanguage: 'pt-br',
              }
            }))];
          }
        }

        // If we got NO chapters and NO errors, then we really are at the end
        if (totalChaptersInChunk === 0 && errorsInChunk === 0) {
          hasMore = false;
        } else if (totalChaptersInChunk === 0 && errorsInChunk > 0) {
          // All pages in chunk errored out? Maybe wait and try one more time or just stop
          console.error(`Chunk starting at page ${page} completely errored out.`);
          hasMore = false; 
        } else {
          page += currentChunkSize;
        }
      }
      
      return allChapters;
    } catch (error) {
      console.error('MangaLivre chapters error:', error);
      return null;
    }
  },

  getPages: async (chapterId: string) => {
    try {
      const url = `${MANGALIVRE_BASE}/leitor/pages/${chapterId}.json`;
      const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
      if (!response.ok) return null;

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('MangaLivre pages returned non-JSON response');
        return null;
      }

      const data = await response.json();
      return data.images || [];
    } catch (error) {
      console.error('MangaLivre pages error:', error);
      return null;
    }
  }
};
