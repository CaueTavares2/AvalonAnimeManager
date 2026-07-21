import React, { createContext, useContext } from 'react';
import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';

interface RankInfo {
  currentRank: string;
  totalPoints: number;
  availablePoints: number;
  weeklyPoints: number;
}

interface RankingContextType {
  updateRank: (userId: string, totalPO: number) => Promise<void>;
  getRankInfo: (userId: string) => Promise<RankInfo>;
}

const RankingContext = createContext<RankingContextType | undefined>(undefined);

const RANK_THRESHOLDS = {
  'DESAFIANTE': 10000,
  'DIAMANTE': 5000,
  'PLATINA': 2500,
  'OURO': 1000,
  'PRATA': 500,
  'BRONZE': 200,
  'FERRO': 0
};

function calculateRank(totalPO: number): string {
  if (totalPO >= 10000) return 'DESAFIANTE';
  if (totalPO >= 5000) return 'DIAMANTE';
  if (totalPO >= 2500) return 'PLATINA';
  if (totalPO >= 1000) return 'OURO';
  if (totalPO >= 500) return 'PRATA';
  if (totalPO >= 200) return 'BRONZE';
  return 'FERRO';
}

export function RankingProvider({ children }: { children: React.ReactNode }) {
  const updateRank = async (userId: string, totalPO: number) => {
    const userRef = doc(db, 'users', userId);
    const newRank = calculateRank(totalPO);

    try {
      await updateDoc(userRef, {
        rank: newRank,
        otakuPoints: totalPO,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Rank update error", e);
    }
  };

  const getRankInfo = async (userId: string): Promise<RankInfo> => {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    
    if (!snap.exists()) {
      return {
        currentRank: 'FERRO',
        totalPoints: 0,
        availablePoints: 0,
        weeklyPoints: 0
      };
    }

    const data = snap.data();
    return {
      currentRank: data.rank || 'FERRO',
      totalPoints: data.otakuPoints || 0,
      availablePoints: data.availablePoints || 0,
      weeklyPoints: data.weeklyPoints || 0
    };
  };

  return (
    <RankingContext.Provider value={{ updateRank, getRankInfo }}>
      {children}
    </RankingContext.Provider>
  );
}

export function useRanking() {
  const context = useContext(RankingContext);
  if (context === undefined) {
    throw new Error('useRanking must be used within a RankingProvider');
  }
  return context;
}
