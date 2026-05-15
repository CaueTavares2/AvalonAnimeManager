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
