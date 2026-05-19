import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth, handleFirestoreError, OperationType } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MessageSquare, Bug, Lightbulb, Heart, Send, Clock, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

type FeedbackType = 'BUG' | 'SUGGESTION' | 'COMPLIMENT' | 'OTHER';

interface FeedbackTicket {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: any;
  adminResponse?: string;
}

export default function Feedback() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [type, setType] = useState<FeedbackType>('SUGGESTION');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      loadTickets();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadTickets = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, 'feedback'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const loadedTickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FeedbackTicket[];
      setTickets(loadedTickets);
    } catch (err) {
      console.error("Error loading tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !description.trim()) return;

    try {
      setSubmitting(true);
      
      // 1. Save to Firestore
      const docRef = await addDoc(collection(db, 'feedback'), {
        userId: user.uid,
        username: user.displayName || 'Anônimo',
        email: user.email,
        type,
        title: title.trim(),
        description: description.trim(),
        status: 'PENDING',
        createdAt: serverTimestamp()
      });

      // 2. Try to sync to GitHub Issues
      try {
        const ghRes = await fetch('/api/feedback/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            user: { name: user.displayName || 'Anon', email: user.email },
            type: type
          })
        });

        if (ghRes.ok) {
          const ghData = await ghRes.json();
          if (ghData.number) {
            // Update Firestore with the issue number for future syncing (like closing)
            const { updateDoc, doc } = await import('firebase/firestore');
            await updateDoc(doc(db, 'feedback', docRef.id), {
              githubIssueNumber: ghData.number
            });
          }
        }
      } catch (ghErr) {
        console.warn("GitHub sync failed, but feedback was saved to Firestore.");
      }
      
      setSuccess(true);
      setTitle('');
      setDescription('');
      loadTickets();
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      const { title, message } = handleFirestoreError(err, OperationType.WRITE);
      alert(`${title}\n${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getIconForType = (type: FeedbackType) => {
    switch (type) {
      case 'BUG': return <Bug size={18} className="text-red-500" />;
      case 'SUGGESTION': return <Lightbulb size={18} className="text-brand" />;
      case 'COMPLIMENT': return <Heart size={18} className="text-pink-500" />;
      default: return <MessageSquare size={18} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'IN_PROGRESS': return 'bg-brand/10 text-brand border-brand/20';
      case 'RESOLVED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'CLOSED': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <MessageSquare className="w-16 h-16 text-[var(--color-border)] mb-4" />
        <h2 className="text-2xl font-black text-[var(--color-text-bright)] uppercase tracking-tight">Faça login</h2>
        <p className="text-gray-500 mt-2">Você precisa estar logado para enviar feedback.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 pb-20">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-[var(--color-text-bright)] uppercase italic tracking-tighter">
          Central de <span className="text-brand">Feedback</span>
        </h1>
        <p className="text-gray-500 mt-2 font-medium max-w-xl mx-auto">
          Encontrou um bug? Tem uma ideia genial? Seu feedback ajuda a construir uma comunidade melhor!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Formulário */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 md:p-8 shadow-sm h-fit">
          <h2 className="text-xl font-black text-[var(--color-text-bright)] uppercase tracking-tight mb-6 flex items-center gap-2">
            <Send size={20} className="text-brand" />
            Enviar Mensagem
          </h2>
          
          {success ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 p-8 rounded-2xl flex flex-col items-center text-center gap-4"
            >
              <CheckCircle size={48} />
              <div>
                <h3 className="font-black text-lg uppercase tracking-widest">Feedback Enviado!</h3>
                <p className="text-sm font-medium opacity-80 mt-1">Nossa equipe agradece a sua contribuição.</p>
              </div>
              <button 
                onClick={() => setSuccess(false)}
                className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase"
              >
                Enviar Outro
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Feedback</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'BUG', label: 'Bug', icon: Bug },
                    { id: 'SUGGESTION', label: 'Sugestão', icon: Lightbulb },
                    { id: 'COMPLIMENT', label: 'Elogio', icon: Heart },
                    { id: 'OTHER', label: 'Outro', icon: MessageSquare }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id as FeedbackType)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                        type === t.id 
                          ? "bg-brand/10 border-brand text-brand" 
                          : "bg-[var(--color-bg)] border-[var(--color-border)] text-gray-500 hover:border-gray-500/30"
                      )}
                    >
                      <t.icon size={18} />
                      <span className="text-[10px] font-black uppercase tracking-wider">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Título</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Problema ao favoritar anime"
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text-bright)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/50 transition-all font-medium placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Por favor, detalhe o máximo possível..."
                  rows={5}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text-bright)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/50 transition-all font-medium resize-none placeholder:text-gray-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !title.trim() || !description.trim()}
                className="w-full py-4 bg-brand text-white rounded-xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    Enviar Feedback
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Histórico */}
        <div className="space-y-4 rounded-3xl p-0 md:p-4 h-fit">
          <h2 className="text-xl font-black text-[var(--color-text-bright)] uppercase tracking-tight mb-6 flex items-center gap-2">
            <Clock size={20} className="text-zinc-500" />
            Seu Histórico
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-t-2 border-brand rounded-full animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 px-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium text-gray-500">Você ainda não enviou nenhum feedback.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={ticket.id} 
                  className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-[var(--color-bg)] rounded-lg shrink-0">
                        {getIconForType(ticket.type)}
                      </div>
                      <div>
                        <h3 className="font-black text-[var(--color-text-bright)] leading-tight">{ticket.title}</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                          {ticket.createdAt?.toDate().toLocaleDateString() || 'Agora mesmo'}
                        </p>
                      </div>
                    </div>
                    <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0", getStatusColor(ticket.status))}>
                      {ticket.status}
                    </div>
                  </div>
                  
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-[var(--color-bg)] border border-[var(--color-border)] p-3 rounded-xl whitespace-pre-wrap">
                    {ticket.description}
                  </p>

                  {ticket.adminResponse && (
                    <div className="mt-4 bg-brand/5 border border-brand/20 p-4 rounded-xl relative">
                      <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <CheckCircle size={12} />
                        Resposta da Equipe
                      </p>
                      <p className="text-sm font-medium text-[var(--color-text-bright)] whitespace-pre-wrap">{ticket.adminResponse}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
