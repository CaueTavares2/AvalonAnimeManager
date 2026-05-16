import React, { useState, useEffect } from 'react';
import { useAuth, OperationType, handleFirestoreError } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, getDocs, deleteDoc, doc, query, where, writeBatch, setDoc, 
  serverTimestamp, onSnapshot, orderBy, limit, updateDoc, addDoc, getCountFromServer
} from 'firebase/firestore';
import { Shield, Trash2, AlertTriangle, CheckCircle, Loader2, Users, Activity, Megaphone, UserX, UserMinus, MessageSquareWarning, RefreshCw, List} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Admin() {
  const { isAdmin, user } = useAuth();
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [log, setLog] = useState<{msg: string, time: Date}[]>([]);
  
  // Dashboard stats
  const [stats, setStats] = useState({ totalUsers: 0, onlineUsers: 0, bannedUsers: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

  // Broadcast
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info'|'warning'>('info');

  // Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // User Management
  const [searchTarget, setSearchTarget] = useState('');
  const [targetUser, setTargetUser] = useState<any>(null);

  useEffect(() => {
    if (!isAdmin) return;

    fetchStats();

    // Listen to audit logs
    const qLogs = query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(15));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'auditLogs');
    });

    return () => unsubLogs();
  }, [isAdmin]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const snapObj = await getCountFromServer(collection(db, 'users'));
      const onlineSnap = await getCountFromServer(query(collection(db, 'users'), where('status', '==', 'ONLINE')));
      const bannedSnap = await getCountFromServer(query(collection(db, 'users'), where('banned', '==', true)));
      setStats({
        totalUsers: snapObj.data().count,
        onlineUsers: onlineSnap.data().count,
        bannedUsers: bannedSnap.data().count
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center">
        <Shield size={64} className="text-red-500 mb-6 opacity-20" />
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">ACESSO NEGADO</h1>
        <p className="text-gray-500 mt-4 font-bold uppercase tracking-widest text-[10px]">Apenas membros da STAFF podem acessar este setor.</p>
      </div>
    );
  }

  const addLog = (msg: string) => {
    setLog(prev => [{msg, time: new Date()}, ...prev].slice(0, 50));
  };

  const logAction = async (action: string, targetId?: string, details?: string) => {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        action,
        actorId: user?.uid,
        actorEmail: user?.email,
        targetId: targetId || null,
        details: details || '',
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error('Failed to write audit log', e);
    }
  };

  const purgeUsers = async () => {
    if (!window.confirm("VOCÊ TEM ABSOLUTA CERTEZA? Isso deletará TODOS os usuários não-staff e resetará o sistema.")) return;
    
    setStatus('LOADING');
    addLog("Iniciando PURGA GLOBAL...");
    logAction('PURGE_START', 'GLOBAL');

    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs;
      
      addLog(`Encontrados ${users.length} usuários.`);

      for (const userDoc of users) {
        const userData = userDoc.data();
        const uid = userDoc.id;

        if (uid === user?.uid || userData.email === 'caue.nanda.tavares@gmail.com') {
          addLog(`Pulando STAFF: ${userData.username || uid}`);
          continue;
        }

        addLog(`Deletando: ${userData.username || uid}...`);

        const subcollections = ['list', 'achievements', 'notifications', 'private']; 
        for (const sub of subcollections) {
           const subSnap = await getDocs(collection(db, 'users', uid, sub));
           if (!subSnap.empty) {
             const batch = writeBatch(db);
             subSnap.docs.forEach(d => batch.delete(d.ref));
             await batch.commit();
           }
        }

        const friendshipSnap = await getDocs(query(collection(db, 'friendships'), where('users', 'array-contains', uid)));
        if (!friendshipSnap.empty) {
          const batch = writeBatch(db);
          friendshipSnap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }

        const chatsSnap = await getDocs(query(collection(db, 'chats'), where('participants', 'array-contains', uid)));
        if (!chatsSnap.empty) {
          const batch = writeBatch(db);
          chatsSnap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }

        const collectionsToClean = ['friendRequests', 'activityFeed'];
        for (const collName of collectionsToClean) {
          const q1 = query(collection(db, collName), where('uid', '==', uid));
          const q2 = query(collection(db, collName), where('from', '==', uid));
          const q3 = query(collection(db, collName), where('to', '==', uid));
          
          const [s1, s2, s3] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3)]);
          const batch = writeBatch(db);
          s1.docs.forEach(d => batch.delete(d.ref));
          s2.docs.forEach(d => batch.delete(d.ref));
          s3.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }

        await deleteDoc(doc(db, 'users', uid));
      }

      const counterRef = doc(db, 'counters', 'users');
      await setDoc(counterRef, { count: 1 });
      addLog("Contador de IDs resetado para 1.");

      addLog("PURGA CONCLUÍDA COM SUCESSO.");
      logAction('PURGE_COMPLETE', 'GLOBAL');
      setStatus('SUCCESS');
      fetchStats();
    } catch (error) {
      console.error(error);
      addLog(`ERRO: ${error instanceof Error ? error.message : String(error)}`);
      setStatus('ERROR');
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    try {
      await addDoc(collection(db, 'broadcasts'), {
        message: broadcastMessage,
        type: broadcastType,
        senderId: user?.uid,
        createdAt: serverTimestamp(),
        active: true
      });
      logAction('BROADCAST_SENT', 'GLOBAL', `Type: ${broadcastType}, Msg: ${broadcastMessage}`);
      addLog(`Broadcast enviado: ${broadcastMessage}`);
      setBroadcastMessage('');
    } catch (e) {
      addLog(`Erro ao enviar broadcast`);
      console.error(e);
    }
  };

  const searchUser = async () => {
    if (!searchTarget.trim()) return;
    setTargetUser(null);
    try {
      let q = query(collection(db, 'users'), where('customId', '==', searchTarget));
      let snap = await getDocs(q);
      
      if (snap.empty) {
        q = query(collection(db, 'users'), where('username', '==', searchTarget));
        snap = await getDocs(q);
      }
      
      if (!snap.empty) {
        setTargetUser({ id: snap.docs[0].id, ...snap.docs[0].data() });
        addLog(`Usuário ${snap.docs[0].data().username} encontrado.`);
      } else {
        addLog(`Usuário não encontrado: ${searchTarget}`);
      }
    } catch (e) {
      addLog(`Erro na busca de usuário`);
    }
  };

  const applyWarn = async () => {
    if (!targetUser) return;
    try {
      const warns = (targetUser.warns || 0) + 1;
      await updateDoc(doc(db, 'users', targetUser.id), { warns });
      logAction('USER_WARN', targetUser.id, `Warn number ${warns}`);
      setTargetUser({...targetUser, warns});
      addLog(`Warn aplicado em ${targetUser.username} (${warns}x)`);
    } catch (e) {
      console.error(e);
    }
  };

  const applyMute = async () => {
    if (!targetUser) return;
    try {
      // Mute for 24h
      const muteUntil = new Date(Date.now() + 86400000);
      await updateDoc(doc(db, 'users', targetUser.id), { mutedUntil: muteUntil });
      logAction('USER_MUTE', targetUser.id, `Muted until ${muteUntil.toISOString()}`);
      setTargetUser({...targetUser, mutedUntil: muteUntil});
      addLog(`Usuário ${targetUser.username} mutado por 24h.`);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBan = async () => {
    if (!targetUser) return;
    try {
      const isBanned = !targetUser.banned;
      await updateDoc(doc(db, 'users', targetUser.id), { banned: isBanned });
      logAction(isBanned ? 'USER_BAN' : 'USER_UNBAN', targetUser.id);
      setTargetUser({...targetUser, banned: isBanned});
      addLog(`Usuário ${targetUser.username} ${isBanned ? 'BANIDO' : 'DESBANIDO'}.`);
      fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  // Safe visualization
  const isTargetBanned = targetUser?.banned;

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4 pb-20">
      <div className="border-b border-white/10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
            <Shield className="text-brand" size={32} />
            PAINEL STAFF
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1 ml-11">Acesso Nível 5 Concedido</p>
        </div>
        <button onClick={fetchStats} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white">
          <RefreshCw size={16} className={cn(loadingStats && "animate-spin text-brand")} />
        </button>
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center">
          <Users size={24} className="text-blue-500 mb-2" />
          <div className="text-3xl font-black text-white">{stats.totalUsers}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total de Contas</div>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center">
          <Activity size={24} className="text-emerald-500 mb-2" />
          <div className="text-3xl font-black text-white">{stats.onlineUsers}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Usuários Online</div>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center">
          <UserX size={24} className="text-red-500 mb-2" />
          <div className="text-3xl font-black text-white">{stats.bannedUsers}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Usuários Banidos</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="space-y-8">
          
          {/* USER MANAGEMENT */}
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Shield size={16} className="text-brand" />
              Gestão de Usuários
            </h3>
            
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="Buscar por Custom ID ou Username..."
                value={searchTarget}
                onChange={e => setSearchTarget(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchUser()}
                className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50 transition-colors"
              />
              <button 
                onClick={searchUser}
                className="px-6 bg-white/5 hover:bg-white/10 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-colors"
              >
                Buscar
              </button>
            </div>

            <AnimatePresence mode="popLayout">
              {targetUser && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-black/60 border border-brand/20 p-6 rounded-2xl space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <img src={targetUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.username}`} className="w-12 h-12 rounded-lg" alt="" />
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        {targetUser.username}
                        {isTargetBanned && <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest">Banido</span>}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">{targetUser.customId} • UID: {targetUser.id.substring(0, 8)}...</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={applyWarn} className="flex flex-col items-center justify-center p-3 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-xl border border-yellow-500/20 transition-colors">
                      <MessageSquareWarning size={18} className="mb-1" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Warn ({targetUser.warns || 0})</span>
                    </button>
                    <button onClick={applyMute} className="flex flex-col items-center justify-center p-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-xl border border-orange-500/20 transition-colors">
                      <UserMinus size={18} className="mb-1" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Mute 24h</span>
                    </button>
                    <button onClick={toggleBan} className={cn("flex flex-col items-center justify-center p-3 rounded-xl border transition-colors", isTargetBanned ? "bg-red-500/20 hover:bg-red-500/30 text-red-500 border-red-500/30" : "bg-red-500/5 hover:bg-red-500/10 text-red-500 border-red-500/10")}>
                      <UserX size={18} className="mb-1" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{isTargetBanned ? 'Desbanir' : 'Banir'}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* BROADCAST */}
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Megaphone size={16} className="text-brand" />
              Anúncio Global
            </h3>
            
            <div className="space-y-4">
              <textarea 
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                placeholder="Escreva uma mensagem para todos os usuários..."
                className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm text-white resize-none h-32 focus:outline-none focus:border-brand/50 transition-colors"
              />
              <div className="flex gap-4 items-center">
                <select 
                  value={broadcastType} 
                  onChange={(e: any) => setBroadcastType(e.target.value)}
                  className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                >
                  <option value="info">Informação (Azul)</option>
                  <option value="warning">Aviso Importante (Laranja)</option>
                </select>
                <button 
                  onClick={handleBroadcast}
                  disabled={!broadcastMessage.trim()}
                  className="flex-1 bg-brand hover:bg-brand-dark text-white rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>

          {/* TEST ACHIEVEMENTS */}
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Shield size={16} className="text-brand" />
              Testar Notificações de Conquistas
            </h3>
            <p className="text-xs text-zinc-400 mb-4">Teste os alertas visuais de conquistas. Isso não salva no banco de dados.</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                   window.dispatchEvent(new CustomEvent('TEST_ACHIEVEMENT', { detail: { id: 'TEST_1', title: 'Primeiros Passos', description: 'Você testou as conquistas.', rarity: 'COMUM', points: 50 } }));
                }}
                className="p-3 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-500/30 transition-colors"
              >
                Comum
              </button>
              <button 
                onClick={() => {
                   window.dispatchEvent(new CustomEvent('TEST_ACHIEVEMENT', { detail: { id: 'TEST_2', title: 'Foco Total', description: 'Você focou no objetivo.', rarity: 'RARO', points: 150 } }));
                }}
                className="p-3 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/30 transition-colors"
              >
                Raro
              </button>
              <button 
                onClick={() => {
                   window.dispatchEvent(new CustomEvent('TEST_ACHIEVEMENT', { detail: { id: 'TEST_3', title: 'Poder Absoluto', description: 'Poder que transborda.', rarity: 'EPICO', points: 400 } }));
                }}
                className="p-3 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-500/30 transition-colors"
              >
                Épico
              </button>
              <button 
                onClick={() => {
                   window.dispatchEvent(new CustomEvent('TEST_ACHIEVEMENT', { detail: { id: 'TEST_4', title: 'Lendário Vivo', description: 'A lenda é real.', rarity: 'LENDARIO', points: 1000 } }));
                }}
                className="p-3 bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-yellow-500/30 transition-colors"
              >
                Lendário
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          
          {/* AUDIT LOGS */}
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl flex flex-col">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <List size={16} className="text-zinc-400" />
              Audit Trail (Realtime)
            </h3>
            
            <div className="bg-black/30 rounded-2xl border border-white/5 p-4 flex-1 h-[300px] overflow-y-auto space-y-2 scrollbar-none">
              {auditLogs.length === 0 ? (
                <div className="text-center text-zinc-600 text-[10px] uppercase tracking-widest py-10">Nenhum registro encontrado.</div>
              ) : (
                auditLogs.map((item) => (
                  <div key={item.id} className="text-[11px] p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn("font-bold uppercase tracking-widest text-[9px] px-2 py-0.5 rounded-full", 
                        item.action.includes('WARN') || item.action.includes('BAN') ? 'bg-red-500/20 text-red-400' :
                        item.action.includes('BROADCAST') ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-zinc-300'
                      )}>
                        {item.action}
                      </span>
                      <span className="text-zinc-600 text-[9px]">{item.createdAt?.toDate().toLocaleString()}</span>
                    </div>
                    <div className="text-zinc-400 mb-1">
                      <span className="text-zinc-500">Actor:</span> {item.actorEmail || item.actorId}
                    </div>
                    {item.targetId && (
                      <div className="text-zinc-400">
                        <span className="text-zinc-500">Target:</span> {item.targetId}
                      </div>
                    )}
                    {item.details && (
                      <div className="text-zinc-300 mt-2 bg-black/40 p-2 rounded text-xs font-mono break-words">
                        {item.details}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PURGE SECTION */}
          <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-3xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-red-500/20 p-3 rounded-2xl text-red-500">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter text-red-500">PURGA GLOBAL</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Ação crítica e irreversível</p>
              </div>
            </div>
            
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 mb-6 text-zinc-400 text-xs font-mono h-32 overflow-y-auto scrollbar-none">
               {log.length === 0 ? "Aguardando comandos..." : log.map((l, i) => (
                 <div key={i}><span className="text-red-500">[{l.time.toLocaleTimeString()}]</span> {l.msg}</div>
               ))}
               {status === 'SUCCESS' && <div className="text-emerald-500 mt-2">SISTEMA LIMPO.</div>}
            </div>

            <button
               onClick={purgeUsers}
               disabled={status === 'LOADING'}
               className="w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-red-500/20"
            >
               {status === 'LOADING' ? <><Loader2 className="animate-spin" size={16}/> Executando...</> : <><Trash2 size={16}/> EXECUTAR PURGA</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
