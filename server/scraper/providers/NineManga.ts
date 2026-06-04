import { BaseScraperProvider } from '../BaseProvider';
import { ScrapedManga, ScrapedChapter, ScrapedPage } from '../types';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class NineMangaProvider extends BaseScraperProvider {
  readonly sourceId = 'ninemanga';
  readonly sourceName = 'Nine Manga';

  async search(query: string): Promise<ScrapedManga[]> {
    try {
      console.log(`[NineManga] Searching: ${query}`);
      const response = await axios.get(`http://localhost:3000/api/proxy?url=${encodeURIComponent(`https://ninemanga.com/search/?wd=${query}`)}`);
      const $ = cheerio.load(response.data);
      const results: ScrapedManga[] = [];
      
      // Selectors genéricos para ninemanga, precisarão de ajuste
      $('.book_list_item').each((i, el) => {
        const title = $(el).find('.book_name').text().trim();
        const id = $(el).find('a').attr('href')?.split('/').pop() || '';
        results.push({
          id,
          title,
          source: this.sourceId
        });
      });
      console.log(`[NineManga] Search found ${results.length} results`);
      return results;
    } catch (e) {
      console.error('[NineManga] search error:', e);
      return [];
    }
  }

  async getChapters(mangaId: string): Promise<ScrapedChapter[]> {
    try {
      console.log(`[NineManga] Getting chapters for: ${mangaId}`);
      const response = await axios.get(`http://localhost:3000/api/proxy?url=${encodeURIComponent(`https://ninemanga.com/manga/${mangaId}.html`)}`);
      const $ = cheerio.load(response.data);
      const chapters: ScrapedChapter[] = [];
      
      // Selectors genéricos para table-lista de capítulos
      $('.chapter_list tr').each((i, el) => {
        const link = $(el).find('a').attr('href');
        if (!link) return;
        const chapterNumber = $(el).find('a').text().split(' ').pop()?.replace(/[^0-9.]/g, '') || '';
        
        if (link && chapterNumber) {
            chapters.push({
            id: link,
            mangaId,
            chapterNumber,
            source: this.sourceName
            });
        }
      });
      console.log(`[NineManga] Found ${chapters.length} chapters`);
      return chapters;
    } catch (e) {
      console.error('[NineManga] chapter error:', e);
      return [];
    }
  }
  async getPages(chapterId: string): Promise<ScrapedPage[]> {
    try {
      console.log(`[NineManga] Getting pages for: ${chapterId}`);
      const response = await axios.get(`http://localhost:3000/api/proxy?url=${encodeURIComponent(chapterId)}`);
      const $ = cheerio.load(response.data);
      const pages: ScrapedPage[] = [];
      
      // Generic placeholder for image pages
      $('.chapter_img img').each((i, el) => {
        const url = $(el).attr('src') || '';
        if (url) {
            pages.push({ url });
        }
      });
      console.log(`[NineManga] Found ${pages.length} pages`);
      return pages;
    } catch (e) {
      console.error('[NineManga] pages error:', e);
      return [];
    }
  }
}
