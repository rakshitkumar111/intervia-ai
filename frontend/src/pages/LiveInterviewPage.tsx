import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { interviewApi } from '../services/interviewApi';
import { avatarApi } from '../services/avatarApi';
import { speechEngine } from '../services/speechEngine';
import { InterviewSession, InterviewQuestion, AvatarState, VisemeType, AnswerEvaluation } from '../types';
import { HumanoidAvatar, AvatarProviderMode } from '../components/avatar/HumanoidAvatar';
import { LiveQuestionCard } from '../components/interview/LiveQuestionCard';
import { CandidateVideoFeed } from '../components/interview/CandidateVideoFeed';
import { SessionProgress } from '../components/interview/SessionProgress';
import { SpeechInputArea } from '../components/interview/SpeechInputArea';
import { AvatarControls } from '../components/avatar/AvatarControls';
import { CodeEditorWorkspace } from '../components/coding/CodeEditorWorkspace';
import { SystemDesignWhiteboard } from '../components/architecture/SystemDesignWhiteboard';
import { AlertCircle, Activity, Sparkles, Briefcase, Volume2, ShieldCheck, UserCheck, Video, Lightbulb, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle, Code2, Share2, ArrowRight } from 'lucide-react';

export type InterviewPhase = 
  | 'INITIALIZING'
  | 'D_ID_CONNECTING'
  | 'D_ID_CONNECTED'
  | 'INTERVIEWER_SPEAKING'
  | 'CANDIDATE_LISTENING'
  | 'PROCESSING_ANSWER'
  | 'EVALUATING'
  | 'NEXT_QUESTION'
  | 'FINAL_EVALUATION'
  | 'COMPLETED';

interface LiveInterviewPageProps {
  interviewId?: number;
  onNavigate: (tab: string, param?: any) => void;
}

function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatQuestionId(q: InterviewQuestion | null, fallbackIndex = 1): string {
  if (!q) return `Q${String(fallbackIndex).padStart(3, '0')}`;
  const num = q.question_number || q.order_index || q.id || fallbackIndex;
  return `Q${String(num).padStart(3, '0')}`;
}

export const LiveInterviewPage: React.FC<LiveInterviewPageProps> = ({ interviewId, onNavigate }) => {
  const { user } = useAuth();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  // Practice Mode State
  const [lastEvaluation, setLastEvaluation] = useState<AnswerEvaluation | null>(null);
  const [showPracticeCritique, setShowPracticeCritique] = useState<boolean>(false);
  const [integrityEventCount, setIntegrityEventCount] = useState<number>(0);
  const [showCodeEditor, setShowCodeEditor] = useState<boolean>(false);
  const [showWhiteboard, setShowWhiteboard] = useState<boolean>(false);

  // HireVue Submission State
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submissionTime, setSubmissionTime] = useState<string>('');

  // 1. SINGLE AUTHORITATIVE INTERVIEWER MODE: Defaults to 'DID_HD'
  const [interviewerMode, setInterviewerMode] = useState<AvatarProviderMode>('DID_HD');
  const interviewerModeRef = useRef<AvatarProviderMode>('DID_HD');

  // Session-Level Guard Flags (Persisted across re-renders)
  const didConnectionAttemptedRef = useRef<boolean>(false);
  const didFallbackActiveRef = useRef<boolean>(false);
  const connectionGenerationRef = useRef<number>(1);
  const [connectionGeneration, setConnectionGeneration] = useState<number>(1);
  const activeSpeechIdRef = useRef<string | null>(null);
  const isSubmittingRef = useRef<boolean>(false);

  // 2. SINGLE SOURCE OF TRUTH: Question Management
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const currentQuestionRef = useRef<InterviewQuestion | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(1);
  const [askedQuestionIds, setAskedQuestionIds] = useState<number[]>([]);
  const askedQuestionIdsRef = useRef<number[]>([]);

  // Keep refs in sync
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  useEffect(() => {
    askedQuestionIdsRef.current = askedQuestionIds;
  }, [askedQuestionIds]);

  useEffect(() => {
    interviewerModeRef.current = interviewerMode;
  }, [interviewerMode]);

  // Deterministic State Machine Phase
  const [phase, setPhase] = useState<InterviewPhase>('INITIALIZING');
  const phaseRef = useRef<InterviewPhase>('INITIALIZING');

  const transitionToPhase = useCallback((newPhase: InterviewPhase) => {
    console.log(`[INTERVIEW] state = ${newPhase}`);
    phaseRef.current = newPhase;
    setPhase(newPhase);
  }, []);

  // Avatar & Speech State
  const [avatarState, setAvatarState] = useState<AvatarState>('IDLE');
  const [currentViseme, setCurrentViseme] = useState<VisemeType>('REST');
  const [activeSpeechText, setActiveSpeechText] = useState<string>('');

  // Candidate Transcript State (Separated & Reset Per Turn)
  const [candidateFinalTranscript, setCandidateFinalTranscript] = useState<string>('');
  const [candidateInterimTranscript, setCandidateInterimTranscript] = useState<string>('');

  // Audio Level & Timers
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioIntervalRef = useRef<number | null>(null);
  const didSpeechTimerRef = useRef<number | null>(null);

  // Candidate Controls
  const [isMicActive, setIsMicActive] = useState<boolean>(true);
  const [isCamActive, setIsCamActive] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const [answerTimer, setAnswerTimer] = useState<number>(0);
  const [totalSessionTimer, setTotalSessionTimer] = useState<number>(0);

  // Word count of current candidate answer
  const wordCount = candidateFinalTranscript.trim()
    ? candidateFinalTranscript.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const combinedDisplayTranscript = (
    candidateFinalTranscript + (candidateInterimTranscript ? ' ' + candidateInterimTranscript : '')
  ).trim();

  // Passive Anti-Cheating & Integrity Listeners
  useEffect(() => {
    if (!session || phase === 'COMPLETED' || phase === 'FINAL_EVALUATION') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIntegrityEventCount((prev) => prev + 1);
        interviewApi.logIntegrityEvent(session.id, {
          event_type: 'TAB_SWITCH',
          details: { state: phaseRef.current, timestamp: new Date().toISOString() }
        }).catch(console.warn);
      }
    };

    const handleWindowBlur = () => {
      setIntegrityEventCount((prev) => prev + 1);
      interviewApi.logIntegrityEvent(session.id, {
        event_type: 'WINDOW_BLUR',
        details: { state: phaseRef.current, timestamp: new Date().toISOString() }
      }).catch(console.warn);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [session, phase]);

  // 1. Candidate Speech-to-Text Activation (Gated strictly to CANDIDATE_LISTENING)
  const startCandidateListening = useCallback((preserveTranscript = false) => {
    if (!isMicActive || isPaused) return;

    speechEngine.stopSpeaking();
    transitionToPhase('CANDIDATE_LISTENING');
    setAvatarState('LISTENING');

    if (!preserveTranscript) {
      setCandidateFinalTranscript('');
      setCandidateInterimTranscript('');
      speechEngine.clearTranscript();
      setAnswerTimer(0);
    }

    speechEngine.startListening({
      onTranscript: (finalText: string, interimText: string) => {
        if (phaseRef.current === 'CANDIDATE_LISTENING') {
          setCandidateFinalTranscript(finalText);
          setCandidateInterimTranscript(interimText);
        }
      },
      onError: (err: string) => {
        console.warn('Candidate STT issue:', err);
      },
      onEnd: () => {}
    }, preserveTranscript ? candidateFinalTranscript : '');
  }, [isMicActive, isPaused, candidateFinalTranscript, transitionToPhase]);

  // 2. Handler when Interviewer Speaking Completes
  const handleInterviewerSpeakingEnded = useCallback(() => {
    console.log('[INTERVIEWER] speaking ended');
    if (didSpeechTimerRef.current) {
      clearTimeout(didSpeechTimerRef.current);
      didSpeechTimerRef.current = null;
    }

    if (phaseRef.current === 'INTERVIEWER_SPEAKING') {
      transitionToPhase('CANDIDATE_LISTENING');
      startCandidateListening(false);
    }
  }, [transitionToPhase, startCandidateListening]);

  // 3. Centralized Speech Engine Function
  const speakInterviewer = useCallback(async (
    questionObj: InterviewQuestion,
    modeOverride?: AvatarProviderMode
  ) => {
    const activeMode = modeOverride || interviewerModeRef.current;
    const qIdFormatted = formatQuestionId(questionObj, currentQuestionIndex);
    const speechId = `${qIdFormatted}-TURN-${askedQuestionIdsRef.current.length + 1}`;

    // Prevent duplicate speech execution
    if (activeSpeechIdRef.current === speechId && phaseRef.current === 'INTERVIEWER_SPEAKING') {
      console.log(`[SPEECH] Duplicate speech ignored for ${speechId}`);
      return;
    }
    activeSpeechIdRef.current = speechId;

    if (didSpeechTimerRef.current) {
      clearTimeout(didSpeechTimerRef.current);
      didSpeechTimerRef.current = null;
    }

    // Stop candidate STT and reset candidate audio before speaking new question
    speechEngine.stopSpeaking();
    speechEngine.stopListening();
    speechEngine.clearTranscript();
    setCandidateFinalTranscript('');
    setCandidateInterimTranscript('');
    setAnswerTimer(0);

    // Set single source of truth question
    setCurrentQuestion(questionObj);
    currentQuestionRef.current = questionObj;
    setActiveSpeechText(questionObj.question_text);

    // Track asked question ID
    setAskedQuestionIds((prev) => {
      const updated = prev.includes(questionObj.id) ? prev : [...prev, questionObj.id];
      askedQuestionIdsRef.current = updated;
      return updated;
    });

    transitionToPhase('INTERVIEWER_SPEAKING');
    setAvatarState('TALKING');

    if (isMuted) {
      transitionToPhase('CANDIDATE_LISTENING');
      startCandidateListening(false);
      return;
    }

    // PROVIDER A: D-ID HD Human WebRTC Stream
    if (activeMode === 'DID_HD') {
      console.log('[SPEECH] provider = D_ID_WEBRTC, voice = en-US-JennyNeural (D-ID HD Human)');
      const words = questionObj.question_text.trim().split(/\s+/).length;
      const estimatedDurationMs = Math.max(3800, Math.min(18000, words * 280));

      didSpeechTimerRef.current = window.setTimeout(() => {
        if (phaseRef.current === 'INTERVIEWER_SPEAKING') {
          handleInterviewerSpeakingEnded();
        }
      }, estimatedDurationMs);
      return;
    }

    // PROVIDER B: Realistic Female Local Fallback with Female Local TTS
    const femaleVoiceName = speechEngine.getSelectedFemaleVoiceName();
    console.log(`[SPEECH] provider = LOCAL_TTS, voice = ${femaleVoiceName}, gender = FEMALE`);

    speechEngine.speak(questionObj.question_text, {
      onStart: () => {
        setAvatarState('TALKING');
      },
      onBoundary: () => {
        const vowels: VisemeType[] = ['AA', 'EE', 'IH', 'OH', 'OU'];
        const randomVowel = vowels[Math.floor(Math.random() * vowels.length)];
        setCurrentViseme(randomVowel);
      },
      onEnd: () => {
        setCurrentViseme('REST');
        handleInterviewerSpeakingEnded();
      },
      onError: () => {
        setCurrentViseme('REST');
        handleInterviewerSpeakingEnded();
      }
    });
  }, [currentQuestionIndex, isMuted, transitionToPhase, startCandidateListening, handleInterviewerSpeakingEnded]);

  // 4. Fallback Activation if D-ID connection fails
  const activateLocalFallback = useCallback((reason: string, targetMode: AvatarProviderMode = 'REALISTIC_LOCAL') => {
    console.warn(`[FALLBACK] activating ${targetMode}. Reason: ${reason}`);
    console.log(`[INTERVIEWER] mode changed ${interviewerModeRef.current} → ${targetMode}`);

    didFallbackActiveRef.current = true;
    didConnectionAttemptedRef.current = true;
    connectionGenerationRef.current++;

    speechEngine.stopSpeaking();

    setInterviewerMode(targetMode);
    interviewerModeRef.current = targetMode;
    setFallbackNotice('D-ID stream unavailable — using Realistic Female Fallback.');

    if (currentQuestionRef.current) {
      speakInterviewer(currentQuestionRef.current, targetMode);
    }
  }, [speakInterviewer]);

  // 5. Initial Session Load (Prioritizing D-ID HD Real Human)
  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        setLoading(true);
        setError(null);
        transitionToPhase('INITIALIZING');
        let activeSession: InterviewSession;

        if (interviewId) {
          activeSession = await interviewApi.getInterview(interviewId);
        } else {
          activeSession = await interviewApi.createInterview({
            target_role: 'Full Stack Software Engineer',
            domain: 'Technology',
            difficulty: 'Medium',
            mode: 'Technical',
            category: 'System Design & Algorithms',
            total_questions: 5,
            language: 'English'
          });
        }

        if (!isMounted) return;

        if (activeSession.status === 'created') {
          activeSession = await interviewApi.startInterview(activeSession.id);
        }

        // Configure speech language
        speechEngine.setLanguage(activeSession.language || 'English');

        setSession(activeSession);
        setLoading(false);

        if (activeSession.questions && activeSession.questions.length > 0) {
          const firstQ = activeSession.questions[0];
          setCurrentQuestion(firstQ);
          currentQuestionRef.current = firstQ;
          setCurrentQuestionIndex(1);

          // Check if D-ID credentials are configured
          let isDIDConfigured = false;
          try {
            const avatarStatus = await avatarApi.getStatus();
            isDIDConfigured = !!(avatarStatus.did_configured && avatarStatus.agent_id && avatarStatus.client_key);
          } catch (e) {
            isDIDConfigured = false;
          }

          if (isDIDConfigured) {
            console.log('[D-ID] Agent credentials present. Initializing D-ID HD Real Human Stream...');
            setInterviewerMode('DID_HD');
            interviewerModeRef.current = 'DID_HD';
            didFallbackActiveRef.current = false;
            transitionToPhase('D_ID_CONNECTING');
          } else {
            console.log('[D-ID] Credentials not found. Starting with Realistic Female Interviewer.');
            setInterviewerMode('REALISTIC_LOCAL');
            interviewerModeRef.current = 'REALISTIC_LOCAL';
            didFallbackActiveRef.current = true;
            setFallbackNotice('HD Avatar unavailable — using Realistic Female Interviewer.');
            speakInterviewer(firstQ, 'REALISTIC_LOCAL');
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load interview session.');
        setLoading(false);
      }
    };

    loadSession();

    return () => {
      isMounted = false;
      speechEngine.stopSpeaking();
      speechEngine.stopListening();
      speechEngine.releaseMicrophone();
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (didSpeechTimerRef.current) clearTimeout(didSpeechTimerRef.current);
    };
  }, [interviewId]);

  // 6. Handler when D-ID stream is ready
  const handleAvatarStreamReady = useCallback(() => {
    console.log('[D-ID Stream Ready] WebRTC media stream active with video & audio tracks.');
    if (phaseRef.current === 'D_ID_CONNECTING' && currentQuestionRef.current) {
      transitionToPhase('D_ID_CONNECTED');
      setTimeout(() => {
        if (currentQuestionRef.current) {
          speakInterviewer(currentQuestionRef.current, 'DID_HD');
        }
      }, 400);
    }
  }, [transitionToPhase, speakInterviewer]);

  // 7. Controlled Mode Selection & User Explicit Retry
  const handleProviderModeChange = useCallback(async (newMode: AvatarProviderMode, isExplicitRetry = false) => {
    if (newMode === 'DID_HD') {
      console.log('[USER ACTION] Selecting / Retrying D-ID HD Human stream...');
      didFallbackActiveRef.current = false;
      didConnectionAttemptedRef.current = false;
      connectionGenerationRef.current++;
      setConnectionGeneration(connectionGenerationRef.current);
      setFallbackNotice(null);
      setInterviewerMode('DID_HD');
      interviewerModeRef.current = 'DID_HD';
      transitionToPhase('D_ID_CONNECTING');
      speechEngine.stopSpeaking();
    } else {
      console.log(`[INTERVIEWER] mode changed ${interviewerModeRef.current} → ${newMode}`);
      setInterviewerMode(newMode);
      interviewerModeRef.current = newMode;
      if (currentQuestionRef.current && (phaseRef.current === 'D_ID_CONNECTING' || phaseRef.current === 'INTERVIEWER_SPEAKING')) {
        speakInterviewer(currentQuestionRef.current, newMode);
      }
    }
  }, [transitionToPhase, speakInterviewer]);

  // 8. Total Session Timer
  useEffect(() => {
    if (loading || !session || isPaused) return;
    const interval = window.setInterval(() => {
      setTotalSessionTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, session, isPaused]);

  // 9. Current Answer Timer
  useEffect(() => {
    let interval: number | null = null;
    if (phase === 'CANDIDATE_LISTENING' && !isPaused) {
      interval = window.setInterval(() => {
        setAnswerTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase, isPaused]);

  // 10. Candidate Audio Level Analyzer
  useEffect(() => {
    if (phase === 'CANDIDATE_LISTENING' && isMicActive && !isPaused) {
      speechEngine.initAudioAnalyser().then(() => {
        audioIntervalRef.current = window.setInterval(() => {
          const vol = speechEngine.getAudioVolume();
          setAudioLevel(vol);
        }, 60);
      });
    } else {
      setAudioLevel(0);
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [phase, isMicActive, isPaused]);

  // 11. Submit Answer & Progress to Next Unique Question (Atomic Lock)
  const handleSubmitAnswer = async () => {
    if (isSubmittingRef.current || phaseRef.current !== 'CANDIDATE_LISTENING') {
      console.warn('[INTERVIEW] Submission ignored: already in progress or not in CANDIDATE_LISTENING.');
      return;
    }

    const finalAnswerToSubmit = (
      candidateFinalTranscript + (candidateInterimTranscript ? ' ' + candidateInterimTranscript : '')
    ).trim();

    const activeQ = currentQuestionRef.current;
    if (!session || !activeQ || !finalAnswerToSubmit) return;

    isSubmittingRef.current = true;
    if (didSpeechTimerRef.current) clearTimeout(didSpeechTimerRef.current);

    // Stop STT and freeze transcript
    speechEngine.stopListening();
    transitionToPhase('PROCESSING_ANSWER');
    setAvatarState('THINKING');

    const formattedActiveQId = formatQuestionId(activeQ, currentQuestionIndex);
    console.log(`[INTERVIEW] ANSWER_SUBMITTED: ${formattedActiveQId} (Q${currentQuestionIndex}/${session.total_questions})`);
    console.log(`[INTERVIEW] TRANSCRIPT: "${finalAnswerToSubmit}"`);

    try {
      transitionToPhase('EVALUATING');
      console.log('[GEMINI] evaluation started');

      const evalResponse = await interviewApi.submitAnswer(session.id, {
        question_id: activeQ.id,
        transcript_text: finalAnswerToSubmit,
        audio_duration_seconds: answerTimer,
        asked_question_ids: [...askedQuestionIdsRef.current, activeQ.id]
      });

      console.log('[GEMINI] evaluation completed');
      setLastEvaluation(evalResponse);

      // Check if session has concluded (all questions answered)
      if (evalResponse.is_completed || !evalResponse.next_question) {
        transitionToPhase('FINAL_EVALUATION');
        await handleFinishInterview(session.id);
        isSubmittingRef.current = false;
        return;
      }

      transitionToPhase('NEXT_QUESTION');
      let nextQ: InterviewQuestion = evalResponse.next_question;
      const nextIndex = currentQuestionIndex + 1;
      const formattedNextQId = formatQuestionId(nextQ, nextIndex);
      console.log(`[INTERVIEW] NEXT_QUESTION_ID: ${formattedNextQId} (Q${nextIndex}/${session.total_questions})`);

      const isDuplicateId = nextQ.id === activeQ.id || askedQuestionIdsRef.current.includes(nextQ.id);
      const isDuplicateText = normalizeQuestion(nextQ.question_text) === normalizeQuestion(activeQ.question_text);
      const isDup = isDuplicateId || isDuplicateText;

      // If duplicate detected, request a fresh adaptive question
      if (isDup) {
        console.error('[QUESTION ERROR] DUPLICATE QUESTION DETECTED', nextQ);
        const altResponse = await interviewApi.getNextQuestion(session.id, {
          previous_question_id: activeQ.id,
          previous_question: activeQ.question_text,
          asked_question_ids: [...askedQuestionIdsRef.current, activeQ.id],
          candidate_name: session.candidate_name,
          job_role: session.target_role,
          company_name: session.company_name,
          domain: session.domain || session.category,
          experience_level: session.experience_level,
          interview_type: session.mode,
          difficulty: session.difficulty,
          language: session.language
        });

        if (altResponse.question) {
          nextQ = altResponse.question;
          console.log(`[INTERVIEW] NEXT_QUESTION_ID (Deduplicated): ${formatQuestionId(nextQ, nextIndex)}`);
        }
      }

      // Update question index and session state
      setCurrentQuestionIndex(nextIndex);
      const updatedSession = await interviewApi.getInterview(session.id);
      setSession(updatedSession);

      // Present the verified unique next question
      await speakInterviewer(nextQ);

    } catch (err: any) {
      console.error('Answer submission error:', err);
      setError(err.message || 'Failed to submit answer.');
      transitionToPhase('CANDIDATE_LISTENING');
      setAvatarState('LISTENING');
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // 12. Finalize Interview & Submit Assessment (HireVue Standard Protocol)
  const handleFinishInterview = async (idToComplete?: number) => {
    const id = idToComplete || session?.id;
    if (!id) return;

    if (didSpeechTimerRef.current) clearTimeout(didSpeechTimerRef.current);
    speechEngine.stopSpeaking();
    speechEngine.stopListening();
    speechEngine.releaseMicrophone();
    transitionToPhase('COMPLETED');
    setAvatarState('THINKING');

    try {
      await interviewApi.completeInterview(id);

      // HireVue Protocol: Candidates NEVER see internal evaluation reports or scores
      const isRecruiterOrAdmin = user?.role === 'recruiter' || user?.role === 'admin';
      if (isRecruiterOrAdmin) {
        onNavigate('report', { interviewId: id });
      } else {
        setSubmissionTime(new Date().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }));
        setIsSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit interview assessment.');
    }
  };

  // 13. Pause / Resume Toggle
  const togglePause = () => {
    setIsPaused((prev) => {
      const willBePaused = !prev;
      if (willBePaused) {
        speechEngine.pauseListening();
        speechEngine.stopSpeaking();
        setAvatarState('IDLE');
      } else {
        if (avatarState !== 'TALKING' && phaseRef.current === 'CANDIDATE_LISTENING') {
          startCandidateListening(true);
        }
      }
      return willBePaused;
    });
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Initializing D-ID AI Real Human Interview Room...</p>
        <p className="text-xs text-slate-500">Connecting Real-Time WebRTC Media Stream</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Interview Session Error</h3>
        <p className="text-xs text-slate-400">{error || 'Session could not be loaded.'}</p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // HireVue Submission Confirmation Screen for Candidates
  if (isSubmitted && session) {
    const confirmationId = `HV-${session.id}-${String((session.id * 73 + 109) % 10000).padStart(4, '0')}`;
    const candidateDisplayName = user?.full_name || session.candidate_name || 'Candidate';

    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-6 my-8">
        <div className="max-w-xl w-full bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

          {/* Success Check Badge */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> Assessment Submission Confirmed
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Assessment Completed!
            </h1>
            <p className="text-sm text-slate-300 max-w-md">
              Thank you, <strong className="text-white font-semibold">{candidateDisplayName}</strong>. Your recorded responses and assessment telemetry have been securely transmitted to the recruitment team.
            </p>
          </div>

          {/* Submission Receipt Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
              <span className="text-slate-400">Confirmation Number</span>
              <span className="font-mono font-bold text-emerald-400">{confirmationId}</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
              <span className="text-slate-400">Target Role</span>
              <span className="font-semibold text-white">{session.target_role}</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
              <span className="text-slate-400">Recorded Responses</span>
              <span className="text-slate-200 font-medium">{session.total_questions} of {session.total_questions} Questions Completed</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
              <span className="text-slate-400">Submission Timestamp</span>
              <span className="text-slate-300">{submissionTime || new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Assessment Status</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Submitted for Hiring Review
              </span>
            </div>
          </div>

          {/* HireVue Policy & Next Steps Box */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4.5 space-y-2 text-xs text-slate-400 leading-relaxed">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>What Happens Next?</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-400">
              <li>Our hiring team will comprehensively review your video and verbal responses.</li>
              <li>You will receive an official update via email regarding your application status.</li>
              <li>In accordance with recruitment confidentiality standards, individual evaluation rubrics and scores are delivered directly to the recruiter.</li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => onNavigate('landing')}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Return to Homepage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-500">
            You may now safely close this browser window.
          </p>
        </div>
      </div>
    );
  }

  const activeDisplayQuestion = currentQuestion || session.questions[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Fallback Notice Banner */}
      {fallbackNotice && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 text-amber-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">{fallbackNotice}</span>
          </div>
          <button onClick={() => setFallbackNotice(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Real-time Deterministic State Machine Debug Indicator */}
      <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl px-5 py-3 shadow-xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-slate-400 font-semibold">STATE:</span>
            <span className="font-bold text-purple-300 bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-800/60 shadow-sm">
              {phase}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
            <Briefcase className="w-3.5 h-3.5 text-purple-400" />
            <span className="truncate max-w-[180px]">{session.target_role}</span>
          </div>

          {integrityEventCount > 0 && (
            <div className="hidden md:flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
              <AlertTriangle className="w-3 h-3" />
              <span>Integrity Logs: {integrityEventCount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">MODE:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
              interviewerMode === 'DID_HD'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
            }`}>
              {interviewerMode === 'DID_HD' ? 'D-ID HD HUMAN' : interviewerMode}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">STT:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
              phase === 'CANDIDATE_LISTENING'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}>
              {phase === 'CANDIDATE_LISTENING' ? 'ON' : 'OFF'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">AUDIO:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
              phase === 'D_ID_CONNECTING'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                : phase === 'INTERVIEWER_SPEAKING' && interviewerMode === 'DID_HD'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                : phase === 'INTERVIEWER_SPEAKING'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}>
              {phase === 'D_ID_CONNECTING' ? 'CONNECTING' : phase === 'INTERVIEWER_SPEAKING' ? (interviewerMode === 'DID_HD' ? 'D-ID FEMALE (JennyNeural)' : 'LOCAL FEMALE') : 'OFF'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">LANG:</span>
            <span className="font-bold text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
              {session.language || 'English'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">QUESTION:</span>
            <span className="font-bold text-slate-200 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60 text-[11px]">
              {formatQuestionId(activeDisplayQuestion, currentQuestionIndex)} ({currentQuestionIndex}/{session.total_questions})
            </span>
          </div>

          <button
            onClick={() => setShowCodeEditor((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
              showCodeEditor
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showCodeEditor ? 'Hide Code Editor' : 'Open Code Editor'}</span>
          </button>

          <button
            onClick={() => {
              setShowWhiteboard((prev) => !prev);
              if (!showWhiteboard) setShowCodeEditor(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
              showWhiteboard
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
            <span>{showWhiteboard ? 'Hide Whiteboard' : 'Open Whiteboard'}</span>
          </button>
        </div>
      </div>

      {/* 3-Column Top Stage Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 Cols): D-ID Real Human / Fallback Interviewer */}
        <div className="lg:col-span-5 h-[420px]">
          <HumanoidAvatar
            mode={interviewerMode}
            state={avatarState}
            currentViseme={currentViseme}
            audioLevel={audioLevel}
            speechText={activeSpeechText || activeDisplayQuestion?.question_text || ''}
            interviewerName="Dr. Sarah Mitchell"
            interviewerTitle={`Universal AI Interviewer • ${session.target_role}`}
            connectionGeneration={connectionGeneration}
            isFallbackActive={didFallbackActiveRef.current}
            onModeChange={handleProviderModeChange}
            onStreamReady={handleAvatarStreamReady}
            onSpeakingEnded={handleInterviewerSpeakingEnded}
            onFallbackTriggered={activateLocalFallback}
          />
        </div>

        {/* Center/Right Column (7 Cols): Question Prompt & Candidate Stream */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Live Question Card */}
          <LiveQuestionCard
            question={activeDisplayQuestion}
            currentIndex={currentQuestionIndex - 1}
            totalQuestions={session.total_questions}
            isSpeaking={phase === 'INTERVIEWER_SPEAKING'}
            isPracticeMode={session.is_practice_mode}
            onReplayAudio={() => activeDisplayQuestion && speakInterviewer(activeDisplayQuestion)}
          />

          {/* Practice Mode Post-Answer Instant Critique Drawer */}
          {session.is_practice_mode && lastEvaluation && (
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-xl">
              <button
                type="button"
                onClick={() => setShowPracticeCritique(!showPracticeCritique)}
                className="w-full flex items-center justify-between text-xs font-bold text-emerald-400"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>Practice Mode Critique — Last Score: {lastEvaluation.score}/100</span>
                </div>
                {showPracticeCritique ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showPracticeCritique && (
                <div className="mt-3 space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                  <p><strong className="text-slate-100">Feedback:</strong> {lastEvaluation.feedback}</p>
                  {lastEvaluation.strengths.length > 0 && (
                    <p><strong className="text-emerald-400">Strengths:</strong> {lastEvaluation.strengths.join(', ')}</p>
                  )}
                  {lastEvaluation.missing_concepts.length > 0 && (
                    <p><strong className="text-amber-400">Missing Concepts:</strong> {lastEvaluation.missing_concepts.join(', ')}</p>
                  )}
                  {lastEvaluation.suggested_ideal_answer && (
                    <p className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-200">
                      <strong className="text-purple-400 block mb-1">Suggested Ideal Answer:</strong>
                      {lastEvaluation.suggested_ideal_answer}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Right Meta Split: Candidate Video + Session Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CandidateVideoFeed
              isCamActive={isCamActive}
              candidateName={user?.full_name || 'Candidate'}
              targetRole={session.target_role}
              interviewId={session.id}
              onProctoringAlert={(eventType, details) => {
                setIntegrityEventCount((prev) => prev + 1);
                interviewApi.logIntegrityEvent(session.id, {
                  event_type: eventType,
                  details,
                }).catch((err) => console.warn('Integrity log error:', err));
              }}
            />

            <SessionProgress
              questions={session.questions}
              currentIndex={currentQuestionIndex - 1}
              totalDurationSeconds={totalSessionTimer}
              mode={session.mode}
              category={session.domain || session.category || 'General'}
              difficulty={session.difficulty}
            />
          </div>
        </div>
      </div>

      {/* Embedded Live Code Editor Workspace (Phase 3) */}
      {showCodeEditor && (
        <div className="mt-6 h-[620px] transition-all duration-300">
          <CodeEditorWorkspace
            interviewId={session.id}
            questionId={activeDisplayQuestion?.id}
            onCodeSubmitted={(score, aiReview) => {
              console.log(`[CODE SUBMISSION] Score = ${score}/100, Complexity = ${aiReview.time_complexity}`);
            }}
          />
        </div>
      )}

      {/* Embedded Live System Design Whiteboard (Phase 3) */}
      {showWhiteboard && (
        <div className="mt-6 h-[640px] transition-all duration-300">
          <SystemDesignWhiteboard
            interviewId={session.id}
            questionId={activeDisplayQuestion?.id}
            onArchitectureEvaluated={(score, evalRes) => {
              console.log(`[ARCHITECTURE EVALUATION] Score = ${score}/100, Scale = ${evalRes.scalability_score}`);
            }}
          />
        </div>
      )}

      {/* Control Toolbar */}
      <AvatarControls
        isMicActive={isMicActive}
        isCamActive={isCamActive}
        isMuted={isMuted}
        isPaused={isPaused}
        onToggleMic={() => {
          setIsMicActive((prev) => {
            const willBeActive = !prev;
            if (!willBeActive) {
              speechEngine.pauseListening();
            } else if (!isPaused && phase === 'CANDIDATE_LISTENING') {
              startCandidateListening(true);
            }
            return willBeActive;
          });
        }}
        onToggleCam={() => setIsCamActive((prev) => !prev)}
        onToggleMute={() => {
          setIsMuted((prev) => {
            const next = !prev;
            if (next) speechEngine.stopSpeaking();
            return next;
          });
        }}
        onTogglePause={togglePause}
        onEndInterview={() => handleFinishInterview()}
      />

      {/* Candidate Live Speech Response Area */}
      <SpeechInputArea
        transcript={combinedDisplayTranscript}
        isRecording={phase === 'CANDIDATE_LISTENING'}
        isSubmitting={phase === 'PROCESSING_ANSWER' || phase === 'EVALUATING' || phase === 'NEXT_QUESTION' || phase === 'FINAL_EVALUATION'}
        audioLevel={audioLevel}
        timerSeconds={answerTimer}
        isPaused={isPaused}
        interviewPhase={phase}
        wordCount={wordCount}
        onSubmitAnswer={handleSubmitAnswer}
        onTranscriptChange={(text) => {
          setCandidateFinalTranscript(text);
          setCandidateInterimTranscript('');
        }}
        onInterruptInterviewer={() => {
          console.log('[DUPLEX] Interruption triggered by candidate.');
          speechEngine.stopSpeaking();
          if (didSpeechTimerRef.current) {
            window.clearTimeout(didSpeechTimerRef.current);
            didSpeechTimerRef.current = null;
          }
          setAvatarState('LISTENING');
          startCandidateListening(true);
        }}
      />
    </div>
  );
};
