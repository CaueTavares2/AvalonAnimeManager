
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

  getEpisodes: async (id: string) => {
    const [type, tmdbId] = id.split(':');
    
    if (type === 'movie') {
      return [{ id: `${id}:1`, number: 1, title: 'Filme Completo' }];
    }

    // Try to get info from mapping first if it's an anime
    // For now, return a generous list since the player handles the episode selection too.
    // If we return 100, the user can at least navigate.
    return Array.from({ length: 50 }, (_, i) => ({
      id: `${id}:${i + 1}`,
      number: i + 1,
      title: `Episódio ${i + 1}`
    }));
  },

  getStreams: async (id: string, episodeId?: string) => {
    const fullId = episodeId || id;
    const [type, tmdbId, epNum] = fullId.split(':');
    const episode = epNum || '1';
    
    // Betterflix Sources
    const sources = [
      {
        url: type === 'movie' 
          ? `https://betterflix.click/api/player?id=${tmdbId}&type=movie`
          : `https://betterflix.click/api/player?id=${tmdbId}&type=tv&season=1&episode=${episode}`,
        type: 'iframe' as const,
        quality: 'Betterflix HD (S1)'
      },
      {
        url: type === 'movie'
          ? `https://betterflix.click/api/player?id=${tmdbId}&type=movie&server=2`
          : `https://betterflix.click/api/player?id=${tmdbId}&type=tv&season=1&episode=${episode}&server=2`,
        type: 'iframe' as const,
        quality: 'Betterflix HD (S2)'
      },
      {
        url: type === 'movie'
          ? `https://betterflix.click/api/player?id=${tmdbId}&type=movie&server=3`
          : `https://betterflix.click/api/player?id=${tmdbId}&type=tv&season=1&episode=${episode}&server=3`,
        type: 'iframe' as const,
        quality: 'Betterflix HD (S3)'
      },
      {
        url: type === 'movie'
          ? `https://betterflix.click/watch?id=${tmdbId}&type=movie`
          : `https://betterflix.click/watch?id=${tmdbId}&type=tv&season=1&episode=${episode}`,
        type: 'iframe' as const,
        quality: 'Betterflix (Completo + Dub)'
      },
      {
        url: type === 'tv'
          ? `https://vidlink.pro/embed/tv/${tmdbId}/1/${episode}?primaryColor=ff0000`
          : `https://vidlink.pro/embed/movie/${tmdbId}?primaryColor=ff0000`,
        type: 'iframe' as const,
        quality: 'VidLink (Ultra HD)'
      },
      {
        url: type === 'tv' 
          ? `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=1&episode=${episode}`
          : `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}`,
        type: 'iframe' as const,
        quality: 'Global Multi-Source'
      }
    ];

    return sources;
  }
};
