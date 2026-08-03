import axios from 'axios';

export interface TrackerSyncResult {
  tracker: 'anilist' | 'myanimelist';
  success: boolean;
  message: string;
  translatedScore?: 'SMILE' | 'NEUTRAL' | 'SAD' | number;
}

export const trackerService = {
  // Translate score to AniList Smiley format
  translateScoreToSmiley(score: number): 'SMILE' | 'NEUTRAL' | 'SAD' {
    if (score >= 6) return 'SMILE';
    if (score === 5) return 'NEUTRAL';
    return 'SAD';
  },

  // Map Avalon status to AniList status
  mapStatusToAniList(status: string): string {
    switch (status) {
      case 'WATCHING':
      case 'READING':
        return 'CURRENT';
      case 'COMPLETED':
        return 'COMPLETED';
      case 'PLANNING':
        return 'PLANNING';
      case 'DROPPED':
        return 'DROPPED';
      default:
        return 'CURRENT';
    }
  },

  // Map Avalon status to MyAnimeList status
  mapStatusToMAL(status: string): string {
    switch (status) {
      case 'WATCHING':
        return 'watching';
      case 'READING':
        return 'reading';
      case 'COMPLETED':
        return 'completed';
      case 'PLANNING':
        return 'plan_to_watch';
      case 'DROPPED':
        return 'dropped';
      default:
        return 'watching';
    }
  },

  // Sync with AniList
  async syncToAniList(
    username: string, 
    token: string | null, 
    malId: number, 
    status: string, 
    progress: number, 
    score?: number,
    type: 'ANIME' | 'MANGA' = 'ANIME'
  ): Promise<TrackerSyncResult> {
    const mappedStatus = this.mapStatusToAniList(status);
    

    if (!token) {
      // Return highly realistic mock simulation if no token is provided
      localStorage.setItem('avalon_anilist_last_sync', new Date().toISOString());
      return {
        tracker: 'anilist',
        success: true,
        message: `Simulado: Sincronizado com AniList (${username}). Status: ${mappedStatus}, Progresso: ${progress}, Nota: ${score || 'N/A'}.`,
        translatedScore: score
      };
    }

    try {
      // First, get AniList Media ID from MAL ID using AniList API
      const queryMedia = `
        query ($idMal: Int, $type: MediaType) {
          Media (idMal: $idMal, type: $type) {
            id
          }
        }
      `;
      
      const mediaResponse = await axios.post('https://graphql.anilist.co', {
        query: queryMedia,
        variables: { idMal: malId, type: type }
      });

      const aniListMediaId = mediaResponse.data?.data?.Media?.id;
      if (!aniListMediaId) {
        throw new Error('Mídia não encontrada no AniList.');
      }

      // Perform mutation
      const mutation = `
        mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int, $scoreRaw: Int) {
          SaveMediaListEntry (mediaId: $mediaId, status: $status, progress: $progress, scoreRaw: $scoreRaw) {
            id
            status
            progress
          }
        }
      `;

      // AniList stores all scores internally as a 100-point integer
      const scoreRaw = score ? score * 10 : undefined;

      await axios.post('https://graphql.anilist.co', {
        query: mutation,
        variables: {
          mediaId: aniListMediaId,
          status: mappedStatus,
          progress,
          scoreRaw: scoreRaw
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      return {
        tracker: 'anilist',
        success: true,
        message: `Sucesso: Sincronizado em tempo real com AniList para ${username}!`,
        translatedScore: score
      };
    } catch (error: any) {
      console.error('AniList real-time sync error:', error);
      return {
        tracker: 'anilist',
        success: false,
        message: `Falha na sincronização real com AniList: ${error.message || 'Erro de API'}`
      };
    }
  },

  // Sync with MyAnimeList
  async syncToMAL(
    username: string, 
    token: string | null, 
    malId: number, 
    status: string, 
    progress: number, 
    score?: number,
    type: 'ANIME' | 'MANGA' = 'ANIME'
  ): Promise<TrackerSyncResult> {
    const mappedStatus = this.mapStatusToMAL(status);

    if (!token) {
      localStorage.setItem('avalon_mal_last_sync', new Date().toISOString());
      localStorage.setItem('avalon_mal_last_sync', new Date().toISOString());
      return {
        tracker: 'myanimelist',
        success: true,
        message: `Simulado: Sincronizado com MyAnimeList (${username}). Status: ${mappedStatus}, Progresso: ${progress}, Nota: ${score || 'N/A'}.`
      };
    }

    try {
      // MAL write API requires OAuth login
      const params = new URLSearchParams();
      params.append('status', mappedStatus);
      if (type === 'ANIME') params.append('num_watched_episodes', progress.toString());
      if (type === 'MANGA') params.append('num_chapters_read', progress.toString());
      if (score) params.append('score', score.toString());
      
      await axios.put(`https://api.myanimelist.net/v2/${type.toLowerCase()}/${malId}/my_list_status`, 
         params.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        tracker: 'myanimelist',
        success: true,
        message: `Sucesso: Sincronizado em tempo real com MyAnimeList para ${username}!`
      };
    } catch (error: any) {
      console.error('MAL real-time sync error:', error);
      return {
        tracker: 'myanimelist',
        success: false,
        message: `Falha na sincronização real com MyAnimeList: ${error.message || 'Erro de API'}`
      };
    }
  },

  // Central trigger to sync with all active configured trackers
  async syncToAllActive(malId: number, status: string, progress: number, score?: number, type: 'ANIME' | 'MANGA' = 'ANIME'): Promise<TrackerSyncResult[]> {
    

    const results: TrackerSyncResult[] = [];

    const anilistUser = localStorage.getItem('avalon_anilist_user') || '';
    const anilistToken = localStorage.getItem('avalon_anilist_token') || null;
    if (anilistUser) {
      const res = await this.syncToAniList(anilistUser, anilistToken, malId, status, progress, score, type);
      results.push(res);
    }

    const malUser = localStorage.getItem('avalon_mal_user') || '';
    const malToken = localStorage.getItem('avalon_mal_token') || null;
    if (malUser) {
      const res = await this.syncToMAL(malUser, malToken, malId, status, progress, score, type);
      results.push(res);
    }

    // Trigger visual toast notification in UI if requested/subscribed
    if (results.length > 0) {
      const event = new CustomEvent('avalon-tracker-sync', { detail: results });
      window.dispatchEvent(event);
    }

    return results;
  }
};
