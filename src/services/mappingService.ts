
export interface IDMapping {
  mal_id: number;
  tmdb_id?: number;
  type: 'tv' | 'movie';
  title?: string;
}

/**
 * Service to map MyAnimeList IDs to TMDB IDs for Betterflix/Stremio support
 */
export const mappingService = {
  /**
   * Hardcoded maps for high-traffic problematic titles
   */
  hardcodedMappings: {
    1535: { tmdb_id: 13916, type: 'tv' }, // Death Note
    21: { tmdb_id: 37854, type: 'tv' }, // One Piece
    1575: { tmdb_id: 1575, type: 'tv' }, // Code Geass
    11061: { tmdb_id: 11061, type: 'tv' }, // Hunter x Hunter
  } as Record<number, { tmdb_id: number, type: 'tv' | 'movie' }>,

  /**
   * Fetches TMDB mapping for a MAL ID
   */
  getTMDBId: async (malId: number, title?: string): Promise<IDMapping | null> => {
    try {
      // 0. Priority: Hardcoded for speed and accuracy
      if (mappingService.hardcodedMappings[malId]) {
        console.log(`[Mapping] Hardcoded hit for MAL:${malId}`);
        return {
          mal_id: malId,
          ...mappingService.hardcodedMappings[malId]
        };
      }
      // 1. Try ani.zip mappings (Primary)
      console.log(`[Mapping] Checking ani.zip for MAL:${malId}`);
      const response = await fetch(`https://api.ani.zip/mappings?mal_id=${malId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.tmdb_id) {
          return {
            mal_id: malId,
            tmdb_id: data.tmdb_id,
            type: data.format?.toLowerCase().includes('movie') ? 'movie' : 'tv'
          };
        }
      }

      // 2. Fallback: Search TMDB directly by title if provided
      // Note: In a production app, the API key would be used server-side.
      // For this implementation, we'll try a public TMDB proxy or title-based heuristic
      // if the user hasn't configured the server-side proxy yet.
      if (title) {
        console.log(`[Mapping] ani.zip failed, searching TMDB for: ${title}`);
        const cleanTitle = title.replace(/\(.*\)/g, '').trim();
        // Fallback search pattern
        const searchResp = await fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=3f3debb8f744f97bf0774d7e7fbe0157&query=${encodeURIComponent(cleanTitle)}&language=pt-BR`
        );
        
        if (searchResp.ok) {
          const searchData = await searchResp.json();
          const bestMatch = searchData.results?.find((item: any) => 
            item.genre_ids?.includes(16) || item.original_language === 'ja'
          ) || searchData.results?.[0];

          if (bestMatch) {
            console.log(`[Mapping] Found TMDB match: ${bestMatch.name || bestMatch.title}`);
            return {
              mal_id: malId,
              tmdb_id: bestMatch.id,
              type: bestMatch.media_type === 'movie' ? 'movie' : 'tv'
            };
          }
        }
      }
      
      return null;
    } catch (e) {
      console.error('Mapping failed:', e);
      return null;
    }
  }
};
