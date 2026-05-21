import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'pt' | 'en';

interface Translation {
  [key: string]: string;
}

const translations: Record<Language, Translation> = {
  pt: {
    'nav.home': 'Página Inicial',
    'nav.browse': 'Explorar',
    'nav.list': 'Lista',
    'nav.config': 'Configuração',
    'nav.profile': 'Perfil',
    'nav.community': 'Comunidade',
    'nav.search': 'Pesquisar animes ou mangás...',
    'nav.login': 'Entrar',
    'nav.logout': 'Sair',
    'list.title': 'Minha Avalon List',
    'list.all': 'Tudo',
    'list.watching': 'Assistindo',
    'list.reading': 'Lendo',
    'list.completed': 'Completados',
    'list.planning': 'Planejados',
    'list.dropped': 'Dropados',
    'media.anime': 'Anime',
    'media.manga': 'Mangá',
    'community.title': 'Comunidade',
    'community.subtitle': 'Descubra outros aventureiros na Avalon Saga',
    'community.search': 'Buscar por usuário...',
    'list.empty': 'Nenhum resultado encontrado.',
    'list.browse_trending': 'Explorar Animes em alta',
    'settings.title': 'Configuração',
    'settings.subtitle': 'Personalize sua experiência no Avalon',
    'settings.save': 'Salvar Alterações',
    'settings.saved': 'Salvo!',
    'settings.tab.general': 'Geral',
    'settings.tab.appearance': 'Aparência',
    'settings.tab.migration': 'Migração',
    'settings.tab.extensions': 'Fontes',
    'settings.tab.language': 'Idioma',
    'settings.tab.diagnostics': 'Testes',
    'settings.theme.dark_mode': 'Modo Escuro',
    'settings.theme.dark_mode_desc': 'Experiência modo escuro',
    'settings.theme.colors': 'Cores de Destaque',
    'settings.migration.title': 'Importar do AniList / MyAnimeList',
    'settings.migration.subtitle': 'Migre sua jornada para o Avalon em segundos.',
    'settings.migration.mal': 'MyAnimeList Import',
    'settings.migration.anilist': 'AniList Import',
    'settings.migration.import': 'Importar',
    'settings.language.title': 'Idioma do App',
    'settings.language.subtitle': 'Escolha seu idioma favorito',
    'settings.danger.title': 'Zona de Perigo',
    'settings.danger.desc': 'Excluir sua conta removerá permanentemente todas as suas listas de animes, avaliações e progresso. Esta ação não pode ser desfeita.',
    'settings.danger.button': 'Excluir Conta Permanentemente',
    'settings.extensions.title': 'Fontes de Anime & Streams (Híbridas)',
    'settings.extensions.subtitle': 'Sistemas de agregação e conexões externas de vídeo (Stremio & APIs)',
    'settings.extensions.test_all': 'Testar Todas Conexões',
    'settings.diagnostics.title': 'Funcionalidades e Testes de Sistema',
    'settings.diagnostics.subtitle': 'Execute verificações manuais de estado e detecção de erros.',
    'settings.general.title': 'Preferências do Sistema',
    'settings.general.titleLanguage': 'Idioma do Título',
    'settings.general.titleLanguageDesc': 'Como os nomes dos animes aparecem',
    'home.explore': 'Explorar',
    'home.anime': 'Animes',
    'home.manga': 'Mangás',
    'home.trending': 'Em Alta',
    'home.popular': 'Populares',
    'home.upcoming': 'Próximos',
    'home.favorites': 'Favoritos',
    'home.year.subtitle': 'Sua Máquina do Tempo',
    'home.year.title': 'Explore por Ano',
    'home.year.desc': 'Descubra os clássicos atemporais ou os sucessos que definiram cada temporada da história.',
  },
  en: {
    'nav.home': 'Home',
    'nav.browse': 'Browse',
    'nav.list': 'My List',
    'nav.config': 'Settings',
    'nav.profile': 'Profile',
    'nav.community': 'Community',
    'nav.search': 'Search anime or manga...',
    'nav.login': 'Log In',
    'nav.logout': 'Log Out',
    'list.title': 'My Avalon List',
    'list.all': 'All',
    'list.watching': 'Watching',
    'list.reading': 'Reading',
    'list.completed': 'Completed',
    'list.planning': 'Planning',
    'list.dropped': 'Dropped',
    'media.anime': 'Anime',
    'media.manga': 'Manga',
    'community.title': 'Community',
    'community.subtitle': 'Discover other adventurers in Avalon Saga',
    'community.search': 'Search for users...',
    'list.empty': 'No results found.',
    'list.browse_trending': 'Browse Trending Anime',
    'settings.title': 'Settings',
    'settings.subtitle': 'Personalize your Avalon experience',
    'settings.save': 'Save Changes',
    'settings.saved': 'Saved!',
    'settings.tab.general': 'General',
    'settings.tab.appearance': 'Appearance',
    'settings.tab.migration': 'Migration',
    'settings.tab.extensions': 'Sources',
    'settings.tab.language': 'Language',
    'settings.tab.diagnostics': 'Diagnostics',
    'settings.theme.dark_mode': 'Dark Mode',
    'settings.theme.dark_mode_desc': 'Dark mode experience',
    'settings.theme.colors': 'Accent Colors',
    'settings.migration.title': 'Import from AniList / MyAnimeList',
    'settings.migration.subtitle': 'Migrate your journey to Avalon in seconds.',
    'settings.migration.mal': 'MyAnimeList Import',
    'settings.migration.anilist': 'AniList Import',
    'settings.migration.import': 'Import',
    'settings.language.title': 'App Language',
    'settings.language.subtitle': 'Choose your favorite language',
    'settings.danger.title': 'Danger Zone',
    'settings.danger.desc': 'Deleting your account will permanently remove all your anime lists, ratings, and progress. This action cannot be undone.',
    'settings.danger.button': 'Permanently Delete Account',
    'settings.extensions.title': 'Anime & Streams Sources (Hybrid)',
    'settings.extensions.subtitle': 'Aggregation systems and external video connections (Stremio & APIs)',
    'settings.extensions.test_all': 'Test All Connections',
    'settings.diagnostics.title': 'Features and System Tests',
    'settings.diagnostics.subtitle': 'Run manual state checks and error detection.',
    'settings.general.title': 'System Preferences',
    'settings.general.titleLanguage': 'Title Language',
    'settings.general.titleLanguageDesc': 'How anime names appear',
    'home.explore': 'Explore',
    'home.anime': 'Anime',
    'home.manga': 'Manga',
    'home.trending': 'Trending',
    'home.popular': 'Popular',
    'home.upcoming': 'Upcoming',
    'home.favorites': 'Favorites',
    'home.year.subtitle': 'Your Time Machine',
    'home.year.title': 'Explore by Year',
    'home.year.desc': 'Discover timeless classics or the hits that defined every season in history.',
  }
};

export type TitleLanguage = 'Romaji' | 'Inglês' | 'Nativo';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  titleLanguage: TitleLanguage;
  setTitleLanguage: (lang: TitleLanguage) => void;
  t: (key: string) => string;
  formatTitle: (media?: {
    title?: string;
    title_english?: string;
    title_japanese?: string;
    english?: string;
    japanese?: string;
    titleEnglish?: string;
    titleJapanese?: string;
    titleRomaji?: string;
    name?: string;
  }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'pt';
  });

  const [titleLanguage, setTitleLanguage] = useState<TitleLanguage>(() => {
    const saved = localStorage.getItem('titleLanguage');
    return (saved as TitleLanguage) || 'Romaji';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('titleLanguage', titleLanguage);
  }, [titleLanguage]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  const formatTitle = (media?: {
    title?: string;
    title_english?: string;
    title_japanese?: string;
    english?: string;
    japanese?: string;
    titleEnglish?: string;
    titleJapanese?: string;
    titleRomaji?: string;
    name?: string;
  }) => {
    if (!media) return '';
    const mainTitle = media.title || media.name || '';
    if (titleLanguage === 'Inglês') {
      return media.title_english || media.english || media.titleEnglish || mainTitle;
    }
    if (titleLanguage === 'Nativo') {
      return media.title_japanese || media.japanese || media.titleJapanese || mainTitle;
    }
    return media.titleRomaji || mainTitle;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, titleLanguage, setTitleLanguage, t, formatTitle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
