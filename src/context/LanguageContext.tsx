import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'pt' | 'en';

interface Translation {
  [key: string]: string;
}

const translations: Record<Language, Translation> = {
  pt: {
    'nav.browse': 'Browse',
    'nav.list': 'Lista',
    'nav.config': 'Config',
    'nav.profile': 'Perfil',
    'nav.community': 'Comunidade',
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
    'settings.tab.general': 'Geral',
    'settings.tab.appearance': 'Aparência',
    'settings.tab.migration': 'Migração',
    'settings.theme.dark_mode': 'Modo Escuro',
    'settings.theme.colors': 'Cores de Destaque',
    'settings.migration.title': 'Importar do AniList / MyAnimeList',
    'settings.migration.subtitle': 'Migre sua jornada para o Avalon em segundos.',
    'settings.migration.mal': 'MyAnimeList Import',
    'settings.migration.anilist': 'AniList Import',
    'settings.migration.import': 'Importar',
    'settings.language.title': 'Idioma do App',
    'settings.language.subtitle': 'Escolha seu idioma favorito',
  },
  en: {
    'nav.browse': 'Browse',
    'nav.list': 'List',
    'nav.config': 'Settings',
    'nav.profile': 'Profile',
    'nav.community': 'Community',
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
    'settings.tab.general': 'General',
    'settings.tab.appearance': 'Appearance',
    'settings.tab.migration': 'Migration',
    'settings.theme.dark_mode': 'Dark Mode',
    'settings.theme.colors': 'Accent Colors',
    'settings.migration.title': 'Import from AniList / MyAnimeList',
    'settings.migration.subtitle': 'Migrate your journey to Avalon in seconds.',
    'settings.migration.mal': 'MyAnimeList Import',
    'settings.migration.anilist': 'AniList Import',
    'settings.migration.import': 'Import',
    'settings.language.title': 'App Language',
    'settings.language.subtitle': 'Choose your favorite language',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'pt';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
