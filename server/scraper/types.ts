export interface ScrapedManga {
  id: string; // ID único usado pelo site (ex: url do manga)
  title: string;
  coverImage?: string;
  source: string; // Nome do provedor (ex: 'meuSite')
}

export interface ScrapedChapter {
  id: string; // URL ou ID do capítulo
  mangaId: string;
  chapterNumber: string;
  title?: string;
  publishedAt?: string;
  source: string;
}

export interface ScrapedPage {
  url: string;
  headers?: Record<string, string>; // Headers necessários para bypass de hotlinking (ex: Referer)
}
