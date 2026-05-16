export type MediaStatus = 'WATCHING' | 'READING' | 'COMPLETED' | 'PLANNING' | 'DROPPED';
export type AnimeStatus = MediaStatus;

export interface UserMedia {
  id: number;
  title: string;
  image: string;
  type: 'ANIME' | 'MANGA';
  status: MediaStatus;
  score: number;
  progress: number;
  totalProgress?: number;
  startDate?: string;
  endDate?: string;
  genres?: string[];
  updatedAt?: string;
  createdAt?: string;
  userId?: string;
}

export interface Media {
  id: number;
  title: string;
  image: string;
  banner?: string;
  type: 'ANIME' | 'MANGA';
  status: 'TRENDING' | 'POPULAR' | 'UPCOMING';
  genres: string[];
  score: number;
  format: string;
  episodes?: number;
  chapters?: number;
  volumes?: number;
  season?: string;
  year?: number;
  synopsis?: string;
  rank?: number;
  members?: number;
}
