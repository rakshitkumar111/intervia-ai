import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'recharts';
import { DashboardStats } from '../../types';

interface PerformanceRadarProps {
  stats: DashboardStats;
}

export const PerformanceRadar: React.FC<PerformanceRadarProps> = ({ stats }) => {
  const data = [
    { dimension: 'Relevance', score: Math.min(100, Math.max(30, (stats.average_score || 75) * 1.02)) },
    { dimension: 'Technical Depth', score: stats.technical_score || 72 },
    { dimension: 'Correctness', score: Math.min(100, Math.max(30, (stats.average_score || 75) * 0.98)) },
    { dimension: 'Clarity', score: stats.communication_score || 78 },
    { dimension: 'Completeness', score: stats.problem_solving_score || 70 },
    { dimension: 'Confidence', score: stats.confidence_score || 75 }
  ];

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between h-full">
      <div className="mb-2">
        <h3 className="text-base font-bold text-slate-100">Performance Radar</h3>
        <p className="text-xs text-slate-400">6-Dimensional AI competency evaluation matrix</p>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="75%">
            <PolarGrid stroke="#334155" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 9 }}
              stroke="#1e293b"
            />
            <Radar
              name="Competency Score"
              dataKey="score"
              stroke="#0284c7"
              fill="#0284c7"
              fillOpacity={0.4}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#f8fafc',
                fontSize: '12px'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center text-xs">
        <div>
          <span className="text-slate-400 text-[10px] block">Technical</span>
          <span className="font-bold text-slate-200">{stats.technical_score || 72}%</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block">Communication</span>
          <span className="font-bold text-slate-200">{stats.communication_score || 78}%</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block">Problem Solving</span>
          <span className="font-bold text-slate-200">{stats.problem_solving_score || 70}%</span>
        </div>
      </div>
    </div>
  );
};
