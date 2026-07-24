import { doc, getDoc, updateDoc, increment, serverTimestamp, setDoc, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../context/AuthContext';

interface ListItem {
  status: string;
  episodes?: number;
  score?: number;
  progress: number;
}

interface AchievementStats {
  completedIds?: number[];
  hasAchievement_REI_PIRATAS?: boolean;
  genresCount?: number;
  minAnimePerGenre?: number;
  hasAchievement_EXPLORADOR?: boolean;
}

function calculateMultiplier(userData: DocumentData): number {
  const poMUntil = userData.poMultiplierUntil;
  if (!poMUntil) return 1;
  try {
    return new Date(poMUntil) > new Date() ? 2 : 1;
  } catch {
    return 1;
  }
}

function calculateRank(totalPoints: number): string {
  if (totalPoints >= 10000) return 'DESAFIANTE';
  if (totalPoints >= 5000) return 'DIAMANTE';
  if (totalPoints >= 2500) return 'PLATINA';
  if (totalPoints >= 1000) return 'OURO';
  if (totalPoints >= 500) return 'PRATA';
  if (totalPoints >= 200) return 'BRONZE';
  return 'FERRO';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'COMUM' | 'RARO' | 'EPICO' | 'LENDARIO';
  points: number;
  secret?: boolean;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  // Common (+50 PO)
  'NINJA_MEDICO_JR': {
    id: 'NINJA_MEDICO_JR',
    title: 'Ninja Médico Júnior',
    description: 'Salvar o streak de um amigo pela primeira vez.',
    icon: 'HeartPulse',
    rarity: 'COMUM',
    points: 50
  },
  'COVEIRO_WAIFUS': {
    id: 'COVEIRO_WAIFUS',
    title: 'Coveiro de Waifus',
    description: 'Adicionar 15 personagens aos favoritos.',
    icon: 'Heart',
    rarity: 'COMUM',
    points: 50
  },
  'FUI_DEIXADO_VACUO': {
    id: 'FUI_DEIXADO_VACUO',
    title: 'Fui Deixado no Vácuo',
    description: 'Pedir ajuda de streak e o tempo expirar sem socorro.',
    icon: 'Wind',
    rarity: 'COMUM',
    points: 50,
    secret: true
  },
  'GENJUTSU': {
    id: 'GENJUTSU',
    title: 'Isso é um Genjutsu?',
    description: 'Clicar 10 vezes seguidas na foto de perfil de um amigo ou no logotipo.',
    icon: 'Eye',
    rarity: 'COMUM',
    points: 50,
    secret: true
  },
  'NIGHT_MODE_RELIGION': {
    id: 'NIGHT_MODE_RELIGION',
    title: 'Modo Noturno é Religião',
    description: 'Tentar ativar o Modo Escuro quando ele já estiver ativado.',
    icon: 'Moon',
    rarity: 'COMUM',
    points: 50,
    secret: true
  },
  'MULTI_DISPOSITIVO': {
    id: 'MULTI_DISPOSITIVO',
    title: 'Onipresente',
    description: 'Acessar o aplicativo em mais de um dispositivo simultaneamente.',
    icon: 'MonitorSmartphone',
    rarity: 'COMUM',
    points: 50,
    secret: true
  },

  // Rare (+150 PO)
  'EXPLORADOR': {
    id: 'EXPLORADOR',
    title: 'Explorador de Gêneros',
    description: 'Assistir a pelo menos 3 animes de 5 gêneros diferentes.',
    icon: 'Compass',
    rarity: 'RARO',
    points: 150
  },
  'CRITICO': {
    id: 'CRITICO',
    title: 'Crítico do Reddit',
    description: 'Escrever 10 avaliações detalhadas com mais de 200 caracteres.',
    icon: 'Edit3',
    rarity: 'RARO',
    points: 150
  },
  'DROPADOR_PROFISSIONAL': {
    id: 'DROPADOR_PROFISSIONAL',
    title: 'O Dropador Profissional',
    description: 'Abandonar 5 animes ainda no primeiro episódio.',
    icon: 'Trash2',
    rarity: 'RARO',
    points: 150,
    secret: true
  },
  'GOSTO_PECULIAR': {
    id: 'GOSTO_PECULIAR',
    title: 'Gosto Peculiar',
    description: 'Dar nota 10 para um anime com média global menor que 5.0.',
    icon: 'Star',
    rarity: 'RARO',
    points: 150,
    secret: true
  },
  'SEARCH_ONE_PIECE': {
    id: 'SEARCH_ONE_PIECE',
    title: 'Procurando o One Piece',
    description: 'Digitar o nome de um anime que não existe 5 vezes na busca.',
    icon: 'Search',
    rarity: 'RARO',
    points: 150,
    secret: true
  },

  // Epic (+400 PO)
  'MARATONISTA': {
    id: 'MARATONISTA',
    title: 'Maratonista Lendário',
    description: 'Assistir a mais de 12 episódios dentro de uma janela de 24 horas.',
    icon: 'Flame',
    rarity: 'EPICO',
    points: 400
  },
  'SALVADOR_SHIZUME': {
    id: 'SALVADOR_SHIZUME',
    title: 'O Salvador de Shizume',
    description: 'Salvar o streak de amigos 10 vezes no total.',
    icon: 'ShieldPlus',
    rarity: 'EPICO',
    points: 400
  },
  'INIMIGO_SOL': {
    id: 'INIMIGO_SOL',
    title: 'Inimigo do Sol',
    description: 'Assistir a uma temporada inteira (12 episódios) em um único dia útil.',
    icon: 'SunDim',
    rarity: 'EPICO',
    points: 400,
    secret: true
  },
  'SEM_VIDA_SOCIAL': {
    id: 'SEM_VIDA_SOCIAL',
    title: 'Sem Vida Social',
    description: 'Atualizar a lista às 04:00 da madrugada de uma segunda-feira.',
    icon: 'Coffee',
    rarity: 'EPICO',
    points: 400,
    secret: true
  },
  'SINDROME_PROTAGONISTA': {
    id: 'SINDROME_PROTAGONISTA',
    title: 'Síndrome de Protagonista',
    description: 'Mudar o nome ou foto de perfil 3 vezes em uma única semana.',
    icon: 'UserPlus',
    rarity: 'EPICO',
    points: 400,
    secret: true
  },
  'GOSTOS_OPOSTOS': {
    id: 'GOSTOS_OPOSTOS',
    title: 'Gostos Opostos',
    description: 'Adicionar um amigo que possui 0% de afinidade com você.',
    icon: 'Users',
    rarity: 'EPICO',
    points: 400,
    secret: true
  },
  'DESIGNER_INTERIOR': {
    id: 'DESIGNER_INTERIOR',
    title: 'Designer de Interiores',
    description: 'Alterar o banner do perfil para uma imagem personalizada.',
    icon: 'Image',
    rarity: 'COMUM',
    points: 50,
    secret: true
  },
  'LEITOR_AVIAO': {
    id: 'LEITOR_AVIAO',
    title: 'Leitor de Avião',
    description: 'Ler 10 mangás até o fim.',
    icon: 'BookOpen',
    rarity: 'COMUM',
    points: 100
  },
  'BIBLIOTECARIO': {
    id: 'BIBLIOTECARIO',
    title: 'Bibliotecário',
    description: 'Ler 50 mangás até o fim.',
    icon: 'Library',
    rarity: 'RARO',
    points: 250
  },

  // Legendary (+1000 PO)
  'REI_PIRATAS': {
    id: 'REI_PIRATAS',
    title: 'O Rei dos Piratas',
    description: 'Completar todos os episódios de One Piece.',
    icon: 'Crown',
    rarity: 'LENDARIO',
    points: 1000
  },
  'SAITAMA_TRAINING': {
    id: 'SAITAMA_TRAINING',
    title: 'Treinamento do Saitama',
    description: 'Ficar exatamente 100 dias seguidos de streak sem quebrar.',
    icon: 'Fist',
    rarity: 'LENDARIO',
    points: 1000,
    secret: true
  },
  'LACOS_INQUEBRAVEIS': {
    id: 'LACOS_INQUEBRAVEIS',
    title: 'Laços Inquebráveis',
    description: 'Ter o seu streak salvo pelo mesmo amigo 3 vezes em meses diferentes.',
    icon: 'Link',
    rarity: 'LENDARIO',
    points: 1000,
    secret: true
  },
  'O_ESCOLHIDO': {
    id: 'O_ESCOLHIDO',
    title: 'O Escolhido (Isekai)',
    description: 'Ser o primeiro usuário a adicionar um anime recém-lançado.',
    icon: 'Sparkles',
    rarity: 'LENDARIO',
    points: 1000,
    secret: true
  },
  'FILLER_VIDA_REAL': {
    id: 'FILLER_VIDA_REAL',
    title: 'Filler na Vida Real',
    description: 'Deixar um anime em "Planejo Assistir" por mais de 365 dias.',
    icon: 'Hourglass',
    rarity: 'LENDARIO',
    points: 1000,
    secret: true
  },
  'LEGADO_KAISER': {
    id: 'LEGADO_KAISER',
    title: 'Legado do Staff',
    description: 'Tornar-se amigo oficial de um membro do Conselho Superior (Staff).',
    icon: 'ShieldCheck',
    rarity: 'LENDARIO',
    points: 1000,
    secret: true
  }
};

function calculateMediaPoints(list: ListItem[]): number {
  let total = 0;

  for (const item of list) {
    if (item.status === 'COMPLETED') {
      const episodes = item.episodes || 1;
      const score = item.score || 0;

      const scoreBonus = score > 5 ? (score - 5) * 10 : 0;
      const basePO = 50 + (episodes * 2) + scoreBonus;
      const bonus = episodes > 100 ? 150 : episodes > 50 ? 75 : 0;

      total += (basePO + bonus);
    } else if (item.progress > 0) {
      total += (item.progress * 2);
    }
  }

  return total;
}

export const rankingService = {
  addPoints: async (userId: string, points: number, reason: string) => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    try {
      const snap = await getDoc(userRef);
      const multiplier = snap.exists() ? calculateMultiplier(snap.data()) : 1;
      const finalPoints = points * multiplier;

      await updateDoc(userRef, {
        otakuPoints: increment(finalPoints),
        availablePoints: increment(finalPoints),
        weeklyPoints: increment(finalPoints),
        lastActivityAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`User ${userId} earned ${finalPoints} PO (Multiplier x${multiplier}): ${reason}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  },

  syncListPoints: async (userId: string, list: ListItem[]) => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const userData = snap.data();
    const totalMediaPO = calculateMediaPoints(list);

    const oldMediaPO = Number(userData.mediaPoints) || 0;
    const diff = totalMediaPO - oldMediaPO;

    const pointsToAdd = userData.mediaPoints === undefined ? totalMediaPO : Math.max(0, diff);

    if (pointsToAdd <= 0 && userData.mediaPoints !== undefined) return;

    const multiplier = calculateMultiplier(userData);
    const finalPointsToAdd = pointsToAdd * multiplier;

    const currentTotalPO = Number(userData.otakuPoints) || 0;
    const currentAvailablePoints = Number(userData.availablePoints) || 0;
    const newTotalPO = currentTotalPO + finalPointsToAdd;
    const newAvailablePoints = currentAvailablePoints + finalPointsToAdd;

    const newRank = calculateRank(newTotalPO);

    try {
      await updateDoc(userRef, {
        otakuPoints: newTotalPO,
        mediaPoints: totalMediaPO,
        availablePoints: newAvailablePoints,
        rank: newRank,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  },

  checkAchievements: async (userId: string, stats: AchievementStats) => {
    if (stats.completedIds?.includes(21) && !stats.hasAchievement_REI_PIRATAS) {
      await rankingService.grantAchievement(userId, 'REI_PIRATAS');
    }

    if (
      typeof stats.genresCount === 'number' &&
      stats.genresCount >= 5 &&
      typeof stats.minAnimePerGenre === 'number' &&
      stats.minAnimePerGenre >= 3 &&
      !stats.hasAchievement_EXPLORADOR
    ) {
      await rankingService.grantAchievement(userId, 'EXPLORADOR');
    }
  },

  grantAchievement: async (userId: string, achievementId: string): Promise<boolean | undefined> => {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return;

    const achRef = doc(db, 'users', userId, 'achievements', achievementId);
    const snap = await getDoc(achRef);

    if (snap.exists()) return false;

    await setDoc(achRef, {
      ...achievement,
      unlockedAt: serverTimestamp()
    });
    await rankingService.addPoints(userId, achievement.points, `Conquista: ${achievement.title}`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ACHIEVEMENT_UNLOCKED', { detail: achievement }));
    }

    return true;
  }
};
