import React, { useMemo } from 'react';
import { Send, Trash2, Edit3, Clock, PauseCircle, Mic, Loader2, Sparkles, HandMetal } from 'lucide-react';
import { AudioWaveform } from '../avatar/AudioWaveform';
import { SpeechTelemetryEngine } from '../../services/speechTelemetry';
import { SpeechTelemetryHUD } from './SpeechTelemetryHUD';

interface SpeechInputAreaProps {
  transcript: string;
  onTranscriptChange: (text: string) => void;
  onSubmitAnswer: () => void;
  isRecording: boolean;
  audioLevel: number;
  isSubmitting: boolean;
  timerSeconds: number;
  isPaused?: boolean;
  interviewPhase: string;
  wordCount: number;
  onInterruptInterviewer?: () => void;
}

export const SpeechInputArea: React.FC<SpeechInputAreaProps> = ({
  transcript,
  onTranscriptChange,
  onSubmitAnswer,
  isRecording,
  audioLevel,
  isSubmitting,
  timerSeconds,
  isPaused = false,
  interviewPhase,
  wordCount,
  onInterruptInterviewer,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Compute live speech telemetry (WPM, Fillers, Clarity score)
  const telemetry = useMemo(() => {
    return SpeechTelemetryEngine.analyzeSpeech(transcript, timerSeconds);
  }, [transcript, timerSeconds]);

  const getStatusDisplay = () => {
    if (isPaused) {
      return {
        color: 'text-amber-300',
        dot: 'bg-amber-400',
        text: 'Microphone Paused',
        icon: <PauseCircle className="w-4 h-4 text-amber-400" />
      };
    }
    switch (interviewPhase) {
      case 'D_ID_CONNECTING':
        return {
          color: 'text-amber-300',
          dot: 'bg-amber-400 animate-pulse',
          text: 'Connecting to HD Interviewer Stream...',
          icon: <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
        };
      case 'D_ID_CONNECTED':
        return {
          color: 'text-blue-300',
          dot: 'bg-blue-400',
          text: 'Interviewer Stream Connected',
          icon: null
        };
      case 'INTERVIEWER_SPEAKING':
        return {
          color: 'text-blue-300',
          dot: 'bg-blue-500 animate-pulse',
          text: 'Interviewer Speaking • Standby',
          icon: null
        };
      case 'CANDIDATE_LISTENING':
        return {
          color: 'text-emerald-300',
          dot: 'bg-emerald-500 animate-pulse',
          text: 'Candidate Listening • Speak Your Answer',
          icon: <Mic className="w-4 h-4 text-emerald-400" />
        };
      case 'PROCESSING_ANSWER':
        return {
          color: 'text-purple-300',
          dot: 'bg-purple-500 animate-spin',
          text: 'Finalizing Answer Transcript...',
          icon: <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
        };
      case 'EVALUATING':
        return {
          color: 'text-purple-300',
          dot: 'bg-purple-500 animate-spin',
          text: 'Evaluating Answer with Gemini AI...',
          icon: <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
        };
      case 'GENERATING_NEXT_QUESTION':
        return {
          color: 'text-indigo-300',
          dot: 'bg-indigo-500 animate-spin',
          text: 'Synthesizing Next Question...',
          icon: <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
        };
      case 'COMPLETED':
        return {
          color: 'text-emerald-400',
          dot: 'bg-emerald-400',
          text: 'Interview Completed',
          icon: null
        };
      default:
        return {
          color: 'text-slate-300',
          dot: 'bg-slate-500',
          text: 'Ready',
          icon: null
        };
    }
  };

  const status = getStatusDisplay();
  const isInputAllowed = interviewPhase === 'CANDIDATE_LISTENING' && !isPaused && !isSubmitting;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header bar: Recording status, Waveform, Timer, Word Count, and Interruption button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {status.icon || <span className={`w-3 h-3 rounded-full ${status.dot}`} />}
            <span className={`text-sm font-semibold ${status.color}`}>
              {status.text}
            </span>
          </div>

          <AudioWaveform
            isActive={isRecording && !isPaused && interviewPhase === 'CANDIDATE_LISTENING'}
            audioLevel={audioLevel}
            color={isRecording ? '#10b981' : '#64748b'}
          />

          {/* Duplex Interruption Control: Allow candidate to interrupt while avatar is speaking */}
          {interviewPhase === 'INTERVIEWER_SPEAKING' && onInterruptInterviewer && (
            <button
              onClick={onInterruptInterviewer}
              title="Interrupt interviewer and begin speaking immediately"
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-800 rounded-lg text-xs font-semibold transition-all shadow-md animate-pulse"
            >
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span>Interrupt & Speak</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{formatTime(timerSeconds)}</span>
          </div>

          <div className="bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="font-semibold text-slate-200">{wordCount} words</span>
          </div>
        </div>
      </div>

      {/* Editable Live Transcript Area */}
      <div className="relative">
        <textarea
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder={
            isPaused
              ? "Interview is paused. Click Resume in controls to continue speaking..."
              : interviewPhase === 'D_ID_CONNECTING'
              ? "Connecting to interviewer HD stream... Microphone is standby."
              : interviewPhase === 'CANDIDATE_LISTENING'
              ? "Listening to candidate voice in real-time... Speak your answer now. You can also edit or type manually."
              : interviewPhase === 'INTERVIEWER_SPEAKING'
              ? "Interviewer is speaking the question. Click 'Interrupt & Speak' or wait for speaking to complete..."
              : "Analyzing and evaluating candidate answer..."
          }
          rows={3}
          disabled={!isInputAllowed}
          className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80 text-sm md:text-base resize-none transition-all leading-relaxed disabled:opacity-60"
        />

        <div className="absolute bottom-3 right-3 text-xs text-slate-500 flex items-center gap-1 pointer-events-none">
          <Edit3 className="w-3 h-3" />
          <span>Live Candidate Transcript</span>
        </div>
      </div>

      {/* Real-time Speech Telemetry HUD (WPM, Fillers, Clarity Score) */}
      {(transcript.length > 0 || interviewPhase === 'CANDIDATE_LISTENING') && (
        <SpeechTelemetryHUD
          telemetry={telemetry}
          isRecording={isRecording && !isPaused && interviewPhase === 'CANDIDATE_LISTENING'}
        />
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onTranscriptChange('')}
          disabled={!transcript || !isInputAllowed}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Transcript</span>
        </button>

        <button
          onClick={onSubmitAnswer}
          disabled={!transcript.trim() || !isInputAllowed}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting || interviewPhase === 'PROCESSING_ANSWER' || interviewPhase === 'EVALUATING' ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Answer with Gemini...</span>
            </>
          ) : (
            <>
              <span>Submit Answer</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
