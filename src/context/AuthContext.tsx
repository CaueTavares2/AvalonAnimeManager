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
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export enum OperationType {
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null = null) {
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
  
  // Return formatted error for UI
  return {
    title: 'Erro de Banco de Dados',
    message: errInfo.error,
    info: errInfo
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  mediaType: 'anime' | 'manga';
  setMediaType: (type: 'anime' | 'manga') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mediaType, setMediaType] = useState<'anime' | 'manga'>('anime');

  useEffect(() => {
    // Set persistence to local (survives tab close)
    setPersistence(auth, browserLocalPersistence);

    const setOffline = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          await updateDoc(userRef, {
            status: 'OFFLINE',
            lastOnlineAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          // Ignore logout errors on close
        }
      }
    };

    window.addEventListener('beforeunload', setOffline);

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        if (authUser) {
          setUser(authUser);
          const userRef = doc(db, 'users', authUser.uid);
          
          // Initial sync (fast)
          let userData: any = null;
          try {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              userData = userSnap.data();
            }
          } catch (e) {
            console.error("Initial profile fetch error", e);
          }

          // Decide if we need to set loading to false
          if (userData) {
            // Existing User: Check for migration/missing fields
            if (!userData.numericId || !userData.customId || (authUser.email === 'caue.nanda.tavares@gmail.com' && userData.numericId !== 1)) {
              try {
                await runTransaction(db, async (t) => {
                  const uSnap = await t.get(userRef);
                  if (!uSnap.exists()) return;
                  const uData = uSnap.data();

                  const cRef = doc(db, 'counters', 'users');
                  const cSnap = await t.get(cRef);
                  
                  let nId = uData.numericId;
                  let cId = uData.customId;

                  if (authUser.email === 'caue.nanda.tavares@gmail.com') {
                    nId = 1;
                  } else if (!nId) {
                    nId = (cSnap.exists() ? (cSnap.data().count || 1) : 1) + 1;
                    if (nId === 1) nId = 2;
                    t.set(cRef, { count: nId }, { merge: true });
                  }

                  if (!cId) {
                    const shortId = Math.floor(1000 + Math.random() * 9000);
                    cId = `#Otaku${shortId}`;
                  }

                  t.update(userRef, { 
                    numericId: nId,
                    customId: cId,
                    uid: uData.uid || authUser.uid,
                    username: uData.username || authUser.displayName || 'Otaku',
                    createdAt: uData.createdAt || serverTimestamp(),
                    updatedAt: serverTimestamp()
                  });
                });
              } catch (e) {
                console.warn("Migration failed", e);
              }
            }
            setLoading(false);
            
            // Background tasks (non-blocking for UI)
            processBackgroundTasks(userData, authUser);
          } else {
            // New User flow (Wait for creation)
            try {
              await createNewUserProfile(authUser);
              setLoading(false);
            } catch (err) {
              console.error("Critical: Failed to create user profile", err);
              setLoading(false);
            }
          }

          const admins = ['caue.nanda.tavares@gmail.com']; 
          setIsAdmin(admins.includes(authUser.email || ''));
        } else {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
      } catch (err) {
        console.error("Critical Auth Error", err);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', setOffline);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            heartbeatAt: serverTimestamp(),
            lastActivityAt: serverTimestamp()
          });
        } catch (e) { /* ignore */ }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const createNewUserProfile = async (authUser: User) => {
    const userRef = doc(db, 'users', authUser.uid);
    await runTransaction(db, async (transaction) => {
      const counterRef = doc(db, 'counters', 'users');
      const counterSnap = await transaction.get(counterRef);
      
      let nextId = 1;
      if (authUser.email === 'caue.nanda.tavares@gmail.com') {
        nextId = 1;
      } else {
        nextId = (counterSnap.exists() ? (counterSnap.data().count || 0) : 1) + 1;
        if (nextId === 1) nextId = 2; // Reserve 1 for staff
      }
      
      const currentCount = counterSnap.exists() ? counterSnap.data().count : 0;
      if (nextId > currentCount) {
        transaction.set(counterRef, { count: nextId }, { merge: true });
      }
      
      const shortId = Math.floor(1000 + Math.random() * 9000);
      const customId = `#Otaku${shortId}`;
      
      const initialData = {
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
    };

  const processBackgroundTasks = async (userData: any, authUser: User) => {
    const userRef = doc(db, 'users', authUser.uid);
    
    try {
      const updates: any = {
        status: 'ONLINE',
        lastOnlineAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp()
      };
      
      await updateDoc(userRef, updates);

      // Update Private Info
      if (authUser.emailVerified) {
        const privRef = doc(db, 'users', authUser.uid, 'private', 'info');
        await setDoc(privRef, {
          email: authUser.email,
          emailVerified: true,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (e) {
      console.error("Background sync error", e);
      handleFirestoreError(e, OperationType.UPDATE, `users/${authUser.uid}`);
    }
  };

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
      user, loading, loginWithGoogle, logout, isAdmin, mediaType, setMediaType
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Removed redundant exports
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
