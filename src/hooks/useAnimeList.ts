import { useGlobalAnimeList } from '../context/AnimeListContext';
import type { UserMedia, MediaStatus, AnimeStatus } from '../types';

export type { UserMedia, MediaStatus, AnimeStatus };
export type { UserMedia as UserAnime }; // Keep alias for now

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
