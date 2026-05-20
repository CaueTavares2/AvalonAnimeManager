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
              <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[var(--color-text-bright)] uppercase tracking-tighter">Guia de Sincronização AniList</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Como configurar o Client ID</p>
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
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-[10px] font-black text-brand shrink-0 mt-0.5">1</div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-bright)]">Criar um Cliente na AniList</h3>
                  <p className="text-xs text-gray-400 mt-1">Acesse a aba de desenvolvedor na sua conta AniList e crie um novo Client.</p>
                  <a 
                    href="https://anilist.co/settings/developer" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-xs font-bold text-white hover:border-brand transition-colors"
                  >
                    Abrir AniList Developer Settings <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-[10px] font-black text-brand shrink-0 mt-0.5">2</div>
                <div className="w-full">
                  <h3 className="text-sm font-bold text-[var(--color-text-bright)]">Configurar a URL de Redirecionamento</h3>
                  <p className="text-xs text-gray-400 mt-1 mb-3">É extremamente importante que o campo <strong>Redirect URL</strong> no site do AniList seja exatamente este abaixo. Se não for igual, a página do AniList dará erro ao tentar logar:</p>
                  
                  <div className="flex items-center gap-2 bg-black/50 border border-[var(--color-border)] rounded-xl p-3">
                    <LinkIcon size={16} className="text-gray-500" />
                    <code className="text-xs font-mono text-brand flex-1 break-all select-all">
                      {currentUrl}
                    </code>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-[10px] font-black text-brand shrink-0 mt-0.5">3</div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-bright)]">Salvar o Secret</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Copie apenas o <strong>Client ID</strong> gerado (um número na lista dos seus apps) e coloque-o como <code className="text-[10px] bg-black/50 px-1 py-0.5 rounded">VITE_ANILIST_CLIENT_ID</code> nas Environment Variables de sua plataforma de hospedagem ou no Google AI studio (como Secret).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-brand/10 border border-brand/20 p-4 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <div className="text-xs text-gray-300">
                <strong className="text-white block font-bold mb-1">Por que a página do AniList dá erro?</strong>
                Se ao clicar em "Obter Token de Acesso" a tela do AniList ficar branca ou apresentar erro, as chances são quase 100% de que a <strong>Redirect URL</strong> que você colocou lá no painel deles está diferente daquela apresentada no Passo 2 acima. Verifique os "https", as barras ("/") e o subdiretório.
              </div>
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
