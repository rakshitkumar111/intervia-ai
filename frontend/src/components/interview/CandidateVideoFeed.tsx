import React, { useEffect, useRef, useState, useCallback } from 'react';
import { User, VideoOff, ShieldCheck, AlertTriangle, Eye, EyeOff, Users, Activity, Volume2, ShieldAlert } from 'lucide-react';

export type GazeStatus = 'CENTER' | 'LOOKING_LEFT' | 'LOOKING_RIGHT' | 'LOOKING_DOWN' | 'FACE_ABSENT' | 'MULTIPLE_FACES';

interface CandidateVideoFeedProps {
  isCamActive: boolean;
  candidateName: string;
  targetRole: string;
  interviewId?: number;
  onProctoringAlert?: (eventType: string, details: Record<string, any>) => void;
}

export const CandidateVideoFeed: React.FC<CandidateVideoFeedProps> = ({
  isCamActive,
  candidateName,
  targetRole,
  interviewId,
  onProctoringAlert,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Proctoring States
  const [gazeStatus, setGazeStatus] = useState<GazeStatus>('CENTER');
  const [trustScore, setTrustScore] = useState<number>(100);
  const [warningCount, setWarningCount] = useState<number>(0);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [audioAnomaly, setAudioAnomaly] = useState<boolean>(false);

  const offScreenTimerRef = useRef<number | null>(null);
  const lastLoggedEventRef = useRef<string | null>(null);
  const lastLogTimeRef = useRef<number>(0);

  // Helper to safely trigger and throttle proctoring event callback
  const triggerProctoringEvent = useCallback(
    (eventType: string, details: Record<string, any>) => {
      const now = Date.now();
      if (lastLoggedEventRef.current === eventType && now - lastLogTimeRef.current < 4000) {
        return; // Throttle duplicate logs to once every 4s
      }
      lastLoggedEventRef.current = eventType;
      lastLogTimeRef.current = now;

      // Adjust trust score
      setTrustScore((prev) => Math.max(10, prev - (eventType === 'FACE_ABSENT' ? 5 : eventType === 'MULTIPLE_FACES' ? 8 : 3)));
      setWarningCount((prev) => prev + 1);

      if (onProctoringAlert) {
        onProctoringAlert(eventType, details);
      }
    },
    [onProctoringAlert]
  );

  // Camera & Audio Stream Initialization
  useEffect(() => {
    let active = true;

    async function startMedia() {
      if (isCamActive) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' },
            audio: true,
          });

          if (active && videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;

            // Set up Web Audio API analyzer for acoustic anomaly detection
            try {
              const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioContextClass) {
                const audioCtx = new AudioContextClass();
                const source = audioCtx.createMediaStreamSource(stream);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                audioContextRef.current = audioCtx;
                analyserRef.current = analyser;
              }
            } catch (audioErr) {
              console.warn('Audio proctoring analyzer unavailable:', audioErr);
            }
          }
        } catch (e) {
          console.warn('Camera/Mic access denied or unavailable:', e);
        }
      } else {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
      }
    }

    startMedia();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [isCamActive]);

  // Real-Time Computer Vision & Gaze Tracking Loop (30 FPS)
  useEffect(() => {
    if (!isCamActive) return;

    let animId: number;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let consecutiveOffscreenFrames = 0;
    let consecutiveFaceAbsentFrames = 0;

    const analyzeFrame = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2 && ctx) {
        ctx.drawImage(video, 0, 0, 160, 120);
        const frameData = ctx.getImageData(0, 0, 160, 120);
        const data = frameData.data;

        let totalBrightness = 0;
        let leftSideBrightness = 0;
        let rightSideBrightness = 0;
        let topBrightness = 0;
        let bottomBrightness = 0;
        let skinPixels = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          totalBrightness += brightness;

          const pixelIdx = i / 4;
          const x = pixelIdx % 160;
          const y = Math.floor(pixelIdx / 160);

          // Skin tone heuristic for face presence detection
          if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
            skinPixels++;
            if (x < 80) leftSideBrightness += brightness;
            else rightSideBrightness += brightness;

            if (y < 60) topBrightness += brightness;
            else bottomBrightness += brightness;
          }
        }

        const skinRatio = skinPixels / (160 * 120);

        // Classify Gaze and Face Presence
        let currentStatus: GazeStatus = 'CENTER';

        if (skinRatio < 0.04) {
          currentStatus = 'FACE_ABSENT';
          consecutiveFaceAbsentFrames++;
        } else if (skinRatio > 0.45) {
          currentStatus = 'MULTIPLE_FACES';
        } else {
          consecutiveFaceAbsentFrames = 0;
          const lrRatio = leftSideBrightness / (rightSideBrightness + 1);
          const tbRatio = topBrightness / (bottomBrightness + 1);

          if (lrRatio > 1.65) {
            currentStatus = 'LOOKING_RIGHT';
          } else if (lrRatio < 0.60) {
            currentStatus = 'LOOKING_LEFT';
          } else if (tbRatio < 0.65) {
            currentStatus = 'LOOKING_DOWN';
          } else {
            currentStatus = 'CENTER';
          }
        }

        setGazeStatus(currentStatus);

        // Trigger Alerts if off-screen sustained
        if (currentStatus !== 'CENTER') {
          consecutiveOffscreenFrames++;
          if (consecutiveOffscreenFrames > 45) {
            // Sustained ~1.5 seconds
            setActiveAlert(
              currentStatus === 'FACE_ABSENT'
                ? 'Face Not Detected in Camera Frame'
                : currentStatus === 'MULTIPLE_FACES'
                ? 'Multiple People Detected in Frame'
                : `Off-Screen Gaze: ${currentStatus.replace('_', ' ')}`
            );
            triggerProctoringEvent(`PROCTORING_${currentStatus}`, {
              status: currentStatus,
              skin_ratio: Math.round(skinRatio * 100),
            });
          }
        } else {
          consecutiveOffscreenFrames = 0;
          setActiveAlert(null);
        }

        // Acoustic Background Noise Anomaly Check
        if (analyserRef.current) {
          const audioArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(audioArray);
          let sum = 0;
          for (let i = 0; i < audioArray.length; i++) {
            sum += audioArray[i];
          }
          const avgVolume = sum / audioArray.length;
          if (avgVolume > 110) {
            setAudioAnomaly(true);
          } else {
            setAudioAnomaly(false);
          }
        }
      }

      animId = requestAnimationFrame(analyzeFrame);
    };

    animId = requestAnimationFrame(analyzeFrame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isCamActive, triggerProctoringEvent]);

  return (
    <div className="relative w-full h-48 bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg flex items-center justify-center">
      {isCamActive ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Real-time Focus Crosshair Reticle */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              className={`w-28 h-28 rounded-full border-2 border-dashed transition-all duration-300 ${
                gazeStatus === 'CENTER'
                  ? 'border-emerald-500/40 scale-100'
                  : 'border-amber-500/80 scale-110'
              }`}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-500 gap-2 p-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <VideoOff className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">Camera Disabled</span>
        </div>
      )}

      {/* Top Status Tags: Live Status + AI Proctoring Trust Score */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
        {/* Live Proctoring Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide backdrop-blur-md border shadow-md transition-all ${
            gazeStatus === 'CENTER'
              ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-300'
              : gazeStatus === 'FACE_ABSENT' || gazeStatus === 'MULTIPLE_FACES'
              ? 'bg-rose-950/80 border-rose-800/60 text-rose-300 animate-pulse'
              : 'bg-amber-950/80 border-amber-800/60 text-amber-300'
          }`}
        >
          {gazeStatus === 'CENTER' ? (
            <Eye className="w-3 h-3 text-emerald-400" />
          ) : gazeStatus === 'FACE_ABSENT' ? (
            <EyeOff className="w-3 h-3 text-rose-400" />
          ) : gazeStatus === 'MULTIPLE_FACES' ? (
            <Users className="w-3 h-3 text-rose-400" />
          ) : (
            <AlertTriangle className="w-3 h-3 text-amber-400" />
          )}
          <span>
            {gazeStatus === 'CENTER'
              ? 'Eye Contact: Center'
              : gazeStatus === 'FACE_ABSENT'
              ? 'Face Absent'
              : gazeStatus === 'MULTIPLE_FACES'
              ? 'Multiple Faces'
              : `Gaze: ${gazeStatus.replace('LOOKING_', '')}`}
          </span>
        </div>

        {/* AI Integrity Trust Score Badge */}
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md border shadow-md ${
            trustScore >= 80
              ? 'bg-indigo-950/80 border-indigo-800/60 text-indigo-300'
              : trustScore >= 60
              ? 'bg-amber-950/80 border-amber-800/60 text-amber-300'
              : 'bg-rose-950/80 border-rose-800/60 text-rose-300'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Trust: {trustScore}%</span>
        </div>
      </div>

      {/* Real-time Warning Banner if Off-Screen */}
      {activeAlert && (
        <div className="absolute top-11 inset-x-2.5 bg-amber-950/90 border border-amber-500/80 text-amber-200 px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 shadow-lg animate-bounce">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
          <span className="truncate">{activeAlert}</span>
        </div>
      )}

      {/* Bottom Candidate Bar */}
      <div className="absolute bottom-2.5 inset-x-2.5 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl px-3 py-1.5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-100">{candidateName}</p>
          <p className="text-[10px] text-slate-400">{targetRole}</p>
        </div>
        <div className="flex items-center gap-2">
          {audioAnomaly && (
            <div className="flex items-center gap-0.5 text-[9px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
              <Volume2 className="w-2.5 h-2.5" />
              <span>Noise</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[10px] text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            <span>Proctored</span>
          </div>
        </div>
      </div>
    </div>
  );
};
