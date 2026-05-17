import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import { PartyPopper, Sparkles, Star, ChevronRight } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const WelcomeModal: React.FC = () => {
  const { profile } = useProfile();
  const { user } = useAuth();
  
  if (!user || profile.hasSeenWelcome !== false) return null;

  const handleStart = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        hasSeenWelcome: true
      });
    } catch (e) {
      console.error("Error updating hasSeenWelcome", e);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-xl bg-[var(--color-bg)] rounded-[32px] overflow-hidden border border-[var(--color-border)] shadow-2xl"
        >
          {/* Header Image / Pattern */}
          <div className="h-48 bg-gradient-to-br from-brand/80 to-brand-dark/80 relative overflow-hidden flex items-center justify-center">
             {/* Abstract pattern */}
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
             
             <motion.div
               initial={{ rotate: -15, scale: 0.8 }}
               animate={{ rotate: 0, scale: 1 }}
               transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
               className="bg-white p-4 rounded-3xl shadow-xl rotate-12 relative z-10"
             >
               <PartyPopper className="w-16 h-16 text-brand" />
             </motion.div>
             <Sparkles className="absolute top-8 left-12 w-8 h-8 text-white/50 animate-pulse" />
             <Star className="absolute bottom-8 right-16 w-6 h-6 text-white/50 animate-bounce" />
          </div>

          <div className="p-8 text-center space-y-6 relative">
            <h2 className="text-3xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">
              Bem-vindo ao Avalon!
            </h2>
            
            <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto font-medium">
              Sua jornada de mil episódios começa agora. Avalon é o seu novo universo para rastrear animes, interagir com amigos, ganhar conquistas e subir de rank!
            </p>

            <div className="grid grid-cols-2 gap-4 py-4 text-left">
              <div className="bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)]">
                <Star className="w-5 h-5 text-yellow-500 mb-2" />
                <h4 className="font-bold text-[var(--color-text-bright)] text-sm mb-1">Pontos Otaku</h4>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Suba nas Ligas Semanais</p>
              </div>
              <div className="bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)]">
                <Sparkles className="w-5 h-5 text-emerald-500 mb-2" />
                <h4 className="font-bold text-[var(--color-text-bright)] text-sm mb-1">Acompanhe Seu Ritmo</h4>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">A melhor lista já feita</p>
              </div>
            </div>

            <button 
              onClick={handleStart}
              className="w-full bg-brand text-white font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-dark transition-all transform hover:scale-[1.02] shadow-lg shadow-brand/20 active:scale-95"
            >
              Começar minha jornada
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
