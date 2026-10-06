// Cross-browser Speech Recognition type declaration
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

export interface SpeechRecognitionHandlers {
  onTranscript: (finalTranscript: string, interimTranscript: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

export class SpeechEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private finalTranscript: string = '';
  private interimTranscript: string = '';
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private currentLanguage: string = 'English';
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-IN';
      console.log('[MIC] initialized');
    }

    if (this.isTTSSupported()) {
      this.loadVoices();
      if (typeof window.speechSynthesis !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  private loadVoices(): void {
    if (typeof window.speechSynthesis !== 'undefined') {
      this.cachedVoices = window.speechSynthesis.getVoices() || [];
      const selected = this.getAvailableFemaleVoice();
      if (selected) {
        console.log(`[SPEECH] Female voice primed: ${selected.name} (${selected.lang})`);
      }
    }
  }

  public setLanguage(language: string) {
    this.currentLanguage = language;
    if (this.recognition) {
      if (language === 'Hindi') {
        this.recognition.lang = 'hi-IN';
      } else if (language === 'Hinglish') {
        this.recognition.lang = 'en-IN';
      } else {
        this.recognition.lang = 'en-US';
      }
      console.log(`[STT Language Set]: ${language} (Code: ${this.recognition.lang})`);
    }
  }

  public isSTTSupported(): boolean {
    return !!this.recognition;
  }

  public isTTSSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Starts live Speech-to-Text recognition
   */
  public startListening(handlers: SpeechRecognitionHandlers, initialFinalTranscript: string = '') {
    if (!this.recognition) {
      handlers.onError('Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or type manually.');
      return;
    }

    if (this.isListening) {
      return;
    }

    this.finalTranscript = initialFinalTranscript ? initialFinalTranscript.trim() + ' ' : '';
    this.interimTranscript = '';
    this.isListening = true;
    console.log('[MIC] listening');
    console.log('[STT] started');

    this.recognition.onresult = (event: any) => {
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const transcriptText = item[0].transcript;

        if (item.isFinal) {
          this.finalTranscript += transcriptText + ' ';
          console.log(`[STT] final: ${transcriptText.trim()}`);
        } else {
          currentInterim += transcriptText;
        }
      }

      this.interimTranscript = currentInterim;
      handlers.onTranscript(this.finalTranscript.trim(), this.interimTranscript.trim());
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition event error:', event.error);
      if (event.error === 'not-allowed') {
        handlers.onError('Microphone access was denied. Please allow microphone permissions in browser settings.');
      } else if (event.error === 'network') {
        handlers.onError('Network connection error in speech recognition.');
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch (e) {
          // Ignore already started errors
        }
      }
      handlers.onEnd();
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed or already active:', err);
    }
  }

  /**
   * Stops Speech-to-Text recognition completely
   */
  public stopListening(): string {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('Recognition stop exception:', err);
      }
    }
    const finalResult = (this.finalTranscript + ' ' + this.interimTranscript).trim();
    this.interimTranscript = '';
    return finalResult;
  }

  public pauseListening(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('Recognition pause exception:', err);
      }
      console.log('[MIC] paused');
    }
  }

  public clearTranscript(): void {
    this.finalTranscript = '';
    this.interimTranscript = '';
  }

  public getFinalTranscript(): string {
    return this.finalTranscript.trim();
  }

  /**
   * Strictly Selects a Female Voice for the Local Fallback Avatar
   */
  public getAvailableFemaleVoice(): SpeechSynthesisVoice | null {
    if (!this.isTTSSupported()) return null;

    const voices = (this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices()) || [];
    if (!voices || voices.length === 0) return null;

    // Filter out known male voice signatures
    const maleNames = [
      'daniel', 'david', 'george', 'mark', 'james', 'richard', 'alex', 'fred',
      'oliver', 'rishi', 'hemant', 'male', 'guy', 'stefan', 'tom', 'diego', 'jorge'
    ];

    // Priority 1: Language-specific Female Voice (Hindi/Indian)
    if (this.currentLanguage === 'Hindi') {
      const hindiFemale = voices.find(v => 
        (v.lang.includes('hi') || v.name.toLowerCase().includes('hindi')) &&
        !maleNames.some(m => v.name.toLowerCase().includes(m))
      );
      if (hindiFemale) return hindiFemale;
    }

    // Priority 2: Explicit high-quality female natural voices
    const preferredFemaleNames = [
      'jenny', 'aria', 'zira', 'samantha', 'victoria', 'karen', 'fiona',
      'moira', 'tessa', 'veena', 'sangeeta', 'swara', 'kalpana', 'google us english female', 'microsoft zira', 'microsoft jenny'
    ];

    for (const name of preferredFemaleNames) {
      const found = voices.find(v => v.name.toLowerCase().includes(name));
      if (found) return found;
    }

    // Priority 3: Non-male English or Indian female voice
    const femaleCandidate = voices.find(v => {
      const vName = v.name.toLowerCase();
      const isMatchingLang = v.lang.startsWith('en') || v.lang.startsWith('hi');
      const isMale = maleNames.some(m => vName.includes(m));
      return isMatchingLang && !isMale;
    });

    if (femaleCandidate) return femaleCandidate;

    // Fallback: Pick any non-male voice
    const nonMale = voices.find(v => !maleNames.some(m => v.name.toLowerCase().includes(m)));
    return nonMale || voices[0];
  }

  public getSelectedFemaleVoiceName(): string {
    const voice = this.getAvailableFemaleVoice();
    return voice ? voice.name : 'System Female Default';
  }

  /**
   * Speaks text using strictly female browser TTS
   */
  public speak(
    text: string,
    options: {
      onStart?: () => void;
      onEnd?: () => void;
      onBoundary?: (event: SpeechSynthesisEvent) => void;
      onError?: (error: any) => void;
      rate?: number;
      pitch?: number;
    } = {}
  ): void {
    if (!this.isTTSSupported()) {
      options.onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const femaleVoice = this.getAvailableFemaleVoice();

    if (femaleVoice) {
      utterance.voice = femaleVoice;
      console.log(`[SPEECH] provider = LOCAL_TTS, voice = ${femaleVoice.name} (${femaleVoice.lang})`);
    } else {
      console.log('[SPEECH] provider = LOCAL_TTS, voice = FEMALE (pitched)');
    }

    // Feminine pitch (1.08) and natural conversational pacing (0.96)
    utterance.rate = options.rate || 0.96;
    utterance.pitch = options.pitch || 1.08;

    utterance.onstart = () => {
      console.log('[LOCAL FEMALE TTS] speaking started');
      options.onStart?.();
    };

    utterance.onend = () => {
      console.log('[LOCAL FEMALE TTS] speaking ended');
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onboundary = (event) => {
      options.onBoundary?.(event);
    };

    utterance.onerror = (err) => {
      console.warn('[LOCAL TTS] utterance error:', err);
      this.currentUtterance = null;
      options.onError?.(err);
      options.onEnd?.();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.isTTSSupported()) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
      console.log('[TTS] stopped');
    }
  }

  /**
   * Initializes candidate AudioContext Analyser
   */
  public async initAudioAnalyser(): Promise<boolean> {
    try {
      if (this.audioContext && this.analyser) {
        return true;
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);
      return true;
    } catch (e) {
      console.warn('AudioAnalyser initialization warning:', e);
      return false;
    }
  }

  public getAudioVolume(): number {
    if (!this.analyser) return 0;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const avg = sum / bufferLength;
    return Math.min(1.0, Math.max(0.0, avg / 128));
  }

  public releaseMicrophone(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
  }
}

export const speechEngine = new SpeechEngine();
