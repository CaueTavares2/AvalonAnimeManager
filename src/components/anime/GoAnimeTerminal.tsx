import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Terminal as TerminalIcon, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { jikanService } from '../../services/jikanService';

interface GoAnimeTerminalProps {
  onClose: () => void;
}

export default function GoAnimeTerminal({ onClose }: GoAnimeTerminalProps) {
  const [history, setHistory] = useState<string[]>([
    'Avalon OS v4.2.0 (kernel 5.15-avalon)',
    'Welcome to GoAnime CLI',
    'Type "help" for a list of commands.',
    ''
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCommand = async (cmd: string) => {
    const parts = cmd.trim().split(' ');
    const action = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    setHistory(prev => [...prev, `> ${cmd}`]);

    switch (action) {
      case 'help':
        setHistory(prev => [...prev, 
          'Available commands:',
          '  search <name>  - Search for an anime',
          '  list           - List popular animes',
          '  clear          - Clear terminal',
          '  exit           - Close terminal',
          '  help           - Show this help message'
        ]);
        break;
      case 'clear':
        setHistory([]);
        break;
      case 'exit':
        onClose();
        break;
      case 'search':
        if (!args) {
          setHistory(prev => [...prev, 'Error: No search term provided. Usage: search <name>']);
          break;
        }
        setHistory(prev => [...prev, `Searching for "${args}"...`]);
        try {
          const data = await jikanService.search(args, 'anime', 1);
          if (data.data?.length > 0) {
            setHistory(prev => [...prev, 'Results:']);
            data.data.forEach((anime: any, i: number) => {
              setHistory(prev => [...prev, `  [${i + 1}] ${anime.title} (${anime.mal_id})`]);
            });
            setHistory(prev => [...prev, 'Type the ID to start watching.']);
          } else {
            setHistory(prev => [...prev, 'No results found.']);
          }
        } catch (e) {
          setHistory(prev => [...prev, 'Error: Failed to connect to registry.']);
        }
        break;
      default:
        // Try if it's a number (selection)
        if (!isNaN(parseInt(action)) && history.some(h => h.includes(`[${action}]`))) {
          const match = history.findLast(h => h.includes(`[${action}]`));
          const idMatch = match?.match(/\((\d+)\)/);
          if (idMatch) {
            setHistory(prev => [...prev, `Initiating link aggregation for ID ${idMatch[1]}...`]);
            setTimeout(() => {
              navigate(`/anime/${idMatch[1]}/watch`);
              onClose();
            }, 1000);
          }
        } else if (action) {
          setHistory(prev => [...prev, `Command not found: ${action}. Type "help" for commands.`]);
        }
    }
    setInput('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl h-[600px] bg-[#0c0c0c] border border-brand/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-mono"
        onClick={e => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div className="bg-[#1a1a1a] p-3 flex items-center justify-between border-b border-brand/20">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest ml-4">
              <TerminalIcon size={12} />
              GoAnime v3.2.0 — user@avalon
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Terminal Content */}
        <div 
          ref={scrollRef}
          className="flex-1 p-6 overflow-y-auto text-green-500 text-sm space-y-1 custom-scrollbar"
        >
          {history.map((line, i) => (
            <div key={i} className={cn(
              "whitespace-pre-wrap leading-relaxed",
              line.startsWith('>') ? "text-emerald-400 font-bold" : 
              line.includes('Error') ? "text-red-400" : 
              line.startsWith(' ') ? "text-gray-400" : "text-emerald-500/80"
            )}>
              {line}
            </div>
          ))}
          
          <div className="flex items-center gap-2 pt-2">
            <span className="text-emerald-400 font-bold animate-pulse">avalonshell$</span>
            <input 
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCommand(input)}
              className="flex-1 bg-transparent border-none outline-none text-emerald-400 caret-emerald-400"
              autoFocus
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-[#1a1a1a]/50 p-2 text-[8px] text-gray-600 flex justify-between uppercase tracking-widest font-black">
          <span>Connection: Encrypted (AES-256)</span>
          <span>Aggregator Engine: Active</span>
        </div>
      </div>
    </motion.div>
  );
}
