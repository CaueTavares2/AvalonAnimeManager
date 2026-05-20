import { useState, useEffect } from 'react';
import { Terminal as TerminalIcon, Settings, DollarSign, HelpCircle, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface AdSenseBannerProps {
  slotId: string; // The AdSense ad slot key e.g. "8215930211"
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: boolean;
}

export default function AdSenseBanner({ slotId, format = 'auto', responsive = true }: AdSenseBannerProps) {
  const [publisherId, setPublisherId] = useState<string>('');
  const [adsenseEnabled, setAdsenseEnabled] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Load configured publisher ID if present
  useEffect(() => {
    // Standard approach to fetch Adsense configuration dynamically
    const configPubId = import.meta.env.VITE_ADSENSE_PUBLISHER_ID || localStorage.getItem('avalon_adsense_pub_id') || '';
    setPublisherId(configPubId);
    
    if (configPubId) {
      setAdsenseEnabled(true);
      // Attempt to load standard Google AdSense script globally if not loaded already
      if (!window.document.getElementById('adsense-global-script')) {
        const script = window.document.createElement('script');
        script.id = 'adsense-global-script';
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${configPubId}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        window.document.head.appendChild(script);
      }

      // Initialize any ads on page refresh
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (err) {
        // Suppress during non-production domains
        console.debug('AdSense init block (Standard behavior on local/development domains)');
      }
    }
  }, [publisherId]);

  return (
    <div className="w-full bg-[var(--color-card)]/40 rounded-3xl border border-[var(--color-border)] p-4 relative overflow-hidden group">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand/5 to-emerald-500/5 opacity-40 pointer-events-none" />

      {adsenseEnabled && publisherId ? (
        <div className="w-full flex flex-col items-center justify-center min-h-[90px]">
          {/* Real Google AdSense Tag */}
          <ins
            className="adsbygoogle"
            style={{ display: 'block', textAlign: 'center' }}
            data-ad-client={publisherId}
            data-ad-slot={slotId}
            data-ad-format={format}
            data-full-width-responsive={responsive ? "true" : "false"}
          />
          <div className="mt-2 text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] flex items-center gap-1.5 justify-center">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            Anúncio Adsense Original (Sinal Ativo)
          </div>
        </div>
      ) : (
        /* Highly elegant placeholder for development and user presentation */
        <div className="w-full py-6 flex flex-col items-center justify-center text-center space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500">
              <DollarSign size={14} className="animate-pulse" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-bright)]">
              Slot de Monetização Preparado
            </h4>
          </div>

          <p className="text-[10px] text-gray-400 max-w-md leading-relaxed font-semibold">
            Espaço reservado para <strong className="text-emerald-500">Google AdSense</strong>. Totalmente otimizado para banners responsivos que se adaptam no mobile e desktop sem quebrar o player.
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center gap-1.5"
            >
              <HelpCircle size={10} />
              {showGuide ? "Ocultar Guia" : "Como Ativar?"}
            </button>

            <button
              onClick={() => {
                const pubId = prompt('Insira seu código de publicador do Google AdSense (ex: ca-pub-xxxxxxxxxxxxxxxx):');
                if (pubId) {
                  localStorage.setItem('avalon_adsense_pub_id', pubId);
                  setPublisherId(pubId);
                  setAdsenseEnabled(true);
                  alert('ID configurado! Quando o Avalon estiver instalado em seu domínio próprio aprovado, o AdSense carregará banners ativos automaticamente.');
                }
              }}
              className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Settings size={10} />
              Inserir ca-pub ID
            </button>
          </div>

          {showGuide && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="w-full text-left bg-black/40 p-4 rounded-xl border border-white/5 space-y-2 mt-4 max-w-lg"
            >
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-emerald-500 leading-none">
                Passo-a-passo para colocar no Ar:
              </p>
              <ol className="list-decimal list-inside text-[9px] text-gray-400 space-y-1.5 leading-relaxed font-medium">
                <li>Adicione seu domínio em sua conta do <strong>Google AdSense</strong>.</li>
                <li>Gere blocos de anúncios do tipo <strong>Anúncios In-page / Display</strong>.</li>
                <li>Copie o seu código de publicador (ID que começa com <code className="text-emerald-400">ca-pub-</code>).</li>
                <li>Coloque-o na variável de ambiente <code className="text-white">VITE_ADSENSE_PUBLISHER_ID</code> ou clique no botão acima para testar localmente.</li>
                <li>Assegure-se de subir o arquivo <code className="text-white">ads.txt</code> no diretório público do seu servidor web para validar a propriedade intelectual da sua conta do AdSense!</li>
              </ol>
              <div className="flex items-start gap-1 p-2 bg-yellow-500/5 rounded border border-yellow-500/10 text-[8px] text-yellow-500">
                <ShieldAlert size={12} className="shrink-0 mt-0.5" />
                <span>O Google AdSense exige domínios reais de topo (ex: seudominio.com) para exibir anúncios reais. Ele não exibe anúncios válidos em URLs temporárias de desenvolvimento.</span>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
