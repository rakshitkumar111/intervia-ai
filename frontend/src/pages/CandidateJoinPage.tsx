import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Video,
  Mic,
  ShieldCheck,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Briefcase,
  Layers,
  Award
} from 'lucide-react';
import { recruiterApi } from '../services/recruiterApi';
import { useAuth } from '../context/AuthContext';

interface CandidateJoinPageProps {
  inviteToken: string;
  onNavigate: (tab: string, params?: any) => void;
}

export const CandidateJoinPage: React.FC<CandidateJoinPageProps> = ({ inviteToken, onNavigate }) => {
  const { setAuthSession } = useAuth();
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Hardware Readiness Checks
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [hasMic, setHasMic] = useState<boolean>(false);
  const [isCheckingMedia, setIsCheckingMedia] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    fetchInvite();
  }, [inviteToken]);

  const fetchInvite = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await recruiterApi.getInviteInfo(inviteToken);
      setInviteInfo(data);
      // Auto trigger media test
      testMediaDevices();
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired interview invitation link.');
    } finally {
      setIsLoading(false);
    }
  };

  const testMediaDevices = async () => {
    setIsCheckingMedia(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCamera(true);
      setHasMic(true);
    } catch (e) {
      console.warn('Media devices check warning:', e);
      // If combined fails, try individually
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasMic(true);
      } catch {}
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCamera(true);
      } catch {}
    } finally {
      setIsCheckingMedia(false);
    }
  };

  const handleStartInterview = async () => {
    setIsStarting(true);
    try {
      const joinData = await recruiterApi.joinInterviewByToken(inviteToken);

      // If the interview was already completed, show the completed screen instead of re-entering
      if (joinData.status === 'completed') {
        setIsCompleted(true);
        return;
      }

      if (joinData.access_token && joinData.user) {
        // Authenticate candidate instantly
        setAuthSession(joinData.access_token, {
          id: joinData.user.id,
          email: joinData.user.email,
          full_name: joinData.user.full_name,
          role: 'candidate',
          is_active: true,
          created_at: new Date().toISOString(),
        });
      }
      
      // Stop local preview tracks before navigating to avoid camera conflict
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      // Route directly to live interview
      onNavigate('live-interview', { interviewId: joinData.interview_id });
    } catch (err: any) {
      alert(`Could not start interview: ${err?.message || String(err)}`);
    } finally {
      setIsStarting(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-emerald-800/40 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Assessment Already Completed</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              You have already completed this assessment. Your responses have been submitted and are currently under evaluation.
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              Your recruiter will reach out with the results. This invitation link is no longer active.
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Candidate</span>
              <span className="text-white font-semibold">{inviteInfo?.candidate_name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Role</span>
              <span className="text-purple-400 font-semibold">{inviteInfo?.target_role || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Submitted
              </span>
            </div>
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-white">Validating Interview Invitation...</h2>
        <p className="text-xs text-slate-400 mt-1">Checking secure invite token and assessment permissions.</p>
      </div>
    );
  }

  if (error || !inviteInfo) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Invitation Unavailable</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || 'This interview invitation link is invalid or has expired.'}
          </p>
          <p className="text-[11px] text-slate-500">
            Please contact your recruiter or hiring manager to request a new assessment invitation link.
          </p>
          <button
            onClick={() => onNavigate('landing')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> OFFICIAL CANDIDATE ASSESSMENT
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Valid until {new Date(inviteInfo.expires_at).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome, {inviteInfo.candidate_name}!
              </h1>
              <p className="text-sm text-slate-300 mt-1">
                You have been invited for the{' '}
                <strong className="text-purple-400 font-semibold">{inviteInfo.target_role}</strong> assessment.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
                <Bot className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Specs & Environment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assessment Specifications */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-400" /> Assessment Structure
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Target Role</span>
                <span className="font-semibold text-white">{inviteInfo.target_role}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Interview Mode</span>
                <span className="font-semibold text-purple-400">{inviteInfo.mode} Mode</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Difficulty Benchmark</span>
                <span className="font-semibold text-amber-400">{inviteInfo.difficulty}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Total Questions</span>
                <span className="font-semibold text-white">{inviteInfo.total_questions} Adaptive Questions</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Languages Supported</span>
                <span className="font-semibold text-white">{inviteInfo.language || 'English'}</span>
              </div>
            </div>
          </div>

          {/* Pre-Flight Media Test */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-400" /> Device Pre-Flight Check
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ensure your camera & microphone are working properly before entering the virtual room.
              </p>
            </div>

            <div className="relative aspect-video bg-black/60 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              {!hasCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-slate-400 p-4 text-center">
                  <Video className="w-8 h-8 text-slate-600 mb-2" />
                  <span className="text-xs">Camera preview will appear here</span>
                  <button
                    onClick={testMediaDevices}
                    disabled={isCheckingMedia}
                    className="mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold rounded-lg transition-colors"
                  >
                    {isCheckingMedia ? 'Checking Devices...' : 'Allow Camera & Mic'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                {hasCamera ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
                <span>Camera: {hasCamera ? 'Ready' : 'Not Connected'}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                {hasMic ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
                <span>Microphone: {hasMic ? 'Ready' : 'Not Connected'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Anti-Cheating & Integrity Advisory */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-300 space-y-1">
            <h4 className="font-bold text-white text-sm">Automated AI Integrity Proctoring</h4>
            <p className="text-slate-400 leading-relaxed">
              This session uses live computer vision and audio telemetry to monitor eye gaze, browser tab focus, and background speech. Please remain in full screen, maintain eye contact with the interviewer, and avoid switching browser windows during the assessment.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-400">
            Click below when you are ready. Your interview session will begin immediately.
          </div>
          <button
            onClick={handleStartInterview}
            disabled={isStarting}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            <span>{isStarting ? 'Launching Session...' : 'Enter Virtual Interview Room'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
