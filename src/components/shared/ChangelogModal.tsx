import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Zap } from 'lucide-react';

const LATEST_CHANGES = {
  version: '3.2.0',
  items: [
    'A Saga Avalon v3.2.0 — Asset Guardian & Absolute Pathing',
    '🛡️ Blindagem de Ativos: Migração das logos para o motor de bundling do Vite. Agora elas são compiladas e gerenciadas pelo núcleo do app, eliminando falhas de pathing no GitHub Pages.',
    '🔗 Roteamento Cinematográfico: Ajuste no basename do React Router para navegação fluida em subpastas sem erros de 404.',
    '✨ Visual Clarity: Restauração completa da identidade visual em todas as telas (Navbar, Home, Footer e Player).'
  ]
};

export const ChangelogModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if the user hasn't seen this version yet
    const seenVersion = localStorage.getItem('seenChangelogVersion');
    if (seenVersion !== LATEST_CHANGES.version) {
      setIsVisible(true);
    }
  }, []);

  const close = () => {
    setIsVisible(false);
    localStorage.setItem('seenChangelogVersion', LATEST_CHANGES.version);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[var(--color-card)] border border-brand/30 rounded-3xl p-8 max-w-lg w-full shadow-2xl shadow-brand/20 relative"
        >
          <button onClick={close} className="absolute top-6 right-6 text-gray-500 hover:text-[var(--color-text-bright)] transition-colors">
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-brand/20 rounded-2xl flex items-center justify-center border border-brand/50">
              <Sparkles className="text-brand" size={24} />
            </div>
            <div>
                <h2 className="text-xl font-black text-[var(--color-text-bright)] uppercase italic tracking-tighter">O que há de novo?</h2>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest italic">Versão {LATEST_CHANGES.version}</p>
            </div>
          </div>

          <ul className="space-y-4 mb-8">
            {LATEST_CHANGES.items.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <Zap className="text-brand shrink-0 mt-1" size={14} />
                <span className="text-sm text-gray-500 font-medium">{item}</span>
              </li>
            ))}
          </ul>

          <button 
            onClick={close}
            className="w-full bg-brand hover:bg-brand-dark text-black font-black uppercase text-sm py-3 rounded-xl transition-colors"
          >
            Vamos lá!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
