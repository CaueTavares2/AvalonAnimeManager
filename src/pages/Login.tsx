import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { LogIn, Github, Mail } from 'lucide-react';

export default function Login() {
  const { user, loginWithGoogle } = useAuth();
  
  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full bg-[var(--color-card)] p-12 rounded-3xl border border-[var(--color-border)] shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-12">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-[var(--color-text-bright)] uppercase tracking-tighter italic">Bem-vindo de volta</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Sincronize sua jornada em 2026</p>
        </div>

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
              <span className="bg-[var(--color-card)] px-4 text-gray-500">ou</span>
            </div>
          </div>

          <div className="space-y-4">
            <input 
              disabled
              type="email" 
              placeholder="E-mail (Em breve)"
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl px-6 py-4 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none opacity-50 cursor-not-allowed"
            />
            <button 
              disabled
              className="w-full flex items-center justify-center gap-4 bg-brand/10 text-brand border border-brand/20 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all opacity-50 cursor-not-allowed"
            >
              <Mail className="w-5 h-5" />
              Entrar com E-mail
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
