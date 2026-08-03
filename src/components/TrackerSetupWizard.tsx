import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Check, ExternalLink, HelpCircle } from 'lucide-react';

interface TrackerSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  trackerType: 'anilist' | 'mal';
}

export default function TrackerSetupWizard({ isOpen, onClose, trackerType }: TrackerSetupWizardProps) {
  const [step, setStep] = useState(1);

  const stepsAniList = [
    {
      title: 'O que é o AniList Token?',
      content: 'Para que o Avalon sincronize seus episódios e mangas automaticamente, precisamos de uma permissão especial (Token) para falar com o AniList em seu nome. É rápido, seguro e nós não guardamos sua senha.',
      image: 'https://cdn.dribbble.com/users/2069279/screenshots/6253457/media/50ff01abdfbda6bb903f67824ee1f51d.gif'
    },
    {
      title: 'Passo 1: Fazer Login',
      content: 'Clique no botão "Obter Token de Acesso" nas configurações. Isso vai abrir uma janela oficial do AniList pedindo para você fazer login (se já não estiver).',
      image: 'https://i.imgur.com/K3Zp8X3.png'
    },
    {
      title: 'Passo 2: Autorizar',
      content: 'Uma tela pedirá para autorizar o "Avalon". Basta clicar em "Approve". Isso diz ao AniList que você confia em nós para atualizar sua lista.',
      image: 'https://i.imgur.com/Qj04b1q.png'
    },
    {
      title: 'Passo 3: Copiar o Token',
      content: 'Você será levado a uma página em branco com um código longo. Esse é o seu Token! Copie tudo, volte aqui e cole no campo "Token de Acesso AniList". E pronto!',
      image: 'https://i.imgur.com/P5d9vD8.png'
    }
  ];

  const stepsMAL = [
    {
      title: 'Integração com MyAnimeList',
      content: 'Infelizmente, o MyAnimeList possui regras de API muito rígidas que exigem servidores dedicados para autenticação OAuth2 contínua. Para uma experiência local e segura como o Avalon, recomendamos fortemente o uso do AniList.',
      image: 'https://cdn.dribbble.com/users/2069279/screenshots/6253457/media/50ff01abdfbda6bb903f67824ee1f51d.gif'
    },
    {
      title: 'Alternativa Recomendada',
      content: 'Sugerimos migrar sua lista do MAL para o AniList (é possível importar direto no site deles). O AniList é muito mais amigável com desenvolvedores e integra perfeitamente aqui!',
      image: 'https://i.imgur.com/K3Zp8X3.png'
    }
  ];

  const steps = trackerType === 'anilist' ? stepsAniList : stepsMAL;
  const currentStep = steps[step - 1];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[var(--color-bg)] w-full max-w-md rounded-3xl shadow-2xl border border-[var(--color-border)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center p-6 pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 text-brand rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[var(--color-text-bright)]">
              {trackerType === 'anilist' ? 'Guia do AniList' : 'Guia do MyAnimeList'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--color-card)] text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              <h4 className="font-black text-xl text-brand">{currentStep.title}</h4>
              <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">
                {currentStep.content}
              </p>
              
              <div className="w-full aspect-video bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] mt-2 overflow-hidden flex items-center justify-center">
                {/* Fallback image style for representation */}
                <div className="w-full h-full bg-gradient-to-br from-brand/20 to-black/40 flex items-center justify-center text-center p-4">
                  <span className="text-xs text-brand font-bold uppercase tracking-widest opacity-60">Exemplo Visual</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-card)] flex justify-between items-center">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${step === i + 1 ? 'w-6 bg-brand' : 'w-2 bg-gray-600'}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="p-3 rounded-xl hover:bg-[var(--color-bg)] text-[var(--color-text-dim)] hover:text-white transition-colors border border-transparent hover:border-[var(--color-border)]"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            
            {step < steps.length ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-black text-sm uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand/20"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  localStorage.setItem(`avalon_${trackerType}_wizard_completed`, 'true');
                  onClose();
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-black text-sm uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20"
              >
                Entendi!
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
