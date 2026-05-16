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

  if (!announcement || !isVisible) return null;

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="bg-brand text-black font-black text-xs uppercase tracking-widest p-3 text-center flex items-center justify-center gap-2 relative"
    >
      <Megaphone size={16} />
      {announcement}
      <button onClick={close} className="absolute right-4 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </motion.div>
  );
};
