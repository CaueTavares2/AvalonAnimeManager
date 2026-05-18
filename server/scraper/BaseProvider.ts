import { ScrapedManga, ScrapedChapter, ScrapedPage } from './types';

export abstract class BaseScraperProvider {
  /**
   * Identificador único do scraper (ex: 'mangahost', 'muitomanga')
   */
  abstract readonly sourceId: string;
  abstract readonly sourceName: string;

  /**
   * Busca mangás por título
   */
  abstract search(query: string): Promise<ScrapedManga[]>;

  /**
   * Pega a lista de capítulos de um mangá
   */
  abstract getChapters(mangaId: string): Promise<ScrapedChapter[]>;

  /**
   * Pega as URLs das imagens de um capítulo
   */
  abstract getPages(chapterId: string): Promise<ScrapedPage[]>;

  // Função utilitária opcional para requisições seguras com headers falsos
  protected async fetchHtml(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    if (!response.ok) throw new Error(`Scraper fetch failed: ${response.status}`);
    return await response.text();
  }
}
