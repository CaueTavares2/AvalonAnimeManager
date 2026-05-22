import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { doc, updateDoc, increment, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function ConsoleCommandHook() {
  const { user, isAdmin } = useAuth();
  const { profile } = useProfile();
  const [isSessionVerified, setIsSessionVerified] = useState(() => {
    return sessionStorage.getItem('avalon_console_auth') === 'verified';
  });

  useEffect(() => {
    // Print the welcome header to the inspector's terminal
    console.log(
      '%c 🌌 AVALON DEVCONSOLE v4.7.2 %c\n' +
      'Sua sessão hacker de Neo-Tokyo foi mapeada.\n' +
      'Digite %cavalon.ajuda()%c ou %cavalon.help()%c no terminal para ver os comandos de ADM disponíveis.\n\n' +
      'STATUS DA SESSÃO: ' + (isSessionVerified ? '🔓 DESBLOQUEADO' : '🔒 BLOQUEADO (Digite avalon.auth("SUA_SENHA") para liberar)'),
      'background: #f59e0b; color: #111827; font-weight: bold; font-size: 13px; padding: 4px 8px; border-radius: 4px;',
      'color: #94a3b8; font-size: 11px;',
      'color: #38bdf8; font-weight: bold;',
      'color: #94a3b8;',
      'color: #38bdf8; font-weight: bold;',
      'color: #94a3b8;'
    );

    const checkAdminPrivilege = () => {
      if (!user) {
        console.warn('%c[AVALON DEVCONSOLE]%c Erro: Nenhum usuário autenticado no sistema.', 'color: #ef4444; font-weight: bold;', 'color: #94a3b8;');
        return false;
      }
      // Require email check OR is admin
      const isOwner = user.email === 'caue.nanda.tavares@gmail.com';
      if (!isAdmin && !isOwner) {
        console.error(
          `%c[AVALON DEVCONSOLE]%c Acesso negado para o email logado: ${user.email || 'N/A'}.\nVocê precisa estar logado com a conta de desenvolvedor correspondente.`,
          'color: #ef4444; font-weight: bold;',
          'color: #94a3b8;'
        );
        return false;
      }
      if (!isSessionVerified) {
        console.warn(
          '%c[AVALON DEVCONSOLE]%c Erro: Console travado. Autentique seu terminal digitando:\n%cavalon.auth("SUA_SENHA")',
          'color: #f59e0b; font-weight: bold;',
          'color: #94a3b8;',
          'color: #38bdf8;'
        );
        return false;
      }
      return true;
    };

    // Global avalon command set
    (window as any).avalon = {
      // 1. Help Commands
      help: () => (window as any).avalon.ajuda(),
      ajuda: () => {
        console.group('%c🌌 MENU DE COMANDOS DE ADMIN - AVALON SAGA %c', 'color: #f55f0b; font-weight: bold; font-size: 12px;', 'color: #475569');
        console.log('Use os métodos abaixo diretamente para alterar estados em tempo real no banco de dados:');
        console.table([
          { 'Comando': 'avalon.auth("senha")', 'Descrição': 'Autentica o console (Senha: avalonDev2026)' },
          { 'Comando': 'avalon.addPoints(quantidade, motivo?)', 'Descrição': 'Adiciona Otaku Points (PO) para sua conta ativa.' },
          { 'Comando': 'avalon.setPoints(quantidade)', 'Descrição': 'Insere valor bruto exato de PO na conta.' },
          { 'Comando': 'avalon.setStreak(dias)', 'Descrição': 'Modifica o contador do seu Streak diário (leitura diária).' },
          { 'Comando': 'avalon.addProtection(quantidade)', 'Descrição': 'Incrementa itens "Pena da Imortalidade" (Streak Saver) no avatar.' },
          { 'Comando': 'avalon.addBadge(id, nome, descrição?, raridade?)', 'Descrição': 'Seta um emblema customizado raríssimo direto no seu perfil.' },
          { 'Comando': 'avalon.setRank(rank)', 'Descrição': 'Modifica rank (FERRO, BRONZE, PRATA, OURO, PLATINA, DIAMANTE, DESAFIANTE).' },
          { 'Comando': 'avalon.addBoost(horas)', 'Descrição': 'Ativa multiplicador PO x2 válido por n horas.' },
          { 'Comando': 'avalon.clearInventory()', 'Descrição': 'Remove todos os cosméticos e cartas compradas do inventário.' },
          { 'Comando': 'avalon.status()', 'Descrição': 'Retorna dados do perfil local atual.' }
        ]);
        console.log('%cExemplo para ativar 50.000 PO: %cavalon.addPoints(50000)', 'color: #f59e0b; font-weight: bold;', 'color: #10b981;');
        console.groupEnd();
        return 'Digite qualquer um dos comandos listados acima.';
      },

      // 2. Authentication System
      auth: (passcode: string) => {
        if (!user) {
          console.error('%c[AVALON DEVCONSOLE]%c Login indisponível no momento.', 'color: #ef4444; font-weight: bold;', 'color: #94a3b8;');
          return 'Tente entrar na sua conta e recarregar.';
        }
        
        // Allowed master keys
        const validPasscodes = ['avalonDev2026', 'caue1337', 'neoTokyo99', 'avalonadmin'];
        if (validPasscodes.includes(passcode)) {
          setIsSessionVerified(true);
          sessionStorage.setItem('avalon_console_auth', 'verified');
          console.log(
            '%c🔓 AUTENTICAÇÃO CONCLUÍDA COM SUCESSO! %c\nSua sessão administrativa foi iniciada com privilégios de desenvolvedor. Todos os comandos de banco de dados foram liberados.',
            'color: #10b981; font-weight: bold; font-size: 11px;',
            'color: #94a3b8;'
          );
          return `Bem-vindo de volta, ${user.displayName || 'Admin'}!`;
        } else {
          console.error('%c[AVALON DEVCONSOLE]%c Senha incorreta!', 'color: #ef4444; font-weight: bold;', 'color: #94a3b8;');
          return 'Acesso negado. Tente novamente.';
        }
      },

      // 3. Command: Print Profile Status (Info-only)
      status: () => {
        if (!user) return 'Nenhum usuário logado.';
        console.group('%c📊 DADOS DE SESSÃO ATIVOS %c', 'color: #06b6d4; font-weight: bold;', 'color: #94a3b8;');
        console.log(`👤 ID do Usuário (UID): ${user.uid}`);
        console.log(`📧 E-mail cadastrado: ${user.email}`);
        console.log(`🎖️ Rank de Lenda: ${profile?.rank || 'FERRO'}`);
        console.log(`💰 Otaku Points (PO): ${profile?.otakuPoints || 0}`);
        console.log(`🌟 PO Gastável: ${profile?.availablePoints || 0}`);
        console.log(`🔥 Streak Atual: ${profile?.streak || 0} dias`);
        console.log(`🖲️ Proteção Ativa: ${profile?.streakProtections || 0} penas`);
        console.log(`🚀 Multiplicador Ativo: ${profile?.poMultiplierUntil ? new Date(profile.poMultiplierUntil).toLocaleTimeString('pt-BR') : 'Sem multiplicador'}`);
        console.groupEnd();
        return 'Métricas carregadas do Firestore.';
      },

      // 4. Command: Add Points (PO)
      addPoints: async (amount: number, reason: string = 'Ação Administrativa via Console') => {
        if (!checkAdminPrivilege()) return 'Acesso bloqueado.';
        if (typeof amount !== 'number' || isNaN(amount)) return 'Erro: A quantidade de pontos deve ser um número válido.';
        
        try {
          const userRef = doc(db, 'users', user!.uid);
          await updateDoc(userRef, {
            otakuPoints: increment(amount),
            availablePoints: increment(amount),
            weeklyPoints: increment(amount)
          });
          console.log(`%c✓ [AVALON SUITE]%c Adicionados ${amount} PO com sucesso para o usuário!`, 'color: #10b981; font-weight: bold;', 'color: #94a3b8;');
          return `Sucesso: +${amount} PO.`;
        } catch (e) {
          console.error('Falha de escrita no Firestore:', e);
          return 'Erro ao tentar atualizar o banco.';
        }
      },

      // 5. Command: Force set points brute value
      setPoints: async (amount: number) => {
        if (!checkAdminPrivilege()) return 'Acesso bloqueado.';
        if (typeof amount !== 'number' || isNaN(amount)) return 'Erro numérico.';
        
        try {
          const userRef = doc(db, 'users', user!.uid);
          await updateDoc(userRef, {
            otakuPoints: amount,
            availablePoints: amount
          });
          console.log(`%c✓ [AVALON SUITE]%c Otaku Points definidos para ${amount} PO!`, 'color: #10b981; font-weight: bold;', 'color: #94a3b8;');
          return `PO definido para: ${amount}.`;
        } catch (e) {
          console.error(e);
          return 'Ocorreu um erro no update.';
        }
      },

      // 6. Command: Set Active Streak Counter
      setStreak: async (days: number) => {
        if (!checkAdminPrivilege()) return 'Acesso bloqueado.';
        if (typeof days !== 'number' || isNaN(days)) return 'Forneça um número.';
        
        try {
          const userRef = doc(db, 'users', user!.uid);
          await updateDoc(userRef, {
            streak: days
          });
          console.log(`%c🔥 [AVALON SUITE]%c Contador de Streak definido para ${days} dias de atividade!`, 'color: #10b981; font-weight: bold;', 'color: #94a3b8;');
          return `Streak de atividade alterado para ${days} dias.`;
        } catch (e) {
          console.error(e);
          return 'Falhou.';
        }
      },

      // 7. Command: Add Immortality Feather
      addProtection: async (amount: number = 1) => {
        if (!checkAdminPrivilege()) return 'Acesso bloqueado.';
        
        try {
          const userRef = doc(db, 'users', user!.uid);
          await updateDoc(userRef, {
            streakProtections: increment(amount)
          });
          console.log(`%c🪶 [AVALON SUITE]%c Concedida(s) ${amount} Pena(s) da Imortalidade!`, 'color: #10b981; font-weight: bold;', 'color: #94a3b8;');
          return `Pena adicionada: +${amount} proteções.`;
        } catch (e) {
          console.error(e);
          return 'Falhou.';
        }
      },

      // 8. Command: Award Custom High-Rarity Badge
      addBadge: async (id: string, name: string, description: string = 'Feito místico extraordinário concedido eletronicamente.', rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' = 'LEGENDARY') => {
        if (!checkAdminPrivilege()) return 'Acesso bloqueado.';
        if (!id || !name) return 'Parâmetros necessários: id e nome da badge.';
        
        try {
          const userRef = doc(db, 'users', user!.uid);
          const badgeObject = {
            id,
            name,
            description,
            category: 'BADGE',
            rarity,
            purchasedAt: new Date().toISOString()
          };
          
          await updateDoc(userRef, {
            inventory: arrayUnion(badgeObject),
            badges: arrayUnion(badgeObject) // Equip standard option right away
          });
          
          console.log(`%c👑 [AVALON SUITE]%c Emblema lendário "${name}" (ID: ${id}) concedido de forma eletrônica!`, 'color: #10b981; font-weight: bold;', 'color: #94a3b8;');
          return `Emblema equipado com sucesso.`;
        } catch (e) {
          console.error(e);
          return 'Erro.';
        }
      },

      // 9. Command: Force league rank state
      setRank: async (rank: string) => {
        if (!checkAdminPrivilege()) return 'Acesso bloqueado.';
        const upper = rank.toUpperCase();
        const validRanks = ['FERRO', 'BRONZE', 'PRATA', 'OURO', 'PLATINA', 'DIAMANTE', 'DESAFIANTE'];
        if (!validRanks.includes(upper)) return `Erro. Forneça uma dessas ligas: ${validRanks.join(', ')}`;

        try {
          const userRef = doc(db, 'users', user!.uid);
          await updateDoc(userRef, { rank: upper });
          console.log(`%c🎖️ [AVALON SUITE]%c Rank de Liga fixado em ${upper}!`, 'color: #10b981; font-weight: bold;', 'color: #94a3b8;');
          return `Rank definido como ${upper}.`;
        } catch (e) {
          console.error(e);
          return 'Falhou.';
        }
      },

      // 10. Command: Give 2x PO Multiplier
      addBoost: async (hours: number = 24) => {
        if (!checkAdminPrivilege()) return 'Acesso bloqueado.';
        if (typeof hours !== 'number' || isNaN(hours)) return 'Forneça horas em números.';

        try {
          const userRef = doc(db, 'users', user!.uid);
          const currentEnd = Date.now();
          const targetEnd = new Date(currentEnd + hours * 60 * 60 * 1000).toISOString();
          await updateDoc(userRef, {
            poMultiplierUntil: targetEnd
          });
          console.log(`%c⚡ [AVALON SUITE]%c Multiplicador PO x2 concedido por ${hours} horas!`, 'color: #10b981; font-weight: bold;', 'color: #94a3b8;');
          return `Multiplicador ativado até ${new Date(targetEnd).toLocaleString('pt-BR')}`;
        } catch (e) {
          console.error(e);
          return 'Falhou.';
        }
      },

      // 11. Clear Chest
      clearInventory: async () => {
        if (!checkAdminPrivilege()) return 'Acesso bloqueado.';
        try {
          const userRef = doc(db, 'users', user!.uid);
          await updateDoc(userRef, {
            inventory: [],
            badges: []
          });
          console.log('%c🗑️ [AVALON SUITE]%c Inventário limpo!', 'color: #10b981; font-weight: bold;', 'color: #94a3b8;');
          return 'Inventário e emblemas ativos resetados no banco de dados.';
        } catch (e) {
          console.error(e);
          return 'Falhou.';
        }
      }
    };
  }, [user, isAdmin, isSessionVerified]);

  return null;
}
