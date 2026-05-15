import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
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
  rank: string;
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
  rank: 'FERRO'
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
    if (!user) return;

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
          otakuPoints: data.otakuPoints || 0,
          rank: data.rank || 'FERRO'
        }));
      }
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
