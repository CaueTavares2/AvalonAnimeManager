import { useGlobalAnimeList } from '../context/AnimeListContext';

export type MediaStatus = 'WATCHING' | 'READING' | 'COMPLETED' | 'PLANNING' | 'DROPPED';

export interface UserMedia {
  id: number;
  title: string;
  image: string;
  type: 'ANIME' | 'MANGA';
  status: MediaStatus;
  score: number;
  progress: number; // For both episodesWatched and chaptersRead
  totalProgress?: number; // For totalEpisodes or totalChapters
  startDate?: string;
  endDate?: string;
  genres?: string[];
  updatedAt?: string;
  createdAt?: string;
  userId?: string;
}

export type { UserMedia as UserAnime }; // Keep alias for now
export type { MediaStatus as AnimeStatus }; // Keep alias for now

export function useAnimeList() {
  const context = useGlobalAnimeList();
  return { 
    list: context.list as UserMedia[], 
    addAnime: (anime: UserMedia) => context.addAnime(anime), 
    updateAnime: (id: number, data: Partial<UserMedia>) => context.updateAnime(id, data), 
    removeAnime: (id: number) => context.removeAnime(id), 
    batchAddAnimes: (animes: UserMedia[]) => context.batchAddAnimes(animes) 
  };
}
