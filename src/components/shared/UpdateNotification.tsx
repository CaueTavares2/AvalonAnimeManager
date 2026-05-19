import React, { useState, useEffect } from 'react';
import { RefreshCw, X, Github, ArrowUpCircle } from 'lucide-react';
import { updateService } from '../../services/updateService';
import { motion, AnimatePresence } from 'motion/react';

export const UpdateNotification: React.FC = () => {
  const [update, setUpdate] = useState<{ latestSha: string; message: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initial check after 5 seconds
    const timer = setTimeout(async () => {
      const result = await updateService.checkForUpdates();
      if (result?.hasUpdate) {
        setUpdate({ latestSha: result.latestSha, message: result.message });
        setIsVisible(true);
      }
    }, 5000);

    // Periodic check every 30 minutes
    const interval = setInterval(async () => {
      const result = await updateService.checkForUpdates();
      if (result?.hasUpdate) {
        setUpdate({ latestSha: result.latestSha, message: result.message });
        setIsVisible(true);
      }
    }, 1000 * 60 * 30);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  if (!isVisible || !update) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-[100] max-w-sm w-full"
      >
        <div className="bg-[var(--color-card)] backdrop-blur-xl border border-brand/30 rounded-2xl p-4 shadow-2xl shadow-brand/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center shrink-0 border border-brand/50">
              <RefreshCw className="w-5 h-5 text-brand animate-spin-slow" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-black text-[var(--color-text-bright)] uppercase tracking-widest flex items-center gap-2">
                  <ArrowUpCircle size={14} className="text-brand" /> Nova Atualização
                </h4>
                <button 
                  onClick={() => setIsVisible(false)}
                  className="text-gray-500 hover:text-[var(--color-text-bright)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              
              <p className="text-[10px] text-gray-500 font-bold uppercase italic line-clamp-2 leading-relaxed mb-3">
                "{update.message}"
              </p>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => updateService.applyUpdate(update.latestSha)}
                  className="flex-1 bg-brand hover:bg-brand-dark text-black text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={12} /> Atualizar Agora
                </button>
                <a 
                  href={`https://github.com/${updateService.REPO_OWNER}/${updateService.REPO_NAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[var(--color-bg)] hover:bg-[var(--color-bg)] text-[var(--color-text-bright)] p-2 rounded-lg transition-colors border border-[var(--color-border)]/50"
                >
                  <Github size={14} />
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
            <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em] text-center italic">
              Verificando repositório automaticamente...
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
