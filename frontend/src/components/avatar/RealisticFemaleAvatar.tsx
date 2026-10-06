import React, { useEffect, useRef, useState } from 'react';
import { AvatarState, VisemeType } from '../../types';
import { LipSyncController } from './LipSyncController';
import { Sparkles, UserCheck, Volume2, ShieldCheck, Activity } from 'lucide-react';

interface RealisticFemaleAvatarProps {
  state: AvatarState;
  currentViseme?: VisemeType;
  audioLevel?: number;
  interviewerName?: string;
  interviewerTitle?: string;
  onFallbackRequest?: () => void;
}

export const RealisticFemaleAvatar: React.FC<RealisticFemaleAvatarProps> = ({
  state,
  currentViseme = 'REST',
  audioLevel = 0,
  interviewerName = 'Dr. Sarah Mitchell',
  interviewerTitle = 'Universal AI Interviewer',
  onFallbackRequest
}) => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(true);
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [mouthOpen, setMouthOpen] = useState<number>(0);
  const lipSyncRef = useRef<LipSyncController>(new LipSyncController());
  const blinkTimeoutRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // 1. Viseme & Audio Lipsync Controller
  useEffect(() => {
    lipSyncRef.current.setViseme(currentViseme, audioLevel);
  }, [currentViseme, audioLevel]);

  // 2. Continuous Animation Loop (Mouth aperture + Head sway)
  useEffect(() => {
    let active = true;

    const loop = () => {
      if (!active) return;

      if (state === 'TALKING') {
        const mouth = lipSyncRef.current.update(0.16);
        // Map openHeight (0 to 25) + audioLevel to normalized mouth openness
        const open = Math.min(1.0, (mouth.openHeight / 18) + (audioLevel * 0.5));
        setMouthOpen(open);
      } else {
        setMouthOpen(0);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state, audioLevel]);

  // 3. Natural Human Blinking Timer (Randomized every 3 to 5 seconds)
  useEffect(() => {
    const scheduleNextBlink = () => {
      const delay = Math.random() * 2500 + 2500; // 2.5s - 5.0s
      blinkTimeoutRef.current = window.setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 150); // Blink duration 150ms
      }, delay);
    };

    scheduleNextBlink();

    return () => {
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    };
  }, []);

  const getStatusBadge = () => {
    switch (state) {
      case 'TALKING':
        return { label: 'Speaking', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'LISTENING':
        return { label: 'Listening to Candidate', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
      case 'THINKING':
      case 'PROCESSING':
        return { label: 'Evaluating Answer...', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      default:
        return { label: 'Active', color: 'bg-slate-800/80 text-slate-300 border-slate-700/50' };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center group">
      {/* 1. Photorealistic Studio Presenter Image Layer */}
      <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
        <img
          src="/avatars/sarah_mitchell_portrait.jpg"
          alt="Dr. Sarah Mitchell - AI Interviewer"
          onError={() => {
            console.warn('[RealisticFemaleAvatar] Local portrait failed to load, trying desk shot...');
            // Try alternate path or trigger fallback
            setImageLoaded(false);
            onFallbackRequest?.();
          }}
          className={`w-full h-full object-cover object-center transition-all duration-700 ${
            state === 'TALKING'
              ? 'scale-[1.02] filter brightness-105'
              : state === 'THINKING'
              ? 'scale-100 filter brightness-95'
              : 'scale-100'
          }`}
        />

        {/* 2. Realistic Dynamic Mouth Viseme Overlay */}
        {state === 'TALKING' && mouthOpen > 0.05 && (
          <div
            className="absolute z-10 pointer-events-none rounded-full transition-all duration-75"
            style={{
              top: '47.5%',
              left: '50.2%',
              transform: 'translate(-50%, -50%)',
              width: `${26 + mouthOpen * 8}px`,
              height: `${4 + mouthOpen * 14}px`,
              backgroundColor: '#4a151b',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), 0 0 4px rgba(180,60,70,0.3)',
              borderTop: '1px solid rgba(240,200,200,0.4)',
              borderBottom: '1px solid rgba(160,50,60,0.5)',
              opacity: Math.min(1.0, mouthOpen * 1.4)
            }}
          >
            {/* Subtle Teeth Glimpse */}
            {mouthOpen > 0.35 && (
              <div
                className="w-[70%] h-[2.5px] mx-auto rounded-sm bg-white/85 mt-[1px] shadow-sm"
              />
            )}
          </div>
        )}

        {/* 3. Realistic Natural Eyelid Blink Overlay */}
        {isBlinking && (
          <div className="absolute top-[32%] left-[49.5%] transform -translate-x-1/2 -translate-y-1/2 w-[160px] h-[32px] pointer-events-none flex justify-between px-3 z-10">
            {/* Left Eyelid */}
            <div className="w-[38px] h-[10px] bg-[#bf8e72] rounded-full shadow-inner opacity-90 border-t border-[#8c563b]" />
            {/* Right Eyelid */}
            <div className="w-[38px] h-[10px] bg-[#bf8e72] rounded-full shadow-inner opacity-90 border-t border-[#8c563b]" />
          </div>
        )}

        {/* 4. Ambient Studio Lighting Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/30" />

        {/* 5. Live Speaking / Evaluating Aura Halo */}
        {state === 'TALKING' && (
          <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/30 rounded-2xl animate-pulse" />
        )}
        {state === 'LISTENING' && (
          <div className="absolute inset-0 pointer-events-none border-2 border-teal-500/30 rounded-2xl animate-pulse" />
        )}
        {(state === 'THINKING' || state === 'PROCESSING') && (
          <div className="absolute inset-0 pointer-events-none border-2 border-purple-500/30 rounded-2xl animate-pulse" />
        )}
      </div>

      {/* State & Interviewer Tag Overlay */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 z-20 pointer-events-none">
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${badge.color} backdrop-blur-md flex items-center gap-1.5 shadow-lg`}>
          <span className="w-2 h-2 rounded-full bg-current animate-ping" />
          {badge.label}
        </span>
      </div>

      {/* Realistic Presenter Details Footer Card */}
      <div className="absolute bottom-3 inset-x-3 bg-slate-950/90 backdrop-blur-md border border-slate-800/90 rounded-xl p-3 flex items-center justify-between shadow-xl z-20 pointer-events-none">
        <div>
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <span>{interviewerName}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          </h4>
          <p className="text-xs text-slate-400">{interviewerTitle}</p>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-[11px]">Realistic Female Interviewer • Local AI</span>
        </div>
      </div>
    </div>
  );
};
