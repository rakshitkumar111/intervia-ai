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
  private audioPlayer: HTMLAudioElement | null = null;
  private boundaryInterval: number | null = null;
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
   * Selects a Natural Female Voice, filtering out robotic legacy desktop voices
   */
  public getAvailableFemaleVoice(): SpeechSynthesisVoice | null {
    if (!this.isTTSSupported()) return null;

    const voices = (this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices()) || [];
    if (!voices || voices.length === 0) return null;

    // Filter out known male voice signatures & robotic legacy voices
    const unwantedNames = [
      'daniel', 'david', 'george', 'mark', 'james', 'richard', 'alex', 'fred',
      'oliver', 'rishi', 'hemant', 'male', 'guy', 'stefan', 'tom', 'diego', 'jorge',
      'desktop', 'zira desktop'
    ];

    // Priority 1: High-Definition Neural / Natural voices (Edge & Chrome natural neural voices)
    const naturalNeuralVoice = voices.find(v => {
      const vName = v.name.toLowerCase();
      const isNatural = vName.includes('natural') || vName.includes('neural') || vName.includes('online (natural)');
      const isUnwanted = unwantedNames.some(u => vName.includes(u));
      return isNatural && !isUnwanted && (v.lang.startsWith('en') || v.lang.startsWith('hi'));
    });
    if (naturalNeuralVoice) return naturalNeuralVoice;

    // Priority 2: Explicit high-quality female natural voices (excluding legacy desktop)
    const preferredFemaleNames = [
      'jenny', 'aria', 'ava', 'sonia', 'samantha', 'victoria', 'karen', 'fiona',
      'moira', 'tessa', 'neerja', 'veena', 'sangeeta', 'swara', 'kalpana', 'google us english female', 'google us english'
    ];

    for (const name of preferredFemaleNames) {
      const found = voices.find(v => {
        const vName = v.name.toLowerCase();
        return vName.includes(name) && !vName.includes('desktop');
      });
      if (found) return found;
    }

    // Priority 3: Non-male English or Indian female voice
    const femaleCandidate = voices.find(v => {
      const vName = v.name.toLowerCase();
      const isMatchingLang = v.lang.startsWith('en') || v.lang.startsWith('hi');
      const isUnwanted = unwantedNames.some(m => vName.includes(m));
      return isMatchingLang && !isUnwanted;
    });

    if (femaleCandidate) return femaleCandidate;

    // Fallback: Pick any non-male voice
    const nonMale = voices.find(v => !unwantedNames.some(m => v.name.toLowerCase().includes(m)));
    return nonMale || voices[0];
  }

  public getSelectedFemaleVoiceName(): string {
    const voice = this.getAvailableFemaleVoice();
    return voice ? voice.name : 'Studio Neural Female Voice';
  }

  public unlockAudio(): void {
    try {
      const silentAudio = new Audio();
      silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      silentAudio.play().catch(() => {});
    } catch (e) {
      console.warn('[SPEECH] unlockAudio warning:', e);
    }
  }

  /**
   * Speaks text using Lifelike Neural Voice (with Web Speech fallback)
   */
  public async speak(
    text: string,
    options: {
      onStart?: () => void;
      onEnd?: () => void;
      onBoundary?: (event?: any) => void;
      onError?: (error: any) => void;
      voice?: string;
      rate?: number;
      pitch?: number;
    } = {}
  ): Promise<void> {
    this.stopSpeaking();

    // 1. Primary: Server-side Studio Neural Voice (Authentic Indian Voice or Kokoro-82M)
    try {
      const targetVoice = options.voice || (
        this.currentLanguage === 'Hindi'
          ? 'hi-IN-SwaraNeural'
          : 'en-IN-NeerjaNeural' // Authentic Indian English Voice by default
      );

      const response = await fetch('/api/speech/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: targetVoice,
          language: this.currentLanguage
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const player = new Audio(audioUrl);
        this.audioPlayer = player;

        player.onplay = () => {
          console.log(`[SPEECH] Lifelike Studio Neural Voice active (${targetVoice})`);
          options.onStart?.();

          // Smooth phonetic viseme lipsync simulation
          if (this.boundaryInterval) clearInterval(this.boundaryInterval);
          this.boundaryInterval = window.setInterval(() => {
            options.onBoundary?.();
          }, 160);
        };

        player.onended = () => {
          if (this.boundaryInterval) {
            clearInterval(this.boundaryInterval);
            this.boundaryInterval = null;
          }
          URL.revokeObjectURL(audioUrl);
          this.audioPlayer = null;
          console.log('[SPEECH] Studio Neural Voice playback completed.');
          options.onEnd?.();
        };

        player.onerror = (err) => {
          console.warn('[SPEECH] Neural audio playback error:', err);
          if (this.boundaryInterval) {
            clearInterval(this.boundaryInterval);
            this.boundaryInterval = null;
          }
          URL.revokeObjectURL(audioUrl);
          this.audioPlayer = null;
          options.onEnd?.();
        };

        try {
          await player.play();
          return;
        } catch (playErr: any) {
          if (playErr?.name === 'NotAllowedError') {
            console.warn('[SPEECH] Autoplay blocked by browser policy. Will play on first candidate click/gesture.');
            const playOnInteraction = () => {
              player.play().catch(console.warn);
              window.removeEventListener('click', playOnInteraction);
              window.removeEventListener('keydown', playOnInteraction);
            };
            window.addEventListener('click', playOnInteraction, { once: true });
            window.addEventListener('keydown', playOnInteraction, { once: true });
            return;
          }
          throw playErr;
        }
      }
    } catch (networkErr) {
      console.warn('[SPEECH] Neural synthesis endpoint unavailable, trying natural Web Speech:', networkErr);
    }

    // 2. Secondary: Browser Web Speech API (only if server completely unreachable)
    this.speakWebSpeech(text, options);
  }

  /**
   * Browser Web Speech API fallback
   */
  public speakWebSpeech(
    text: string,
    options: {
      onStart?: () => void;
      onEnd?: () => void;
      onBoundary?: (event?: any) => void;
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
      console.log(`[SPEECH] Web Speech provider active: ${femaleVoice.name} (${femaleVoice.lang})`);
    }

    // Natural human conversational pacing and natural pitch
    utterance.rate = options.rate || 0.98;
    utterance.pitch = options.pitch || 1.0;

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
    if (this.boundaryInterval) {
      clearInterval(this.boundaryInterval);
      this.boundaryInterval = null;
    }
    if (this.audioPlayer) {
      try {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
      } catch (e) {}
      this.audioPlayer = null;
    }
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
