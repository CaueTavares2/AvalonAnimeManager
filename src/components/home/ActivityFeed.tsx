import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth, OperationType, handleFirestoreError } from '../../context/AuthContext';
import { useSocial } from '../../context/SocialContext';
import { Clock, Play, BookOpen, Star, Heart } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

interface ActivityEvent {
  id: string;
  userId: string;
  username: string;
  photoURL?: string;
  type: 'WATCH' | 'READ' | 'RATE' | 'ACHIEVEMENT';
  mediaId?: string;
  mediaTitle?: string;
  mediaType?: 'ANIME' | 'MANGA';
  details?: string;
  createdAt: any;
}

export function ActivityFeed() {
  const { user } = useAuth();
  const { friends } = useSocial();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch activities from the user and their friends
    const friendIds = friends.map(f => f.uid);
    const targetIds = [user.uid, ...friendIds];

    // Firestore `in` query is limited to 10. For simplicity, we just fetch global recent activity if too many friends, 
    // or batch them, or just fetch the first 10 for the feed.
    const queryIds = targetIds.slice(0, 10); 

    const q = query(
      collection(db, 'activityFeed'),
      where('userId', 'in', queryIds.length > 0 ? queryIds : ['dummy']),
      orderBy('createdAt', 'desc'),
      limit(15)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityEvent)));
    }, (error) => {
      console.warn("Activity Feed error:", error);
    });

    return () => unsubscribe();
  }, [user, friends]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'WATCH': return <Play className="w-3.5 h-3.5 text-blue-400" />;
      case 'READ': return <BookOpen className="w-3.5 h-3.5 text-emerald-400" />;
      case 'RATE': return <Star className="w-3.5 h-3.5 text-yellow-400" />;
      case 'ACHIEVEMENT': return <Heart className="w-3.5 h-3.5 text-pink-400" />;
      default: return <Clock className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  if (!user || activities.length === 0) return null;

  return (
    <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4 shadow-sm h-full max-h-[400px] overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-brand" />
        <h3 className="text-[10px] font-black text-[var(--color-text-bright)] uppercase tracking-widest">Feed de Atividades</h3>
      </div>
      
      <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 space-y-3">
        <AnimatePresence>
          {activities.map(activity => (
            <motion.div 
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 bg-[var(--color-bg)]/30 p-2.5 rounded-xl border border-[var(--color-border)]/50"
            >
              <img 
                src={activity.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.username}`} 
                alt={activity.username} 
                className="w-8 h-8 rounded-lg object-cover bg-black" 
              />
              <div className="flex-1 space-y-1">
                <p className="text-[10px] text-[var(--color-text-bright)] leading-tight">
                  <Link to={`/profile/${activity.userId}`} className="font-bold hover:text-brand transition-colors mr-1">
                    {activity.username}
                  </Link>
                  <span className="text-gray-400">
                    {activity.type === 'WATCH' && "assistiu"}
                    {activity.type === 'READ' && "leu"}
                    {activity.type === 'RATE' && "avaliou"}
                    {activity.type === 'ACHIEVEMENT' && "conquistou"}
                  </span>
                  {activity.mediaTitle && (
                    <Link to={`/${activity.mediaType?.toLowerCase()}/${activity.mediaId}`} className="font-bold hover:text-brand transition-colors italic ml-1">
                      {activity.mediaTitle}
                    </Link>
                  )}
                </p>
                {activity.details && (
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{activity.details}</p>
                )}
                <p className="text-[8px] text-gray-500 italic">
                  {activity.createdAt?.toDate ? new Date(activity.createdAt.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                </p>
              </div>
              <div className="shrink-0 p-1.5 bg-black/20 rounded-md">
                {getIcon(activity.type)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
