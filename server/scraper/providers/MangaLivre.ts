import { BaseScraperProvider } from '../BaseProvider';
import { ScrapedManga, ScrapedChapter, ScrapedPage } from '../types';

export class MangaLivreProvider extends BaseScraperProvider {
  readonly sourceId = 'mangalivre';
  readonly sourceName = 'MangaLivre';

  async search(query: string): Promise<ScrapedManga[]> { return []; }
  async getChapters(mangaId: string): Promise<ScrapedChapter[]> { return []; }
  async getPages(chapterId: string): Promise<ScrapedPage[]> { return []; }
}
