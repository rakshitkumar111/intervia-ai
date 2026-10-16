import React from 'react';
import {
  CalendarDays,
  Search,
  Users,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react';

export const MeetingNotes: React.FC = () => {
  return (
    <div className="hb-meeting-notes">
      {/* Title row */}
      <div className="hb-meeting-title-row">
        <h2 className="hb-meeting-title">
          Key Meeting Notes – Hiring: Frontend Developer
        </h2>
        <button className="hb-meeting-more" aria-label="More options">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Meta tags */}
      <div className="hb-meeting-meta">
        <div className="hb-meta-tag">
          <CalendarDays size={14} />
          <span>Jul 10, 2025</span>
        </div>
        <div className="hb-meta-tag">
          <Search size={14} />
          <span>Hiring</span>
        </div>
        <div className="hb-meta-tag">
          <Users size={14} />
          <span>Mrs. Tania Shahira, Regina Tanya</span>
        </div>
      </div>

      {/* AI Summary Card */}
      <div className="hb-ai-summary">
        <div className="hb-ai-summary-header">
          <Sparkles size={16} className="hb-ai-icon" />
          <h3 className="hb-ai-summary-title">AI Summary of Meeting</h3>
        </div>
        <p className="hb-ai-summary-text">
          Mrs. Tania Shahira and Regina Tanya led the hiring meeting to finalize
          the interview structure for the Frontend Developer position. The
          discussion covered candidate evaluation methods, role expectations, and
          feedback alignment across the panel. They agreed to streamline the
          hiring flow by merging the technical screening and live coding session.
        </p>
      </div>
    </div>
  );
};
