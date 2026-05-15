import axios from 'axios';

import { UserMedia, MediaStatus } from '../hooks/useAnimeList';

export const importService = {
  importFromAniList: async (username: string): Promise<UserMedia[]> => {
    const query = `
      query ($username: String) {
        MediaListCollection(userName: $username, type: ANIME) {
          lists {
            entries {
              media {
                id
                title {
                  romaji
                  english
                }
                coverImage {
                  large
                }
                episodes
                genres
              }
              status
              progress
              score(format: POINT_10)
            }
          }
        }
      }
    `;

    const response = await axios.post('https://graphql.anilist.co', {
      query,
      variables: { username }
    });

    const entries: UserMedia[] = [];
    response.data.data.MediaListCollection.lists.forEach((list: any) => {
      list.entries.forEach((entry: any) => {
        entries.push({
          id: entry.media.id,
          title: entry.media.title.english || entry.media.title.romaji,
          image: entry.media.coverImage.large,
          type: 'ANIME',
          status: mapAniListStatus(entry.status),
          progress: entry.progress,
          totalProgress: entry.media.episodes || 0,
          score: entry.score,
          genres: entry.media.genres,
          updatedAt: new Date().toISOString()
        });
      });
    });

    return entries;
  },

  importFromMAL: async (username: string): Promise<UserMedia[]> => {
    const response = await axios.get(`https://api.jikan.moe/v4/users/${username}/animelist`);
    
    return response.data.data.map((item: any) => ({
      id: item.anime.mal_id,
      title: item.anime.title,
      image: item.anime.images.webp.image_url,
      type: 'ANIME',
      status: mapMALStatus(item.status),
      progress: item.episodes_watched,
      totalProgress: item.anime.episodes || 0,
      score: item.score,
      updatedAt: new Date().toISOString()
    }));
  }
};

function mapAniListStatus(status: string): MediaStatus {
  switch (status) {
    case 'CURRENT': return 'WATCHING';
    case 'COMPLETED': return 'COMPLETED';
    case 'PLANNING': return 'PLANNING';
    case 'DROPPED': return 'DROPPED';
    case 'REPEATING': return 'WATCHING';
    default: return 'PLANNING';
  }
}

function mapMALStatus(status: string): MediaStatus {
  const s = status.toString().toLowerCase();
  if (s.includes('watching')) return 'WATCHING';
  if (s.includes('completed')) return 'COMPLETED';
  if (s.includes('plan')) return 'PLANNING';
  if (s.includes('dropped')) return 'DROPPED';
  return 'PLANNING';
}
