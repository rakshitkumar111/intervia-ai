import React from 'react';
import { AvatarState, VisemeType } from '../../types';
import { DIDRealtimeAvatar } from './DIDRealtimeAvatar';
import { RealisticFemaleAvatar } from './RealisticFemaleAvatar';
import { CanvasHumanoidAvatar } from './CanvasHumanoidAvatar';
import { Sparkles, Video, Box, RefreshCw, UserCheck } from 'lucide-react';

export type AvatarProviderMode = 'DID_HD' | 'REALISTIC_LOCAL' | 'FALLBACK_2D';

interface HumanoidAvatarProps {
  mode: AvatarProviderMode;
  state: AvatarState;
  currentViseme?: VisemeType;
  audioLevel?: number;
  interviewerName?: string;
  interviewerTitle?: string;
  speechText?: string;
  connectionGeneration: number;
  isFallbackActive: boolean;
  onModeChange: (mode: AvatarProviderMode, isExplicitRetry?: boolean) => void;
  onStreamReady?: () => void;
  onSpeakingStarted?: () => void;
  onSpeakingEnded?: () => void;
  onFallbackTriggered?: (reason: string) => void;
}

export const HumanoidAvatar: React.FC<HumanoidAvatarProps> = ({
  mode,
  state,
  currentViseme,
  audioLevel,
  interviewerName,
  interviewerTitle,
  speechText,
  connectionGeneration,
  isFallbackActive,
  onModeChange,
  onStreamReady,
  onSpeakingStarted,
  onSpeakingEnded,
  onFallbackTriggered
}) => {
  const handleSelectMode = (newMode: AvatarProviderMode) => {
    if (newMode === 'DID_HD') {
      console.log('[USER ACTION] Explicitly selected/retried HD Human (D-ID)');
      onModeChange('DID_HD', true);
    } else {
      console.log(`[USER ACTION] Selected ${newMode}`);
      onModeChange(newMode, false);
    }
  };

  const handleDIDFallback = (reason: string) => {
    console.warn('[HumanoidAvatar] D-ID stream fallback triggered:', reason);
    onFallbackTriggered?.(reason);
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Authoritative Controlled Provider Selector Bar */}
      <div className="absolute top-4 right-4 z-30 flex items-center space-x-1 bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-2xl">
        <button
          onClick={() => handleSelectMode('DID_HD')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            mode === 'DID_HD'
              ? 'bg-purple-600 text-white shadow-lg ring-1 ring-purple-400/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title={isFallbackActive ? "Retry connecting HD Human (D-ID)" : "HD Photorealistic Human Interviewer (D-ID Stream)"}
        >
          {isFallbackActive && mode !== 'DID_HD' ? (
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <Video className="w-3.5 h-3.5 text-purple-200" />
          )}
          <span>{isFallbackActive && mode !== 'DID_HD' ? 'Retry HD Human' : 'HD Human (D-ID)'}</span>
        </button>

        <button
          onClick={() => handleSelectMode('REALISTIC_LOCAL')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            mode === 'REALISTIC_LOCAL'
              ? 'bg-emerald-600 text-white shadow-lg ring-1 ring-emerald-400/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Realistic Female Human Local Fallback Presenter"
        >
          <UserCheck className="w-3.5 h-3.5 text-emerald-200" />
          <span>{mode === 'REALISTIC_LOCAL' ? 'REALISTIC FEMALE • ACTIVE' : 'Realistic Female'}</span>
        </button>

        <button
          onClick={() => handleSelectMode('FALLBACK_2D')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            mode === 'FALLBACK_2D'
              ? 'bg-slate-700 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Local 2D Canvas Fallback"
        >
          <Box className="w-3.5 h-3.5 text-slate-300" />
          <span>2D Fallback</span>
        </button>
      </div>

      {/* Controlled Active Avatar Engine */}
      {mode === 'DID_HD' && (
        <DIDRealtimeAvatar
          state={state}
          currentViseme={currentViseme}
          audioLevel={audioLevel}
          interviewerName={interviewerName}
          interviewerTitle={interviewerTitle}
          speechText={speechText}
          connectionGeneration={connectionGeneration}
          onStreamReady={onStreamReady}
          onFallbackRequest={handleDIDFallback}
          onSpeakingStarted={onSpeakingStarted}
          onSpeakingEnded={onSpeakingEnded}
        />
      )}

      {mode === 'REALISTIC_LOCAL' && (
        <RealisticFemaleAvatar
          state={state}
          currentViseme={currentViseme}
          audioLevel={audioLevel}
          interviewerName={interviewerName}
          interviewerTitle={interviewerTitle}
          onFallbackRequest={() => handleSelectMode('FALLBACK_2D')}
        />
      )}

      {mode === 'FALLBACK_2D' && (
        <CanvasHumanoidAvatar
          state={state}
          audioLevel={audioLevel}
          interviewerName={interviewerName}
          interviewerTitle={interviewerTitle}
        />
      )}
    </div>
  );
};
