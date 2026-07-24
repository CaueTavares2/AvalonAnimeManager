import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const { user, loginWithGoogle, loginWithEmail, registerWithEmail, sendPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('Preencha todos os campos');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      await registerWithEmail(email, password);
      setSuccessMsg('Conta criada com sucesso! Agora você pode fazer login.');
      setIsRegistering(false);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Digite seu e-mail para recuperar a senha');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await sendPasswordReset(email);
      setSuccessMsg('E-mail de recuperação enviado!');
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/user-not-found':
        return 'Usuário não encontrado. Verifique o e-mail ou crie uma conta.';
      case 'auth/wrong-password':
        return 'Senha incorreta.';
      case 'auth/email-already-in-use':
        return 'Este e-mail já está em uso. Tente fazer login.';
      case 'auth/invalid-email':
        return 'E-mail inválido.';
      case 'auth/weak-password':
        return 'A senha é muito fraca.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde.';
      case 'auth/network-request-failed':
        return 'Erro de conexão. Verifique sua internet.';
      case 'auth/operation-not-allowed':
        return 'Login por e-mail não está habilitado.';
      default:
        return 'Ocorreu um erro. Tente novamente.';
    }
  };

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

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span className="text-red-400 text-xs font-bold">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3">
                <span className="text-green-400 text-xs font-bold">{successMsg}</span>
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); setSuccessMsg(null); }}
                placeholder="E-mail"
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl px-12 py-4 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:border-brand/50 transition-colors placeholder:text-gray-600"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); setSuccessMsg(null); }}
                placeholder="Senha"
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl px-12 py-4 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:border-brand/50 transition-colors placeholder:text-gray-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {isRegistering && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); setSuccessMsg(null); }}
                  placeholder="Confirmar senha"
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl px-12 py-4 text-sm font-bold text-[var(--color-text-bright)] focus:outline-none focus:border-brand/50 transition-colors placeholder:text-gray-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-4 bg-brand text-white hover:bg-brand-dark px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Aguarde...</>
              ) : isRegistering ? (
                'Criar Conta'
              ) : (
                'Entrar com E-mail'
              )}
            </button>
          </form>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-gray-500 hover:text-brand transition-colors font-bold"
            >
              Esqueceu a senha?
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-brand hover:text-brand-light transition-colors font-bold"
            >
              {isRegistering ? 'Já tenho conta' : 'Criar conta'}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
          Ao entrar, você concorda com nossos <br /> termos de serviço
        </p>
      </div>
    </div>
  );
}