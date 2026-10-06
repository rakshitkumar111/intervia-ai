import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  audioLevel: number; // 0.0 to 1.0
  color?: string;
  barCount?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  audioLevel,
  color = '#0284c7',
  barCount = 18
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.08;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const spacing = 3;
      const barWidth = (width - (barCount - 1) * spacing) / barCount;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;
        if (isActive) {
          const wave = Math.sin(time * 3 + i * 0.4) * 0.5 + 0.5;
          const noise = Math.sin(i * 99 + time) * 0.2;
          const dynamicAmp = Math.max(0.15, audioLevel * 1.8);
          barHeight = Math.min(height, Math.max(4, height * dynamicAmp * (wave + noise)));
        }

        const x = i * (barWidth + spacing);
        const y = (height - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, color);
        grad.addColorStop(1, '#38bdf8');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isActive, audioLevel, color, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={140}
      height={32}
      className="w-32 h-8 rounded-lg bg-slate-950/40 p-1"
    />
  );
};
