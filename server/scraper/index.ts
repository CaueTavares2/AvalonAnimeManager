import { BaseScraperProvider } from './BaseProvider';
import { ScrapedChapter } from './types';
import { MuitoMangaProvider } from './providers/MuitoManga';
import { MangaPlusProvider } from './providers/MangaPlus';
import { NineMangaProvider } from './providers/NineManga';
import { MangaDexProvider } from './providers/MangaDex';

class ScraperManager {
  private providers: Map<string, BaseScraperProvider> = new Map();

  constructor() {
    this.registerProvider(
      new MuitoMangaProvider(),
      new MangaPlusProvider(),
      new NineMangaProvider(),
      new MangaDexProvider()
    );
  }

  private registerProvider(...providers: BaseScraperProvider[]) {
    for (const provider of providers) {
      this.providers.set(provider.sourceId, provider);
    }
  }

  getProvider(sourceId: string): BaseScraperProvider | undefined {
    return this.providers.get(sourceId);
  }

  async getChapters(mangaId: string) {
    const promises = Array.from(this.providers.values()).map(async (provider) => {
      try {
        const chapters = await provider.getChapters(mangaId);
        return chapters.map(c => ({
          ...c,
          // Normaliza o número do capítulo para comparação
          chapterNumber: c.chapterNumber.replace(/^0+/, '').toLowerCase()
        }));
      } catch (e) {
        console.error(`[Scraper] ${provider.sourceId} getChapters erro:`, e);
        return [];
      }
    });

    const results = await Promise.all(promises);
    const allChapters = results.flat();
    
    // Deduplicar: preferir fontes com títulos de capítulos (mais informação)
    const uniqueChapters = new Map<string, ScrapedChapter>();
    for (const chapter of allChapters) {
      const existing = uniqueChapters.get(chapter.chapterNumber);
      if (!existing || (chapter.title && !existing.title)) {
        uniqueChapters.set(chapter.chapterNumber, chapter);
      }
    }
    return Array.from(uniqueChapters.values());
  }

  async getPages(chapterId: string) {
    const promises = Array.from(this.providers.values()).map(async (provider) => {
        try {
            return await provider.getPages(chapterId);
        } catch (e) {
            return [];
        }
    });
    
    // Tentar pegar de todos em paralelo, retornar o primeiro que der resultado
    const results = await Promise.all(promises);
    return results.find(pages => pages.length > 0) || [];
  }

  async searchAll(query: string) {
    const promises = Array.from(this.providers.values()).map(p => 
      p.search(query).catch(e => {
        console.error(`[Scraper] ${p.sourceId} search erro:`, e.message);
        return [];
      })
    );
    const results = await Promise.all(promises);
    return results.flat();
  }
}

export const scraperManager = new ScraperManager();
