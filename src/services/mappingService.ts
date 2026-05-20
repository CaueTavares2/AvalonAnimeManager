
export interface IDMapping {
  mal_id: number;
  tmdb_id?: number;
  type: 'tv' | 'movie';
  title?: string;
  season?: number;
  episode_offset?: number;
  source?: string;
}

/**
 * Service to map MyAnimeList IDs to TMDB IDs for Betterflix/Stremio support
 */
export const mappingService = {
  /**
   * Hardcoded maps for high-traffic problematic titles with Season and Episode offsets!
   */
  hardcodedMappings: {
    // === DEATH NOTE ===
    1535: { tmdb_id: 13916, type: 'tv', season: 1, episode_offset: 0 },

    // === ONE PIECE ===
    21: { tmdb_id: 37854, type: 'tv', season: 1, episode_offset: 0 },

    // === CODE GEASS ===
    1575: { tmdb_id: 1575, type: 'tv', season: 1, episode_offset: 0 },

    // === HUNTER X HUNTER (2011) ===
    11061: { tmdb_id: 46298, type: 'tv', season: 1, episode_offset: 0 },

    // === JUJUTSU KAISEN ===
    40748: { tmdb_id: 95479, type: 'tv', season: 1, episode_offset: 0 }, // JJK S1
    51009: { tmdb_id: 95479, type: 'tv', season: 2, episode_offset: 0 }, // JJK S2
    46569: { tmdb_id: 858017, type: 'movie' }, // JJK 0 Movie

    // === DEMON SLAYER (KIMETSU NO YAIBA) ===
    38000: { tmdb_id: 94605, type: 'tv', season: 1, episode_offset: 0 },  // Season 1 (Kamado Tanjiro Arc)
    41608: { tmdb_id: 635302, type: 'movie' }, // Mugen Train Movie
    44074: { tmdb_id: 94605, type: 'tv', season: 2, episode_offset: 0 },  // Mugen Train Arc TV (ep 1-7)
    47778: { tmdb_id: 94605, type: 'tv', season: 2, episode_offset: 7 },  // Entertainment District Arc (ep 1-11 mapped to TMDB S2 ep 8-18)
    53413: { tmdb_id: 94605, type: 'tv', season: 3, episode_offset: 0 },  // Swordsmith Village Arc (ep 1-11 mapped to TMDB S3 ep 1-11)
    55701: { tmdb_id: 94605, type: 'tv', season: 4, episode_offset: 0 },  // Hashira Training Arc (ep 1-8 mapped to TMDB S4 ep 1-8)

    // === MY HERO ACADEMIA (BOKU NO HERO ACADEMIA) ===
    31964: { tmdb_id: 63926, type: 'tv', season: 1, episode_offset: 0 }, // S1
    33486: { tmdb_id: 63926, type: 'tv', season: 2, episode_offset: 0 }, // S2
    36456: { tmdb_id: 63926, type: 'tv', season: 3, episode_offset: 0 }, // S3
    38691: { tmdb_id: 63926, type: 'tv', season: 4, episode_offset: 0 }, // S4
    41587: { tmdb_id: 63926, type: 'tv', season: 5, episode_offset: 0 }, // S5
    51141: { tmdb_id: 63926, type: 'tv', season: 6, episode_offset: 0 }, // S6
    55457: { tmdb_id: 63926, type: 'tv', season: 7, episode_offset: 0 }, // S7

    // === ATTACK ON TITAN (SHINGEKI NO KYOJIN) ===
    16498: { tmdb_id: 1429, type: 'tv', season: 1, episode_offset: 0 }, // S1
    25777: { tmdb_id: 1429, type: 'tv', season: 2, episode_offset: 0 }, // S2
    35760: { tmdb_id: 1429, type: 'tv', season: 3, episode_offset: 0 }, // S3 Part 1
    38524: { tmdb_id: 1429, type: 'tv', season: 3, episode_offset: 12 }, // S3 Part 2 (ep 1-10 mapped to S3 ep 13-22)
    40028: { tmdb_id: 1429, type: 'tv', season: 4, episode_offset: 0 }, // Final Season Part 1 (ep 1-16 mapped to S4 ep 1-16)
    48583: { tmdb_id: 1429, type: 'tv', season: 4, episode_offset: 16 }, // Final Season Part 2 (ep 1-12 mapped to S4 ep 17-28)
    51761: { tmdb_id: 1429, type: 'tv', season: 4, episode_offset: 28 }, // Final Season Part 3 (ep 1-2 mapped to S4 ep 29-30)

    // === NARUTO FRANCHISE ===
    20: { tmdb_id: 46261, type: 'tv', season: 1, episode_offset: 0 },    // Naruto
    1735: { tmdb_id: 31910, type: 'tv', season: 1, episode_offset: 0 },  // Naruto Shippuden
    34566: { tmdb_id: 70881, type: 'tv', season: 1, episode_offset: 0 },  // Boruto

    // === BLEACH FRANCHISE ===
    269: { tmdb_id: 30984, type: 'tv', season: 1, episode_offset: 0 },   // Bleach
    41467: { tmdb_id: 154148, type: 'tv', season: 1, episode_offset: 0 }, // Bleach TYBW Part 1
    53998: { tmdb_id: 154148, type: 'tv', season: 2, episode_offset: 0 }, // Bleach TYBW Part 2
    57731: { tmdb_id: 154148, type: 'tv', season: 3, episode_offset: 0 }, // Bleach TYBW Part 3

    // === DRAGON BALL ===
    813: { tmdb_id: 12971, type: 'tv', season: 1, episode_offset: 0 },   // Dragon Ball Z
    30694: { tmdb_id: 62715, type: 'tv', season: 1, episode_offset: 0 },  // Dragon Ball Super

    // === SWORD ART ONLINE ===
    11757: { tmdb_id: 45782, type: 'tv', season: 1, episode_offset: 0 }, // SAO S1
    21881: { tmdb_id: 45782, type: 'tv', season: 2, episode_offset: 0 }, // SAO S2
    37521: { tmdb_id: 45782, type: 'tv', season: 3, episode_offset: 0 }, // SAO Alicization
    40540: { tmdb_id: 45782, type: 'tv', season: 3, episode_offset: 24 }, // SAO War of Underworld (ep 1-23 mapped to S3 ep 25-47)

    // === TOKYO GHOUL ===
    22319: { tmdb_id: 61664, type: 'tv', season: 1, episode_offset: 0 }, // Tokyo Ghoul S1
    27899: { tmdb_id: 61664, type: 'tv', season: 2, episode_offset: 0 }, // Tokyo Ghoul √A S2
    36511: { tmdb_id: 61664, type: 'tv', season: 3, episode_offset: 0 }, // Tokyo Ghoul:re S3
    37703: { tmdb_id: 61664, type: 'tv', season: 4, episode_offset: 0 }, // Tokyo Ghoul:re 2nd Season S4

    // === ONE PUNCH MAN ===
    30276: { tmdb_id: 63923, type: 'tv', season: 1, episode_offset: 0 }, // OPM S1
    34134: { tmdb_id: 63923, type: 'tv', season: 2, episode_offset: 0 }, // OPM S2

    // === KONOSUBA ===
    30831: { tmdb_id: 65942, type: 'tv', season: 1, episode_offset: 0 }, // KonoSuba S1
    32901: { tmdb_id: 65942, type: 'tv', season: 2, episode_offset: 0 }, // KonoSuba S2
    52082: { tmdb_id: 65942, type: 'tv', season: 3, episode_offset: 0 }, // KonoSuba S3
    38040: { tmdb_id: 592834, type: 'movie' }, // KonoSuba Movie Legend of Crimson

    // === SOLO LEVELING ===
    52299: { tmdb_id: 117376, type: 'tv', season: 1, episode_offset: 0 }, // Solo Leveling S1
    57297: { tmdb_id: 117376, type: 'tv', season: 2, episode_offset: 0 }, // Solo Leveling S2

    // === MISC POPULAR ===
    34572: { tmdb_id: 73223, type: 'tv', season: 1, episode_offset: 0 },  // Black Clover
    6702: { tmdb_id: 33741, type: 'tv', season: 1, episode_offset: 0 },   // Fairy Tail
    44511: { tmdb_id: 114410, type: 'tv', season: 1, episode_offset: 0 }, // Chainsaw Man S1
    32182: { tmdb_id: 67023, type: 'tv', season: 1, episode_offset: 0 },  // Mob Psycho 100 S1
    37510: { tmdb_id: 67023, type: 'tv', season: 2, episode_offset: 0 },  // Mob Psycho 100 S2
    50172: { tmdb_id: 67023, type: 'tv', season: 3, episode_offset: 0 },  // Mob Psycho 100 S3
    5114: { tmdb_id: 31964, type: 'tv', season: 1, episode_offset: 0 },   // FMAB
  } as Record<number, { tmdb_id: number, type: 'tv' | 'movie', season?: number, episode_offset?: number }>,

  /**
   * Fetches TMDB mapping for a MAL ID with caching and custom override priority
   */
  getTMDBId: async (malId: number, title?: string, year?: number, anilistId?: number): Promise<IDMapping | null> => {
    try {
      // 0. Check Custom Override priority (Saved locally by the user inside the player)
      const overridesRaw = localStorage.getItem('avalon_tmdb_overrides');
      if (overridesRaw) {
        try {
          const overrides = JSON.parse(overridesRaw);
          if (overrides[malId]) {
            return {
              mal_id: malId,
              ...overrides[malId],
              source: 'override'
            };
          }
        } catch (e) {
          console.error('Failed to parse overrides:', e);
        }
      }

      // 1. Priority: Fixed mappings list for popular titles (Demon Slayer, Attack on Titan, KonoSuba, Bleach)
      if (mappingService.hardcodedMappings[malId]) {
        return {
          mal_id: malId,
          ...mappingService.hardcodedMappings[malId],
          source: 'offline'
        };
      }

      // 2. Check local translation cache
      const cacheKey = `tmdb_mapping_${malId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          return {
            ...JSON.parse(cached),
            source: 'cache'
          };
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }

      // 3. Try ani.zip mappings (Primary API mapping with strict defensive structure checking)
      let response;
      if (malId) {
        response = await fetch(`https://api.ani.zip/mappings?mal_id=${malId}`);
      } else if (anilistId) {
        response = await fetch(`https://api.ani.zip/mappings?anilist_id=${anilistId}`);
      }

      if (response && response.ok) {
        const data = await response.json();
        // Support all commonly returned raw payload structures
        const tmdbIdResult = data.tmdb_id || data.themoviedb_id || data.mappings?.themoviedb_id || data.mappings?.tmdb_id;
        
        if (tmdbIdResult) {
          const result: IDMapping = {
            mal_id: malId || data.mappings?.mal_id || data.mal_id || 0,
            tmdb_id: Number(tmdbIdResult),
            type: (data.format?.toLowerCase().includes('movie') || data.mappings?.format?.toLowerCase().includes('movie')) ? 'movie' : 'tv',
            season: 1,
            episode_offset: 0,
            source: 'anizip'
          };
          localStorage.setItem(cacheKey, JSON.stringify(result));
          return result;
        }
      }

      // 4. Try fetching via AniList ID lookup to pull MAL/Jikan Id as intermediary
      if (anilistId && !malId) {
        try {
          const query = `
            query ($id: Int) {
              Media (id: $id, type: ANIME) {
                idMal
              }
            }
          `;
          const alResponse = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables: { id: anilistId } })
          });
          if (alResponse.ok) {
            const alData = await alResponse.json();
            const retrievedMalId = alData.data?.Media?.idMal;
            if (retrievedMalId) {
              return mappingService.getTMDBId(retrievedMalId, title, year);
            }
          }
        } catch (e) {
          console.warn('AniList lookup proxy failed:', e);
        }
      }

      // 5. Fallback: Search TMDB search endpoint directly by cleaned title with high-precision rating logic
      if (title) {
        const cleanTitle = title.replace(/\(.*\)/g, '').replace(/Final Season/gi, '').trim();
        const yearParam = year ? `&first_air_date_year=${year}&primary_release_year=${year}` : '';
        const searchResp = await fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=3f3debb8f744f97bf0774d7e7fbe0157&query=${encodeURIComponent(cleanTitle)}&language=pt-BR${yearParam}`
        );
        
        if (searchResp.ok) {
          const searchData = await searchResp.json();
          // Filter strictly for Animation AND Japanese original audio to catch animes accurately
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
              type: bestMatch.media_type === 'movie' || bestMatch.first_air_date === undefined ? 'movie' : 'tv',
              season: 1,
              episode_offset: 0,
              source: 'search'
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
  },

  /**
   * Save a local adjustment override for an anime mapping
   */
  saveOverride: (malId: number, mapping: { tmdb_id: number, type: 'tv' | 'movie', season?: number, episode_offset?: number }) => {
    try {
      const overridesRaw = localStorage.getItem('avalon_tmdb_overrides') || '{}';
      const overrides = JSON.parse(overridesRaw);
      overrides[malId] = mapping;
      localStorage.setItem('avalon_tmdb_overrides', JSON.stringify(overrides));
    } catch (e) {
      console.error('Failed to save override:', e);
    }
  },

  /**
   * Delete a custom local override, restoring normal automated translation
   */
  removeOverride: (malId: number) => {
    try {
      const overridesRaw = localStorage.getItem('avalon_tmdb_overrides') || '{}';
      const overrides = JSON.parse(overridesRaw);
      delete overrides[malId];
      localStorage.setItem('avalon_tmdb_overrides', JSON.stringify(overrides));
    } catch (e) {
      console.error('Failed to remove override:', e);
    }
  }
};
