import React from 'react';
import { Bot, Terminal, ShieldCheck, Sparkles, Cpu, Diamond } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      className="w-full py-10 mt-auto text-xs border-t"
      style={{ background: '#fff', borderColor: '#e5e3ee', color: '#6b6b80' }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #eeeafd, #d8d3f5)' }}
          >
            <Diamond className="w-4 h-4" style={{ color: '#6c5ce7' }} />
          </div>
          <div>
            <span className="font-bold text-sm" style={{ color: '#1a1a2e' }}>
              Intervia – AI Humanoid Virtual Interviewer
            </span>
            <p className="text-[11px]" style={{ color: '#9b9bae' }}>
              Production-Grade B.Tech Final Year Capstone Project
            </p>
          </div>
        </div>

        {/* Technical Architecture Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { icon: <Cpu className="w-3 h-3" style={{ color: '#6c5ce7' }} />, label: 'FastAPI + SQLAlchemy' },
            { icon: <Sparkles className="w-3 h-3" style={{ color: '#6c5ce7' }} />, label: 'LLM / Multi-Criteria NLP' },
            { icon: <Terminal className="w-3 h-3" style={{ color: '#22c55e' }} />, label: 'Web Speech STT / TTS' },
            { icon: <ShieldCheck className="w-3 h-3" style={{ color: '#818cf8' }} />, label: 'JWT & RBAC' },
          ].map((badge, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-full text-[10px] flex items-center gap-1.5 border"
              style={{ background: '#f7f6fb', borderColor: '#e5e3ee', color: '#4a4a60' }}
            >
              {badge.icon}
              {badge.label}
            </span>
          ))}
        </div>

        <div className="text-right">
          <p style={{ color: '#6b6b80' }}>© 2026 AI-Powered Virtual Interviewer System</p>
          <p className="text-[10px]" style={{ color: '#9b9bae' }}>
            Department of Computer Science & Engineering
          </p>
        </div>
      </div>
    </footer>
  );
};
