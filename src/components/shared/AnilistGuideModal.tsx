import React from 'react';
import { X, ExternalLink, Key, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnilistGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnilistGuideModal({ isOpen, onClose }: AnilistGuideModalProps) {
  if (!isOpen) return null;

  const currentUrl = window.location.origin + window.location.pathname;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[var(--color-bg)] rounded-3xl border border-[var(--color-border)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between sticky top-0 bg-[var(--color-bg)] z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[var(--color-text-bright)] uppercase tracking-tighter">Sincronização Ativa!</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tudo pronto para conectar seu perfil</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white bg-[var(--color-card)] hover:bg-[var(--color-border)] rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto space-y-8">
            <div className="bg-green-500/5 border border-green-500/10 p-4 rounded-2xl">
              <p className="text-sm text-green-500 font-bold mb-1">Parabéns! 🎉</p>
              <p className="text-xs text-gray-400">Você já configurou o básico. Agora só falta garantir que o redirecionamento esteja perfeito para que o login funcione sem erros.</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-8 h-8 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-xs font-black text-brand">1</div>
                <div className="space-y-3 flex-1">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text-bright)] uppercase tracking-tight">Onde configurar?</h3>
                    <p className="text-xs text-gray-500 mt-1">Vá em Developer Settings na AniList e edite o seu Client ID (41911).</p>
                  </div>
                  <a 
                    href="https://anilist.co/settings/developer" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                  >
                    Abrir Painel AniList <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="shrink-0 w-8 h-8 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-xs font-black text-brand">2</div>
                <div className="space-y-3 flex-1">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text-bright)] uppercase tracking-tight">A URL Mágica</h3>
                    <p className="text-xs text-gray-500 mt-1">Copie o link abaixo e cole no campo <strong>Redirect URL</strong> do AniList. Sem isso, o login dará erro 404 ou página branca.</p>
                  </div>
                  
                  <div className="group relative">
                    <div className="flex items-center gap-2 bg-black/50 border border-[var(--color-border)] rounded-xl p-3 pr-10">
                      <LinkIcon size={14} className="text-brand shrink-0" />
                      <code className="text-[10px] font-mono text-gray-300 break-all select-all flex-1">
                        {currentUrl}
                      </code>
                    </div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <CheckCircle2 size={14} className="text-green-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="shrink-0 w-8 h-8 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-xs font-black text-brand">3</div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-bright)] uppercase tracking-tight">Login Final</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Após salvar no AniList, clique em <strong>"Obter Token de Acesso"</strong> nas configurações do Avalon e pronto! Seu progresso será sincronizado automaticamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
              <strong className="text-red-500 block text-xs font-bold mb-1 uppercase tracking-widest">Dica de Sobrevivência</strong>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Se a página do AniList disser "Invalid Client" ou não carregar, verifique se o Client ID está preenchido e se a <strong>Redirect URL</strong> é exatamente igual à do Passo 2 (inclusive o https e a barra final).
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-card)]/50">
            <button 
              onClick={onClose}
              className="w-full bg-brand text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-dark transition-colors"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
