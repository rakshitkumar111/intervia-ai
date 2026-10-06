import React, { useState } from 'react';
import { Bot, Mail, Lock, ArrowRight, AlertCircle, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onNavigate: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('candidate@interviewer.ai');
  const [password, setPassword] = useState('Candidate@12345');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoRole = (role: 'candidate' | 'admin') => {
    if (role === 'candidate') {
      setEmail('candidate@interviewer.ai');
      setPassword('Candidate@12345');
    } else {
      setEmail('admin@interviewer.ai');
      setPassword('Admin@12345');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-blue-500 mx-auto flex items-center justify-center shadow-lg shadow-brand-500/30 mb-4">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-1">Sign in to your AI Virtual Interviewer account</p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="mb-6 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-slate-400">Quick Fill Demo:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDemoRole('candidate')}
              className="px-2.5 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-lg text-xs font-semibold border border-brand-500/20 transition-all flex items-center gap-1"
            >
              <User className="w-3 h-3" />
              Candidate
            </button>
            <button
              type="button"
              onClick={() => setDemoRole('admin')}
              className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-xs font-semibold border border-purple-500/20 transition-all flex items-center gap-1"
            >
              <Shield className="w-3 h-3" />
              Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-600/25 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Platform</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-brand-400 font-semibold hover:underline"
          >
            Register here
          </button>
        </div>
      </div>
    </div>
  );
};
