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
    id: 'mock-anime-ext',
    name: 'Avalon Streams (Official)',
    version: '1.0.0',
    icon: '🔥',
    description: 'Fonte oficial do Avalon com episódios de demonstração.',
    search: async (query) => {
      return [{ id: 'demo-1', title: query, image: '' }];
    },
    getEpisodes: async (animeId) => {
      // Mocking 12 episodes
      return Array.from({ length: 12 }, (_, i) => ({
        id: `ep-${i + 1}`,
        number: i + 1,
        title: `Episódio ${i + 1}`
      }));
    },
    getStreams: async (epId) => {
      return [
        {
          url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', // Simple test HLS stream
          type: 'hls',
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
      installed: ['mock-anime-ext'], // Pre-install our mock
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
