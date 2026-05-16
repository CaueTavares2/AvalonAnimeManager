import React, { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const GlobalAnnouncement: React.FC = () => {
  const [announcement, setAnnouncement] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching announcements
    setAnnouncement("Bem-vindo ao Avalon! Estamos em constante atualização. Fique de olho nas novidades!");
  }, []);

  if (!announcement) return null;

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="bg-brand text-black font-black text-xs uppercase tracking-widest p-3 text-center flex items-center justify-center gap-2"
    >
      <Megaphone size={16} />
      {announcement}
    </motion.div>
  );
};
