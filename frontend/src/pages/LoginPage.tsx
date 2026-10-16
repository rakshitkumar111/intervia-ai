import React, { useState } from 'react';
import { Diamond, Mail, Lock, ArrowRight, AlertCircle, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onNavigate: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <div
        className="w-full max-w-md rounded-3xl p-8 relative overflow-hidden"
        style={{
          background: '#ffffff',
          border: '1px solid #e5e3ee',
          boxShadow: '0 10px 40px rgba(108, 92, 231, 0.08), 0 4px 12px rgba(0,0,0,0.04)',
        }}
      >
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(108, 92, 231, 0.08)' }}
        />

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, #6c5ce7, #818cf8)',
              boxShadow: '0 8px 24px rgba(108, 92, 231, 0.3)',
            }}
          >
            <Diamond className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: '#1a1a2e' }}>Welcome Back</h2>
          <p className="text-sm mt-1" style={{ color: '#9b9bae' }}>
            Sign in to your AI Virtual Interviewer account
          </p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div
          className="mb-6 p-3 rounded-2xl flex items-center justify-between gap-2"
          style={{ background: '#f7f6fb', border: '1px solid #e5e3ee' }}
        >
          <span className="text-xs font-semibold" style={{ color: '#6b6b80' }}>Quick Fill Demo:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDemoRole('candidate')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
              style={{
                background: 'rgba(108, 92, 231, 0.08)',
                color: '#6c5ce7',
                border: '1px solid rgba(108, 92, 231, 0.18)',
              }}
            >
              <User className="w-3 h-3" />
              Candidate
            </button>
            <button
              type="button"
              onClick={() => setDemoRole('admin')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
              style={{
                background: 'rgba(108, 92, 231, 0.06)',
                color: '#818cf8',
                border: '1px solid rgba(129, 140, 248, 0.18)',
              }}
            >
              <Shield className="w-3 h-3" />
              Admin
            </button>
          </div>
        </div>

        {error && (
          <div
            className="mb-6 p-3.5 rounded-xl text-xs flex items-center gap-2"
            style={{
              background: 'rgba(231, 76, 76, 0.06)',
              border: '1px solid rgba(231, 76, 76, 0.15)',
              color: '#e74c4c',
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b6b80' }}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9b9bae' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm transition-all focus:outline-none"
                style={{
                  background: '#f7f6fb',
                  border: '1px solid #e5e3ee',
                  color: '#1a1a2e',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b6b80' }}>
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9b9bae' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm transition-all focus:outline-none"
                style={{
                  background: '#f7f6fb',
                  border: '1px solid #e5e3ee',
                  color: '#1a1a2e',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 text-white font-semibold text-sm rounded-xl transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(to right, #6c5ce7, #818cf8)',
              boxShadow: '0 4px 16px rgba(108, 92, 231, 0.3)',
            }}
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

        <div className="mt-6 text-center text-sm" style={{ color: '#6b6b80' }}>
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="font-semibold hover:underline"
            style={{ color: '#6c5ce7' }}
          >
            Register here
          </button>
        </div>
      </div>
    </div>
  );
};
