
import { jikanService } from './jikanService';
import { AnimeExtension, Episode, StreamSource } from './extensionService';

export const createStremioExtension = (manifestUrl: string, customName?: string): AnimeExtension => {
  const baseUrl = manifestUrl.replace('/manifest.json', '');
  
  // Internal cache for IMDb IDs
  const imdbCache = new Map<string, string>();

  const getImdbId = async (malId: string) => {
    if (imdbCache.has(malId)) return imdbCache.get(malId);
    
    try {
      const external = await jikanService.getExternalIds(parseInt(malId));
      const imdb = external.find((ex: any) => ex.name.toLowerCase() === 'imdb');
      if (imdb) {
        // Extract ID from URL like https://www.imdb.com/title/tt0110413/
        const match = imdb.url.match(/title\/(tt\d+)/);
        if (match) {
          imdbCache.set(malId, match[1]);
          return match[1];
        }
      }
    } catch (e) {
      console.error('Failed to map MAL to IMDb:', e);
    }
    return null;
  };

  return {
    id: `stremio-${btoa(manifestUrl).slice(0, 10)}`,
    name: customName || 'Stremio Addon',
    version: '1.0.0',
    icon: '🎬',
    description: 'Filmes e Séries via Torrentio/Stremio Proto',
    
    search: async (query: string) => {
      const items = await jikanService.search(query);
      return items.map((item: any) => ({
        id: item.mal_id.toString(),
        title: item.title,
        image: item.images.webp.large_image_url
      }));
    },
    
    getEpisodes: async (animeId: string) => {
      const details = await jikanService.getDetails(parseInt(animeId));
      const isMovie = details.type?.toLowerCase() === 'movie';
      
      if (isMovie) {
        return [{
          id: `${animeId}:movie:1`,
          number: 1,
          title: details.title
        }];
      }

      const totalEpisodes = details.episodes || 1;
      return Array.from({ length: totalEpisodes }, (_, i) => ({
        id: `${animeId}:series:${i + 1}`, // Encode prefix
        number: i + 1,
        title: `Episódio ${i + 1}`
      }));
    },
    
    getStreams: async (complexId: string) => {
      const [malId, type, epNum] = complexId.split(':');
      const imdbId = await getImdbId(malId);
      
      if (!imdbId) return [];

      try {
        // Stremio streams endpoint: /stream/{type}/{id}.json
        // For series: id is imdbId:season:episode (assuming season 1 for most anime)
        const stremioId = type === 'movie' ? imdbId : `${imdbId}:1:${epNum}`;
        const streamUrl = `${baseUrl}/stream/${type}/${stremioId}.json`;
        
        // Using a proxy might be needed for CORS
        const response = await fetch(`/api/proxy?url=${encodeURIComponent(streamUrl)}`);
        if (!response.ok) return [];
        
        const data = await response.json();
        if (!data.streams) return [];

        return data.streams.map((s: any) => ({
          url: s.url || s.link, // Torrentio usually returns direct URL if configured with Debrid
          type: s.url?.includes('.m3u8') ? 'hls' : 'mp4',
          quality: s.title || s.name || 'Torrent Stream'
        })).filter((s: any) => s.url);
      } catch (e) {
        console.error('Stremio stream fetch error:', e);
        return [];
      }
    }
  };
};
