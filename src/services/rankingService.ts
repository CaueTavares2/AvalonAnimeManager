import { doc, getDoc, updateDoc, increment, serverTimestamp, collection, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../context/AuthContext';

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

export const rankingService = {
  addPoints: async (userId: string, points: number, reason: string) => {
    const userRef = doc(db, 'users', userId);
    try {
      await updateDoc(userRef, {
        otakuPoints: increment(points),
        availablePoints: increment(points),
        weeklyPoints: increment(points),
        lastActivityAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`User ${userId} earned ${points} PO: ${reason}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  },

  syncListPoints: async (userId: string, list: any[]) => {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    
    const userData = snap.data();
    let totalMediaPO = 0;
    
    list.forEach(item => {
      if (item.status === 'COMPLETED') {
        const episodes = item.episodes || 1;
        const score = item.score || 0;
        
        const scoreBonus = score > 5 ? (score - 5) * 10 : 0;
        const basePO = 50 + (episodes * 2) + scoreBonus;
        const bonus = episodes > 100 ? 150 : episodes > 50 ? 75 : 0;
        
        totalMediaPO += (basePO + bonus);
      } else if (item.progress > 0) {
        totalMediaPO += (item.progress * 2);
      }
    });

    const oldMediaPO = userData.mediaPoints || 0;
    const diff = totalMediaPO - oldMediaPO;
    
    // If it's the first sync (mediaPoints undefined), we add the full amount to otakuPoints
    const pointsToAdd = userData.mediaPoints === undefined ? totalMediaPO : Math.max(0, diff);

    if (pointsToAdd <= 0 && userData.mediaPoints !== undefined) return; 

    const currentTotalPO = userData.otakuPoints || 0;
    const newTotalPO = currentTotalPO + pointsToAdd;
    const availablePoints = userData.availablePoints || 0;
    const newAvailablePoints = availablePoints + pointsToAdd;

    // Rank evaluation logic
    let newRank = 'FERRO';
    if (newTotalPO >= 10000) newRank = 'DESAFIANTE';
    else if (newTotalPO >= 5000) newRank = 'DIAMANTE';
    else if (newTotalPO >= 2500) newRank = 'PLATINA';
    else if (newTotalPO >= 1000) newRank = 'OURO';
    else if (newTotalPO >= 500) newRank = 'PRATA';
    else if (newTotalPO >= 200) newRank = 'BRONZE';

    // Update total PO, media PO, rank AND available points
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
        unlockedAt: serverTimestamp()
      });
      await rankingService.addPoints(userId, achievement.points, `Conquista: ${achievement.title}`);
      return true;
    }
    return false;
  }
};
