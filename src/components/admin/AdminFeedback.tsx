import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MessageSquare, CheckCircle, Bug, Lightbulb, Heart, Search, X, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export default function AdminFeedback() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING'); // PENDING, ALL
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const loaded = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(loaded);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, adminResponse?: string) => {
    try {
      const ticket = tickets.find(t => t.id === id);
      const data: any = { status };
      if (adminResponse) data.adminResponse = adminResponse;
      await updateDoc(doc(db, 'feedback', id), data);
      
      // Sync with GitHub if it exists
      if (ticket?.githubIssueNumber && (status === 'CLOSED' || status === 'RESOLVED')) {
        try {
          await fetch(`/api/feedback/github/${ticket.githubIssueNumber}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: 'closed' })
          });
        } catch (ghErr) {
          console.warn("Failed to close GitHub issue:", ghErr);
        }
      }

      setTickets(tix => tix.map(t => t.id === id ? { ...t, ...data } : t));
      setReplyingTo(null);
      setReplyText('');
    } catch (e) {
      console.error(e);
    }
  };

  const [testStatus, setTestStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');

  const testGitHub = async () => {
    setTestStatus('LOADING');
    try {
      // 1. Create a test issue
      const res = await fetch('/api/feedback/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Conexão de Teste (APAGAR)',
          description: 'Esta é uma mensagem automática para testar a integração com o GitHub. Será fechada automaticamente.',
          user: { name: 'Admin Test', email: 'admin@avalon.com' },
          type: 'OTHER'
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        // 2. Immediately close it to keep it clean
        if (data.number) {
          await fetch(`/api/feedback/github/${data.number}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: 'closed' })
          });
        }
        setTestStatus('SUCCESS');
      } else {
        setTestStatus('ERROR');
      }
    } catch (e) {
      setTestStatus('ERROR');
    } finally {
      setTimeout(() => setTestStatus('IDLE'), 3000);
    }
  };

  const filteredTickets = tickets.filter(t => filter === 'ALL' || t.status === filter);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Caregando feedbacks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
        <h3 className="text-xl font-black text-[var(--color-text-bright)] uppercase tracking-tight flex items-center gap-2">
          <MessageSquare size={20} className="text-brand" />
          Feedback dos Usuários
        </h3>
        <div className="flex items-center gap-4">
          <button 
            onClick={testGitHub}
            disabled={testStatus !== 'IDLE'}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-2",
              testStatus === 'SUCCESS' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
              testStatus === 'ERROR' ? "bg-red-500/10 text-red-500 border-red-500/30" :
              "bg-[var(--color-bg)] text-gray-500 border-[var(--color-border)] hover:text-brand hover:border-brand/30"
            )}
          >
            {testStatus === 'LOADING' ? <div className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" /> : <AlertCircle size={12} />}
            {testStatus === 'SUCCESS' ? 'Conectado!' : testStatus === 'ERROR' ? 'Erro de Conexão' : 'Testar GitHub'}
          </button>
          <div className="flex gap-2">
          <button 
            onClick={() => setFilter('PENDING')}
            className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest", filter === 'PENDING' ? "bg-brand text-white" : "bg-[var(--color-bg)] text-gray-500")}
          >
            Pendentes
          </button>
          <button 
            onClick={() => setFilter('ALL')}
            className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest", filter === 'ALL' ? "bg-brand text-white" : "bg-[var(--color-bg)] text-gray-500")}
          >
            Todos
          </button>
        </div>
      </div>
    </div>

      <div className="space-y-4">
        {filteredTickets.length === 0 && (
          <div className="text-center py-12 text-gray-500 font-medium">Nenhum feedback encontrado.</div>
        )}
        
        {filteredTickets.map(ticket => (
          <div key={ticket.id} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border", 
                    ticket.type === 'BUG' ? "text-red-500 border-red-500/30 bg-red-500/10" :
                    ticket.type === 'SUGGESTION' ? "text-brand border-brand/30 bg-brand/10" :
                    "text-gray-500 border-gray-500/30 bg-gray-500/10"
                  )}>
                    {ticket.type}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border", 
                    ticket.status === 'PENDING' ? "text-orange-500 border-orange-500/30 bg-orange-500/10" :
                    "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                  )}>
                    {ticket.status}
                  </span>
                </div>
                <h4 className="font-black text-[var(--color-text-bright)]">{ticket.title}</h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                  Enviado por: {ticket.username} ({ticket.email})
                </p>
              </div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">
                {ticket.createdAt?.toDate().toLocaleDateString() || '...'}
              </div>
            </div>

            <div className="p-4 bg-[var(--color-bg)] rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300">
              {ticket.description}
            </div>

            {ticket.adminResponse && (
              <div className="p-4 bg-brand/10 border border-brand/20 rounded-xl">
                <p className="text-[10px] text-brand font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                  <CheckCircle size={12} /> Sua Resposta
                </p>
                <p className="text-sm font-medium text-[var(--color-text-bright)]">{ticket.adminResponse}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]/50">
              {replyingTo === ticket.id ? (
                <div className="w-full space-y-3">
                  <textarea 
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Sua resposta ao usuário..."
                    className="w-full bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-border)] text-sm resize-none focus:outline-none focus:border-brand"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setReplyingTo(null)} className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-[var(--color-bg)]">Cancelar</button>
                    <button onClick={() => updateStatus(ticket.id, 'RESOLVED', replyText)} className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-brand hover:bg-brand-dark">Resolver & Responder</button>
                  </div>
                </div>
              ) : (
                <>
                  {ticket.status === 'PENDING' && (
                    <button onClick={() => setReplyingTo(ticket.id)} className="px-4 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-black uppercase tracking-widest">
                      Responder
                    </button>
                  )}
                  {ticket.status !== 'CLOSED' && (
                     <button onClick={() => updateStatus(ticket.id, 'CLOSED')} className="px-4 py-1.5 bg-[var(--color-bg)] hover:bg-[var(--color-border)] rounded-lg text-xs font-black uppercase tracking-widest text-gray-500">
                       Fechar sem Reposta
                     </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
