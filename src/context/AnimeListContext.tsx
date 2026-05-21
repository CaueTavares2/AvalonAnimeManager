import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserMedia, MediaStatus } from '../hooks/useAnimeList';
import { useAuth } from './AuthContext';
import { 
  collection, 
  onSnapshot, 
  query, 
  setDoc, 
  doc, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  writeBatch,
  serverTimestamp,
  increment
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
      setList([]);
      localStorage.removeItem('avalon_anime_list');
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

      // Filler na Vida Real check
      const yearInMs = 365 * 24 * 60 * 60 * 1000;
      const now = new Date();
      const longTermPlanning = newList.find(anime => {
        if (anime.status !== 'PLANNING' || !anime.createdAt) return false;
        const createdDate = new Date(anime.createdAt);
        return (now.getTime() - createdDate.getTime()) > yearInMs;
      });

      if (longTermPlanning) {
        rankingService.grantAchievement(user.uid, 'FILLER_VIDA_REAL');
      }
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

        // O Escolhido Logic: check if first to add
        const globalRef = doc(db, 'global_media_stats', anime.id.toString());
        const globalSnap = await getDoc(globalRef);
        if (!globalSnap.exists()) {
          await setDoc(globalRef, {
            firstAddedBy: user.uid,
            firstAddedAt: serverTimestamp(),
            count: 1
          });
          await rankingService.grantAchievement(user.uid, 'O_ESCOLHIDO');
        } else {
          await updateDoc(globalRef, {
            count: increment(1)
          });
        }

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
        const { _parentIdMigration, ...cleanAnime } = anime as any;
        
        batch.set(docRef, { 
          ...cleanAnime, 
          mediaId: anime.id,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // If this show was migrated to standard MAL ID, delete its old AniList ID record
        if (_parentIdMigration) {
          const oldDocRef = doc(db, 'users', user.uid, 'list', _parentIdMigration.toString());
          batch.delete(oldDocRef);
        }
      });
      try {
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/list (batch)`);
      }
    } else {
      setList(prev => {
        const migratedIds = animes
          .filter(a => (a as any)._parentIdMigration)
          .map(a => (a as any)._parentIdMigration);

        // Filter out any duplicates referencing the old migrated AniList ID
        let filteredPrev = prev.filter(a => !migratedIds.includes(a.id));

        const cleanNewAnimes = animes.map(a => {
          const { _parentIdMigration, ...clean } = a as any;
          return clean;
        });

        const finalAnimes = cleanNewAnimes.filter(newAnime => !filteredPrev.some(a => a.id === newAnime.id));
        const updated = [...filteredPrev, ...finalAnimes];
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
        
        if (data.status === 'COMPLETED' && existingItem && existingItem.totalProgress) {
          data.progress = existingItem.totalProgress;
        }

        const docRef = doc(db, 'users', user.uid, 'list', id.toString());
        await updateDoc(docRef, { 
          ...data,
          updatedAt: serverTimestamp()
        });

        const now = new Date();
        const isMonday = now.getDay() === 1;
        const is4AM = now.getHours() === 4;

        if (isMonday && is4AM) {
          await rankingService.grantAchievement(user.uid, 'SEM_VIDA_SOCIAL');
        }

        // Update User Status to MARATONANDO
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        await updateDoc(userRef, {
          status: 'ONLINE',
          currentActivity: existingItem?.title || data.title || 'Algo Incrível',
          updatedAt: serverTimestamp()
        });

        // Award points for progress
        if (existingItem && data.progress !== undefined && data.progress > existingItem.progress) {
          const diff = data.progress - existingItem.progress;
          await rankingService.addPoints(user.uid, diff * 5, `Progresso em: ${existingItem.title}`);
          
          // Track marathons
          const lastMarathonUpdate = userData?.lastMarathonUpdate?.toDate() || new Date(0);
          const isToday = lastMarathonUpdate.toDateString() === now.toDateString();
          const todayCount = isToday ? (userData?.todayEpisodesCount || 0) + diff : diff;
          
          await updateDoc(userRef, {
            todayEpisodesCount: todayCount,
            lastMarathonUpdate: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          if (todayCount >= 12) {
            await rankingService.grantAchievement(user.uid, 'MARATONISTA');
            const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
            if (isWeekday) {
              await rankingService.grantAchievement(user.uid, 'INIMIGO_SOL');
            }
          }
        }

        // Dropador Profissional Logic
        if (data.status === 'DROPPED' && existingItem && existingItem.status !== 'DROPPED') {
          if (existingItem.progress <= 1) {
            const drops = (userData?.dropsCount || 0) + 1;
            await updateDoc(userRef, { 
              dropsCount: drops,
              updatedAt: serverTimestamp()
            });
            if (drops >= 5) {
              await rankingService.grantAchievement(user.uid, 'DROPADOR_PROFISSIONAL');
            }
          }
        }

        // Gosto Peculiar Logic
        if (data.score === 10 && existingItem && existingItem.score !== 10) {
          // Check global rating (this is tricky without API, but we can use the media.score property if it's there)
          if ((existingItem.score || 0) < 5.0 || (data as any).globalScore < 5.0) {
             await rankingService.grantAchievement(user.uid, 'GOSTO_PECULIAR');
          }
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
        const existingItem = prev.find(a => a.id === id);
        const newData = { ...data };
        if (newData.status === 'COMPLETED' && existingItem && existingItem.totalProgress) {
          newData.progress = existingItem.totalProgress;
        }

        const updated = prev.map(a => a.id === id ? { ...a, ...newData, updatedAt: new Date().toISOString() } : a);
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
