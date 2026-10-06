import React from 'react';
import { Bot, Terminal, ShieldCheck, Sparkles, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 py-10 mt-auto text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-300">AI Humanoid Virtual Interviewer</span>
            <p className="text-[11px] text-slate-500">Production-Grade B.Tech Final Year Capstone Project</p>
          </div>
        </div>

        {/* Technical Architecture Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="px-2 py-1 bg-slate-900 rounded-md border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-brand-400" />
            FastAPI + SQLAlchemy
          </span>
          <span className="px-2 py-1 bg-slate-900 rounded-md border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            LLM / Multi-Criteria NLP
          </span>
          <span className="px-2 py-1 bg-slate-900 rounded-md border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1">
            <Terminal className="w-3 h-3 text-emerald-400" />
            Web Speech STT / TTS
          </span>
          <span className="px-2 py-1 bg-slate-900 rounded-md border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            JWT & RBAC
          </span>
        </div>

        <div className="text-right">
          <p>© 2026 AI-Powered Virtual Interviewer System</p>
          <p className="text-[10px] text-slate-600">Department of Computer Science & Engineering</p>
        </div>
      </div>
    </footer>
  );
};
