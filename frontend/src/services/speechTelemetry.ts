export interface SpeechTelemetryResult {
  wordCount: number;
  speakingTimeSeconds: number;
  wpm: number;
  paceCategory: 'Slow' | 'Optimal' | 'Fast';
  paceColor: string;
  fillerWordCount: number;
  fillerWordsBreakdown: Record<string, number>;
  fillerPercentage: number;
  clarityScore: number; // 0 - 100%
  suggestions: string[];
}

const FILLER_WORDS_CATALOG: string[] = [
  // English
  'um',
  'uh',
  'uhm',
  'er',
  'ah',
  'like',
  'you know',
  'basically',
  'actually',
  'literally',
  'sort of',
  'kind of',
  'i mean',
  'right',
  'you see',
  // Hindi & Hinglish
  'matlab',
  'woh',
  'yaani',
  'jaise ki',
  'hai na',
  'toh',
  'samjhe',
  'aur kya',
];

export class SpeechTelemetryEngine {
  /**
   * Analyzes live spoken transcript and speaking duration to compute real-time telemetry.
   */
  public static analyzeSpeech(
    transcript: string,
    speakingDurationSeconds: number
  ): SpeechTelemetryResult {
    const cleanText = transcript.trim().toLowerCase();
    if (!cleanText) {
      return {
        wordCount: 0,
        speakingTimeSeconds: speakingDurationSeconds,
        wpm: 0,
        paceCategory: 'Optimal',
        paceColor: 'text-emerald-400',
        fillerWordCount: 0,
        fillerWordsBreakdown: {},
        fillerPercentage: 0,
        clarityScore: 100,
        suggestions: ['Start speaking your answer clearly into the microphone.'],
      };
    }

    // Split words
    const words = cleanText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Calculate WPM (prevent division by zero, min 3 seconds duration for fair rate)
    const effectiveMinutes = Math.max(speakingDurationSeconds, 3) / 60;
    const rawWpm = Math.round(wordCount / effectiveMinutes);
    const wpm = Math.min(Math.max(rawWpm, 0), 300);

    // Determine Pace Category
    let paceCategory: 'Slow' | 'Optimal' | 'Fast' = 'Optimal';
    let paceColor = 'text-emerald-400';

    if (wpm < 110) {
      paceCategory = 'Slow';
      paceColor = 'text-amber-400';
    } else if (wpm > 165) {
      paceCategory = 'Fast';
      paceColor = 'text-cyan-400';
    } else {
      paceCategory = 'Optimal';
      paceColor = 'text-emerald-400';
    }

    // Detect Filler Words
    const fillerBreakdown: Record<string, number> = {};
    let totalFillers = 0;

    FILLER_WORDS_CATALOG.forEach((filler) => {
      // Check multi-word fillers or exact word matches with regex boundary
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = cleanText.match(regex);
      if (matches && matches.length > 0) {
        fillerBreakdown[filler] = matches.length;
        totalFillers += matches.length;
      }
    });

    const fillerPercentage = wordCount > 0 ? Math.round((totalFillers / wordCount) * 100) : 0;

    // Compute Clarity Score (100 base, deductions for fillers and extreme pace)
    let clarity = 100;
    clarity -= Math.min(totalFillers * 4, 35); // Fillers deduction

    if (paceCategory === 'Slow' && speakingDurationSeconds > 10) {
      clarity -= 10;
    } else if (paceCategory === 'Fast') {
      clarity -= 15;
    }
    const clarityScore = Math.max(Math.min(clarity, 100), 20);

    // Suggestions
    const suggestions: string[] = [];
    if (totalFillers > 2) {
      const topFillers = Object.entries(fillerBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([w, c]) => `"${w}" (${c}x)`)
        .join(', ');
      suggestions.push(`Try replacing filler phrases like ${topFillers} with natural brief pauses.`);
    }

    if (paceCategory === 'Fast') {
      suggestions.push('You are speaking quite fast (>165 WPM). Slow down slightly to emphasize key points.');
    } else if (paceCategory === 'Slow' && wordCount > 10) {
      suggestions.push('Speaking pace is on the slower side (<110 WPM). Aim for a steady, confident cadence.');
    } else if (paceCategory === 'Optimal') {
      suggestions.push('Pacing is optimal and easy to follow. Keep it up!');
    }

    return {
      wordCount,
      speakingTimeSeconds: speakingDurationSeconds,
      wpm,
      paceCategory,
      paceColor,
      fillerWordCount: totalFillers,
      fillerWordsBreakdown: fillerBreakdown,
      fillerPercentage,
      clarityScore,
      suggestions,
    };
  }
}
