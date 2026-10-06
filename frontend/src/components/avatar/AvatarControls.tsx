import React from 'react';
import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Pause, Play, Square } from 'lucide-react';

interface AvatarControlsProps {
  isMicActive: boolean;
  isCamActive: boolean;
  isMuted: boolean;
  isPaused: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onEndInterview: () => void;
  isSubmitting?: boolean;
}

export const AvatarControls: React.FC<AvatarControlsProps> = ({
  isMicActive,
  isCamActive,
  isMuted,
  isPaused,
  onToggleMic,
  onToggleCam,
  onToggleMute,
  onTogglePause,
  onEndInterview,
  isSubmitting = false
}) => {
  return (
    <div className="flex items-center justify-center gap-3 bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-800 shadow-xl">
      {/* Mic Control */}
      <button
        onClick={onToggleMic}
        disabled={isSubmitting}
        title={isMicActive ? "Mute Candidate Microphone" : "Unmute Candidate Microphone"}
        className={`p-3 rounded-xl font-medium transition-all flex items-center justify-center ${
          isMicActive
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
        }`}
      >
        {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>

      {/* Camera Control */}
      <button
        onClick={onToggleCam}
        title={isCamActive ? "Turn Off Webcam" : "Turn On Webcam"}
        className={`p-3 rounded-xl font-medium transition-all flex items-center justify-center ${
          isCamActive
            ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
        }`}
      >
        {isCamActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>

      {/* Speaker / Mute Audio */}
      <button
        onClick={onToggleMute}
        title={isMuted ? "Unmute AI Interviewer Voice" : "Mute AI Interviewer Voice"}
        className={`p-3 rounded-xl font-medium transition-all flex items-center justify-center ${
          isMuted
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
            : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
        }`}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      <div className="w-px h-8 bg-slate-800 mx-1" />

      {/* Pause / Resume Session */}
      <button
        onClick={onTogglePause}
        title={isPaused ? "Resume Interview" : "Pause Interview"}
        className="px-4 py-2.5 rounded-xl font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-2 text-sm"
      >
        {isPaused ? (
          <>
            <Play className="w-4 h-4 text-emerald-400" />
            <span>Resume</span>
          </>
        ) : (
          <>
            <Pause className="w-4 h-4 text-amber-400" />
            <span>Pause</span>
          </>
        )}
      </button>

      {/* End Interview */}
      <button
        onClick={onEndInterview}
        disabled={isSubmitting}
        title="End and Generate Final Report"
        className="px-4 py-2.5 rounded-xl font-medium bg-rose-600/20 text-rose-300 border border-rose-600/30 hover:bg-rose-600/30 transition-all flex items-center gap-2 text-sm ml-auto"
      >
        <Square className="w-4 h-4 fill-current" />
        <span>End Session</span>
      </button>
    </div>
  );
};
