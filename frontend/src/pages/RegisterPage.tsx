import React, { useState } from 'react';
import { Diamond, User, Mail, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
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
      <div
        className="w-full max-w-md rounded-3xl p-8 relative overflow-hidden"
        style={{
          background: '#ffffff',
          border: '1px solid #e5e3ee',
          boxShadow: '0 10px 40px rgba(108, 92, 231, 0.08), 0 4px 12px rgba(0,0,0,0.04)',
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute -top-16 -left-16 w-44 h-44 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(108, 92, 231, 0.08)' }}
        />

        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, #6c5ce7, #818cf8)',
              boxShadow: '0 8px 24px rgba(108, 92, 231, 0.3)',
            }}
          >
            <Diamond className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: '#1a1a2e' }}>Create Account</h2>
          <p className="text-sm mt-1" style={{ color: '#9b9bae' }}>
            Get started with your AI virtual interviewer
          </p>
        </div>

        {/* Quick Demo Fill Shortcut */}
        <button
          type="button"
          onClick={handleQuickFill}
          className="w-full mb-5 py-2.5 px-3 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5"
          style={{
            background: '#f7f6fb',
            border: '1px solid #e5e3ee',
            color: '#4a4a60',
          }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
          <span>Quick Fill Demo Candidate Details</span>
        </button>

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
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9b9bae' }} />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
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
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9b9bae' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
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
                placeholder="Enter password (e.g. password123)"
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
                <span>Create Candidate Profile</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm" style={{ color: '#6b6b80' }}>
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="font-semibold hover:underline"
            style={{ color: '#6c5ce7' }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};
