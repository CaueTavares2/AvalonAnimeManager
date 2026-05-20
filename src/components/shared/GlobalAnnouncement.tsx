import React, { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const GlobalAnnouncement: React.FC = () => {
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if not dismissed
    const dismissed = localStorage.getItem('announcementDismissed');
    if (!dismissed) {
      setAnnouncement("Bem-vindo ao Avalon! Estamos em constante atualização. Fique de olho nas novidades!");
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    (window as any).triggerTestAnnouncement = () => {
        setAnnouncement("Este é um teste de anúncio!");
        setIsVisible(true);
        localStorage.removeItem('announcementDismissed');
    };
  }, []);

  const close = () => {
    setIsVisible(false);
    localStorage.setItem('announcementDismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && announcement && (
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] max-w-lg w-[calc(100%-2rem)]"
        >
          <div className="bg-brand text-black font-black text-[10px] uppercase tracking-widest p-3 rounded-2xl shadow-2xl shadow-brand/20 border border-white/20 flex items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="bg-black/10 p-1.5 rounded-lg">
                <Megaphone size={14} />
              </div>
              <span className="leading-tight">{announcement}</span>
            </div>
            <button 
              onClick={close} 
              className="w-8 h-8 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-xl transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
