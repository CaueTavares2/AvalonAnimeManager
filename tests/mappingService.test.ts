import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mappingService } from '../src/services/mappingService';

// Mock fetch
global.fetch = vi.fn();

describe('mappingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('hardcodedMappings', () => {
    it('should return hardcoded mapping for Demon Slayer', () => {
      const mapping = mappingService.hardcodedMappings[38000];
      expect(mapping).toBeDefined();
      expect(mapping.tmdb_id).toBe(85937);
      expect(mapping.type).toBe('tv');
      expect(mapping.season).toBe(1);
    });

    it('should return hardcoded mapping for One Piece', () => {
      const mapping = mappingService.hardcodedMappings[21];
      expect(mapping).toBeDefined();
      expect(mapping.tmdb_id).toBe(37854);
    });

    it('should return hardcoded mapping for Attack on Titan', () => {
      const mapping = mappingService.hardcodedMappings[16498];
      expect(mapping).toBeDefined();
      expect(mapping.tmdb_id).toBe(1429);
      expect(mapping.season).toBe(1);
    });
  });

  describe('getTMDBId', () => {
    it('should use hardcoded mapping first', async () => {
      const result = await mappingService.getTMDBId(38000);
      
      expect(result).toBeDefined();
      expect(result?.tmdb_id).toBe(85937);
      expect(result?.source).toBe('offline');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should check cache for non-hardcoded IDs', async () => {
      localStorage.setItem('tmdb_mapping_99999', JSON.stringify({
        mal_id: 99999,
        tmdb_id: 12345,
        type: 'tv',
        season: 1,
        episode_offset: 0,
        source: 'cache'
      }));

      const result = await mappingService.getTMDBId(99999);
      
      expect(result).toBeDefined();
      expect(result?.tmdb_id).toBe(12345);
      expect(result?.source).toBe('cache');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should save and retrieve overrides', () => {
      mappingService.saveOverride(38000, {
        tmdb_id: 99999,
        type: 'tv',
        season: 2,
        episode_offset: 5
      });

      const result = mappingService.getTMDBId(38000);
      
      expect(result?.tmdb_id).toBe(99999);
      expect(result?.season).toBe(2);
      expect(result?.episode_offset).toBe(5);
      expect(result?.source).toBe('override');
    });

    it('should remove overrides', () => {
      mappingService.saveOverride(38000, {
        tmdb_id: 99999,
        type: 'tv'
      });

      mappingService.removeOverride(38000);
      
      const result = mappingService.getTMDBId(38000);
      
      // Should fall back to hardcoded mapping
      expect(result?.tmdb_id).toBe(85937);
      expect(result?.source).toBe('offline');
    });
  });
});
