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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set persistence to local (survives tab close)
    setPersistence(auth, browserLocalPersistence);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              username: user.displayName || user.email?.split('@')[0],
              avatar: user.photoURL || '',
              otakuPoints: 0,
              weeklyPoints: 0,
              rank: 'FERRO',
              lastResetAt: serverTimestamp(),
              lastActivityAt: serverTimestamp(),
              preferences: {
                darkMode: true,
                colorTheme: 'avalon',
                language: 'pt'
              },
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } else {
            // Check for weekly reset
            const userData = userSnap.data();
            const lastReset = userData.lastResetAt ? (userData.lastResetAt.toDate?.() || new Date(userData.lastResetAt)) : new Date();
            const now = new Date();
            const weekInMs = 7 * 24 * 60 * 60 * 1000;
            
            if (userData.lastResetAt && now.getTime() - lastReset.getTime() > weekInMs) {
              await updateDoc(userRef, {
                weeklyPoints: 0,
                lastResetAt: serverTimestamp()
              });
            }

            // Inactivity penalty check (3 days)
            const lastActivity = userData.lastActivityAt ? (userData.lastActivityAt.toDate?.() || new Date(userData.lastActivityAt)) : new Date();
            const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
            if (userData.lastActivityAt && now.getTime() - lastActivity.getTime() > threeDaysInMs) {
              const daysInactive = Math.floor((now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));
              const penalty = daysInactive * 10; // 10 PO per day inactive
              await updateDoc(userRef, {
                otakuPoints: Math.max(0, (userData.otakuPoints || 0) - penalty),
                lastActivityAt: serverTimestamp()
              });
            } else {
              // Update last activity to now to avoid penalty soon
              await updateDoc(userRef, {
                lastActivityAt: serverTimestamp()
              });
            }
          }
        } catch (error) {
          console.error("Profile sync error:", error);
          // Don't use handleFirestoreError here as it might loop or hide auth state
        }
        
        // Simple admin check (can be replaced with a collection check)
        const admins = ['caue.nanda.tavares@gmail.com']; 
        setIsAdmin(admins.includes(user.email || ''));
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
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
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, isAdmin }}>
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
