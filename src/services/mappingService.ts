
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
    11061: { tmdb_id: 46298, type: 'tv' }, // Hunter x Hunter (2011)
    40748: { tmdb_id: 95479, type: 'tv' }, // Jujutsu Kaisen
    38000: { tmdb_id: 94605, type: 'tv' }, // Kimetsu no Yaiba
    31964: { tmdb_id: 63926, type: 'tv' }, // Boku no Hero Academia
    16498: { tmdb_id: 1429, type: 'tv' }, // Shingeki no Kyojin
    25777: { tmdb_id: 1429, type: 'tv' }, // Shingeki no Kyojin S2
    35760: { tmdb_id: 1429, type: 'tv' }, // Shingeki no Kyojin S3
    40028: { tmdb_id: 1429, type: 'tv' }, // Shingeki no Kyojin Final Season
    38524: { tmdb_id: 1429, type: 'tv' }, // Shingeki no Kyojin Final Season Part 1
    20: { tmdb_id: 46261, type: 'tv' }, // Naruto
    1735: { tmdb_id: 31910, type: 'tv' }, // Naruto Shippuden
    269: { tmdb_id: 30984, type: 'tv' }, // Bleach
    41467: { tmdb_id: 154148, type: 'tv' }, // Bleach TYBW
    34566: { tmdb_id: 70881, type: 'tv' }, // Boruto
    813: { tmdb_id: 12971, type: 'tv' }, // Dragon Ball Z
    30694: { tmdb_id: 62715, type: 'tv' }, // Dragon Ball Super
    6702: { tmdb_id: 33741, type: 'tv' }, // Fairy Tail
    34572: { tmdb_id: 73223, type: 'tv' }, // Black Clover
  } as Record<number, { tmdb_id: number, type: 'tv' | 'movie' }>,

  /**
   * Fetches TMDB mapping for a MAL ID with caching
   */
  getTMDBId: async (malId: number, title?: string, year?: number): Promise<IDMapping | null> => {
    try {
      // 0. Priority: Hardcoded for speed and accuracy
      if (mappingService.hardcodedMappings[malId]) {
        return {
          mal_id: malId,
          ...mappingService.hardcodedMappings[malId]
        };
      }

      // 1. Check Local Cache
      const cacheKey = `tmdb_mapping_${malId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }

      // 2. Try ani.zip mappings (Primary)
      const response = await fetch(`https://api.ani.zip/mappings?mal_id=${malId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.tmdb_id) {
          const result: IDMapping = {
            mal_id: malId,
            tmdb_id: data.tmdb_id,
            type: data.format?.toLowerCase().includes('movie') ? 'movie' : 'tv'
          };
          localStorage.setItem(cacheKey, JSON.stringify(result));
          return result;
        }
      }

      // 3. Fallback: Search TMDB directly by title if provided
      if (title) {
        const cleanTitle = title.replace(/\(.*\)/g, '').replace(/Final Season/gi, '').trim();
        const yearParam = year ? `&first_air_date_year=${year}&primary_release_year=${year}` : '';
        const searchResp = await fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=3f3debb8f744f97bf0774d7e7fbe0157&query=${encodeURIComponent(cleanTitle)}&language=pt-BR${yearParam}`
        );
        
        if (searchResp.ok) {
          const searchData = await searchResp.json();
          // Filter strictly for Animation AND (Japanese culture OR correct Year)
          const animeMatches = searchData.results?.filter((item: any) => {
            const isAnimation = item.genre_ids?.includes(16);
            const isJapanese = item.original_language === 'ja';
            const releaseYear = (item.first_air_date || item.release_date || '').split('-')[0];
            const yearMatch = year && releaseYear === year.toString();
            
            return isAnimation && (isJapanese || yearMatch);
          }) || [];

          const bestMatch = animeMatches[0] || searchData.results?.[0];

          if (bestMatch && (bestMatch.genre_ids?.includes(16) || bestMatch.original_language === 'ja')) {
            const result: IDMapping = {
              mal_id: malId,
              tmdb_id: bestMatch.id,
              type: bestMatch.media_type === 'movie' || bestMatch.first_air_date === undefined ? 'movie' : 'tv'
            };
            localStorage.setItem(cacheKey, JSON.stringify(result));
            return result;
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
