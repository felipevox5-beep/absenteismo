import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

export function LoginView({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha na autenticação');
      
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4 relative overflow-hidden tech-grid">
      {/* Background elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-green-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] bg-white border border-slate-200 rounded-3xl p-10 shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <img src="/logos/gestorprologo.png" alt="Gestor Pro" className="h-20" />
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-3 bg-rose-500/10 border border-rose-500/50 rounded-lg flex items-center gap-3 text-rose-500 text-xs font-mono"
          >
            <ShieldAlert size={16} />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Mail size={12} className="text-slate-300" />
              Email
            </label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 font-mono text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/10 transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Lock size={12} className="text-slate-300" />
              Senha
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 font-mono text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/10 transition-all placeholder:text-slate-300"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => alert('Recuperação de senha: Entre em contato com o Administrador Master para resetar sua credencial.')}
                className="text-[10px] font-mono font-bold text-slate-400 hover:text-green-500 transition-colors uppercase tracking-widest"
              >
                Esqueceu a senha?
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg mt-8"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <ShieldCheck size={20} />
                <span>ENTRAR NO SISTEMA</span>
              </>
            )}
          </button>
        </form>

      </motion.div>
    </div>
  );
}
