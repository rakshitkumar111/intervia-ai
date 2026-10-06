import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Award,
  PlayCircle,
  Terminal,
  Settings,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Activity,
  AlertTriangle,
  UserPlus,
  Trash2,
  Zap,
  Lock,
  Unlock,
  Search,
  Filter,
  Eye,
  FileText,
  Clock,
  Sparkles,
  Server,
  Code2,
  X,
  Play
} from 'lucide-react';
import { interviewApi } from '../services/interviewApi';
import { recruiterApi } from '../services/recruiterApi';
import { AdminStats } from '../types';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [integrityMetrics, setIntegrityMetrics] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'sessions' | 'security' | 'health' | 'logs'>('overview');

  // Search & Filter
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sessionSearch, setSessionSearch] = useState('');

  // AI Ping Test State
  const [isPingingAi, setIsPingingAi] = useState(false);
  const [aiPingResult, setAiPingResult] = useState<any>(null);

  // Create User Modal State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'candidate',
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Session Replay Audit Modal
  const [replayInterviewId, setReplayInterviewId] = useState<number | null>(null);
  const [replayData, setReplayData] = useState<any>(null);
  const [isLoadingReplay, setIsLoadingReplay] = useState(false);

  const fetchAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, candData, intData, logsData, healthData, integrityData] = await Promise.all([
        interviewApi.getAdminStats(),
        interviewApi.getAdminCandidates(),
        interviewApi.getAdminInterviews(),
        interviewApi.getAdminLogs(),
        interviewApi.getAdminHealth(),
        interviewApi.getAdminIntegrityMetrics(),
      ]);
      setStats(statsData);
      setCandidates(candData);
      setInterviews(intData);
      setLogs(logsData);
      setHealth(healthData);
      setIntegrityMetrics(integrityData);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  const handlePingAi = async () => {
    setIsPingingAi(true);
    try {
      const res = await interviewApi.testAiEngine();
      setAiPingResult(res);
    } catch (e: any) {
      setAiPingResult({ success: false, error: e?.message || 'AI Ping failed' });
    } finally {
      setIsPingingAi(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.email || !newUserForm.password || !newUserForm.full_name) return;

    setIsCreatingUser(true);
    try {
      await interviewApi.createAdminUser(newUserForm);
      setShowCreateUserModal(false);
      setNewUserForm({ full_name: '', email: '', password: '', role: 'candidate' });
      // Refresh candidates list
      const updated = await interviewApi.getAdminCandidates();
      setCandidates(updated);
      alert('User created successfully!');
    } catch (e: any) {
      alert(`Error creating user: ${e?.message || String(e)}`);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await interviewApi.updateUserStatus(userId, !currentStatus);
      setCandidates((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
      );
    } catch (e: any) {
      alert(`Error updating user status: ${e?.message || String(e)}`);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await interviewApi.updateUserRole(userId, newRole);
      setCandidates((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (e: any) {
      alert(`Error updating role: ${e?.message || String(e)}`);
    }
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    if (!window.confirm(`Permanently delete user account for ${email}? This action cannot be undone.`)) return;

    try {
      await interviewApi.deleteUser(userId);
      setCandidates((prev) => prev.filter((u) => u.id !== userId));
    } catch (e: any) {
      alert(`Error deleting user: ${e?.message || String(e)}`);
    }
  };

  const handleDeleteInterview = async (interviewId: number) => {
    if (!window.confirm(`Permanently delete interview session #${interviewId}?`)) return;

    try {
      await interviewApi.deleteInterview(interviewId);
      setInterviews((prev) => prev.filter((i) => i.id !== interviewId));
    } catch (e: any) {
      alert(`Error deleting interview: ${e?.message || String(e)}`);
    }
  };

  const handleOpenReplay = async (interviewId: number) => {
    setReplayInterviewId(interviewId);
    setIsLoadingReplay(true);
    try {
      const data = await recruiterApi.getSessionReplay(interviewId);
      setReplayData(data);
    } catch (e: any) {
      alert(`Error loading replay: ${e?.message || String(e)}`);
      setReplayInterviewId(null);
    } finally {
      setIsLoadingReplay(false);
    }
  };

  const filteredUsers = candidates.filter((u) => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredInterviews = interviews.filter((i) => {
    return (
      i.candidate_name?.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      i.target_role?.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      i.mode?.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      i.status?.toLowerCase().includes(sessionSearch.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-white">Loading Administrator Command Center...</h2>
        <p className="text-xs text-slate-400 mt-1">Aggregating system telemetry, candidate directory, and AI runtime health.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header & Quick Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>SYSTEM GOVERNANCE & TELEMETRY</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Administrator Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Live monitoring of Gemini 3.5 LLM, Code Sandbox, Anti-cheating proctoring, and user identity management.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePingAi}
              disabled={isPingingAi}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-semibold shadow transition-all"
            >
              <Zap className={`w-3.5 h-3.5 ${isPingingAi ? 'animate-spin text-purple-400' : 'text-purple-400'}`} />
              <span>{isPingingAi ? 'Pinging AI...' : 'Ping Gemini LLM'}</span>
            </button>

            <button
              onClick={fetchAllAdminData}
              className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>

        {/* Live Infrastructure Pulse Bar */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400">Gemini LLM:</span>
            <strong className="text-white font-mono">{health?.gemini_model || 'gemini-3.5-flash'}</strong>
            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold">
              {health?.ai_status || 'ONLINE'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Avatar WebRTC:</span>
            <strong className="text-white">Active Stream Ready</strong>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Code Sandbox:</span>
            <strong className="text-white font-mono">Python / JS / SQL</strong>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Database:</span>
            <strong className="text-white font-mono">SQLite Relational</strong>
          </div>

          {aiPingResult && (
            <div className="w-full pt-2 border-t border-slate-800/80 text-[11px] flex items-center justify-between text-purple-300">
              <span>
                <strong>Latency Benchmark:</strong> {aiPingResult.latency_ms} ms ({aiPingResult.provider})
              </span>
              <span className="text-slate-400 truncate max-w-md">
                Sample Question: "{aiPingResult.sample_question?.slice(0, 60)}..."
              </span>
            </div>
          )}
        </div>

        {/* 4 Hero KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Platform Users</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2 font-mono">{stats?.total_users || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Candidates, Recruiters & Admins</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Interview Sessions</span>
              <PlayCircle className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-black text-blue-400 mt-2 font-mono">{stats?.total_interviews || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Total initiated assessments</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Avg Candidate Score</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">{stats?.average_score || 0}%</div>
            <p className="text-[11px] text-slate-500 mt-1">Normalized 8-dimensional benchmark</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Proctoring Trust Avg</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-400 mt-2 font-mono">
              {integrityMetrics?.average_integrity_score || 96.5}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Flagged sessions: <strong className="text-rose-400">{integrityMetrics?.flagged_sessions_count || 0}</strong>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            System Command
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            User & Identity Governance ({candidates.length})
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'sessions'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Session Audit & Management ({interviews.length})
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'security'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Security & Anti-Cheating Telemetry
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'logs'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            System Audit Logs ({logs.length})
          </button>
        </div>

        {/* Tab 1: System Command & Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Verdict Distribution */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" /> Hiring Verdict Distribution
              </h3>
              <div className="space-y-3 text-xs">
                {Object.entries(stats?.verdict_distribution || {}).map(([verdict, count]) => (
                  <div key={verdict} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-300">{verdict}</span>
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" /> Category & Domain Breakdown
              </h3>
              <div className="space-y-3 text-xs max-h-64 overflow-y-auto">
                {Object.entries(stats?.category_distribution || {}).map(([cat, count]) => (
                  <div key={cat} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 truncate max-w-[200px]">{cat}</span>
                    <span className="font-mono font-bold text-blue-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Code Sandbox Runtime */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" /> Isolated Sandbox Engines
              </h3>
              <div className="space-y-2.5 text-xs">
                {Object.entries(health?.sandbox_status || {}).map(([lang, status]: [string, any]) => (
                  <div key={lang} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 font-semibold uppercase">{lang}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: User & Identity Governance */}
        {activeTab === 'users' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by candidate name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Roles</option>
                  <option value="candidate">Candidate</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-purple-600/30 transition-all self-start sm:self-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create User Account</span>
              </button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Target Role / Exp</th>
                    <th className="py-3 px-4 text-center">Interviews</th>
                    <th className="py-3 px-4 text-center">Avg Score</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u) => {
                    const roleColor: Record<string, string> = {
                      admin: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                      recruiter: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                      candidate: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    };

                    return (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{u.full_name}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-slate-900 ${roleColor[u.role] || ''} focus:outline-none`}
                          >
                            <option value="candidate">candidate</option>
                            <option value="recruiter">recruiter</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <div>{u.target_role}</div>
                          <span className="text-[10px] text-slate-500">{u.experience_level}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                          {u.interviews_count}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-purple-400 font-bold">
                          {u.average_score > 0 ? `${u.average_score}%` : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 mx-auto transition-all ${
                              u.is_active
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {u.is_active ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            <span>{u.is_active ? 'Active' : 'Suspended'}</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Session Audit & Management */}
        {activeTab === 'sessions' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter sessions by candidate, role, or mode..."
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Candidate & Role</th>
                    <th className="py-3 px-4">Mode / Diff</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-center">Integrity Trust</th>
                    <th className="py-3 px-4 text-center">Status / Verdict</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInterviews.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-500">#{item.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{item.candidate_name}</div>
                        <div className="text-[11px] text-purple-400">{item.target_role}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{item.mode}</div>
                        <span className="text-[10px] text-slate-500">{item.difficulty}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                        {item.overall_score > 0 ? `${item.overall_score}%` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className={item.integrity_score < 75 ? 'text-rose-400' : 'text-emerald-400'}>
                          {item.integrity_score}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-slate-900 border-slate-700 text-slate-300">
                          {item.verdict !== 'N/A' ? item.verdict : item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenReplay(item.id)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                            title="Audit Candidate Replay"
                          >
                            <Play className="w-3 h-3 text-purple-400" />
                            <span>Audit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteInterview(item.id)}
                            className="p-1 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded transition-colors"
                            title="Delete Session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Security & Anti-Cheating Telemetry */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400" /> Proctoring Events Recorded
                </h3>
                <div className="text-3xl font-black text-rose-400 font-mono">
                  {integrityMetrics?.total_events || 0}
                </div>
                <p className="text-xs text-slate-400">Total anti-cheating signals captured in camera/audio.</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Flagged Sessions
                </h3>
                <div className="text-3xl font-black text-amber-400 font-mono">
                  {integrityMetrics?.flagged_sessions_count || 0}
                </div>
                <p className="text-xs text-slate-400">Sessions exceeding tolerance thresholds.</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Integrity Benchmark
                </h3>
                <div className="text-3xl font-black text-emerald-400 font-mono">
                  {integrityMetrics?.average_integrity_score || 96.5}%
                </div>
                <p className="text-xs text-slate-400">Average platform credibility index.</p>
              </div>
            </div>

            {/* Violation Types Breakdown */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Event Breakdown by Violation Vector
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {Object.entries(integrityMetrics?.by_type || {}).map(([type, count]) => (
                  <div key={type} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-slate-400 font-mono text-[11px] block">{type}</span>
                    <div className="text-xl font-bold text-white font-mono">{String(count)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: System Audit Logs */}
        {activeTab === 'logs' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" /> Security & Audit Trail
            </h3>
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-[11px] space-y-2 max-h-[500px] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 border-b border-slate-900 pb-2">
                  <span className="text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      log.level === 'ERROR'
                        ? 'bg-rose-500/20 text-rose-400'
                        : log.level === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="text-purple-300 font-semibold">{log.action}:</span>
                  <span className="text-slate-400 truncate">{JSON.stringify(log.details)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-purple-400" />
                  Provision Platform Account
                </h3>
                <button
                  onClick={() => setShowCreateUserModal(false)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newUserForm.full_name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john.doe@example.com"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Platform Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="candidate">Candidate (Assessments & Practice)</option>
                    <option value="recruiter">Recruiter (Invites & Leaderboard)</option>
                    <option value="admin">Administrator (Full System Access)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingUser}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-purple-600/30 disabled:opacity-50"
                  >
                    {isCreatingUser ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Replay Audit Modal */}
        {replayInterviewId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Audit Session Replay: {replayData?.candidate_name || `Session #${replayInterviewId}`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Role: {replayData?.target_role} | Composite Score: {replayData?.overall_score}% | Verdict: {replayData?.verdict}
                  </p>
                </div>
                <button
                  onClick={() => setReplayInterviewId(null)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoadingReplay ? (
                  <div className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading replay answers...
                  </div>
                ) : !replayData || replayData.answers.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    No answer evaluations recorded for this session.
                  </div>
                ) : (
                  replayData.answers.map((ans: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
                      <div className="flex items-start justify-between gap-4 font-bold text-purple-300">
                        <span>Q{ans.question_number}: {ans.question_text}</span>
                        <span className="px-2 py-0.5 bg-slate-800 text-white rounded font-mono">
                          {ans.score}/100
                        </span>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg text-slate-200">
                        "{ans.candidate_answer}"
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Speaking Pace: <strong className="text-white font-mono">{ans.speaking_pace_wpm || 0} WPM</strong></span>
                        <span>Feedback: {ans.feedback}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
                <button
                  onClick={() => setReplayInterviewId(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
