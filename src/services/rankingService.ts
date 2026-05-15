import { doc, getDoc, updateDoc, increment, serverTimestamp, collection, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'COMUM' | 'RARO' | 'EPICO' | 'LENDARIO';
  points: number;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  'MARATONISTA': {
    id: 'MARATONISTA',
    title: 'Maratonista Lendário',
    description: 'Assistir a mais de 12 episódios em 24 horas.',
    icon: 'Flame',
    rarity: 'LENDARIO',
    points: 500
  },
  'REI_PIRATAS': {
    id: 'REI_PIRATAS',
    title: 'O Rei dos Piratas',
    description: 'Completar todos os episódios de One Piece.',
    icon: 'Crown',
    rarity: 'EPICO',
    points: 400
  },
  'EXPLORADOR': {
    id: 'EXPLORADOR',
    title: 'Explorador de Gêneros',
    description: 'Assistir a pelo menos 3 animes de 5 gêneros diferentes.',
    icon: 'Compass',
    rarity: 'RARO',
    points: 300
  },
  'CRITICO': {
    id: 'CRITICO',
    title: 'Crítico do Reddit',
    description: 'Escrever 10 avaliações detalhadas.',
    icon: 'Edit3',
    rarity: 'COMUM',
    points: 150
  },
  'CACHADOR_TEMP': {
    id: 'CACHADOR_TEMP',
    title: 'Caçador de Temporadas',
    description: 'Assistir a todos os animes sazonais em alta.',
    icon: 'Zap',
    rarity: 'EPICO',
    points: 400
  },
  'COVEIRO_WAIFUS': {
    id: 'COVEIRO_WAIFUS',
    title: 'Coveiro de Waifus',
    description: 'Adicionar 15 personagens aos favoritos.',
    icon: 'Heart',
    rarity: 'COMUM',
    points: 100
  }
};

export const rankingService = {
  addPoints: async (userId: string, points: number, reason: string) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      otakuPoints: increment(points),
      weeklyPoints: increment(points),
      lastActivityAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`User ${userId} earned ${points} PO: ${reason}`);
  },

  checkAchievements: async (userId: string, stats: any) => {
    // This would ideally be a cloud function, but here we check client-side
    // For "O Rei dos Piratas" (One Piece ID: 21)
    if (stats.completedIds?.includes(21) && !stats.hasAchievement_REI_PIRATAS) {
      await rankingService.grantAchievement(userId, 'REI_PIRATAS');
    }
    
    // Genre Explorer
    if (stats.genresCount >= 5 && stats.minAnimePerGenre >= 3 && !stats.hasAchievement_EXPLORADOR) {
      await rankingService.grantAchievement(userId, 'EXPLORADOR');
    }
  },

  grantAchievement: async (userId: string, achievementId: string) => {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return;

    const achRef = doc(db, 'users', userId, 'achievements', achievementId);
    const snap = await getDoc(achRef);
    
    if (!snap.exists()) {
      await setDoc(achRef, {
        ...achievement,
        unlockedAt: new Date().toISOString()
      });
      await rankingService.addPoints(userId, achievement.points, `Conquista: ${achievement.title}`);
      return true;
    }
    return false;
  }
};
