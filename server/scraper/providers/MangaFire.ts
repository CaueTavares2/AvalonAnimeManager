import { BaseScraperProvider } from '../BaseProvider';
import { ScrapedManga, ScrapedChapter, ScrapedPage } from '../types';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class MangaFireProvider extends BaseScraperProvider {
  readonly sourceId = 'mangafire';
  readonly sourceName = 'MangaFire';

  async search(query: string): Promise<ScrapedManga[]> {
    try {
      console.log(`[MangaFire] Searching: ${query}`);
      // Usando o proxy interno para evitar bloqueios de CORS/bot
      const response = await axios.get(`http://localhost:3000/api/proxy?url=${encodeURIComponent(`https://mangafire.to/search?keyword=${query}`)}`);
      const $ = cheerio.load(response.data);
      const results: ScrapedManga[] = [];
      
      // Selectors genéricos, precisarão de ajuste se a estrutura do site mudar
      $('.manga-item').each((i, el) => {
        const title = $(el).find('.manga-name').text();
        const id = $(el).find('a').attr('href')?.split('/').pop() || '';
        results.push({
          id,
          title,
          source: this.sourceId
        });
      });
      console.log(`[MangaFire] Search found ${results.length} results`);
      return results;
    } catch (e) {
      console.error('[MangaFire] search error:', e);
      return [];
    }
  }
  
  async getChapters(mangaId: string): Promise<ScrapedChapter[]> {
    try {
      console.log(`[MangaFire] Getting chapters for: ${mangaId}`);
      const response = await axios.get(`http://localhost:3000/api/proxy?url=${encodeURIComponent(`https://mangafire.to/manga/${mangaId}`)}`);
      const $ = cheerio.load(response.data);
      const chapters: ScrapedChapter[] = [];
      
      // Selectors genéricos, precisarão de ajuste se a estrutura do site mudar
      $('.chapter-item').each((i, el) => {
        const id = $(el).find('a').attr('href') || '';
        const chapterNumber = $(el).find('.chapter-name').text().replace(/[^0-9.]/g, '').trim();
        if (id && chapterNumber) {
            chapters.push({
            id,
            mangaId,
            chapterNumber,
            source: this.sourceName
            });
        }
      });
      console.log(`[MangaFire] Found ${chapters.length} chapters`);
      return chapters;
    } catch (e) {
      console.error('[MangaFire] chapter error:', e);
      return [];
    }
  }
  async getPages(chapterId: string): Promise<ScrapedPage[]> {
    try {
      console.log(`[MangaFire] Getting pages for: ${chapterId}`);
      // MangaFire often uses pages like `/read/chapter-id/1` or similar. This is highly speculative.
      const response = await axios.get(`http://localhost:3000/api/proxy?url=${encodeURIComponent(chapterId)}`);
      const $ = cheerio.load(response.data);
      const pages: ScrapedPage[] = [];
      
      // Generic placeholder, highly likely to need adjustment
      $('.page-image').each((i, el) => {
        const url = $(el).attr('src') || '';
        if (url) {
            pages.push({ url });
        }
      });
      console.log(`[MangaFire] Found ${pages.length} pages`);
      return pages;
    } catch (e) {
      console.error('[MangaFire] pages error:', e);
      return [];
    }
  }
}
