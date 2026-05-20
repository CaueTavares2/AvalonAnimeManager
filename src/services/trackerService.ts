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
    score?: number
  ): Promise<TrackerSyncResult> {
    const mappedStatus = this.mapStatusToAniList(status);
    const translatedScore = score ? this.translateScoreToSmiley(score) : undefined;

    if (!token) {
      // Return highly realistic mock simulation if no token is provided
      return {
        tracker: 'anilist',
        success: true,
        message: `Simulado: Sincronizado com AniList (${username}). Status: ${mappedStatus}, Progresso: ${progress}, Nota recomendada: ${translatedScore || 'N/A'}.`,
        translatedScore
      };
    }

    try {
      // First, get AniList Media ID from MAL ID using AniList API
      const queryMedia = `
        query ($idMal: Int) {
          Media (idMal: $idMal) {
            id
          }
        }
      `;
      
      const mediaResponse = await axios.post('https://graphql.anilist.co', {
        query: queryMedia,
        variables: { idMal: malId }
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

      // Translate Smiley score to raw score if needed
      let scoreRaw = 0;
      if (translatedScore === 'SMILE') scoreRaw = 3; // Smiley ratings are typically internally mapped in AniList
      else if (translatedScore === 'NEUTRAL') scoreRaw = 2;
      else if (translatedScore === 'SAD') scoreRaw = 1;

      await axios.post('https://graphql.anilist.co', {
        query: mutation,
        variables: {
          mediaId: aniListMediaId,
          status: mappedStatus,
          progress,
          scoreRaw: scoreRaw > 0 ? scoreRaw : undefined
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
        translatedScore
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
    score?: number
  ): Promise<TrackerSyncResult> {
    const mappedStatus = this.mapStatusToMAL(status);

    if (!token) {
      return {
        tracker: 'myanimelist',
        success: true,
        message: `Simulado: Sincronizado com MyAnimeList (${username}). Status: ${mappedStatus}, Progresso: ${progress}, Nota: ${score || 'N/A'}.`
      };
    }

    try {
      // MAL write API requires OAuth login
      await axios.put(`https://api.myanimelist.net/v2/anime/${malId}/my_list_status`, 
        new URLSearchParams({
          status: mappedStatus,
          num_watched_episodes: progress.toString(),
          score: score ? score.toString() : '0'
        }).toString(), {
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
  async syncToAllActive(malId: number, status: string, progress: number, score?: number): Promise<TrackerSyncResult[]> {
    const isAutoSync = localStorage.getItem('avalon_auto_sync_trackers') === 'true';
    if (!isAutoSync) return [];

    const results: TrackerSyncResult[] = [];

    const anilistUser = localStorage.getItem('avalon_anilist_user') || '';
    const anilistToken = localStorage.getItem('avalon_anilist_token') || null;
    if (anilistUser) {
      const res = await this.syncToAniList(anilistUser, anilistToken, malId, status, progress, score);
      results.push(res);
    }

    const malUser = localStorage.getItem('avalon_mal_user') || '';
    const malToken = localStorage.getItem('avalon_mal_token') || null;
    if (malUser) {
      const res = await this.syncToMAL(malUser, malToken, malId, status, progress, score);
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
