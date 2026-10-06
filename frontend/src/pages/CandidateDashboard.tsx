import React, { useEffect, useState } from 'react';
import { PlayCircle, FileUp, Sparkles, RefreshCw, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { interviewApi } from '../services/interviewApi';
import { DashboardStats } from '../types';
import { MetricCards } from '../components/dashboard/MetricCards';
import { PerformanceRadar } from '../components/dashboard/PerformanceRadar';
import { SkillBreakdown } from '../components/dashboard/SkillBreakdown';
import { RecentInterviews } from '../components/dashboard/RecentInterviews';

interface CandidateDashboardProps {
  onNavigate: (tab: string, param?: any) => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInterviews, setRecentInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, interviewsData] = await Promise.all([
        interviewApi.getDashboardStats(),
        interviewApi.getRecentInterviews(),
      ]);
      setStats(statsData);
      setRecentInterviews(interviewsData);
    } catch (e) {
      console.error('Error loading dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const defaultStats: DashboardStats = {
    total_interviews: 0,
    completed_count: 0,
    in_progress_count: 0,
    average_score: 0,
    technical_score: 75,
    communication_score: 80,
    problem_solving_score: 72,
    confidence_score: 78,
    readiness_index: 'Ready to Practice',
    category_performance: [],
    skills: user?.profile?.skills || ["Python", "Algorithms", "System Design"],
    strongest_skills: ["Python", "Algorithms", "React", "Problem Solving"],
    weakest_skills: ["Distributed Systems", "Cloud Security"]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-brand-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Candidate Assessment Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Welcome back, {user?.full_name || 'Candidate'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Targeting: <span className="text-slate-200 font-semibold">{user?.profile?.target_role || 'Software Engineer'}</span> ({user?.profile?.experience_level || 'Fresher'}). Test your readiness with your humanoid virtual interviewer.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-3 z-10 w-full md:w-auto">
          <button
            onClick={() => onNavigate('resume')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            <FileUp className="w-4 h-4 text-brand-400" />
            <span>Upload Resume</span>
          </button>

          <button
            onClick={() => onNavigate('setup-interview')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-600/30 transition-all transform hover:-translate-y-0.5"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Launch Mock Interview</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <MetricCards stats={stats || defaultStats} />

      {/* Main Analytics Grid: Radar Chart + Skill Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <PerformanceRadar stats={stats || defaultStats} />
        </div>
        <div className="lg:col-span-6">
          <SkillBreakdown stats={stats || defaultStats} />
        </div>
      </div>

      {/* Recent Interviews Table */}
      <RecentInterviews
        interviews={recentInterviews}
        onSelectInterview={(id: number) => onNavigate('live-interview', { interviewId: id })}
        onViewReport={(id: number) => onNavigate('report', { interviewId: id })}
      />
    </div>
  );
};
