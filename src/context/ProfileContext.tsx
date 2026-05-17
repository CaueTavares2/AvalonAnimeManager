import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, handleFirestoreError, OperationType } from './AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ProfileData {
  username: string;
  bio: string;
  favoriteAnime: string;
  favoriteGenres: string[];
  location: string;
  joinedDate: string;
  otakuPoints: number;
  availablePoints: number;
  mediaPoints?: number;
  rank: string;
  numericId?: number;
  photoURL?: string;
  bannerURL?: string;
  inventory?: any[];
  badges?: string[];
  streak: number;
  lastAttendance: string | null;
  hasSeenWelcome?: boolean;
}

interface ProfileContextType {
  profile: ProfileData;
  updateProfile: (data: Partial<ProfileData>) => void;
}

const defaultProfile: ProfileData = {
  username: 'Usuário Avalon',
  bio: '"A jornada de mil episódios começa com o primeiro \'play\'." - Entusiasta de Avalon.',
  favoriteAnime: 'Fate/stay night: Unlimited Blade Works',
  favoriteGenres: ['Ação', 'Fantasia', 'Seinen'],
  location: 'Earth 616',
  joinedDate: 'Maio 2026',
  otakuPoints: 0,
  availablePoints: 0,
  rank: 'FERRO',
  bannerURL: 'https://images.unsplash.com/photo-1578632738908-48b4850ee98d?auto=format&fit=crop&q=80&w=1200',
  inventory: [],
  badges: [],
  streak: 0,
  lastAttendance: null
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(() => {
    const saved = localStorage.getItem('avalon_profile');
    return saved ? JSON.parse(saved) : defaultProfile;
  });

  // Sync with Firestore
  useEffect(() => {
    if (!user) {
      setProfile(defaultProfile);
      localStorage.removeItem('avalon_profile');
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setProfile(prev => ({
          ...prev,
          username: data.username || prev.username,
          bio: data.bio || prev.bio,
          location: data.location || prev.location,
          favoriteAnime: data.favoriteAnime || prev.favoriteAnime,
          otakuPoints: data.otakuPoints !== undefined ? data.otakuPoints : (prev.otakuPoints || 0),
          availablePoints: data.availablePoints !== undefined ? data.availablePoints : (prev.availablePoints || 0),
          mediaPoints: data.mediaPoints !== undefined ? data.mediaPoints : (prev.mediaPoints || 0),
          rank: data.rank || 'FERRO',
          numericId: data.numericId !== undefined ? data.numericId : prev.numericId,
          photoURL: data.photoURL || prev.photoURL,
          bannerURL: data.bannerURL || prev.bannerURL,
          inventory: data.inventory || prev.inventory || [],
          badges: data.badges || prev.badges || [],
          streak: data.streak || prev.streak || 0,
          lastAttendance: data.lastAttendance || prev.lastAttendance || null,
          hasSeenWelcome: data.hasSeenWelcome !== undefined ? data.hasSeenWelcome : true // Default true for legacy users
        }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    localStorage.setItem('avalon_profile', JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (data: Partial<ProfileData>) => {
    setProfile(prev => ({ ...prev, ...data }));
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
