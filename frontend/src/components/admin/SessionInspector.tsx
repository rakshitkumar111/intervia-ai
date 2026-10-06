import React from 'react';
import { FileText, Download, UserCheck, ShieldAlert } from 'lucide-react';

interface SessionInspectorProps {
  interviews: any[];
}

export const SessionInspector: React.FC<SessionInspectorProps> = ({ interviews }) => {
  const getVerdictStyle = (v: string) => {
    if (v === 'Strong Hire') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (v === 'Hire') return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
    if (v === 'Leaning Hire') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">Live Interview Sessions Monitor</h3>
          <p className="text-xs text-slate-400">All sessions conducted across candidates</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <th className="pb-3">Candidate</th>
              <th className="pb-3">Session Mode</th>
              <th className="pb-3">Domain Category</th>
              <th className="pb-3">Difficulty</th>
              <th className="pb-3">Score</th>
              <th className="pb-3">AI Verdict</th>
              <th className="pb-3 text-right">PDF Report</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {interviews.map((i) => (
              <tr key={i.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 pr-4">
                  <div className="font-semibold text-slate-100">{i.candidate_name}</div>
                  <div className="text-[11px] text-slate-400">{i.candidate_email}</div>
                </td>
                <td className="py-3.5 pr-4 text-slate-200">{i.mode}</td>
                <td className="py-3.5 pr-4 text-slate-300">{i.category}</td>
                <td className="py-3.5 pr-4 text-amber-400 font-medium">{i.difficulty}</td>
                <td className="py-3.5 pr-4 font-mono font-bold text-slate-100">
                  {i.overall_score > 0 ? `${i.overall_score}%` : '-'}
                </td>
                <td className="py-3.5 pr-4">
                  {i.verdict && i.verdict !== 'N/A' ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getVerdictStyle(i.verdict)}`}>
                      {i.verdict}
                    </span>
                  ) : (
                    <span className="text-slate-500 italic text-[11px]">{i.status}</span>
                  )}
                </td>
                <td className="py-3.5 text-right">
                  {i.pdf_url ? (
                    <a
                      href={i.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  ) : (
                    <span className="text-slate-600 text-xs">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
