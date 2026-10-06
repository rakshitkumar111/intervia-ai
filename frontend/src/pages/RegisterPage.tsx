import React, { useState } from 'react';
import { Bot, User, Mail, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RegisterPageProps {
  onNavigate: (tab: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuickFill = () => {
    const randomId = Math.floor(Math.random() * 900) + 100;
    setFullName('Rahul Sharma');
    setEmail(`candidate${randomId}@interviewer.ai`);
    setPassword('password123');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(fullName, email, password);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-blue-500 mx-auto flex items-center justify-center shadow-lg shadow-brand-500/30 mb-4">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Create Account</h2>
          <p className="text-xs text-slate-400 mt-1">Get started with your AI virtual interviewer</p>
        </div>

        {/* Quick Demo Fill Shortcut */}
        <button
          type="button"
          onClick={handleQuickFill}
          className="w-full mb-5 py-2 px-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-300 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Fill Demo Candidate Details</span>
        </button>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>

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
                placeholder="rahul@example.com"
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
                placeholder="Enter password (e.g. password123)"
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
                <span>Create Candidate Profile</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-brand-400 font-semibold hover:underline"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};
