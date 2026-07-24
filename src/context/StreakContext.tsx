import React, { createContext, useContext, useState } from 'react';
import { doc, updateDoc, serverTimestamp, DocumentData } from 'firebase/firestore';
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
  updateStreak: (userData: DocumentData, authUser: User) => Promise<void>;
}

function calculateStreakPhase(dayCount: number): { phase: 1 | 2 | 3 | 4 | 5; multiplier: number } {
  if (dayCount >= 31) return { phase: 5, multiplier: 2.0 };
  if (dayCount >= 15) return { phase: 4, multiplier: 1.8 };
  if (dayCount >= 8) return { phase: 3, multiplier: 1.5 };
  if (dayCount >= 4) return { phase: 2, multiplier: 1.2 };
  return { phase: 1, multiplier: 1.0 };
}

function parseFirestoreDate(value: unknown): Date {
  if (!value) return new Date(0);
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(value as string | number);
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export function StreakProvider({ children }: { children: React.ReactNode }) {
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [showStreakPopUp, setShowStreakPopUp] = useState(false);

  const updateStreak = async (userData: DocumentData, authUser: User) => {
    if (!authUser.uid) return;

    const userRef = doc(db, 'users', authUser.uid);
    const now = new Date();
    
    const lastUpdate = parseFirestoreDate(userData.lastStreakUpdate);
    const isToday = lastUpdate.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === lastUpdate.toDateString();
    
    let newStreak = Number(userData.streak) || 0;
    let needsHelp = Boolean(userData.needsHelp);
    let helpExpireAt: Date | null = userData.helpExpireAt ? parseFirestoreDate(userData.helpExpireAt) : null;
    let usedProtection = false;
    let remainingProtections = Number(userData.streakProtections) || 0;

    if (!isToday) {
      if (isYesterday || (newStreak === 0 && !needsHelp)) {
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

    const { phase, multiplier } = calculateStreakPhase(newStreak);

    setStreakInfo({ count: newStreak, multiplier, phase, needsHelp, helpExpireAt });

    try {
      const updates: Record<string, unknown> = {
        streak: newStreak,
        streakMultiplier: multiplier,
        lastStreakUpdate: isToday && !usedProtection ? userData.lastStreakUpdate : serverTimestamp(),
        needsHelp,
        helpExpireAt: helpExpireAt ?? null,
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp()
      };

      if (usedProtection) {
        updates.streakProtections = remainingProtections;
      }

      await updateDoc(userRef, updates);
    } catch (e) {
      console.error('[Streak] Update failed for user', authUser.uid, e);
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
