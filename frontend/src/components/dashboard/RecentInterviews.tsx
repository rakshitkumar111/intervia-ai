import React from 'react';
import { Play, FileText, ChevronRight, Clock, Award } from 'lucide-react';

interface RecentInterviewsProps {
  interviews: any[];
  onSelectInterview: (id: number) => void;
  onViewReport: (id: number) => void;
}

export const RecentInterviews: React.FC<RecentInterviewsProps> = ({
  interviews,
  onSelectInterview,
  onViewReport
}) => {
  if (!interviews || interviews.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center">
        <p className="text-slate-400 text-sm mb-2">No interviews conducted yet.</p>
        <p className="text-xs text-slate-500">Upload your resume and start your first AI mock interview session!</p>
      </div>
    );
  }

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'Strong Hire':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Hire':
        return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
      case 'Leaning Hire':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Needs Improvement':
      case 'Reject':
      default:
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">Recent Interview Sessions</h3>
          <p className="text-xs text-slate-400">Track and review previous performance reports</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <th className="pb-3">Session Title & Role</th>
              <th className="pb-3">Mode / Difficulty</th>
              <th className="pb-3">Score</th>
              <th className="pb-3">AI Verdict</th>
              <th className="pb-3">Date</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {interviews.map((item) => {
              const isCompleted = item.status === 'completed';
              return (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 pr-4">
                    <div className="font-semibold text-slate-100">{item.title}</div>
                    <div className="text-[11px] text-slate-400">{item.target_role}</div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="text-slate-300">{item.mode}</span>
                    <span className="text-slate-500 ml-1">({item.difficulty})</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    {isCompleted ? (
                      <span className="font-bold text-slate-100 font-mono text-sm">{item.overall_score}%</span>
                    ) : (
                      <span className="text-slate-500 italic">{item.status}</span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4">
                    {item.verdict ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getVerdictBadge(item.verdict)}`}>
                        {item.verdict}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-slate-400 text-[11px]">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3.5 text-right space-x-2">
                    {isCompleted ? (
                      <button
                        onClick={() => onViewReport(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Report</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectInterview(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Resume</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
