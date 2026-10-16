import React, { useState } from 'react';
import { HireByteNavbar } from '../components/hirebyte/HireByteNavbar';
import { VideoSection } from '../components/hirebyte/VideoSection';
import { MeetingNotes } from '../components/hirebyte/MeetingNotes';
import { QuestionPanel } from '../components/hirebyte/QuestionPanel';
import { ArrowLeft, CircleStop, Video } from 'lucide-react';

interface HireBytePageProps {
  onNavigate?: (tab: string, params?: any) => void;
}

export const HireBytePage: React.FC<HireBytePageProps> = ({ onNavigate }) => {
  const [isRecording, setIsRecording] = useState(true);

  return (
    <div className="hb-page">
      <HireByteNavbar />

      <div className="hb-content">
        {/* Page Header */}
        <div className="hb-page-header">
          <div className="hb-page-header-left">
            <button
              className="hb-back-btn"
              onClick={() => onNavigate?.('landing')}
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="hb-page-title">Hiring-Frontend Developer</h1>
              <p className="hb-page-subtitle">
                Summary of employees, income, and payment status metrics.
              </p>
            </div>
          </div>
          <div className="hb-page-header-right">
            <button className="hb-stop-btn" onClick={() => setIsRecording(false)}>
              <CircleStop size={16} />
              <span>Stop Recording</span>
            </button>
            <button className="hb-live-btn">
              <Video size={16} />
              <span>Live Recording</span>
            </button>
          </div>
        </div>

        {/* Main 2-column layout */}
        <div className="hb-main-grid">
          {/* Left Column */}
          <div className="hb-left-col">
            <VideoSection />
            <MeetingNotes />
          </div>

          {/* Right Column */}
          <div className="hb-right-col">
            <QuestionPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HireBytePage;
