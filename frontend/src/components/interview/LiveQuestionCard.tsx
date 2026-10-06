import React, { useState } from 'react';
import { HelpCircle, Sparkles, Volume2, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { InterviewQuestion } from '../../types';

interface LiveQuestionCardProps {
  question: InterviewQuestion | null;
  currentIndex: number;
  totalQuestions: number;
  onReplayAudio?: () => void;
  isSpeaking?: boolean;
  isPracticeMode?: boolean;
}

export const LiveQuestionCard: React.FC<LiveQuestionCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  onReplayAudio,
  isSpeaking = false,
  isPracticeMode = false
}) => {
  const [showHint, setShowHint] = useState(false);

  if (!question) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        Loading interview questions...
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Decorative subtle accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs font-semibold">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          {isPracticeMode && (
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold flex items-center gap-1">
              <Lightbulb className="w-3 h-3" />
              Practice Mode
            </span>
          )}
          {question.is_follow_up && (
            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Dynamic Follow-Up
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {question.category && (
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium border border-slate-700">
              {question.category}
            </span>
          )}
          <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium border border-slate-700">
            {question.difficulty}
          </span>
        </div>
      </div>

      {/* Question Prompt */}
      <div className="my-2">
        <h3 className="text-xl md:text-2xl font-bold text-slate-100 leading-snug tracking-tight">
          "{question.question_text}"
        </h3>
      </div>

      {/* Practice Mode Hint Drawer */}
      {(isPracticeMode || question.hint) && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold hover:text-amber-300 transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{showHint ? 'Hide Practice Hint' : 'Show Practice Hint & Framework'}</span>
            {showHint ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showHint && (
            <div className="mt-2 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200/90 leading-relaxed">
              <span className="font-bold text-amber-300 block mb-1">💡 Recommended Approach:</span>
              <p>{question.hint || 'Structure your response using STAR method: Situation, Task, Action, Result. Mention specific technical components and trade-offs.'}</p>
            </div>
          )}
        </div>
      )}

      {/* Bottom info & Audio Replay */}
      <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>Speak clearly into your microphone or refine your answer in the transcript editor below.</span>
        </div>

        {onReplayAudio && (
          <button
            onClick={onReplayAudio}
            disabled={isSpeaking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors font-medium text-xs disabled:opacity-50"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-pulse text-purple-400' : ''}`} />
            <span>{isSpeaking ? 'Speaking...' : 'Repeat Question'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
