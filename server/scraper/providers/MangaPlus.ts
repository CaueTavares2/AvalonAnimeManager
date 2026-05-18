import { BaseScraperProvider } from '../BaseProvider';
import { ScrapedManga, ScrapedChapter, ScrapedPage } from '../types';

export class MangaPlusProvider extends BaseScraperProvider {
  readonly sourceId = 'mangaplus';
  readonly sourceName = 'MangaPlus';

  async search(query: string): Promise<ScrapedManga[]> { return []; }
  async getChapters(mangaId: string): Promise<ScrapedChapter[]> { return []; }
  async getPages(chapterId: string): Promise<ScrapedPage[]> { return []; }
}
