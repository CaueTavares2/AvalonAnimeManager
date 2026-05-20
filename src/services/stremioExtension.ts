
import { jikanService } from './jikanService';
import { AnimeExtension, Episode, StreamSource } from './extensionService';

export const createStremioExtension = (manifestUrl: string, customName?: string): AnimeExtension => {
  const baseUrl = manifestUrl.replace('/manifest.json', '');
  
  // Internal cache for IDs
  const idCache = new Map<string, { imdb?: string, kitsu?: string }>();

  const getMapping = async (malId: string) => {
    if (idCache.has(malId)) return idCache.get(malId);
    
    let mapping: { imdb?: string, kitsu?: string } = {};

    try {
      // 1. Try Jikan for IMDb
      const external = await jikanService.getExternalIds(parseInt(malId));
      const imdb = external.find((ex: any) => ex.name.toLowerCase() === 'imdb');
      if (imdb) {
        const match = imdb.url.match(/title\/(tt\d+)/);
        if (match) mapping.imdb = match[1];
      }

      // 2. Try MalSync for Kitsu (very reliable for anime)
      const msResponse = await fetch(`https://api.malsync.moe/mal/anime/${malId}`);
      if (msResponse.ok) {
        const msData = await msResponse.json();
        // Extract Kitsu ID
        if (msData.Sites?.Kitsu) {
          const firstKitsuKey = Object.keys(msData.Sites.Kitsu)[0];
          if (firstKitsuKey) {
            mapping.kitsu = msData.Sites.Kitsu[firstKitsuKey].identifier;
          }
        }
      }
    } catch (e) {
      console.error('Mapping failed for MAL ID:', malId, e);
    }
    
    idCache.set(malId, mapping);
    return mapping;
  };

  return {
    id: `stremio-${btoa(manifestUrl).slice(0, 10)}`,
    name: customName || 'Stremio Addon',
    version: '1.2.0',
    icon: '🎬',
    description: 'Agora com Suporte Web (P2P + Direct)',
    
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
        id: `${animeId}:series:${i + 1}`,
        number: i + 1,
        title: `Episódio ${i + 1}`
      }));
    },
    
    getStreams: async (complexId: string) => {
      const [malId, type, epNum] = complexId.split(':');
      const mapping = await getMapping(malId);
      
      const sources: StreamSource[] = [];
      const idsToTry = [];
      
      if (mapping.imdb) idsToTry.push({ id: mapping.imdb, provider: 'imdb' });
      if (mapping.kitsu) idsToTry.push({ id: `kitsu:${mapping.kitsu}`, provider: 'kitsu' });

      // Fallback: If both fail, try searching by title? (Stremio doesn't usually like this)
      
      for (const { id, provider } of idsToTry) {
        try {
          const stremioId = type === 'movie' || provider === 'kitsu' ? id : `${id}:1:${epNum}`;
          // For Kitsu, it's usually kitsu:id:ep
          const finalId = provider === 'kitsu' ? `${id}:${epNum}` : stremioId;
          
          const streamUrl = `${baseUrl}/stream/${type}/${finalId}.json`;
          const response = await fetch(`/api/proxy?url=${encodeURIComponent(streamUrl)}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.streams) {
              data.streams.forEach((s: any) => {
                let videoUrl = s.url || s.link;
                let videoType: 'mp4' | 'hls' | 'iframe' = videoUrl?.includes('.m3u8') ? 'hls' : 'mp4';
                
                if (!videoUrl && s.infoHash) {
                  // WEBTOR FALLBACK: Convert infoHash to a web-streamable player
                  videoUrl = `https://webtor.io/player?infohash=${s.infoHash}${s.fileIdx !== undefined ? `&file=${s.fileIdx}` : ''}`;
                  videoType = 'iframe';
                }

                if (videoUrl) {
                  sources.push({
                    url: videoUrl,
                    type: videoType,
                    quality: `[${provider.toUpperCase()}] ${s.title || s.name || 'Stream'}`
                  });
                }
              });
            }
          }
        } catch (e) {
          console.error(`Stream fetch failed for ${provider}:`, e);
        }
      }

      return sources;
    }
  };
};
