import { BaseScraperProvider } from '../BaseProvider';
import { ScrapedManga, ScrapedChapter, ScrapedPage } from '../types';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class MangaDexProvider extends BaseScraperProvider {
  readonly sourceId = 'mangadex';
  readonly sourceName = 'MangaDex';

  async search(query: string): Promise<ScrapedManga[]> {
    try {
      console.log(`[MangaDex] Searching: ${query}`);
      const response = await axios.get(`http://localhost:3000/api/proxy?url=${encodeURIComponent(`https://api.mangadex.org/manga?title=${query}&limit=5`)}`);
      const results: ScrapedManga[] = response.data.data.map((m: any) => ({
        id: m.id,
        title: m.attributes.title.en || m.attributes.title['ja-ro'],
        source: this.sourceId
      }));
      return results;
    } catch (e) {
      console.error('[MangaDex] search error:', e);
      return [];
    }
  }

  async getChapters(mangaId: string): Promise<ScrapedChapter[]> {
    try {
      console.log(`[MangaDex] Getting chapters for: ${mangaId}`);
      // Assuming mangaId here already is the UUID if it comes from our search, 
      // but if it's MAL ID, we need to map it. This is tricky.
      // For simplicity, let's assume it's the UUID for now or try to search if not.
      
      const response = await axios.get(`http://localhost:3000/api/proxy?url=${encodeURIComponent(`https://api.mangadex.org/manga/${mangaId}/feed?limit=500&translatedLanguage%5B%5D=pt-br&order%5Bchapter%5D=asc`)}`);
      
      const chapters: ScrapedChapter[] = response.data.data.map((c: any) => ({
        id: c.id,
        mangaId,
        chapterNumber: c.attributes.chapter,
        title: c.attributes.title,
        source: this.sourceName
      }));
      
      return chapters;
    } catch (e) {
      console.error('[MangaDex] chapter error:', e);
      return [];
    }
  }
  
  async getPages(chapterId: string): Promise<ScrapedPage[]> {
    try {
      const response = await axios.get(`http://localhost:3000/api/proxy?url=${encodeURIComponent(`https://api.mangadex.org/at-home/server/${chapterId}`)}`);
      const baseUrl = response.data.baseUrl;
      const hash = response.data.chapter.hash;
      const data = response.data.chapter.data;

      return data.map((filename: string) => ({
        url: `${baseUrl}/data/${hash}/${filename}`
      }));
    } catch (e) {
      console.error('[MangaDex] pages error:', e);
      return [];
    }
  }
}
