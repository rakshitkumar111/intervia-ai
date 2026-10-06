import { request } from './api';

export interface AvatarStatusResponse {
  did_configured: boolean;
  agent_id?: string;
  client_key?: string;
  primary_provider: 'd-id' | 'realistic-female' | 'local-2d';
  fallback_available: boolean;
  presenter_image_url?: string;
  default_voice_id?: string;
  supported_providers: string[];
}

export interface DIDStreamResponse {
  success: boolean;
  stream_id?: string;
  session_id?: string;
  offer?: {
    type: string;
    sdp: string;
  };
  ice_servers?: RTCIceServer[];
  error?: string;
  is_configured?: boolean;
}

export const avatarApi = {
  getStatus: async (): Promise<AvatarStatusResponse> => {
    return request<AvatarStatusResponse>('/avatar/status');
  },

  createStream: async (sourceUrl?: string): Promise<DIDStreamResponse> => {
    return request<DIDStreamResponse>('/avatar/did/stream', {
      method: 'POST',
      body: JSON.stringify({ source_url: sourceUrl })
    });
  },

  submitSDP: async (streamId: string, sessionId: string, answer: RTCSessionDescriptionInit): Promise<{ success: boolean; data?: any }> => {
    return request<{ success: boolean; data?: any }>('/avatar/did/sdp', {
      method: 'POST',
      body: JSON.stringify({
        stream_id: streamId,
        session_id: sessionId,
        answer
      })
    });
  },

  submitICE: async (streamId: string, sessionId: string, candidate: RTCIceCandidate): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>('/avatar/did/ice', {
      method: 'POST',
      body: JSON.stringify({
        stream_id: streamId,
        session_id: sessionId,
        candidate: {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex
        }
      })
    });
  },

  streamTalk: async (streamId: string, sessionId: string, text: string, voiceId?: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>('/avatar/did/talk', {
      method: 'POST',
      body: JSON.stringify({
        stream_id: streamId,
        session_id: sessionId,
        text,
        voice_id: voiceId
      })
    });
  },

  closeStream: async (streamId: string, sessionId: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>('/avatar/did/stream', {
      method: 'DELETE',
      body: JSON.stringify({
        stream_id: streamId,
        session_id: sessionId
      })
    });
  }
};
