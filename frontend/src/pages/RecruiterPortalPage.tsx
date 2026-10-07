import React, { useState, useEffect } from 'react';
import {
  Users,
  Send,
  Trophy,
  Play,
  Copy,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Award,
  ChevronRight,
  ExternalLink,
  Search,
  Sparkles,
  FileText,
  Mic,
  Activity,
  X,
  Mail,
  MessageSquare,
  Phone,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  recruiterApi,
  InterviewInviteResponse,
  CandidateLeaderboardItem,
  CandidateSessionReplayResponse,
  InterviewInviteCreate
} from '../services/recruiterApi';

interface RecruiterPortalPageProps {
  onNavigate?: (tab: string, params?: any) => void;
}

export const RecruiterPortalPage: React.FC<RecruiterPortalPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'invites'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<CandidateLeaderboardItem[]>([]);
  const [invites, setInvites] = useState<InterviewInviteResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Invite Form State
  const [form, setForm] = useState<InterviewInviteCreate>({
    candidate_name: '',
    candidate_email: '',
    candidate_phone: '',
    target_role: 'Full Stack Engineer',
    domain: 'Technology',
    experience_level: 'Mid-Level',
    mode: 'Technical',
    difficulty: 'Medium',
    language: 'English',
    total_questions: 5,
    expires_in_days: 7,
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [latestCreatedInvite, setLatestCreatedInvite] = useState<InterviewInviteResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Email & WhatsApp Action State
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null);
  const [emailFeedback, setEmailFeedback] = useState<{ id: number; message: string; isError: boolean } | null>(null);

  // Replay Modal State
  const [selectedReplayId, setSelectedReplayId] = useState<number | null>(null);
  const [replayData, setReplayData] = useState<CandidateSessionReplayResponse | null>(null);
  const [isLoadingReplay, setIsLoadingReplay] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'leaderboard') {
        const lb = await recruiterApi.getLeaderboard();
        setLeaderboard(lb);
      } else {
        const inv = await recruiterApi.getInvites();
        setInvites(inv);
      }
    } catch (err) {
      console.error('Failed to load recruiter portal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.candidate_name || !form.candidate_email || !form.target_role) return;

    setIsSubmitting(true);
    setEmailFeedback(null);
    try {
      const res = await recruiterApi.createInvite(form);
      const fullUrl = res.candidate_url || `${window.location.origin}/interview/${res.invite_token}`;
      setGeneratedLink(fullUrl);
      setLatestCreatedInvite(res);

      // Refresh invites list
      const inv = await recruiterApi.getInvites();
      setInvites(inv);

      // Reset basic form fields
      setForm((prev) => ({
        ...prev,
        candidate_name: '',
        candidate_email: '',
        candidate_phone: '',
      }));
    } catch (err) {
      alert(`Error creating invite: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async (inviteId: number) => {
    setSendingEmailId(inviteId);
    setEmailFeedback(null);
    try {
      const res = await recruiterApi.sendInviteEmail(inviteId);
      if (res.success) {
        setInvites((prev) =>
          prev.map((i) => (i.id === inviteId ? { ...i, email_status: 'sent' } : i))
        );
        setEmailFeedback({ id: inviteId, message: 'Invitation email sent successfully!', isError: false });
      } else {
        setInvites((prev) =>
          prev.map((i) => (i.id === inviteId ? { ...i, email_status: 'failed' } : i))
        );
        setEmailFeedback({
          id: inviteId,
          message: res.error || 'Failed to dispatch email. Check SMTP credentials in backend/.env',
          isError: true
        });
      }
    } catch (err: any) {
      setInvites((prev) =>
        prev.map((i) => (i.id === inviteId ? { ...i, email_status: 'failed' } : i))
      );
      setEmailFeedback({
        id: inviteId,
        message: err?.message || 'SMTP delivery failed. Check backend SMTP configuration in .env',
        isError: true,
      });
    } finally {
      setSendingEmailId(null);
    }
  };

  const openWhatsApp = async (inv: InterviewInviteResponse) => {
    const fullUrl = inv.candidate_url || `${window.location.origin}/interview/${inv.invite_token}`;
    const expiry = new Date(inv.expires_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const messageText = `Hello ${inv.candidate_name},

You have been invited to complete an AI interview for the ${inv.target_role} position.

Interview: ${inv.mode}
Difficulty: ${inv.difficulty}
Questions: ${inv.total_questions}
Expires: ${expiry}

Start your interview:
${fullUrl}

Good luck!`;

    const encoded = encodeURIComponent(messageText);
    const rawPhone = (inv.candidate_phone || '').replace(/[^0-9]/g, '');
    const waUrl = rawPhone
      ? `https://wa.me/${rawPhone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');

    try {
      await recruiterApi.markWhatsAppSent(inv.id);
      setInvites((prev) =>
        prev.map((i) => (i.id === inv.id ? { ...i, whatsapp_status: 'sent' } : i))
      );
    } catch (e) {
      console.warn('Failed to record WhatsApp dispatch:', e);
    }
  };

  const openReplayModal = async (interviewId: number) => {
    setSelectedReplayId(interviewId);
    setIsLoadingReplay(true);
    try {
      const data = await recruiterApi.getSessionReplay(interviewId);
      setReplayData(data);
    } catch (err) {
      alert(`Failed to load replay: ${err instanceof Error ? err.message : String(err)}`);
      setSelectedReplayId(null);
    } finally {
      setIsLoadingReplay(false);
    }
  };

  const filteredLeaderboard = leaderboard.filter(
    (item) =>
      item.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.target_role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.verdict.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgScore =
    leaderboard.length > 0
      ? Math.round(leaderboard.reduce((acc, c) => acc + c.overall_score, 0) / leaderboard.length)
      : 0;

  const hireRate =
    leaderboard.length > 0
      ? Math.round(
          (leaderboard.filter((c) => c.verdict.toLowerCase().includes('hire')).length /
            leaderboard.length) *
            100
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> TALENT OPERATIONS
              </span>
              <span className="text-xs text-slate-500">Universal AI Evaluation</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white mt-1 tracking-tight">
              Recruiter & Talent Portal
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Distribute expirable assessment links, review verified score leaderboards, and audit candidate speech telemetry.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Leaderboard & Ranking</span>
            </button>
            <button
              onClick={() => setActiveTab('invites')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'invites'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Invite Candidates</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-400 font-medium">Evaluated Candidates</span>
                <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-2">
                  {leaderboard.length}
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-400 font-medium">Average Cohort Score</span>
                <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-2">
                  {avgScore}/100
                  <Award className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-400 font-medium">Strong Hire / Hire Rate</span>
                <div className="text-2xl font-black text-emerald-400 mt-1 flex items-baseline gap-2">
                  {hireRate}%
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-400 font-medium">Proctoring Trust Avg</span>
                <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-2">
                  96.4%
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Filter and Search */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name, role, or verdict..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                onClick={() => setActiveTab('invites')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-purple-600/25 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Invite New Candidate</span>
              </button>
            </div>

            {/* Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Candidate & Role</th>
                      <th className="py-3 px-4">Domain / Exp</th>
                      <th className="py-3 px-4 text-center">Overall Score</th>
                      <th className="py-3 px-4 text-center">Tech / Comm</th>
                      <th className="py-3 px-4 text-center">Integrity Trust</th>
                      <th className="py-3 px-4 text-center">Verdict</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          Loading candidate performance data...
                        </td>
                      </tr>
                    ) : filteredLeaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          No candidates found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredLeaderboard.map((cand, index) => {
                        const isTop = index === 0;
                        const verdictColor = cand.verdict.toLowerCase().includes('strong')
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : cand.verdict.toLowerCase().includes('hire')
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30';

                        return (
                          <tr key={cand.interview_id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-300">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-mono ${
                                  isTop
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                #{index + 1}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-white">{cand.candidate_name}</div>
                              <div className="text-[11px] text-purple-400">{cand.target_role}</div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">
                              <div>{cand.domain}</div>
                              <span className="text-[10px] text-slate-500">{cand.experience_level}</span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 font-mono font-bold text-white">
                                {cand.overall_score}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                              {cand.technical_score} / {cand.communication_score}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-mono">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                {cand.integrity_score}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${verdictColor}`}>
                                {cand.verdict}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openReplayModal(cand.interview_id)}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors"
                                >
                                  <Play className="w-3 h-3 text-purple-400" />
                                  <span>Audit Replay</span>
                                </button>
                                {onNavigate && (
                                  <button
                                    onClick={() => onNavigate('report', { interviewId: cand.interview_id })}
                                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                                    title="Open Full Evaluation Report"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Invites */}
        {activeTab === 'invites' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Invite Form */}
            <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-purple-400" />
                  Generate Assessment Link
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Candidate receives a zero-login tokenized interview link with automated expiry.
                </p>
              </div>

              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Candidate Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Verma"
                    value={form.candidate_name}
                    onChange={(e) => setForm({ ...form, candidate_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Candidate Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul.verma@example.com"
                    value={form.candidate_email}
                    onChange={(e) => setForm({ ...form, candidate_email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Candidate Phone / WhatsApp (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={form.candidate_phone || ''}
                      onChange={(e) => setForm({ ...form, candidate_phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Target Role
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Backend Go Developer"
                    value={form.target_role}
                    onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Mode
                    </label>
                    <select
                      value={form.mode}
                      onChange={(e) => setForm({ ...form, mode: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Coding">Live Coding</option>
                      <option value="HR">HR / Culture</option>
                      <option value="Case Study">System Design</option>
                      <option value="Behavioral">Behavioral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Difficulty
                    </label>
                    <select
                      value={form.difficulty}
                      onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Medium">Medium</option>
                      <option value="Easy">Easy</option>
                      <option value="Hard">Hard</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Questions Count
                    </label>
                    <select
                      value={form.total_questions}
                      onChange={(e) => setForm({ ...form, total_questions: parseInt(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value={3}>3 Questions (Express)</option>
                      <option value={5}>5 Questions (Standard)</option>
                      <option value={10}>10 Questions (Comprehensive)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Expires In
                    </label>
                    <select
                      value={form.expires_in_days}
                      onChange={(e) => setForm({ ...form, expires_in_days: parseInt(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value={3}>3 Days</option>
                      <option value={7}>7 Days</option>
                      <option value={14}>14 Days</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Generating...' : 'Create Invite Link'}</span>
                </button>
              </form>

              {/* Generated Link Box */}
              {generatedLink && latestCreatedInvite && (
                <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded-xl space-y-3">
                  <div className="text-[11px] text-purple-300 font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Candidate Invitation Link Ready!
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Zero login required
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="w-full bg-transparent text-[11px] text-slate-300 focus:outline-none font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedLink)}
                      className="p-1.5 hover:bg-slate-800 text-purple-400 hover:text-white rounded transition-colors"
                      title="Copy Link"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a
                      href={generatedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                      title="Open / Test Link in New Tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Immediate Dispatch Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => openWhatsApp(latestCreatedInvite)}
                      className="py-1.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      title="Share invitation via WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendEmail(latestCreatedInvite.id)}
                      disabled={sendingEmailId === latestCreatedInvite.id}
                      className="py-1.5 px-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      title="Send invitation via SMTP Email"
                    >
                      {sendingEmailId === latestCreatedInvite.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      ) : (
                        <Mail className="w-3.5 h-3.5 text-purple-400" />
                      )}
                      <span>Send Email</span>
                    </button>
                  </div>

                  {emailFeedback && emailFeedback.id === latestCreatedInvite.id && (
                    <div
                      className={`text-[11px] p-2 rounded-lg border flex items-center gap-2 ${
                        emailFeedback.isError
                          ? 'bg-rose-950/40 text-rose-300 border-rose-800'
                          : 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                      }`}
                    >
                      {emailFeedback.isError ? (
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                      )}
                      <span>{emailFeedback.message}</span>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400">
                    Candidate can directly launch the assessment from desktop or mobile browser.
                  </p>
                </div>
              )}
            </div>

            {/* Invites List */}
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Active & Past Interview Invites
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Candidate</th>
                      <th className="py-2.5 px-3">Target Role & Score</th>
                      <th className="py-2.5 px-3">Status & Delivery</th>
                      <th className="py-2.5 px-3">Dates</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {invites.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No interview invites created yet. Use form on left to create one.
                        </td>
                      </tr>
                    ) : (
                      invites.map((inv) => {
                        const statusColors: Record<string, string> = {
                          pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                          in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                          completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                          expired: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                        };

                        const link = inv.candidate_url || `${window.location.origin}/interview/${inv.invite_token}`;

                        return (
                          <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                            {/* Candidate Info */}
                            <td className="py-3 px-3">
                              <div className="font-semibold text-white">{inv.candidate_name}</div>
                              <div className="text-[11px] text-slate-400">{inv.candidate_email}</div>
                              {inv.candidate_phone && (
                                <div className="text-[10px] text-emerald-400/90 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>{inv.candidate_phone}</span>
                                </div>
                              )}
                            </td>

                            {/* Target Role & Score */}
                            <td className="py-3 px-3">
                              <div className="text-purple-300 font-medium">{inv.target_role}</div>
                              <div className="text-[10px] text-slate-500">
                                {inv.difficulty} • {inv.mode} • {inv.total_questions}Q
                              </div>
                              {inv.overall_score !== null && inv.overall_score !== undefined && (
                                <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                  <Award className="w-2.5 h-2.5" />
                                  <span>{inv.overall_score.toFixed(1)}% Score</span>
                                </div>
                              )}
                            </td>

                            {/* Status & Delivery Indicators */}
                            <td className="py-3 px-3 space-y-1.5">
                              <div>
                                <span
                                  className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                                    statusColors[inv.status] || 'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}
                                >
                                  {inv.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>

                              {/* Delivery Badges */}
                              <div className="flex flex-wrap gap-1">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium border flex items-center gap-1 ${
                                    inv.email_status === 'sent'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : inv.email_status === 'failed'
                                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                      : 'bg-slate-800/80 text-slate-400 border-slate-700'
                                  }`}
                                  title={`Email delivery: ${inv.email_status || 'not_sent'}`}
                                >
                                  <Mail className="w-2.5 h-2.5" />
                                  <span>
                                    {inv.email_status === 'sent'
                                      ? 'Email Sent'
                                      : inv.email_status === 'failed'
                                      ? 'Email Failed'
                                      : 'Email Pending'}
                                  </span>
                                </span>

                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium border flex items-center gap-1 ${
                                    inv.whatsapp_status === 'sent'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : 'bg-slate-800/80 text-slate-400 border-slate-700'
                                  }`}
                                  title={`WhatsApp share: ${inv.whatsapp_status || 'not_sent'}`}
                                >
                                  <MessageSquare className="w-2.5 h-2.5" />
                                  <span>
                                    {inv.whatsapp_status === 'sent' ? 'WA Sent' : 'WA Pending'}
                                  </span>
                                </span>
                              </div>
                            </td>

                            {/* Dates */}
                            <td className="py-3 px-3 text-[11px] text-slate-400">
                              <div>Expires: {new Date(inv.expires_at).toLocaleDateString()}</div>
                              <div className="text-[10px] text-slate-500">
                                Created: {new Date(inv.created_at).toLocaleDateString()}
                              </div>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end flex-wrap gap-1">
                                {/* Send Email Button */}
                                <button
                                  onClick={() => handleSendEmail(inv.id)}
                                  disabled={sendingEmailId === inv.id}
                                  className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 rounded text-[11px] font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                                  title="Dispatch Invitation Email via SMTP"
                                >
                                  {sendingEmailId === inv.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                                  ) : (
                                    <Mail className="w-3 h-3 text-purple-400" />
                                  )}
                                  <span>Email</span>
                                </button>

                                {/* WhatsApp Button */}
                                <button
                                  onClick={() => openWhatsApp(inv)}
                                  className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                                  title="Open WhatsApp with pre-filled invitation"
                                >
                                  <MessageSquare className="w-3 h-3 text-emerald-400" />
                                  <span>WhatsApp</span>
                                </button>

                                {/* Copy Link */}
                                <button
                                  onClick={() => copyToClipboard(link)}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                                  title="Copy Candidate Interview Link"
                                >
                                  <Copy className="w-3 h-3 text-purple-400" />
                                  <span>Copy</span>
                                </button>

                                {/* Open/Test Link in New Tab */}
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                                  title="Open / Test Link in New Tab"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>

                                {/* View Report Button */}
                                {inv.status === 'completed' && inv.interview_id && (
                                  <button
                                    onClick={() => onNavigate?.('report', { interviewId: inv.interview_id })}
                                    className="px-2 py-1 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                                    title="View Candidate Assessment Report"
                                  >
                                    <FileText className="w-3 h-3 text-indigo-400" />
                                    <span>Report</span>
                                  </button>
                                )}

                                {/* Audit Replay Button */}
                                {inv.interview_id && (
                                  <button
                                    onClick={() => openReplayModal(inv.interview_id!)}
                                    className="p-1 hover:bg-slate-800 text-purple-400 hover:text-white rounded transition-colors"
                                    title="Audit Candidate Session Replay"
                                  >
                                    <Play className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Audit Session Replay Modal */}
        {selectedReplayId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full">
                      REPLAY AUDIT
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      {replayData ? replayData.candidate_name : 'Loading Candidate'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Target Role: {replayData?.target_role} | Composite Score: {replayData?.overall_score}% | Verdict: {replayData?.verdict}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReplayId(null)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoadingReplay ? (
                  <div className="py-16 text-center text-slate-500">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    Loading session replay & telemetry...
                  </div>
                ) : !replayData || replayData.answers.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    No answered questions recorded for this session yet.
                  </div>
                ) : (
                  replayData.answers.map((ans, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3"
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-xs font-bold text-purple-400">
                          Q{ans.question_number}: {ans.question_text}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-800 text-white rounded text-[11px] font-mono font-bold">
                            Score: {ans.score}/100
                          </span>
                          <span className="px-2 py-0.5 bg-purple-950/60 text-purple-300 border border-purple-500/30 rounded text-[10px] font-mono">
                            Tech: {ans.technical_score}/10
                          </span>
                        </div>
                      </div>

                      {/* Candidate Answer Transcript */}
                      <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800 text-xs text-slate-200 font-sans leading-relaxed">
                        <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                          <Mic className="w-3 h-3 text-purple-400" />
                          Candidate Transcript:
                        </div>
                        "{ans.candidate_answer}"
                      </div>

                      {/* Speech Telemetry HUD */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                          <Activity className="w-3.5 h-3.5 text-blue-400" />
                          <span>Pace:</span>
                          <strong className="text-white font-mono">{ans.speaking_pace_wpm || 0} WPM</strong>
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                          <span>Filler Words:</span>
                          <strong className="text-amber-400 font-mono">{ans.filler_word_count || 0}</strong>
                        </div>

                        <div className="flex-1 text-right text-[11px] text-slate-400">
                          <strong>AI Feedback:</strong> {ans.feedback}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Integrity Events Flagged: {replayData?.integrity_events_count || 0}</span>
                </div>
                <button
                  onClick={() => setSelectedReplayId(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Close Replay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
