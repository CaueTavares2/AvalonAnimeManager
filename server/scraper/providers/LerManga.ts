import { BaseScraperProvider } from '../BaseProvider';
import { ScrapedManga, ScrapedChapter, ScrapedPage } from '../types';
import * as cheerio from 'cheerio';

export class LerMangaProvider extends BaseScraperProvider {
  readonly sourceId = 'lermanga';
  readonly sourceName = 'LerManga';

  async search(query: string): Promise<ScrapedManga[]> {
    // To be implemented by internal scraper AI
    return [];
  }

  async getChapters(mangaId: string): Promise<ScrapedChapter[]> {
    // To be implemented by internal scraper AI
    return [];
  }

  async getPages(chapterId: string): Promise<ScrapedPage[]> {
    // To be implemented by internal scraper AI
    return [];
  }
}
