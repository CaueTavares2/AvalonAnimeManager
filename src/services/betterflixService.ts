
import { AnimeExtension, StreamSource } from './extensionService';

export const betterflixExtension: AnimeExtension = {
  id: 'betterflix',
  name: 'Betterflix',
  version: '1.0.0',
  icon: '💎',
  description: 'Catálogo Betterflix (Filmes e Séries)',
  
  search: async (query: string) => {
    try {
      const response = await fetch(`https://betterflix.click/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      // Betterflix returns TMDB style results. Filter for anime related
      const allResults = data.results || [];
      const results = allResults.filter((item: any) => {
        const isAnimation = (item.genre_ids || []).includes(16);
        const isJapanese = item.original_language === 'ja';
        const name = (item.name || item.title || '').toLowerCase();
        const isAnimeKeyword = name.includes('anime') || name.includes('one piece') || name.includes('naruto') || name.includes('bleach') || name.includes('hunter x hunter');
        
        // Priority: Only Animation with Japanese origin OR strong anime keywords
        return (isAnimation && isJapanese) || (isAnimation && isAnimeKeyword);
      });

      // Deduplicate results by ID
      const seenIds = new Set();
      const uniqueResults = results.filter((item: any) => {
        const fullId = `${item.first_air_date ? 'tv' : 'movie'}:${item.id}`;
        if (seenIds.has(fullId)) return false;
        seenIds.add(fullId);
        return true;
      });

      return uniqueResults.map((item: any) => ({
        id: `${item.first_air_date ? 'tv' : 'movie'}:${item.id}`,
        title: item.name || item.title,
        image: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
        type: item.first_air_date ? 'TV' : 'MOVIE'
      }));
    } catch (e) {
      console.error('Betterflix search failed:', e);
      return [];
    }
  },

  getEpisodes: async (id: string, totalCount?: number) => {
    const parts = id.split(':');
    const type = parts[0];
    const tmdbId = parts[1];
    const season = parts[2] || '1';
    const offset = parseInt(parts[3] || '0', 10);
    
    if (type === 'movie') {
      return [{ id: `${id}:1`, number: 1, title: 'Filme Completo' }];
    }

    // Optimization: Use provided totalCount for accurate paging, or default to 100 for long series
    const count = totalCount || 100;
    return Array.from({ length: count }, (_, i) => ({
      // Under the hood, encode the real TMDB season and calculated absolute episode inside the ID
      id: `${type}:${tmdbId}:${season}:${i + 1 + offset}`,
      number: i + 1,
      title: `Episódio ${i + 1}`
    }));
  },

  getStreams: async (id: string, episodeId?: string) => {
    const fullId = episodeId || id;
    const parts = fullId.split(':');
    
    const type = parts[0];
    const tmdbId = parts[1];
    
    let season = '1';
    let episode = '1';
    
    if (parts.length === 4) {
      // Format from getEpisodes: type:tmdbId:season:calculatedTMDBEpisode
      season = parts[2];
      episode = parts[3];
    } else if (parts.length === 3) {
      // Legacy or manual: type:tmdbId:episode
      episode = parts[2] || '1';
    }
    
    // Betterflix Sources - Reduced to only the most stable source
    const sources = [
      {
        url: type === 'movie' 
          ? `https://betterflix.click/api/player?id=${tmdbId}&type=movie`
          : `https://betterflix.click/api/player?id=${tmdbId}&type=tv&season=${season}&episode=${episode}`,
        type: 'iframe' as const,
        quality: 'Betterflix HD'
      }
    ];

    return sources;
  }
};
