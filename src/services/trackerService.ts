import axios, { AxiosError } from 'axios';

export interface TrackerSyncResult {
  tracker: 'anilist' | 'myanimelist';
  success: boolean;
  message: string;
  translatedScore?: 'SMILE' | 'NEUTRAL' | 'SAD';
}

type SmileyScore = 'SMILE' | 'NEUTRAL' | 'SAD';

function translateScoreToSmiley(score: number): SmileyScore {
  if (score >= 6) return 'SMILE';
  if (score === 5) return 'NEUTRAL';
  return 'SAD';
}

function smileyToRaw(smiley: SmileyScore | undefined): number | undefined {
  switch (smiley) {
    case 'SMILE': return 3;
    case 'NEUTRAL': return 2;
    case 'SAD': return 1;
    default: return undefined;
  }
}

function mapStatusToAniList(status: string): string {
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
}

function mapStatusToMAL(status: string): string {
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
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message || 'Erro de API';
  }
  if (error instanceof Error) return error.message;
  return 'Erro desconhecido';
}

const ANILIST_API = 'https://graphql.anilist.co';
const MAL_API = 'https://api.myanimelist.net/v2';

const ANILIST_QUERY_MEDIA = `
  query ($idMal: Int) {
    Media (idMal: $idMal) { id }
  }
`;

const ANILIST_MUTATION = `
  mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int, $scoreRaw: Int) {
    SaveMediaListEntry (mediaId: $mediaId, status: $status, progress: $progress, scoreRaw: $scoreRaw) {
      id status progress
    }
  }
`;

export const trackerService = {
  async syncToAniList(
    username: string,
    token: string | null,
    malId: number,
    status: string,
    progress: number,
    score?: number
  ): Promise<TrackerSyncResult> {
    const mappedStatus = mapStatusToAniList(status);
    const translatedScore = score ? translateScoreToSmiley(score) : undefined;

    if (!token) {
      return {
        tracker: 'anilist',
        success: true,
        message: `Simulado: Sincronizado com AniList (${username}). Status: ${mappedStatus}, Progresso: ${progress}, Nota recomendada: ${translatedScore || 'N/A'}.`,
        translatedScore
      };
    }

    try {
      const mediaResponse = await axios.post<{ data: { Media: { id: number } } }>(ANILIST_API, {
        query: ANILIST_QUERY_MEDIA,
        variables: { idMal: malId }
      });

      const aniListMediaId = mediaResponse.data?.data?.Media?.id;
      if (!aniListMediaId) {
        return {
          tracker: 'anilist',
          success: false,
          message: 'Mídia não encontrada no AniList.'
        };
      }

      const scoreRaw = smileyToRaw(translatedScore);

      await axios.post(ANILIST_API, {
        query: ANILIST_MUTATION,
        variables: {
          mediaId: aniListMediaId,
          status: mappedStatus,
          progress,
          ...(scoreRaw !== undefined && { scoreRaw })
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
    } catch (error) {
      console.error('AniList sync error:', error);
      return {
        tracker: 'anilist',
        success: false,
        message: `Falha na sincronização com AniList: ${extractErrorMessage(error)}`
      };
    }
  },

  async syncToMAL(
    username: string,
    token: string | null,
    malId: number,
    status: string,
    progress: number,
    score?: number
  ): Promise<TrackerSyncResult> {
    const mappedStatus = mapStatusToMAL(status);

    if (!token) {
      return {
        tracker: 'myanimelist',
        success: true,
        message: `Simulado: Sincronizado com MyAnimeList (${username}). Status: ${mappedStatus}, Progresso: ${progress}, Nota: ${score || 'N/A'}.`
      };
    }

    try {
      await axios.put(`${MAL_API}/anime/${malId}/my_list_status`,
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
    } catch (error) {
      console.error('MAL sync error:', error);
      return {
        tracker: 'myanimelist',
        success: false,
        message: `Falha na sincronização com MyAnimeList: ${extractErrorMessage(error)}`
      };
    }
  },

  async syncToAllActive(malId: number, status: string, progress: number, score?: number): Promise<TrackerSyncResult[]> {
    const isAutoSync = localStorage.getItem('avalon_auto_sync_trackers') === 'true';
    if (!isAutoSync) return [];

    const results: TrackerSyncResult[] = [];

    const anilistUser = localStorage.getItem('avalon_anilist_user') || '';
    const anilistToken = localStorage.getItem('avalon_anilist_token');
    if (anilistUser) {
      const res = await this.syncToAniList(anilistUser, anilistToken, malId, status, progress, score);
      results.push(res);
    }

    const malUser = localStorage.getItem('avalon_mal_user') || '';
    const malToken = localStorage.getItem('avalon_mal_token');
    if (malUser) {
      const res = await this.syncToMAL(malUser, malToken, malId, status, progress, score);
      results.push(res);
    }

    if (results.length > 0) {
      window.dispatchEvent(new CustomEvent('avalon-tracker-sync', { detail: results }));
    }

    return results;
  }
};
