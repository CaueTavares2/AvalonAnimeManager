import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  collection, 
  onSnapshot, 
  query, 
  setDoc, 
  doc, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from './AuthContext';
import { rankingService } from '../services/rankingService';

export interface FavoriteCharacter {
  id: number;
  name: string;
  image: string;
  animeTitle?: string;
  role?: string;
  addedAt?: string;
}

interface FavoritesContextType {
  favoriteCharacters: FavoriteCharacter[];
  addCharacter: (char: FavoriteCharacter) => Promise<void>;
  removeCharacter: (id: number) => Promise<void>;
  isFavorite: (id: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favoriteCharacters, setFavoriteCharacters] = useState<FavoriteCharacter[]>([]);

  useEffect(() => {
    if (!user) {
      setFavoriteCharacters([]);
      return;
    }

    const favRef = collection(db, 'users', user.uid, 'favorites', 'characters', 'items');
    const q = query(favRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newList = snapshot.docs.map(doc => doc.data() as FavoriteCharacter);
      setFavoriteCharacters(newList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/favorites/characters`);
    });

    return () => unsubscribe();
  }, [user]);

  const addCharacter = useCallback(async (char: FavoriteCharacter) => {
    if (!user) return;
    
    try {
      const docRef = doc(db, 'users', user.uid, 'favorites', 'characters', 'items', char.id.toString());
      await setDoc(docRef, { 
        ...char, 
        addedAt: new Date().toISOString() 
      });
      
      // Award points for favoriting? 
      await rankingService.addPoints(user.uid, 10, `Favoritou personagem: ${char.name}`);
      
      // Check achievement: Coveiro de Waifus (15 chars)
      if (favoriteCharacters.length + 1 >= 15) {
        await rankingService.grantAchievement(user.uid, 'COVEIRO_WAIFUS');
      }

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/favorites/characters/${char.id}`);
    }
  }, [user, favoriteCharacters]);

  const removeCharacter = useCallback(async (id: number) => {
    if (!user) return;
    
    try {
      const docRef = doc(db, 'users', user.uid, 'favorites', 'characters', 'items', id.toString());
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/favorites/characters/${id}`);
    }
  }, [user]);

  const isFavorite = useCallback((id: number) => {
    return favoriteCharacters.some(c => c.id === id);
  }, [favoriteCharacters]);

  return (
    <FavoritesContext.Provider value={{ favoriteCharacters, addCharacter, removeCharacter, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
