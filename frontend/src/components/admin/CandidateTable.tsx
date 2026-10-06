import React from 'react';
import { User, Mail, Award, CheckCircle2, XCircle } from 'lucide-react';

interface CandidateTableProps {
  candidates: any[];
}

export const CandidateTable: React.FC<CandidateTableProps> = ({ candidates }) => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">Registered Candidates Directory</h3>
          <p className="text-xs text-slate-400">Manage candidate accounts and track individual performance</p>
        </div>
        <span className="px-3 py-1 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full text-xs font-semibold">
          {candidates.length} Registered
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <th className="pb-3">Candidate</th>
              <th className="pb-3">Target Role</th>
              <th className="pb-3">Experience</th>
              <th className="pb-3">Interviews</th>
              <th className="pb-3">Avg Score</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {candidates.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs">
                      {c.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-100">{c.full_name}</div>
                      <div className="text-[11px] text-slate-400">{c.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 pr-4 text-slate-200 font-medium">{c.target_role}</td>
                <td className="py-3.5 pr-4 text-slate-400">{c.experience_level}</td>
                <td className="py-3.5 pr-4 text-slate-200 font-semibold">{c.interviews_count}</td>
                <td className="py-3.5 pr-4">
                  <span className="font-mono font-bold text-brand-400">{c.average_score}%</span>
                </td>
                <td className="py-3.5 pr-4">
                  {c.is_active ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-rose-400">
                      <XCircle className="w-3.5 h-3.5" />
                      Disabled
                    </span>
                  )}
                </td>
                <td className="py-3.5 text-slate-400 text-[11px]">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
