import { describe, it, expect, beforeEach, vi } from 'vitest';
import { jikanService } from '../src/services/jikanService';

// Mock fetch
global.fetch = vi.fn();

describe('jikanService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('getTrending', () => {
    it('should fetch trending anime', async () => {
      const mockData = {
        data: [
          {
            mal_id: 1,
            title: 'Test Anime',
            images: {
              webp: {
                image_url: 'https://example.com/image.jpg',
                large_image_url: 'https://example.com/large.jpg'
              }
            },
            score: 8.5,
            episodes: 12,
            genres: [{ name: 'Action' }],
            year: 2024,
            season: 'winter',
            status: 'airing',
            rank: 1,
            members: 1000,
            synopsis: 'Test synopsis'
          }
        ]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await jikanService.getTrending('anime');
      
      expect(result).toEqual(mockData.data);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should use cache on subsequent calls', async () => {
      const mockData = {
        data: [{ mal_id: 1, title: 'Test' }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      await jikanService.getTrending('anime');
      await jikanService.getTrending('anime');
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDetails', () => {
    it('should fetch anime details', async () => {
      const mockData = {
        data: {
          mal_id: 1,
          title: 'Test Anime',
          title_english: 'Test English',
          title_japanese: 'テスト',
          images: {
            webp: {
              image_url: 'https://example.com/image.jpg'
            }
          },
          score: 8.5,
          episodes: 12,
          genres: [{ name: 'Action' }],
          synopsis: 'Test synopsis'
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await jikanService.getDetails(1, 'anime');
      
      expect(result).toEqual(mockData.data);
    });
  });

  describe('search', () => {
    it('should search anime by query', async () => {
      const mockData = {
        data: [
          {
            mal_id: 1,
            title: 'Naruto',
            type: 'tv',
            images: {
              webp: { image_url: 'https://example.com/naruto.jpg' }
            },
            score: 8.0,
            episodes: 500
          }
        ],
        pagination: { last_visible_page: 1 }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await jikanService.search('naruto', 'anime');
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Naruto');
    });
  });
});
