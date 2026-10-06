import React from 'react';
import { CheckCircle, AlertTriangle, Layers } from 'lucide-react';
import { DashboardStats } from '../../types';

interface SkillBreakdownProps {
  stats: DashboardStats;
}

export const SkillBreakdown: React.FC<SkillBreakdownProps> = ({ stats }) => {
  const categories = stats.category_performance && stats.category_performance.length > 0
    ? stats.category_performance
    : [
        { category: 'Data Structures & Algorithms', average_score: 76, count: 2 },
        { category: 'Database Systems (DBMS)', average_score: 82, count: 1 },
        { category: 'Web Architecture & APIs', average_score: 88, count: 2 },
        { category: 'Operating Systems & Networks', average_score: 68, count: 1 },
      ];

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Skill Mastery & Domain Breakdown</span>
            </h3>
            <p className="text-xs text-slate-400">Evaluated from your resume profile and interview sessions</p>
          </div>
        </div>

        {/* Category Performance Progress Bars */}
        <div className="space-y-3.5 mb-6">
          {categories.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-300">{cat.category}</span>
                <span className="font-bold text-slate-100">{cat.average_score}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 to-emerald-400 rounded-full"
                  style={{ width: `${cat.average_score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strongest vs Weakest Skills Tags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800">
        <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-2">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Strongest Competencies</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stats.strongest_skills.map((s, i) => (
              <span key={i} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded-md text-[11px] font-medium border border-emerald-500/20">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Focus Areas / Growth Gaps</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stats.weakest_skills.map((s, i) => (
              <span key={i} className="px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded-md text-[11px] font-medium border border-amber-500/20">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
