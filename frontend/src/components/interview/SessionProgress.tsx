import React from 'react';
import { CheckCircle2, Circle, Clock, Award, Activity } from 'lucide-react';
import { InterviewQuestion } from '../../types';

interface SessionProgressProps {
  questions: InterviewQuestion[];
  currentIndex: number;
  totalDurationSeconds: number;
  mode: string;
  category: string;
  difficulty: string;
}

export const SessionProgress: React.FC<SessionProgressProps> = ({
  questions,
  currentIndex,
  totalDurationSeconds,
  mode,
  category,
  difficulty
}) => {
  const total = questions.length || 1;
  const progressPercent = Math.min(100, Math.round(((currentIndex) / total) * 100));

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-400" />
          <span>Interview Progress</span>
        </h4>
        <span className="text-xs font-semibold text-brand-400">{progressPercent}% Completed</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-brand-600 to-emerald-400 transition-all duration-500 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Questions Step Indicator */}
      <div className="flex items-center justify-between gap-1 py-1">
        {questions.map((q, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div
              key={q.id || idx}
              title={`Question ${idx + 1}: ${q.question_text.slice(0, 50)}...`}
              className={`flex-1 h-2 rounded-full transition-all ${
                isDone
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                  : isCurrent
                  ? 'bg-brand-500 animate-pulse ring-2 ring-brand-500/30'
                  : 'bg-slate-800'
              }`}
            />
          );
        })}
      </div>

      {/* Session Metadata Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mode & Domain</span>
          <span className="font-medium text-slate-200 truncate block">{mode} • {category}</span>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Difficulty</span>
          <span className="font-medium text-amber-400">{difficulty}</span>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 col-span-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            <span>Elapsed Duration:</span>
          </div>
          <span className="font-mono font-semibold text-slate-200">{formatDuration(totalDurationSeconds)}</span>
        </div>
      </div>
    </div>
  );
};
