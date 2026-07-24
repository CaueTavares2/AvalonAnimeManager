import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithRedirect, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, runTransaction, DocumentData } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';

export { handleFirestoreError, OperationType };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  isAdmin: boolean;
  mediaType: 'anime' | 'manga';
  setMediaType: (type: 'anime' | 'manga') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['caue.nanda.tavares@gmail.com'];

async function createNewUserProfileInternal(authUser: User): Promise<void> {
  const userRef = doc(db, 'users', authUser.uid);
  await runTransaction(db, async (transaction) => {
    const counterRef = doc(db, 'counters', 'users');
    const counterSnap = await transaction.get(counterRef);

    let nextId = 1;
    if (authUser.email === ADMIN_EMAILS[0]) {
      nextId = 1;
    } else {
      nextId = (counterSnap.exists() ? (counterSnap.data().count || 0) : 1) + 1;
      if (nextId === 1) nextId = 2;
    }

    const currentCount = counterSnap.exists() ? counterSnap.data().count : 0;
    if (nextId > currentCount) {
      transaction.set(counterRef, { count: nextId }, { merge: true });
    }

    const shortId = Math.floor(1000 + Math.random() * 9000);
    const customId = `#Otaku${shortId}`;

    const initialData: Record<string, unknown> = {
      uid: authUser.uid,
      username: authUser.displayName || authUser.email?.split('@')[0],
      customId,
      numericId: nextId,
      photoURL: authUser.photoURL || '',
      status: 'ONLINE',
      lastOnlineAt: serverTimestamp(),
      otakuPoints: 0,
      mediaPoints: 0,
      availablePoints: 0,
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
      hasSeenWelcome: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    transaction.set(userRef, initialData);
    transaction.set(doc(db, 'users', authUser.uid, 'private', 'info'), {
      email: authUser.email,
      emailVerified: authUser.emailVerified,
      updatedAt: serverTimestamp()
    });
  });
}

async function processBackgroundTasksInternal(userData: DocumentData, authUser: User): Promise<void> {
  const userRef = doc(db, 'users', authUser.uid);

  try {
    const updates: Record<string, unknown> = {
      status: 'ONLINE',
      lastOnlineAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp()
    };

    await updateDoc(userRef, updates);

    if (authUser.emailVerified) {
      const privRef = doc(db, 'users', authUser.uid, 'private', 'info');
      await setDoc(privRef, {
        email: authUser.email,
        emailVerified: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (e) {
    console.error('[Auth] Background sync failed', e);
    handleFirestoreError(e, OperationType.UPDATE, `users/${authUser.uid}`);
  }
}

async function runMigrationIfNeeded(userData: DocumentData, authUser: User): Promise<void> {
  if (userData.numericId && userData.customId && !(authUser.email === ADMIN_EMAILS[0] && userData.numericId !== 1)) {
    return;
  }

  try {
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', authUser.uid);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) return;

      const existingData = userSnap.data();
      const counterRef = doc(db, 'counters', 'users');
      const counterSnap = await transaction.get(counterRef);

      let numericId = existingData.numericId;
      let customId = existingData.customId;

      if (authUser.email === ADMIN_EMAILS[0]) {
        numericId = 1;
      } else if (!numericId) {
        numericId = (counterSnap.exists() ? (counterSnap.data().count || 1) : 1) + 1;
        if (numericId === 1) numericId = 2;
        transaction.set(counterRef, { count: numericId }, { merge: true });
      }

      if (!customId) {
        const shortId = Math.floor(1000 + Math.random() * 9000);
        customId = `#Otaku${shortId}`;
      }

      transaction.update(userRef, {
        numericId,
        customId,
        uid: existingData.uid || authUser.uid,
        username: existingData.username || authUser.displayName || 'Otaku',
        createdAt: existingData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
  } catch (e) {
    console.warn('[Auth] Migration failed', e);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mediaType, setMediaType] = useState<'anime' | 'manga'>('anime');

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence);

    const setOffline = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          status: 'OFFLINE',
          lastOnlineAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.warn('[Auth] Failed to set offline status', error);
      }
    };

    window.addEventListener('beforeunload', setOffline);

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        if (!authUser) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setUser(authUser);

        let userData: DocumentData | null = null;
        try {
          const userSnap = await getDoc(doc(db, 'users', authUser.uid));
          if (userSnap.exists()) {
            userData = userSnap.data();
          }
        } catch (e) {
          console.error('[Auth] Initial profile fetch error', e);
        }

        if (userData) {
          await runMigrationIfNeeded(userData, authUser);
          setLoading(false);
          processBackgroundTasksInternal(userData, authUser);
        } else {
          try {
            await createNewUserProfileInternal(authUser);
          } catch (err) {
            console.error('[Auth] Critical: Failed to create user profile', err);
          }
          setLoading(false);
        }

        setIsAdmin(ADMIN_EMAILS.includes(authUser.email || ''));
      } catch (err) {
        console.error('[Auth] Critical error in auth state change', err);
        setLoading(false);
      }
    });

    const interval = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (!currentUser || document.visibilityState !== 'visible') return;

      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          heartbeatAt: serverTimestamp(),
          lastActivityAt: serverTimestamp()
        });
      } catch (e) {
        console.warn('[Auth] Heartbeat update failed', e);
      }
    }, 60000);

    const cleanup = () => {
      unsubscribe();
      window.removeEventListener('beforeunload', setOffline);
      clearInterval(interval);
    };

    return cleanup;
  }, []);

  const loginWithGoogle = () => {
    try {
      const provider = new GoogleAuthProvider();
      signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, loginWithGoogle, logout, isAdmin, mediaType, setMediaType
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
