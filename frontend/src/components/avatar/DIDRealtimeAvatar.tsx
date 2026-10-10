import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AvatarState, VisemeType } from '../../types';
import { avatarApi } from '../../services/avatarApi';
import { createAgentManager } from '@d-id/client-sdk';
import { Video, AlertCircle, RefreshCw, Volume2, Globe, ExternalLink, Sparkles, AlertTriangle } from 'lucide-react';

interface DIDRealtimeAvatarProps {
  state: AvatarState;
  currentViseme?: VisemeType;
  audioLevel?: number;
  interviewerName?: string;
  interviewerTitle?: string;
  speechText?: string;
  connectionGeneration: number;
  onStreamReady?: () => void;
  onFallbackRequest: (reason: string) => void;
  onSpeakingStarted?: () => void;
  onSpeakingEnded?: () => void;
}

// Module-level Singleton State to manage D-ID session lifecycle cleanly
let activeAgentManager: any = null;
let activeMediaStream: MediaStream | null = null;
let isConnectionInProgress = false;

export const DIDRealtimeAvatar: React.FC<DIDRealtimeAvatarProps> = ({
  state,
  interviewerName = 'Dr. Sarah Mitchell',
  interviewerTitle = 'Senior AI Technical Interviewer',
  speechText = '',
  connectionGeneration,
  onStreamReady,
  onFallbackRequest,
  onSpeakingStarted,
  onSpeakingEnded
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<'initializing' | 'connecting' | 'connected' | 'error' | 'unconfigured' | 'domain_mismatch'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInsufficientCredits, setIsInsufficientCredits] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<{ status?: number; code?: string; message?: string } | null>(null);
  const [needsAudioGesture, setNeedsAudioGesture] = useState<boolean>(false);
  
  const lastSpokenTextRef = useRef<string>('');
  const isMountedRef = useRef<boolean>(true);
  const speechEndTimerRef = useRef<number | null>(null);
  const connectTimeoutRef = useRef<number | null>(null);
  const hasTriggeredFallbackRef = useRef<boolean>(false);
  const connectionGenRef = useRef<number>(connectionGeneration);
  // Ref so timeout callbacks always read the latest connection status (avoids stale closure)
  const connectionStatusRef = useRef<string>('initializing');

  useEffect(() => {
    connectionGenRef.current = connectionGeneration;
  }, [connectionGeneration]);

  // Keep the ref in sync so closure callbacks (e.g. setTimeout) always see the latest status
  const setStatus = (s: 'initializing' | 'connecting' | 'connected' | 'error' | 'unconfigured' | 'domain_mismatch') => {
    connectionStatusRef.current = s;
    setConnectionStatus(s);
  };

  // Requirement 15 & 16: Mute WebRTC audio when not in TALKING state
  useEffect(() => {
    if (videoRef.current) {
      if (state === 'TALKING') {
        videoRef.current.muted = false;
      } else {
        videoRef.current.muted = true;
      }
    }
  }, [state]);

  // Requirement 19: Comprehensive cleanup of old WebRTC tracks & AgentManager
  const cleanupActiveSession = async () => {
    if (activeMediaStream) {
      console.log('[D-ID Cleanup] Stopping active MediaStream tracks...');
      activeMediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      activeMediaStream = null;
    }

    if (activeAgentManager) {
      console.log('[D-ID Cleanup] Disconnecting active AgentManager...');
      try {
        await activeAgentManager.disconnect();
      } catch (e) {
        console.warn('[D-ID Cleanup] Disconnect exception:', e);
      }
      activeAgentManager = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    isConnectionInProgress = false;
  };

  const triggerTerminalFallback = useCallback((reason: string) => {
    if (hasTriggeredFallbackRef.current) return;
    hasTriggeredFallbackRef.current = true;

    console.warn('[D-ID Fallback Triggered]:', reason);
    if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);

    cleanupActiveSession();
    onFallbackRequest(reason);
  }, [onFallbackRequest]);

  // 1. Initialize Singleton D-ID Session with Generation Guard
  const initDIDAgency = useCallback(async (isRetry = false) => {
    const currentGen = connectionGenRef.current;
    if (isConnectionInProgress && !isRetry) {
      console.log('[D-ID Singleton] Connection already in progress, skipping duplicate call.');
      return;
    }

    if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
    hasTriggeredFallbackRef.current = false;

    // Reuse existing healthy connection if generation hasn't changed
    if (activeAgentManager && activeMediaStream && !isRetry) {
      console.log('[D-ID Singleton] Reusing existing active WebRTC MediaStream.');
      setConnectionStatus('connected');
      onStreamReady?.();
      if (videoRef.current && videoRef.current.srcObject !== activeMediaStream) {
        videoRef.current.srcObject = activeMediaStream;
        videoRef.current.play().catch(() => setNeedsAudioGesture(true));
      }
      return;
    }

    try {
      isConnectionInProgress = true;
      if (isMountedRef.current) {
        setStatus('initializing');
        setErrorMessage(null);
        setErrorDetails(null);
        setIsInsufficientCredits(false);
      }

      console.log(`[D-ID] Connecting to Real-Time Human Stream (Generation #${currentGen})...`);

      // Check allowed origin
      const currentHost = window.location.hostname;
      const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';

      if (!isLocalhost) {
        console.warn('[D-ID Stream] Allowed domain mismatch detected.');
        if (isMountedRef.current && connectionGenRef.current === currentGen) {
          setStatus('domain_mismatch');
        }
        isConnectionInProgress = false;
        return;
      }

      // Fetch avatar telemetry — backend returns full client_key for SDK use
      const status = await avatarApi.getStatus();

      if (connectionGenRef.current !== currentGen || !isMountedRef.current) {
        isConnectionInProgress = false;
        return;
      }

      if (!status.agent_id || !status.client_key) {
        console.warn('[D-ID Stream] D-ID Agent credentials not found in backend/.env');
        setStatus('unconfigured');
        isConnectionInProgress = false;
        setErrorDetails({ code: 'MISSING_CREDENTIALS', message: 'DID_AGENT_ID or DID_CLIENT_KEY missing in .env' });
        return;
      }

      setStatus('connecting');

      // 30-Second Connection Timeout Guard — reads connectionStatusRef.current (NOT stale closure state)
      connectTimeoutRef.current = window.setTimeout(() => {
        if (connectionGenRef.current === currentGen && isMountedRef.current && connectionStatusRef.current !== 'connected') {
          console.warn('[D-ID Timeout] Connection timed out after 30s.');
          setErrorMessage('D-ID stream connection timed out after 30 seconds.');
          setErrorDetails({ code: 'TIMEOUT', message: 'WebRTC media stream did not arrive within 30 seconds.' });
          setStatus('error');
        }
      }, 30000);

      // Disconnect previous session before connecting new one
      if (isRetry || activeAgentManager) {
        await cleanupActiveSession();
      }

      console.log('[D-ID Singleton] Creating AgentManager with Agent ID:', status.agent_id);
      console.log('[D-ID Singleton] client_key length received:', status.client_key?.length);

      const manager = await createAgentManager(status.agent_id, {
        auth: {
          type: 'key',
          clientKey: status.client_key
        },
        mode: 'DirectPlayback' as any,
        callbacks: {
          onSrcObjectReady: (stream: MediaStream) => {
            if (connectionGenRef.current !== currentGen || !isMountedRef.current) {
              console.log('[D-ID SDK] Stale stream callback discarded.');
              return;
            }

            console.log('[D-ID SDK] onSrcObjectReady called with MediaStream tracks:', stream.getTracks().length);
            activeMediaStream = stream;
            if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);

            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.muted = false;
              videoRef.current.play().then(() => {
                console.log('[D-ID Video] WebRTC video element playing successfully with audio tracks.');
                setStatus('connected');
                setNeedsAudioGesture(false);
                onStreamReady?.();
              }).catch((e) => {
                console.warn('[D-ID Video] Autoplay with audio was restricted:', e);
                setNeedsAudioGesture(true);
                setStatus('connected');
                onStreamReady?.();
              });
            } else {
              setStatus('connected');
              onStreamReady?.();
            }
          },
          onConnectionStateChange: (connState: string) => {
            if (connectionGenRef.current !== currentGen || !isMountedRef.current) return;
            console.log('[D-ID SDK] Connection State Change:', connState);
            if (connState === 'connected') {
              setStatus('connected');
              onStreamReady?.();
            } else if (connState === 'disconnected' || connState === 'failed' || connState === 'closed') {
              if (activeMediaStream === null) {
                setErrorMessage(`D-ID Stream session status: ${connState}`);
              }
            }
          },
          onVideoStateChange: (vState: any) => {
            if (connectionGenRef.current !== currentGen || !isMountedRef.current) return;
            console.log('[D-ID SDK] Video State:', vState);
            setStatus('connected');
          },
          onError: (err: Error) => {
            if (connectionGenRef.current !== currentGen || !isMountedRef.current) return;
            console.error('[D-ID SDK] Stream Error:', err);
            if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
            const msg = err.message || 'D-ID Agent stream encountered an error.';
            const isCredits = msg.toLowerCase().includes('credit');
            setIsInsufficientCredits(isCredits);
            setErrorMessage(msg);
            setErrorDetails({ code: isCredits ? 'INSUFFICIENT_CREDITS' : 'STREAM_ERROR', message: msg });
            setStatus('error');
          }
        },
        streamOptions: {
          compatibilityMode: 'auto',
          streamWarmup: true
        }
      });

      if (connectionGenRef.current !== currentGen || !isMountedRef.current) {
        manager.disconnect().catch(() => {});
        isConnectionInProgress = false;
        return;
      }

      activeAgentManager = manager;
      console.log('[D-ID Singleton] Calling agentManager.connect()...');
      await manager.connect();
      console.log('[D-ID Singleton] agentManager.connect() successfully completed.');
      isConnectionInProgress = false;

    } catch (err: any) {
      if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
      isConnectionInProgress = false;
      console.error('[D-ID Singleton] Connection Exception:', err);
      if (connectionGenRef.current === currentGen && isMountedRef.current) {
        const msg = err.description || err.message || 'Failed to initialize D-ID Agent Manager';
        const isCredits = msg.toLowerCase().includes('credit') ||
          err.status === 402 ||
          err.statusCode === 402 ||
          err.kind === 'InsufficientCreditsError';
        setIsInsufficientCredits(isCredits);
        setErrorMessage(msg);
        setErrorDetails({
          status: err.status || err.statusCode || (isCredits ? 402 : undefined),
          code: isCredits ? 'INSUFFICIENT_CREDITS' : (err.code || 'CONNECT_EXCEPTION'),
          message: msg
        });
        setStatus('error');
      }
    }
  // Remove connectionStatus from deps — we now use connectionStatusRef to avoid stale closures
  }, [onStreamReady]);

  // Execute D-ID connection only when connectionGeneration changes or on explicit mount
  useEffect(() => {
    isMountedRef.current = true;
    initDIDAgency();

    return () => {
      isMountedRef.current = false;
      if (speechEndTimerRef.current) clearTimeout(speechEndTimerRef.current);
      if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
    };
  }, [connectionGeneration, initDIDAgency]);

  // 2. Trigger Real-Time Speech Stream on Question Updates
  useEffect(() => {
    if (
      connectionStatus === 'connected' &&
      speechText &&
      speechText !== lastSpokenTextRef.current &&
      state === 'TALKING'
    ) {
      lastSpokenTextRef.current = speechText;

      if (speechEndTimerRef.current) clearTimeout(speechEndTimerRef.current);

      if (activeAgentManager && activeAgentManager.speak) {
        console.log('[D-ID] Speaking question via WebRTC:', speechText.substring(0, 50) + '...');
        onSpeakingStarted?.();

        const wordCount = speechText.trim().split(/\s+/).length;
        const estimatedDurationMs = Math.max(3800, Math.min(18000, wordCount * 280));

        activeAgentManager.speak({ type: 'text', input: speechText }).catch((err: any) => {
          console.warn('[D-ID SDK] Agent speak error:', err);
        });

        speechEndTimerRef.current = window.setTimeout(() => {
          console.log('[D-ID] Speaking completed');
          onSpeakingEnded?.();
        }, estimatedDurationMs);
      }
    }
  }, [speechText, state, connectionStatus, onSpeakingStarted, onSpeakingEnded]);

  const handleManualAudioEnable = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().then(() => {
        setNeedsAudioGesture(false);
      }).catch(console.warn);
    }
  };

  const redirectToLocalhost = () => {
    const port = window.location.port || '5173';
    window.location.href = `http://localhost:${port}${window.location.pathname}${window.location.search}`;
  };

  const getStatusBadge = () => {
    switch (state) {
      case 'TALKING':
        return { label: 'Speaking (D-ID HD)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'LISTENING':
        return { label: 'Listening to Candidate', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'THINKING':
        return { label: 'Evaluating Answer...', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      default:
        return { label: 'Active', color: 'bg-slate-700/50 text-slate-300 border-slate-600/30' };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
      {/* 1. Authoritative WebRTC HD Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover transition-opacity duration-700 ${
          connectionStatus === 'connected' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 2. Unmute Overlay Gesture */}
      {needsAudioGesture && connectionStatus === 'connected' && (
        <div className="absolute inset-0 z-30 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
          <div className="p-3 bg-purple-500/20 border border-purple-500/40 rounded-full mb-3 text-purple-300 animate-bounce">
            <Volume2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-100 mb-1">Enable Interviewer Audio</h4>
          <p className="text-xs text-slate-400 mb-4 max-w-xs">
            Browser policy requires one user interaction to stream avatar audio.
          </p>
          <button
            onClick={handleManualAudioEnable}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white rounded-xl shadow-lg transition-all"
          >
            Click to Unmute & Listen
          </button>
        </div>
      )}

      {/* 3. Stream Connecting or Detailed Diagnostic Overlay */}
      {connectionStatus !== 'connected' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 backdrop-blur-sm">
          {connectionStatus === 'initializing' || connectionStatus === 'connecting' ? (
            <>
              <div className="relative mb-4">
                <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin flex items-center justify-center" />
                <Video className="w-5 h-5 text-purple-400 absolute inset-0 m-auto" />
              </div>
              <h3 className="text-sm font-semibold text-slate-100">Connecting to D-ID Real-Time HD Human...</h3>
              <p className="text-xs text-slate-400 mt-1">Establishing WebRTC Stream Session</p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-purple-400 bg-purple-950/50 px-3 py-1 rounded-full border border-purple-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span>Subscribing to Real-Time Video & Audio Tracks</span>
              </div>
            </>
          ) : connectionStatus === 'domain_mismatch' ? (
            <div className="space-y-3 max-w-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Switch to localhost:5173</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your D-ID Studio allowed domain is configured for <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">http://localhost</code>.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={redirectToLocalhost}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open on http://localhost:5173</span>
                </button>
                <button
                  onClick={() => triggerTerminalFallback('Domain mismatch')}
                  className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Use Realistic Female Fallback</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-w-md w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  {isInsufficientCredits 
                    ? 'D-ID HD Human unavailable: insufficient D-ID credits.' 
                    : 'D-ID HD Stream Connection Issue'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isInsufficientCredits
                    ? 'D-ID Real-Time WebRTC streaming requires minimum 1.0 credit on your account.'
                    : 'Real-time WebRTC handshake diagnostic details'}
                </p>
              </div>

              {/* Exact Error Diagnostic Details */}
              <div className="text-left bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-[11px] font-mono space-y-1.5 text-slate-300">
                {errorDetails?.status && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">HTTP STATUS:</span>
                    <span className="text-rose-400 font-bold">{errorDetails.status}</span>
                  </div>
                )}
                {errorDetails?.code && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">ERROR CODE:</span>
                    <span className="text-amber-300">{errorDetails.code}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block mb-0.5">DIAGNOSTIC:</span>
                  <span className="text-rose-300/90 leading-relaxed break-words font-sans">
                    {isInsufficientCredits
                      ? 'D-ID HD Human unavailable: insufficient D-ID credits.'
                      : (errorMessage || 'D-ID stream initialization failed.')}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => triggerTerminalFallback(isInsufficientCredits ? 'D-ID HD Human unavailable: insufficient D-ID credits.' : (errorMessage || 'D-ID unavailable'))}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Continue with Realistic Female Interviewer</span>
                </button>
                <button
                  onClick={() => initDIDAgency(true)}
                  className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry HD Human</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* State & Interviewer Tag Overlay */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 z-20 pointer-events-none">
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${badge.color} backdrop-blur-md flex items-center gap-1.5 shadow-lg`}>
          <span className="w-2 h-2 rounded-full bg-current animate-ping" />
          {badge.label}
        </span>
      </div>

      {/* Interviewer Details Card */}
      <div className="absolute bottom-3 inset-x-3 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-xl p-3 flex items-center justify-between shadow-xl z-20 pointer-events-none">
        <div>
          <h4 className="text-sm font-bold text-slate-100">{interviewerName}</h4>
          <p className="text-xs text-slate-400">{interviewerTitle}</p>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-purple-400 bg-purple-950/40 border border-purple-500/30 px-2.5 py-1 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="font-semibold text-[11px]">D-ID HD Real Human • WebRTC</span>
        </div>
      </div>
    </div>
  );
};
