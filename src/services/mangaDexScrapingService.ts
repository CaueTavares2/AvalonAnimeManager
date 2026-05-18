const MANGADEX_BASE = 'https://mangadex.org';
const PROXY_URL = '/api/proxy?url=';

export const mangaDexScrapingService = {
  searchManga: async (title: string) => {
    try {
      const url = `${MANGADEX_BASE}/search?q=${encodeURIComponent(title)}`;
      const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
      if (!response.ok) return null;
      const html = await response.text();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Look for manga cards
      const cards = doc.querySelectorAll('a.manga-card');
      const results = Array.from(cards).map(card => {
        const id = card.getAttribute('href')?.split('/')[2];
        const title = card.querySelector('.title')?.textContent || '';
        return { id, title };
      });
      
      return results;
    } catch (error) {
      console.error('MangaDex scraping search error:', error);
      return null;
    }
  },

  // Note: For chapters and pages, it's usually better to use the API if we have the ID.
  // Scraping pages is very hard because MangaDex uses a complex lazy loading.
  // So we'll mainly use this for search fallback if the API search fails.
};
