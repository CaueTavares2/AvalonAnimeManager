import { FavoriteCharacter } from '../context/FavoritesContext';

// Simple deterministic pseudo-random number generator
function mulberry32(a: number) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export interface CharacterStats {
  baseKi: number;
  totalKi: number;
  rank: 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';
  affinityColor: string;
  affinityName: string;
  protagonismBonus: number;
  userSynergy: number;
}

const AFFINITIES = [
  { name: 'Chama', color: 'text-red-500', hex: '#ef4444' },
  { name: 'Oceano', color: 'text-blue-500', hex: '#3b82f6' },
  { name: 'Gaia', color: 'text-green-500', hex: '#22c55e' },
  { name: 'Zéfiro', color: 'text-teal-400', hex: '#2dd4bf' },
  { name: 'Luz', color: 'text-yellow-400', hex: '#facc15' },
  { name: 'Abismo', color: 'text-purple-500', hex: '#a855f7' },
  { name: 'Trovão', color: 'text-amber-500', hex: '#f59e0b' },
  { name: 'Glacial', color: 'text-cyan-300', hex: '#67e8f9' },
  { name: 'Cósmico', color: 'text-indigo-400', hex: '#818cf8' }
];

export function calculateCharacterStats(char: FavoriteCharacter, userOtakuPoints: number): CharacterStats {
  const rand = mulberry32(char.id);
  
  // Base power based on deterministic random (1000 to 9000)
  // We use multiple rand() calls to create a normal-ish distribution (bell curve)
  const roll = (rand() + rand() + rand()) / 3; 
  const baseKi = Math.floor(1000 + (roll * 8000));
  
  // Protagonism Bonus
  const roleBonus = char.role?.toLowerCase() === 'main' ? 1.25 : 1.0;
  const protagonismBonus = Math.floor(baseKi * roleBonus) - baseKi;
  
  // User synergy scales logarithmically to avoid abusive scaling but still reward user points
  const userSynergy = Math.floor(Math.pow(Math.max(userOtakuPoints || 0, 0), 0.75) * 2.5);
  
  const totalKi = baseKi + protagonismBonus + userSynergy;
  
  let rank: CharacterStats['rank'] = 'D';
  if (baseKi >= 8000) rank = 'S+';
  else if (baseKi >= 6500) rank = 'S';
  else if (baseKi >= 4500) rank = 'A';
  else if (baseKi >= 3000) rank = 'B';
  else if (baseKi >= 1500) rank = 'C';

  const affinityIndex = Math.floor(rand() * AFFINITIES.length);
  const affinity = AFFINITIES[affinityIndex];

  return {
    baseKi,
    totalKi,
    rank,
    affinityColor: affinity.color,
    affinityName: affinity.name,
    protagonismBonus,
    userSynergy
  };
}
