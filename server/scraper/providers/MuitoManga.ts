import { BaseScraperProvider } from '../BaseProvider';
import { ScrapedManga, ScrapedChapter, ScrapedPage } from '../types';
import * as cheerio from 'cheerio';

export class MuitoMangaProvider extends BaseScraperProvider {
  readonly sourceId = 'muitomanga';
  readonly sourceName = 'MuitoManga';

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
