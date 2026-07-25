import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { LogIn, Github, Mail, Key, UserPlus, Loader2 } from 'lucide-react';

export default function Login() {
  const { user, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  
  if (user) {
    return <Navigate to="/" />;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Preencha email e senha');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      if (isRegister) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMsg('Credenciais inválidas');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('E-mail já está em uso');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('Senha muito fraca (mínimo 6 caracteres)');
      } else {
        setErrorMsg(err.message || 'Erro de autenticação');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <div className="max-w-md w-full bg-[var(--color-card)] p-8 md:p-12 rounded-3xl border border-[var(--color-border)] shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-12">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">Bem-vindo de volta</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Sincronize sua jornada em 2026</p>
        </div>
        
        {window !== window.parent && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 p-4 rounded-xl text-xs font-bold text-center">
            ⚠️ Usando Firefox ou Safari? <br/>
            O login com Google pode falhar devido ao bloqueio de cookies. 
            <br/><br/>
            Você pode usar o Email/Senha ou abrir este site em uma <span className="text-white">NOVA GUIA</span> usando o botão no canto superior direito.
          </div>
        )}

        <div className="space-y-4 pt-4">
          <button 
            onClick={() => loginWithGoogle()}
            className="w-full flex items-center justify-center gap-4 bg-white text-black hover:bg-gray-100 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 border border-gray-200"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Continuar com Google
          </button>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border)]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
              <span className="bg-[var(--color-card)] px-4 text-gray-500">ou com email</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}
            
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="email" 
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:border-brand transition-colors"
                />
              </div>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="password" 
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:border-brand transition-colors"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-4 bg-brand/10 text-brand hover:bg-brand/20 border border-brand/20 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isRegister ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  Criar Conta
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar
                </>
              )}
            </button>
          </form>
          
          <div className="text-center mt-4">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs font-bold text-brand hover:text-brand/80 transition-colors uppercase tracking-widest"
            >
              {isRegister ? "Já tenho uma conta. Fazer Login." : "Não tem conta? Criar uma."}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
          Ao entrar, você concorda com nossos <br/> termos de serviço
        </p>
      </div>
    </div>
  );
}
