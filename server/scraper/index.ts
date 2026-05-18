import { BaseScraperProvider } from './BaseProvider';
import { MuitoMangaProvider } from './providers/MuitoManga';
import { LerMangaProvider } from './providers/LerManga';
import { SuperMangasProvider } from './providers/SuperMangas';
import { MangaLivreProvider } from './providers/MangaLivre';
import { MangaPlusProvider } from './providers/MangaPlus';

class ScraperManager {
  private providers: Map<string, BaseScraperProvider> = new Map();

  constructor() {
    this.registerProvider(
      new MuitoMangaProvider(),
      new LerMangaProvider(),
      new SuperMangasProvider(),
      new MangaLivreProvider(),
      new MangaPlusProvider()
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
