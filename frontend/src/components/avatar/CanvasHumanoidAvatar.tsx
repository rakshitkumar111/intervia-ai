import React, { useEffect, useRef } from 'react';
import { AvatarState, VisemeType } from '../../types';
import { LipSyncController } from './LipSyncController';

interface CanvasHumanoidAvatarProps {
  state: AvatarState;
  currentViseme?: VisemeType;
  audioLevel?: number;
  interviewerName?: string;
  interviewerTitle?: string;
}

export const CanvasHumanoidAvatar: React.FC<CanvasHumanoidAvatarProps> = ({
  state,
  currentViseme = 'REST',
  audioLevel = 0,
  interviewerName = 'Dr. Sarah Mitchell',
  interviewerTitle = 'Senior AI Technical Interviewer'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lipSyncRef = useRef<LipSyncController>(new LipSyncController());
  const animationFrameRef = useRef<number | null>(null);

  const timeRef = useRef<number>(0);
  const blinkStateRef = useRef<{ isBlinking: boolean; blinkProgress: number; nextBlinkTime: number }>({
    isBlinking: false,
    blinkProgress: 0,
    nextBlinkTime: 2.5
  });
  const nodOffsetRef = useRef<number>(0);

  useEffect(() => {
    lipSyncRef.current.setViseme(currentViseme, audioLevel);
  }, [currentViseme, audioLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      timeRef.current += 0.025;
      const t = timeRef.current;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // 1. Dynamic Background & Lighting Aura
      const bgGrad = ctx.createRadialGradient(centerX, centerY - 20, 50, centerX, centerY, width * 0.7);
      if (state === 'TALKING') {
        bgGrad.addColorStop(0, '#0e2442');
        bgGrad.addColorStop(1, '#080d1a');
      } else if (state === 'LISTENING') {
        bgGrad.addColorStop(0, '#0c2e28');
        bgGrad.addColorStop(1, '#080d1a');
      } else if (state === 'THINKING' || state === 'PROCESSING') {
        bgGrad.addColorStop(0, '#241a3e');
        bgGrad.addColorStop(1, '#080d1a');
      } else {
        bgGrad.addColorStop(0, '#131e33');
        bgGrad.addColorStop(1, '#080d1a');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle ambient particle dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < 20; i++) {
        const px = (Math.sin(i * 99 + t * 0.2) * 0.5 + 0.5) * width;
        const py = (Math.cos(i * 33 + t * 0.2) * 0.5 + 0.5) * height;
        ctx.beginPath();
        ctx.arc(px, py, (i % 3) + 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Thinking Halo Effect
      if (state === 'THINKING' || state === 'PROCESSING') {
        ctx.save();
        const pulse = Math.sin(t * 4) * 10 + 15;
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 60, 110 + pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 60, 125 + pulse * 1.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Physics & Motion Calculations
      const breathing = Math.sin(t * 1.5) * 3;
      
      if (state === 'LISTENING' && audioLevel > 0.15) {
        nodOffsetRef.current = Math.sin(t * 5) * 4;
      } else {
        nodOffsetRef.current *= 0.9;
      }

      let headTiltY = breathing + nodOffsetRef.current;
      let headTiltX = 0;
      if (state === 'TALKING') {
        headTiltY += Math.sin(t * 6) * 2;
        headTiltX = Math.cos(t * 3) * 1.5;
      } else if (state === 'THINKING' || state === 'PROCESSING') {
        headTiltX = 3;
        headTiltY -= 2;
      }

      // Blinking Logic
      const blink = blinkStateRef.current;
      if (!blink.isBlinking && t > blink.nextBlinkTime) {
        blink.isBlinking = true;
        blink.blinkProgress = 0;
      }
      if (blink.isBlinking) {
        blink.blinkProgress += 0.18;
        if (blink.blinkProgress >= 1.0) {
          blink.isBlinking = false;
          blink.blinkProgress = 0;
          blink.nextBlinkTime = t + 2.5 + Math.random() * 3.5;
        }
      }
      const eyeOpenFactor = blink.isBlinking ? Math.abs(Math.sin(blink.blinkProgress * Math.PI - Math.PI / 2)) : 1.0;

      const mouth = lipSyncRef.current.update();

      // ================= AVATAR RENDERING ================= //
      ctx.save();
      ctx.translate(centerX + headTiltX, centerY + headTiltY);

      // 3. Body & Professional Attire
      const bodyY = 100;
      ctx.fillStyle = '#1e293b'; // Navy Suit
      ctx.beginPath();
      ctx.moveTo(-160, height - centerY);
      ctx.lineTo(-110, bodyY + 30);
      ctx.quadraticCurveTo(-50, bodyY + 15, 0, bodyY + 25);
      ctx.quadraticCurveTo(50, bodyY + 15, 110, bodyY + 30);
      ctx.lineTo(160, height - centerY);
      ctx.closePath();
      ctx.fill();

      // Suit Lapels & Shadow
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-70, bodyY + 30);
      ctx.lineTo(-20, bodyY + 110);
      ctx.lineTo(0, bodyY + 130);
      ctx.lineTo(20, bodyY + 110);
      ctx.lineTo(70, bodyY + 30);
      ctx.stroke();

      // Crisp White Collared Shirt
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(-45, bodyY + 20);
      ctx.lineTo(0, bodyY + 85);
      ctx.lineTo(45, bodyY + 20);
      ctx.lineTo(0, bodyY + 28);
      ctx.closePath();
      ctx.fill();

      // Tie
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(-10, bodyY + 32);
      ctx.lineTo(10, bodyY + 32);
      ctx.lineTo(14, bodyY + 120);
      ctx.lineTo(0, bodyY + 140);
      ctx.lineTo(-14, bodyY + 120);
      ctx.closePath();
      ctx.fill();

      // 4. Neck & Face Anatomy
      const neckGrad = ctx.createLinearGradient(0, bodyY - 30, 0, bodyY + 20);
      neckGrad.addColorStop(0, '#e5a285');
      neckGrad.addColorStop(1, '#c5785d');
      ctx.fillStyle = neckGrad;
      ctx.beginPath();
      ctx.moveTo(-28, bodyY - 35);
      ctx.lineTo(-28, bodyY + 25);
      ctx.quadraticCurveTo(0, bodyY + 32, 28, bodyY + 25);
      ctx.lineTo(28, bodyY - 35);
      ctx.closePath();
      ctx.fill();

      const headY = -35;
      const headRadiusX = 64;
      const headRadiusY = 82;

      // Hair Back
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(0, headY - 10, headRadiusX + 10, headRadiusY + 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      ctx.fillStyle = '#e8a588';
      ctx.beginPath();
      ctx.ellipse(-headRadiusX + 2, headY + 5, 10, 16, 0, 0, Math.PI * 2);
      ctx.ellipse(headRadiusX - 2, headY + 5, 10, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Face Oval Skin
      const skinGrad = ctx.createRadialGradient(-10, headY - 20, 10, 0, headY, headRadiusY);
      skinGrad.addColorStop(0, '#f9c5ad');
      skinGrad.addColorStop(0.7, '#ebb094');
      skinGrad.addColorStop(1, '#d89476');
      ctx.fillStyle = skinGrad;
      ctx.beginPath();
      ctx.ellipse(0, headY, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.moveTo(-headRadiusX - 6, headY - 15);
      ctx.quadraticCurveTo(-45, headY - headRadiusY - 12, 0, headY - headRadiusY - 8);
      ctx.quadraticCurveTo(45, headY - headRadiusY - 12, headRadiusX + 6, headY - 15);
      ctx.quadraticCurveTo(headRadiusX + 10, headY + 30, headRadiusX - 8, headY + 45);
      ctx.quadraticCurveTo(50, headY - 25, 20, headY - 45);
      ctx.quadraticCurveTo(-20, headY - 40, -headRadiusX + 8, headY + 45);
      ctx.quadraticCurveTo(-headRadiusX - 10, headY + 30, -headRadiusX - 6, headY - 15);
      ctx.closePath();
      ctx.fill();

      // Eyebrows
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      let browTilt = (state === 'THINKING' || state === 'PROCESSING') ? -2 : (state === 'LISTENING' ? 1.5 : 0);

      ctx.beginPath();
      ctx.moveTo(-44, headY - 22 + browTilt);
      ctx.quadraticCurveTo(-28, headY - 28 - browTilt, -12, headY - 21);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(12, headY - 21);
      ctx.quadraticCurveTo(28, headY - 28 - browTilt, 44, headY - 22 + browTilt);
      ctx.stroke();

      // Eyes
      const renderEye = (eyeX: number) => {
        const eyeY = headY - 10;
        const eyeW = 16;
        const eyeH = Math.max(1, 10 * eyeOpenFactor);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
        ctx.fill();

        if (eyeOpenFactor > 0.25) {
          let gazeX = (state === 'THINKING' || state === 'PROCESSING') ? 1.5 : (state === 'TALKING' ? Math.sin(t * 2) * 1.2 : 0);
          let gazeY = (state === 'THINKING' || state === 'PROCESSING') ? -2.5 : 0;

          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.arc(eyeX + gazeX, eyeY + gazeY, 5.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#09090b';
          ctx.beginPath();
          ctx.arc(eyeX + gazeX, eyeY + gazeY, 2.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.arc(eyeX + gazeX - 1.8, eyeY + gazeY - 1.8, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      renderEye(-28);
      renderEye(28);

      // Nose
      ctx.strokeStyle = 'rgba(180, 83, 9, 0.4)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, headY - 10);
      ctx.lineTo(-2, headY + 12);
      ctx.quadraticCurveTo(0, headY + 16, 5, headY + 13);
      ctx.stroke();

      // Mouth
      const mouthY = headY + 34;
      const mouthW = 20 * mouth.width;
      const mouthOpen = mouth.openHeight;

      if (mouthOpen > 2) {
        ctx.fillStyle = '#450a0a';
        ctx.beginPath();
        ctx.ellipse(0, mouthY + mouthOpen * 0.3, mouthW, mouthOpen * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.rect(-mouthW * 0.6, mouthY - 1, mouthW * 1.2, Math.min(5, mouthOpen * 0.4));
        ctx.fill();
      }

      ctx.strokeStyle = '#be123c';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-mouthW, mouthY);
      ctx.quadraticCurveTo(-mouthW * 0.4, mouthY - 3, 0, mouthY - 1);
      ctx.quadraticCurveTo(mouthW * 0.4, mouthY - 3, mouthW, mouthY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-mouthW, mouthY);
      ctx.quadraticCurveTo(0, mouthY + Math.max(3, mouthOpen * 0.9) + 4, mouthW, mouthY);
      ctx.stroke();

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state, currentViseme, audioLevel]);

  const getStateBadge = () => {
    switch (state) {
      case 'TALKING':
        return { label: 'Speaking', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'LISTENING':
        return { label: 'Listening to you', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'THINKING':
        return { label: 'Evaluating response...', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      case 'PROCESSING':
        return { label: 'Processing...', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'IDLE':
      default:
        return { label: 'Ready', color: 'bg-slate-700/40 text-slate-300 border-slate-600/40' };
    }
  };

  const badge = getStateBadge();

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      <canvas
        ref={canvasRef}
        width={480}
        height={420}
        className="w-full h-auto max-h-[380px] object-contain rounded-2xl"
      />

      <div className="absolute top-4 left-4 flex items-center space-x-2">
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${badge.color} backdrop-blur-md flex items-center gap-1.5`}>
          <span className="w-2 h-2 rounded-full bg-current animate-ping" />
          {badge.label}
        </span>
      </div>

      <div className="absolute bottom-3 inset-x-3 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-100">{interviewerName}</h4>
          <p className="text-xs text-slate-400">{interviewerTitle}</p>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span>Canvas 2D Fallback</span>
        </div>
      </div>
    </div>
  );
};
