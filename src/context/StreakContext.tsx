import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';

interface StreakInfo {
  count: number;
  multiplier: number;
  phase: 1 | 2 | 3 | 4 | 5;
  needsHelp: boolean;
  helpExpireAt: Date | null;
}

interface StreakContextType {
  streakInfo: StreakInfo | null;
  showStreakPopUp: boolean;
  setShowStreakPopUp: (show: boolean) => void;
  updateStreak: (userData: any, authUser: User) => Promise<void>;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export function StreakProvider({ children }: { children: React.ReactNode }) {
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [showStreakPopUp, setShowStreakPopUp] = useState(false);

  const updateStreak = async (userData: any, authUser: User) => {
    const userRef = doc(db, 'users', authUser.uid);
    const now = new Date();
    
    // Streak Logic
    const lastUpdate = userData.lastStreakUpdate ? (userData.lastStreakUpdate.toDate?.() || new Date(userData.lastStreakUpdate)) : new Date(0);
    const isToday = lastUpdate.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === lastUpdate.toDateString();
    
    let newStreak = userData.streak || 0;
    let needsHelp = userData.needsHelp || false;
    let helpExpireAt = userData.helpExpireAt || null;
    let usedProtection = false;
    let remainingProtections = userData.streakProtections || 0;

    if (!isToday) {
      if (isYesterday || (userData.streak === 0 && !needsHelp)) {
        newStreak += 1;
        needsHelp = false;
        helpExpireAt = null;
        setShowStreakPopUp(true);
      } else if (newStreak > 0) {
        if (remainingProtections > 0) {
           remainingProtections -= 1;
           usedProtection = true;
           needsHelp = false;
           helpExpireAt = null;
        } else {
           needsHelp = true;
           helpExpireAt = new Date(now.getTime() + 86400000);
        }
      }
    }

    let phase: 1 | 2 | 3 | 4 | 5 = 1;
    let multiplier = 1.0;
    if (newStreak >= 31) { phase = 5; multiplier = 2.0; }
    else if (newStreak >= 15) { phase = 4; multiplier = 1.8; }
    else if (newStreak >= 8) { phase = 3; multiplier = 1.5; }
    else if (newStreak >= 4) { phase = 2; multiplier = 1.2; }

    setStreakInfo({ count: newStreak, multiplier, phase, needsHelp, helpExpireAt });

    try {
      const updates: any = {
        streak: newStreak,
        streakMultiplier: multiplier,
        lastStreakUpdate: isToday && !usedProtection ? userData.lastStreakUpdate : serverTimestamp(),
        needsHelp,
        helpExpireAt: helpExpireAt ? helpExpireAt : null,
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp()
      };
      
      if (usedProtection) {
        updates.streakProtections = remainingProtections;
      }
      
      await updateDoc(userRef, updates);
    } catch (e) {
      console.error("Streak update error", e);
    }
  };

  return (
    <StreakContext.Provider value={{ streakInfo, showStreakPopUp, setShowStreakPopUp, updateStreak }}>
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak() {
  const context = useContext(StreakContext);
  if (context === undefined) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
}
