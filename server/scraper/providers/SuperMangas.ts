import { BaseScraperProvider } from '../BaseProvider';
import { ScrapedManga, ScrapedChapter, ScrapedPage } from '../types';
import * as cheerio from 'cheerio';

export class SuperMangasProvider extends BaseScraperProvider {
  readonly sourceId = 'supermangas';
  readonly sourceName = 'SuperMangas';

  async search(query: string): Promise<ScrapedManga[]> {
    return [];
  }

  async getChapters(mangaId: string): Promise<ScrapedChapter[]> {
    return [];
  }

  async getPages(chapterId: string): Promise<ScrapedPage[]> {
    return [];
  }
}
