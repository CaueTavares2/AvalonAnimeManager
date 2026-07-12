import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Bell, Check, Trash2, ShieldAlert, Star, UserPlus, Gift } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'SYSTEM' | 'FRIEND_REQUEST' | 'ACHIEVEMENT' | 'LEVEL_UP' | 'GACHA';
  read: boolean;
  createdAt: any;
  actionUrl?: string;
}

export function NotificationsDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, `users/${user.uid}/notifications`),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/notifications`, id), { read: true });
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        batch.update(doc(db, `users/${user.uid}/notifications`, n.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error(error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'FRIEND_REQUEST': return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'ACHIEVEMENT': return <Star className="w-4 h-4 text-yellow-400" />;
      case 'LEVEL_UP': return <ShieldAlert className="w-4 h-4 text-emerald-400" />;
      case 'GACHA': return <Gift className="w-4 h-4 text-purple-400" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-500 hover:text-[var(--color-text-bright)] hover:bg-[var(--color-bg)] transition-colors"
      >
        <Bell size={18} className={cn(unreadCount > 0 && "text-brand")} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--color-card)] animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-3 w-80 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl z-[110] backdrop-blur-xl overflow-hidden flex flex-col max-h-[400px]"
          >
            <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg)]/50">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-bright)]">
                Notificações {unreadCount > 0 && <span className="text-brand">({unreadCount})</span>}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[9px] font-bold text-gray-500 hover:text-brand uppercase tracking-wider flex items-center gap-1"
                >
                  <Check size={12} /> Marcar lidas
                </button>
              )}
            </div>

            <div className="overflow-y-auto custom-scrollbar p-2 space-y-1 flex-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-500 flex flex-col items-center gap-2">
                  <Bell className="w-8 h-8 opacity-20" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Nenhuma notificação</span>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                    className={cn(
                      "p-3 rounded-xl transition-colors cursor-pointer flex gap-3 relative group",
                      notif.read ? "hover:bg-[var(--color-bg)]" : "bg-brand/5 hover:bg-brand/10 border border-brand/20"
                    )}
                  >
                    {!notif.read && (
                      <span className="absolute top-3 right-3 w-1.5 h-1.5 bg-brand rounded-full" />
                    )}
                    <div className="shrink-0 mt-0.5">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className={cn("text-[11px] font-black uppercase tracking-wider", notif.read ? "text-gray-400" : "text-[var(--color-text-bright)]")}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-400 leading-snug">
                        {notif.message}
                      </p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest pt-1">
                        {notif.createdAt?.toDate ? new Date(notif.createdAt.toDate()).toLocaleDateString('pt-BR') : 'Agora'}
                      </p>
                      {notif.actionUrl && (
                        <Link 
                           to={notif.actionUrl}
                           className="inline-block mt-2 text-[9px] font-black text-brand uppercase tracking-widest hover:underline"
                           onClick={() => setIsOpen(false)}
                        >
                          Ver Detalhes
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
