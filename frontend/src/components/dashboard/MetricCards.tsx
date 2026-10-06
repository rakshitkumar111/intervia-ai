import React from 'react';
import { Award, CheckCircle, TrendingUp, Mic, Code2, Zap } from 'lucide-react';
import { DashboardStats } from '../../types';

interface MetricCardsProps {
  stats: DashboardStats;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Average Score',
      value: `${stats.average_score || 0}%`,
      subtitle: `${stats.completed_count} sessions completed`,
      icon: Award,
      color: 'from-blue-600/20 to-indigo-600/20 text-blue-400 border-blue-500/30'
    },
    {
      title: 'Technical Competency',
      value: `${stats.technical_score || 0}%`,
      subtitle: 'Architecture & problem solving',
      icon: Code2,
      color: 'from-emerald-600/20 to-teal-600/20 text-emerald-400 border-emerald-500/30'
    },
    {
      title: 'Communication & Delivery',
      value: `${stats.communication_score || 0}%`,
      subtitle: 'Clarity, structure & cadence',
      icon: Mic,
      color: 'from-purple-600/20 to-pink-600/20 text-purple-400 border-purple-500/30'
    },
    {
      title: 'Hiring Readiness',
      value: stats.readiness_index || 'Developing',
      subtitle: 'AI composite assessment',
      icon: Zap,
      color: 'from-amber-600/20 to-orange-600/20 text-amber-400 border-amber-500/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-slate-700"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{c.title}</span>
              <div className={`p-2 rounded-xl bg-gradient-to-br ${c.color} border`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-extrabold text-slate-100">{c.value}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{c.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
};
