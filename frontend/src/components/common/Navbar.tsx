import React from 'react';
import { User, LogOut, LayoutDashboard, FileUp, PlayCircle, Shield, UserCircle, Bot, Users, Diamond, ChevronDown, Search, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b" style={{
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderColor: '#e5e3ee'
    }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
          className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #eeeafd, #d8d3f5)'
          }}>
            <Diamond className="w-5 h-5" style={{ color: '#6c5ce7' }} />
          </div>
          <span className="text-lg font-extrabold tracking-wide" style={{ color: '#1a1a2e', letterSpacing: '0.5px' }}>
            INTERVIA
          </span>
        </div>

        {/* Navigation Links */}
        {user ? (
          <nav className="hidden md:flex items-center gap-0.5 rounded-full px-1 py-1" style={{ background: '#f7f6fb' }}>
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-white/50'
              }`}
              style={{ color: currentTab === 'dashboard' ? '#1a1a2e' : '#6b6b80' }}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate('resume')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                currentTab === 'resume'
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-white/50'
              }`}
              style={{ color: currentTab === 'resume' ? '#1a1a2e' : '#6b6b80' }}
            >
              <FileUp className="w-4 h-4" />
              <span>Resume</span>
            </button>

            <button
              onClick={() => onNavigate('setup-interview')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                currentTab === 'setup-interview' || currentTab === 'live-interview'
                  ? 'text-white shadow-md'
                  : 'hover:bg-white/50'
              }`}
              style={
                currentTab === 'setup-interview' || currentTab === 'live-interview'
                  ? { background: 'linear-gradient(to right, #6c5ce7, #818cf8)', color: '#fff' }
                  : { color: '#6b6b80' }
              }
            >
              <PlayCircle className="w-4 h-4" />
              <span>Interview</span>
            </button>

            <button
              onClick={() => onNavigate('recruiter')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                currentTab === 'recruiter'
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-white/50'
              }`}
              style={{ color: currentTab === 'recruiter' ? '#6c5ce7' : '#6b6b80' }}
            >
              <Users className="w-4 h-4" />
              <span>Recruiter</span>
            </button>

            {user.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  currentTab === 'admin'
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-white/50'
                }`}
                style={{ color: currentTab === 'admin' ? '#6c5ce7' : '#6b6b80' }}
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </button>
            )}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-0.5 rounded-full px-1 py-1" style={{ background: '#f7f6fb' }}>
            <button
              onClick={() => onNavigate('landing')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                currentTab === 'landing' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
              style={{ color: currentTab === 'landing' ? '#1a1a2e' : '#6b6b80' }}
            >
              Overview
            </button>
            <button
              onClick={() => onNavigate('login')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                currentTab === 'login' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
              style={{ color: currentTab === 'login' ? '#1a1a2e' : '#6b6b80' }}
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg"
              style={{ background: 'linear-gradient(to right, #6c5ce7, #818cf8)' }}
            >
              Get Started
            </button>
          </nav>
        )}

        {/* Right side: Search + Notification + Profile */}
        <div className="flex items-center gap-3 ml-auto">
          <div
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-all hover:border-purple-400"
            style={{ borderColor: '#e5e3ee', background: '#fff' }}
          >
            <Search className="w-4 h-4" style={{ color: '#9b9bae' }} />
            <span className="text-sm" style={{ color: '#9b9bae' }}>Search</span>
          </div>

          {user && (
            <>
              <button
                onClick={() => onNavigate('profile')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all hover:border-purple-400"
                style={{
                  borderColor: '#e5e3ee',
                  background: currentTab === 'profile' ? '#f5f3ff' : '#fff',
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white"
                  style={{ background: '#6c5ce7' }}
                >
                  {user.full_name.charAt(0)}
                </div>
                <span className="text-sm font-medium hidden sm:inline" style={{ color: '#2d2d44' }}>
                  {user.full_name}
                </span>
              </button>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-full border transition-all hover:border-red-300 hover:bg-red-50"
                style={{ borderColor: '#e5e3ee', color: '#9b9bae' }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
