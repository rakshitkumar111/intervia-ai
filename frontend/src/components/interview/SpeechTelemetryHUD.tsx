import React from 'react';
import { SpeechTelemetryResult } from '../../services/speechTelemetry';
import { Gauge, Sparkles, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SpeechTelemetryHUDProps {
  telemetry: SpeechTelemetryResult;
  isRecording: boolean;
}

export const SpeechTelemetryHUD: React.FC<SpeechTelemetryHUDProps> = ({
  telemetry,
  isRecording,
}) => {
  return (
    <div className="bg-slate-950/80 backdrop-blur-md rounded-xl border border-slate-800 p-3 space-y-2.5 text-xs text-slate-300 shadow-lg">
      {/* Top Header: Metric Gauges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-semibold text-slate-200">
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            <span>Speech Telemetry</span>
          </div>
          {isRecording && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-medium animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live Analyzing
            </span>
          )}
        </div>

        {/* Articulation / Clarity Badge */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400">Clarity:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded text-[11px] border ${
              telemetry.clarityScore >= 80
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                : telemetry.clarityScore >= 60
                ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                : 'bg-rose-950/80 border-rose-800 text-rose-300'
            }`}
          >
            {telemetry.clarityScore}%
          </span>
        </div>
      </div>

      {/* Grid of Key Telemetry Stats */}
      <div className="grid grid-cols-3 gap-2">
        {/* Speaking Pace (WPM) */}
        <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Pacing</span>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <span className={`font-bold text-sm ${telemetry.paceColor}`}>
              {telemetry.wpm}
            </span>
            <span className="text-[10px] text-slate-400">WPM</span>
          </div>
          <span className={`text-[10px] font-medium block ${telemetry.paceColor}`}>
            {telemetry.paceCategory}
          </span>
        </div>

        {/* Word Count */}
        <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Spoken</span>
          <div className="mt-0.5 font-bold text-sm text-indigo-300">
            {telemetry.wordCount}
          </div>
          <span className="text-[10px] text-slate-400 block">Words</span>
        </div>

        {/* Filler Words */}
        <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Fillers</span>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <span
              className={`font-bold text-sm ${
                telemetry.fillerWordCount === 0
                  ? 'text-emerald-400'
                  : telemetry.fillerWordCount <= 2
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {telemetry.fillerWordCount}
            </span>
            <span className="text-[10px] text-slate-400">({telemetry.fillerPercentage}%)</span>
          </div>
          <span className="text-[10px] text-slate-400 block">
            {telemetry.fillerWordCount === 0 ? 'Clean' : 'Detected'}
          </span>
        </div>
      </div>

      {/* Filler Words Pill Cloud if Any Detected */}
      {telemetry.fillerWordCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-slate-400 font-medium">Fillers Identified:</span>
          {Object.entries(telemetry.fillerWordsBreakdown).map(([word, count]) => (
            <span
              key={word}
              className="bg-amber-950/60 border border-amber-800/70 text-amber-300 text-[10px] px-2 py-0.5 rounded-md font-mono"
            >
              "{word}" <strong className="text-amber-200">×{count}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Real-time Delivery Coaching Tip */}
      {telemetry.suggestions.length > 0 && (
        <div className="flex items-start gap-1.5 bg-slate-900/60 rounded-lg p-2 border border-slate-800/80 text-[11px] text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <span className="leading-snug">{telemetry.suggestions[0]}</span>
        </div>
      )}
    </div>
  );
};
