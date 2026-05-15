import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserMedia, MediaStatus } from '../hooks/useAnimeList';
import { useAuth } from './AuthContext';
import { 
  collection, 
  onSnapshot, 
  query, 
  setDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from './AuthContext';
import { rankingService } from '../services/rankingService';

interface AnimeListContextType {
  list: UserMedia[];
  addAnime: (anime: UserMedia) => Promise<void>;
  batchAddAnimes: (animes: UserMedia[]) => Promise<void>;
  updateAnime: (id: number, data: Partial<UserMedia>) => Promise<void>;
  removeAnime: (id: number) => Promise<void>;
}

const AnimeListContext = createContext<AnimeListContextType | undefined>(undefined);

export function AnimeListProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [list, setList] = useState<UserMedia[]>(() => {
    try {
      const saved = localStorage.getItem('avalon_anime_list');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load local media list", e);
      return [];
    }
  });

  // Sync with Firestore when user is logged in
  useEffect(() => {
    if (!user) {
      return;
    }

    const listRef = collection(db, 'users', user.uid, 'list');
    const q = query(listRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: data.mediaId || data.id,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as UserMedia;
      });
      setList(newList);
      localStorage.setItem('avalon_anime_list', JSON.stringify(newList));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/list`);
    });

    return () => unsubscribe();
  }, [user]);

  const addAnime = useCallback(async (anime: UserMedia) => {
    if (user) {
      const path = `users/${user.uid}/list/${anime.id}`;
      try {
        const docRef = doc(db, 'users', user.uid, 'list', anime.id.toString());
        await setDoc(docRef, { 
          ...anime, 
          mediaId: anime.id,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Award points for starting/adding
        await rankingService.addPoints(user.uid, 10, `Adicionou: ${anime.title}`);
        if (anime.status === 'COMPLETED') {
          await rankingService.addPoints(user.uid, 50, `Concluiu: ${anime.title}`);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      setList(prev => {
        if (prev.some(a => a.id === anime.id)) return prev;
        const updated = [{ ...anime, updatedAt: new Date().toISOString() }, ...prev];
        localStorage.setItem('avalon_anime_list', JSON.stringify(updated));
        return updated;
      });
    }
  }, [user]);

  const batchAddAnimes = useCallback(async (animes: UserMedia[]) => {
    if (user) {
      const batch = writeBatch(db);
      animes.forEach(anime => {
        const docRef = doc(db, 'users', user.uid, 'list', anime.id.toString());
        batch.set(docRef, { 
          ...anime, 
          mediaId: anime.id,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      try {
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/list (batch)`);
      }
    } else {
      setList(prev => {
        const newAnimes = animes.filter(newAnime => !prev.some(a => a.id === newAnime.id));
        const updated = [...prev, ...newAnimes];
        localStorage.setItem('avalon_anime_list', JSON.stringify(updated));
        return updated;
      });
    }
  }, [user]);

  const updateAnime = useCallback(async (id: number, data: Partial<UserMedia>) => {
    if (user) {
      const path = `users/${user.uid}/list/${id}`;
      try {
        const existingItem = list.find(a => a.id === id);
        const docRef = doc(db, 'users', user.uid, 'list', id.toString());
        await updateDoc(docRef, { 
          ...data,
          updatedAt: serverTimestamp()
        });

        // Award points for progress
        if (existingItem && data.progress !== undefined && data.progress > existingItem.progress) {
          const diff = data.progress - existingItem.progress;
          await rankingService.addPoints(user.uid, diff * 5, `Progresso em: ${existingItem.title}`);
        }

        // Award points for completion
        if (existingItem && data.status === 'COMPLETED' && existingItem.status !== 'COMPLETED') {
          await rankingService.addPoints(user.uid, 50, `Concluiu: ${existingItem.title}`);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    } else {
      setList(prev => {
        const updated = prev.map(a => a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a);
        localStorage.setItem('avalon_anime_list', JSON.stringify(updated));
        return updated;
      });
    }
  }, [user]);

  const removeAnime = useCallback(async (id: number) => {
    if (user) {
      const path = `users/${user.uid}/list/${id}`;
      try {
        const docRef = doc(db, 'users', user.uid, 'list', id.toString());
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    } else {
      setList(prev => {
        const updated = prev.filter(a => a.id !== id);
        localStorage.setItem('avalon_anime_list', JSON.stringify(updated));
        return updated;
      });
    }
  }, [user]);

  return (
    <AnimeListContext.Provider value={{ list, addAnime, batchAddAnimes, updateAnime, removeAnime }}>
      {children}
    </AnimeListContext.Provider>
  );
}

export function useGlobalAnimeList() {
  const context = useContext(AnimeListContext);
  if (context === undefined) {
    throw new Error('useGlobalAnimeList must be used within an AnimeListProvider');
  }
  return context;
}
