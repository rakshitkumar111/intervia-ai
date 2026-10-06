import React from 'react';
import { User, LogOut, LayoutDashboard, FileUp, PlayCircle, Shield, UserCircle, Bot, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              UNIVERSAL<span className="text-purple-400">AI</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-md font-mono">INTERVIEWER</span>
            </span>
            <span className="text-[10px] text-slate-400 block -mt-1">Production-Grade Universal AI Interviewer</span>
          </div>
        </div>

        {/* Navigation Links */}
        {user ? (
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate('resume')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'resume'
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span>Resume Analysis</span>
            </button>

            <button
              onClick={() => onNavigate('setup-interview')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'setup-interview' || currentTab === 'live-interview'
                  ? 'bg-gradient-to-r from-brand-600 to-blue-600 text-white shadow-md shadow-brand-500/25'
                  : 'bg-brand-500/10 text-brand-400 border border-brand-500/30 hover:bg-brand-500/20'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span>Start Interview</span>
            </button>

            <button
              onClick={() => onNavigate('recruiter')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'recruiter'
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-purple-400" />
              <span>Recruiter Portal</span>
            </button>

            {user.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  currentTab === 'admin'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm'
                    : 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/30'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Panel</span>
              </button>
            )}
          </nav>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-600/25 transition-all"
            >
              Get Started Free
            </button>
          </div>
        )}

        {/* User Profile & Logout Dropdown */}
        {user && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('profile')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                currentTab === 'profile' ? 'bg-slate-800 border-slate-700' : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs">
                {user.full_name.charAt(0)}
              </div>
              <span className="text-xs font-medium text-slate-200 hidden sm:inline">{user.full_name}</span>
            </button>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
