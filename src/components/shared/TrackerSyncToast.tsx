import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { TrackerSyncResult } from '../../services/trackerService';
import { motion, AnimatePresence } from 'motion/react';

export default function TrackerSyncToast() {
  const [syncs, setSyncs] = useState<TrackerSyncResult[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleSync = (e: Event) => {
      const results = (e as CustomEvent).detail as TrackerSyncResult[];
      setSyncs(results);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    };

    window.addEventListener('avalon-tracker-sync', handleSync);
    return () => window.removeEventListener('avalon-tracker-sync', handleSync);
  }, []);

  const getSmileyIcon = (smiley?: 'SMILE' | 'NEUTRAL' | 'SAD' | number) => {
    if (smiley === 'SMILE') return '😊 (SMILE)';
    if (smiley === 'NEUTRAL') return '😐 (NEUTRAL)';
    if (smiley === 'SAD') return '😢 (SAD)';
    return '';
  };

  if (!visible || syncs.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999] max-w-sm w-full">
      <div className="bg-black/90 text-white rounded-2xl border border-white/10 shadow-2xl p-4 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
          <RefreshCw className="w-4 h-4 text-brand animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest text-brand flex items-center gap-1.5">
            Auto-Sync Trackers v3.1.6
          </span>
          <span className="ml-auto text-[8px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded font-bold uppercase">Ativo</span>
        </div>

        <div className="space-y-3">
          {syncs.map((sync, idx) => (
            <div key={idx} className="flex items-start gap-3">
              {sync.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase text-gray-400">
                  {sync.tracker === 'anilist' ? 'AniList Hub' : 'MyAnimeList Hub'}
                </p>
                <p className="text-[11px] font-bold text-gray-200 mt-0.5 leading-tight">
                  {sync.message}
                </p>
                {sync.tracker === 'anilist' && sync.translatedScore && (
                  <div className="mt-1 flex items-center gap-1.5 bg-brand/10 text-brand text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full w-max">
                    <Sparkles className="w-2.5 h-2.5" />
                    Traduzido para: {getSmileyIcon(sync.translatedScore)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
