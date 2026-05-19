import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Episode {
  id: string;
  number: number;
  title?: string;
}

export interface StreamSource {
  url: string;
  type: 'hls' | 'mp4' | 'iframe';
  quality?: string;
}

export interface AnimeExtension {
  id: string;
  name: string;
  version: string;
  icon: string;
  description: string;
  search: (query: string) => Promise<{ id: string; title: string; image: string }[]>;
  getEpisodes: (animeId: string) => Promise<Episode[]>;
  getStreams: (episodeId: string) => Promise<StreamSource[]>;
}

// In a real app we would load extensions via eval or importing external scripts.
// For now, we mock the extension registry.
export const AVAILABLE_EXTENSIONS: AnimeExtension[] = [
  {
    id: 'avalon-internal',
    name: 'Avalon Internal',
    version: '1.2.0',
    icon: '⚡',
    description: 'Motor interno otimizado para transmissões em alta velocidade.',
    search: async (query) => {
      // Use Jikan as base for discovery
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      return (data.data || []).map((a: any) => ({
        id: a.mal_id.toString(),
        title: a.title,
        image: a.images?.webp?.image_url || ''
      }));
    },
    getEpisodes: async (animeId) => {
      // Real Jikan episodes call
      const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/episodes`);
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        return data.data.map((ep: any) => ({
          id: ep.mal_id.toString(),
          number: ep.mal_id,
          title: ep.title
        }));
      }
      return Array.from({ length: 12 }, (_, i) => ({
        id: `ep-${i + 1}`,
        number: i + 1,
        title: `Episódio ${i + 1}`
      }));
    },
    getStreams: async (epId) => {
      return [
        {
          url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          type: 'hls',
          quality: '1080p'
        }
      ];
    }
  },
  {
    id: 'goanimes',
    name: 'GoAnimes',
    version: '14.15',
    icon: '🚀',
    description: 'A sua fonte principal. Rápido e com vasto catálogo direto da GoAnimes.',
    search: async (query) => {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      return (data.data || []).map((a: any) => ({
        id: a.mal_id.toString(),
        title: a.title,
        image: a.images?.webp?.image_url || ''
      }));
    },
    getEpisodes: async (animeId) => {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/episodes`);
      const data = await res.json();
      return (data.data || []).map((ep: any) => ({
        id: ep.mal_id.toString(),
        number: ep.mal_id,
        title: ep.title
      }));
    },
    getStreams: async (epId) => {
      return [
        {
          url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          type: 'hls',
          quality: '1080p'
        }
      ];
    }
  },
  {
    id: 'animefire',
    name: 'Anime Fire',
    version: '14.7',
    icon: '🔥',
    description: 'Extensão oficial AnimeFire. Mais de 10.000 títulos disponíveis.',
    search: async (query) => {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      return (data.data || []).map((a: any) => ({
        id: a.mal_id.toString(),
        title: a.title,
        image: a.images?.webp?.image_url || ''
      }));
    },
    getEpisodes: async (animeId) => {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/episodes`);
      const data = await res.json();
      return (data.data || []).map((ep: any) => ({
        id: ep.mal_id.toString(),
        number: ep.mal_id,
        title: ep.title
      }));
    },
    getStreams: async (epId) => {
      return [
        {
          url: 'https://vjs.zencdn.net/v/oceans.mp4',
          type: 'mp4',
          quality: '1080p'
        }
      ];
    }
  },
  {
    id: 'betteranime',
    name: 'Better Anime',
    version: '14.12',
    icon: '✨',
    description: 'Focado em qualidade Premium e legendas profissionais.',
    search: async (query) => {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      return (data.data || []).map((a: any) => ({
        id: a.mal_id.toString(),
        title: a.title,
        image: a.images?.webp?.image_url || ''
      }));
    },
    getEpisodes: async (animeId) => {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/episodes`);
      const data = await res.json();
      return (data.data || []).map((ep: any) => ({
        id: ep.mal_id.toString(),
        number: ep.mal_id,
        title: ep.title
      }));
    },
    getStreams: async (epId) => {
      return [
        {
          url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          type: 'hls',
          quality: '1080p'
        }
      ];
    }
  },
  {
    id: 'animesroll',
    name: 'AnimesROLL',
    version: '14.4',
    icon: '🌀',
    description: 'Catálogo sincronizado em tempo real com os lançamentos do Japão.',
    search: async (query) => {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      return (data.data || []).map((a: any) => ({
        id: a.mal_id.toString(),
        title: a.title,
        image: a.images?.webp?.image_url || ''
      }));
    },
    getEpisodes: async (animeId) => {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/episodes`);
      const data = await res.json();
      return (data.data || []).map((ep: any) => ({
        id: ep.mal_id.toString(),
        number: ep.mal_id,
        title: ep.title
      }));
    },
    getStreams: async (epId) => {
      return [
        {
          url: 'https://vjs.zencdn.net/v/oceans.mp4',
          type: 'mp4',
          quality: '1080p'
        }
      ];
    }
  },
  {
    id: 'anitube',
    name: 'AniTube',
    version: '14.13',
    icon: '📺',
    description: 'O portal lendário. Extenso acervo de animes clássicos e novos.',
    search: async (query) => {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      return (data.data || []).map((a: any) => ({
        id: a.mal_id.toString(),
        title: a.title,
        image: a.images?.webp?.image_url || ''
      }));
    },
    getEpisodes: async (animeId) => {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/episodes`);
      const data = await res.json();
      return (data.data || []).map((ep: any) => ({
        id: ep.mal_id.toString(),
        number: ep.mal_id,
        title: ep.title
      }));
    },
    getStreams: async (epId) => {
      return [
        {
          url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          type: 'hls',
          quality: '1080p'
        }
      ];
    }
  },
  {
    id: 'flixei',
    name: 'Flixei',
    version: '14.7',
    icon: '🎬',
    description: 'Alta qualidade de streaming para animes, filmes e muito mais.',
    search: async (query) => {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      return (data.data || []).map((a: any) => ({
        id: a.mal_id.toString(),
        title: a.title,
        image: a.images?.webp?.image_url || ''
      }));
    },
    getEpisodes: async (animeId) => {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/episodes`);
      const data = await res.json();
      return (data.data || []).map((ep: any) => ({
        id: ep.mal_id.toString(),
        number: ep.mal_id,
        title: ep.title
      }));
    },
    getStreams: async (epId) => {
      return [
        {
          url: 'https://vjs.zencdn.net/v/oceans.mp4',
          type: 'mp4',
          quality: '1080p'
        }
      ];
    }
  }
];

interface ExtensionStore {
  installed: string[];
  install: (id: string) => void;
  uninstall: (id: string) => void;
  getInstalledExtensions: () => AnimeExtension[];
}

export const useExtensions = create<ExtensionStore>()(
  persist(
    (set, get) => ({
      installed: ['avalon-internal', 'goanimes', 'animefire', 'betteranime', 'anitube'], // Pre-installed favorites
      install: (id) => set((state) => ({ installed: [...new Set([...state.installed, id])] })),
      uninstall: (id) => set((state) => ({ installed: state.installed.filter(ext => ext !== id) })),
      getInstalledExtensions: () => {
        return AVAILABLE_EXTENSIONS.filter(ext => get().installed.includes(ext.id));
      }
    }),
    {
      name: 'avalon-extensions-storage',
    }
  )
);
