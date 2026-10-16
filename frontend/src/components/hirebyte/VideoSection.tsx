import React, { useState } from 'react';
import {
  Mic,
  MonitorSmartphone,
  MessageSquare,
  MoreHorizontal,
  PhoneOff,
  AudioLines,
} from 'lucide-react';

export const VideoSection: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="hb-video-section">
      {/* Main video area */}
      <div className="hb-video-main">
        <img
          src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=500&fit=crop&crop=faces"
          alt="Mrs. Tania Shahira"
          className="hb-video-main-img"
        />

        {/* Participant name badge - main */}
        <div className="hb-video-badge hb-video-badge-main">
          <span className="hb-video-badge-avatar hb-badge-avatar-purple">TS</span>
          <span className="hb-video-badge-name">Mrs. Tania Shahira</span>
        </div>

        {/* Audio wave indicator */}
        <div className="hb-audio-indicator">
          <AudioLines size={18} />
        </div>

        {/* Picture-in-picture */}
        <div className="hb-video-pip">
          <img
            src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=250&fit=crop&crop=faces"
            alt="Regina Tanya"
            className="hb-video-pip-img"
          />
          <div className="hb-video-badge hb-video-badge-pip">
            <span className="hb-video-badge-avatar hb-badge-avatar-teal">RT</span>
            <span className="hb-video-badge-name">Regina Tanya</span>
          </div>
        </div>

        {/* Video controls */}
        <div className="hb-video-controls">
          <button
            className={`hb-control-btn ${isMuted ? 'hb-control-btn-muted' : ''}`}
            onClick={() => setIsMuted(!isMuted)}
            aria-label="Toggle microphone"
          >
            <Mic size={18} />
          </button>
          <button className="hb-control-btn" aria-label="Share screen">
            <MonitorSmartphone size={18} />
          </button>
          <button className="hb-control-btn" aria-label="Chat">
            <MessageSquare size={18} />
          </button>
          <button className="hb-control-btn" aria-label="More options">
            <MoreHorizontal size={18} />
          </button>
          <button className="hb-control-btn hb-control-btn-end" aria-label="End call">
            <PhoneOff size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
