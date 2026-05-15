import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  mediaType: 'anime' | 'manga';
  setMediaType: (type: 'anime' | 'manga') => void;
  streakInfo: {
    count: number;
    multiplier: number;
    phase: 1 | 2 | 3 | 4 | 5;
    needsHelp: boolean;
    helpExpireAt: any;
  } | null;
  showStreakPopUp: boolean;
  setShowStreakPopUp: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mediaType, setMediaType] = useState<'anime' | 'manga'>('anime');
  const [streakInfo, setStreakInfo] = useState<AuthContextType['streakInfo']>(null);
  const [showStreakPopUp, setShowStreakPopUp] = useState(false);

  useEffect(() => {
    // Set persistence to local (survives tab close)
    setPersistence(auth, browserLocalPersistence);

    const setOffline = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        try {
          await updateDoc(userRef, {
            status: 'OFFLINE',
            lastOnlineAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
      }
    };

    window.addEventListener('beforeunload', setOffline);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          const now = new Date();
          
          if (!userSnap.exists()) {
            const shortId = Math.floor(1000 + Math.random() * 9000);
            const customId = `#Otaku${shortId}`;
            
            const initialData = {
              uid: user.uid,
              username: user.displayName || user.email?.split('@')[0],
              customId,
              photoURL: user.photoURL || '',
              status: 'ONLINE',
              lastOnlineAt: serverTimestamp(),
              otakuPoints: 0,
              weeklyPoints: 0,
              rank: 'FERRO',
              streak: 1,
              streakMultiplier: 1.0,
              lastStreakUpdate: serverTimestamp(),
              pillsCount: 1,
              pillsResetAt: serverTimestamp(),
              savedStreaksCount: 0,
              receivablesPillsCount: 0,
              lastResetAt: serverTimestamp(),
              lastActivityAt: serverTimestamp(),
              preferences: {
                darkMode: true,
                colorTheme: 'avalon',
                language: 'pt'
              },
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };

            const privateData = {
              email: user.email,
              emailVerified: user.emailVerified,
              updatedAt: serverTimestamp()
            };

            await setDoc(userRef, initialData);
            await setDoc(doc(db, 'users', user.uid, 'private', 'info'), privateData);
            setStreakInfo({ count: 1, multiplier: 1.0, phase: 1, needsHelp: false, helpExpireAt: null });
            setShowStreakPopUp(true);
          } else {
            const userData = userSnap.data();
            
            // Streak Logic
            const lastUpdate = userData.lastStreakUpdate ? (userData.lastStreakUpdate.toDate?.() || new Date(userData.lastStreakUpdate)) : new Date(0);
            const isToday = lastUpdate.toDateString() === now.toDateString();
            const isYesterday = new Date(now.getTime() - 86400000).toDateString() === lastUpdate.toDateString();
            
            let newStreak = userData.streak || 0;
            let needsHelp = userData.needsHelp || false;
            let helpExpireAt = userData.helpExpireAt || null;

            if (!isToday) {
              if (isYesterday || (userData.streak === 0 && !needsHelp)) {
                newStreak += 1;
                needsHelp = false;
                helpExpireAt = null;
                setShowStreakPopUp(true);
              } else if (newStreak > 0) {
                // Streak broken
                needsHelp = true;
                const expire = new Date(now.getTime() + 86400000); // 24h to be saved
                helpExpireAt = expire;
                // Don't zero yet, wait for save or 24h
              }
            }

            // Calculate multiplier and phase
            let phase: 1 | 2 | 3 | 4 | 5 = 1;
            let multiplier = 1.0;
            if (newStreak >= 31) { phase = 5; multiplier = 2.0; }
            else if (newStreak >= 15) { phase = 4; multiplier = 1.8; }
            else if (newStreak >= 8) { phase = 3; multiplier = 1.5; }
            else if (newStreak >= 4) { phase = 2; multiplier = 1.2; }

            setStreakInfo({ count: newStreak, multiplier, phase, needsHelp, helpExpireAt });

            // Saitama Training Achievement
            if (newStreak === 100) {
              const { rankingService } = await import('../services/rankingService');
              await rankingService.grantAchievement(user.uid, 'SAITAMA_TRAINING');
            }

            // Sync Rank with Points (Fix for users appearing in multiple/wrong leagues)
            let newRank = 'FERRO';
            const totalPO = userData.otakuPoints || 0;
            if (totalPO >= 10000) newRank = 'DESAFIANTE';
            else if (totalPO >= 5000) newRank = 'DIAMANTE';
            else if (totalPO >= 2500) newRank = 'PLATINA';
            else if (totalPO >= 1000) newRank = 'OURO';
            else if (totalPO >= 500) newRank = 'PRATA';
            else if (totalPO >= 200) newRank = 'BRONZE';

            // Update online status and streak and RANK
            try {
              // Sync PII if needed
              if (user.emailVerified) {
                await updateDoc(doc(db, 'users', user.uid, 'private', 'info'), {
                  emailVerified: true,
                  updatedAt: serverTimestamp()
                }).catch(() => {
                  // If it doesn't exist, create it (backwards compatibility)
                  setDoc(doc(db, 'users', user.uid, 'private', 'info'), {
                    email: user.email,
                    emailVerified: true,
                    updatedAt: serverTimestamp()
                  });
                });
              }

              await updateDoc(userRef, {
                status: 'ONLINE',
                lastOnlineAt: serverTimestamp(),
                streak: newStreak,
                streakMultiplier: multiplier,
                lastStreakUpdate: isToday ? userData.lastStreakUpdate : serverTimestamp(),
                needsHelp,
                helpExpireAt,
                rank: newRank, // Ensure rank is synced on login
                updatedAt: serverTimestamp()
              });
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
            }

            // Check for weekly reset (Pills, Points, and Changes)
            const lastReset = userData.lastResetAt ? (userData.lastResetAt.toDate?.() || new Date(userData.lastResetAt)) : new Date();
            const weekInMs = 7 * 24 * 60 * 60 * 1000;
            
            if (now.getTime() - lastReset.getTime() > weekInMs) {
              try {
                await updateDoc(userRef, {
                  weeklyPoints: 0,
                  weeklyChangesCount: 0, // Reset profile changes for achievement tracker
                  pillsCount: 1, // Reset pill stock
                  lastResetAt: serverTimestamp()
                });
              } catch (error) {
                handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
              }
            }

            // Inactivity penalty check (3 days)
            const lastActivity = userData.lastActivityAt ? (userData.lastActivityAt.toDate?.() || new Date(userData.lastActivityAt)) : new Date();
            const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
            if (now.getTime() - lastActivity.getTime() > threeDaysInMs) {
              const daysInactive = Math.floor((now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));
              const penalty = daysInactive * 10;
              try {
                await updateDoc(userRef, {
                  otakuPoints: Math.max(0, (userData.otakuPoints || 0) - penalty),
                  lastActivityAt: serverTimestamp()
                });
              } catch (error) {
                handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
              }
            } else {
              try {
                await updateDoc(userRef, {
                  lastActivityAt: serverTimestamp()
                });
              } catch (error) {
                handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
              }
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
        
        // Simple admin check
        const admins = ['caue.nanda.tavares@gmail.com']; 
        setIsAdmin(admins.includes(user.email || ''));
      } else {
        setUser(null);
        setIsAdmin(false);
        setStreakInfo(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', setOffline);
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, loginWithGoogle, logout, isAdmin, mediaType, setMediaType, 
      streakInfo, showStreakPopUp, setShowStreakPopUp 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export { handleFirestoreError, OperationType };

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
