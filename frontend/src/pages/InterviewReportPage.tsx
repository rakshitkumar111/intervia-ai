import React, { useEffect, useState } from 'react';
import { Award, Download, CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, FileText, Check, ShieldCheck, Sparkles, Briefcase, Globe, User, BookOpen } from 'lucide-react';
import { interviewApi } from '../services/interviewApi';
import { InterviewReport, InterviewSession } from '../types';
import { useAuth } from '../context/AuthContext';

interface InterviewReportPageProps {
  interviewId: number;
  onNavigate: (tab: string, param?: any) => void;
}

export const InterviewReportPage: React.FC<InterviewReportPageProps> = ({
  interviewId,
  onNavigate
}) => {
  const { user } = useAuth();
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        const [reportData, sessionData] = await Promise.all([
          interviewApi.getReport(interviewId),
          interviewApi.getInterview(interviewId)
        ]);
        setReport(reportData);
        setSession(sessionData);
      } catch (e) {
        console.error('Failed to load report:', e);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [interviewId]);

  const getVerdictBadge = (verdict: string) => {
    const v = (verdict || '').toUpperCase();
    if (v.includes('STRONG HIRE')) {
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', label: 'STRONG HIRE' };
    } else if (v.includes('HIRE')) {
      return { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/40', label: 'HIRE' };
    } else if (v.includes('CONSIDER')) {
      return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40', label: 'CONSIDER' };
    } else if (v.includes('NEEDS IMPROVEMENT')) {
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', label: 'NEEDS IMPROVEMENT' };
    } else {
      return { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40', label: 'NOT READY' };
    }
  };

  if (loading || !report) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Synthesizing Universal Evaluation Report...</p>
        <p className="text-xs text-slate-500">Evaluating Multi-Dimensional Competencies & Generating Assessment PDF</p>
      </div>
    );
  }

  // HireVue Confidentiality: Candidates are strictly restricted from viewing evaluation scores & internal rubrics
  if (user?.role === 'candidate') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Confidential Assessment Record</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Evaluation metrics, technical scores, and candidate ratings are restricted to verified recruiters and hiring managers.
          </p>
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs text-slate-300">
            Your assessment submission has been logged. The recruiter will contact you directly with your interview results.
          </div>
          <button
            onClick={() => onNavigate('landing')}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  const vBadge = getVerdictBadge(report.hiring_readiness || report.verdict);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Universal AI Interviewer Assessment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Candidate Performance & Hiring Readiness
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <span>Candidate: <b className="text-slate-200">{report.candidate_name || user?.full_name}</b></span>
            <span>•</span>
            <span>Role: <b className="text-purple-300">{report.target_role || session?.target_role}</b></span>
            <span>•</span>
            <span>Domain: <b className="text-slate-200">{report.domain || session?.domain || 'Technology'}</b></span>
            <span>•</span>
            <span>Lang: <b className="text-slate-200">{report.language || session?.language || 'English'}</b></span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {report.pdf_report_path && (
            <a
              href={report.pdf_report_path}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/25 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Report</span>
            </a>
          )}
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left: Overall Score Dial */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-center">
          <div className="relative flex items-center justify-center mb-3">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={326}
                strokeDashoffset={326 - (326 * (report.overall_score || 0)) / 100}
                strokeLinecap="round"
                className="text-purple-500 transition-all duration-1000"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-slate-100">{report.overall_score?.toFixed(0)}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">out of 100</span>
            </div>
          </div>

          <div className={`px-4 py-1.5 rounded-full border text-xs font-bold ${vBadge.bg} ${vBadge.text} ${vBadge.border} shadow-sm`}>
            {vBadge.label}
          </div>
          <span className="text-[11px] text-slate-500 mt-2">Hiring Committee Verdict</span>
        </div>

        {/* Right: Executive Summary & Details */}
        <div className="md:col-span-8 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Executive Performance Summary</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
              {report.executive_summary || 'Candidate completed all question turns with structured technical analysis.'}
            </p>
          </div>

          {/* 4 Multi-Criteria Score Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
              <p className="text-[11px] text-slate-400">Technical / Domain</p>
              <p className="text-base font-extrabold text-purple-300 mt-1">{report.technical_score?.toFixed(0)}%</p>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
              <p className="text-[11px] text-slate-400">Problem Solving</p>
              <p className="text-base font-extrabold text-blue-300 mt-1">{report.problem_solving_score?.toFixed(0)}%</p>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
              <p className="text-[11px] text-slate-400">Communication</p>
              <p className="text-base font-extrabold text-emerald-300 mt-1">{report.communication_score?.toFixed(0)}%</p>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
              <p className="text-[11px] text-slate-400">Confidence</p>
              <p className="text-base font-extrabold text-amber-300 mt-1">{report.confidence_score?.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths, Improvement & Technical Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strengths */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Key Strengths</span>
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.strengths?.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-emerald-900/30">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvement Areas */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Areas for Improvement</span>
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.weaknesses?.map((w, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-amber-900/30">
                <span className="text-amber-400 font-bold">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Technical Gaps & Recommended Topics */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>Recommended Topics</span>
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            {(report.recommended_topics || report.technical_gaps || report.skill_gaps)?.map((gap, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-purple-900/30">
                <span className="text-purple-400 font-bold">•</span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Communication Articulation Feedback */}
      {report.communication_feedback && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Communication Articulation Assessment
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {report.communication_feedback}
          </p>
        </div>
      )}

      {/* Question-by-Question Breakdown */}
      {report.question_breakdown && report.question_breakdown.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Question-by-Question Turn Breakdown</span>
          </h3>

          <div className="space-y-4">
            {report.question_breakdown.map((item, idx) => (
              <div key={idx} className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">
                      Q{idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-200">{item.question_text}</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-purple-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    {item.score?.toFixed(0)} / 100
                  </span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Candidate Answer:</p>
                  <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/50 leading-relaxed font-mono">
                    "{item.answer_text || 'No response recorded'}"
                  </p>
                </div>

                {item.feedback && (
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-purple-400 font-bold">AI Evaluation:</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.feedback}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => onNavigate('setup')}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Start Another Universal Mock Interview</span>
        </button>

        <button
          onClick={() => onNavigate('dashboard')}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
