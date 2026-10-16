import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface Question {
  id: string;
  number: string;
  question: string;
  answer?: string;
  status: 'completed' | 'pending';
  badgeColor: 'green' | 'red';
}

const questions: Question[] = [
  {
    id: '1',
    number: '01',
    question: 'How would you optimize a React app for performance?',
    answer:
      'I use code-splitting, lazy loading, memoization (React.memo, useMemo), and avoid unnecessary re-renders with proper dependency handling in hooks.',
    status: 'completed',
    badgeColor: 'green',
  },
  {
    id: '2',
    number: '02',
    question: 'Describe your experience with Tailwind CSS.',
    answer:
      "I've used Tailwind in three client projects. I love how it speeds up prototyping and encourages consistent design tokens.",
    status: 'completed',
    badgeColor: 'green',
  },
  {
    id: '3',
    number: '03',
    question:
      'Can you explain how you structure components to keep your code clean and maintainable?',
    status: 'pending',
    badgeColor: 'red',
  },
  {
    id: '4',
    number: '04',
    question: 'How do you handle API errors on the frontend?',
    status: 'pending',
    badgeColor: 'red',
  },
];

const tabs = ['Question List', 'Timeline', 'Highlight Clips'] as const;
type Tab = (typeof tabs)[number];

export const QuestionPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Question List');

  return (
    <div className="hb-question-panel">
      {/* Tabs */}
      <div className="hb-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`hb-tab ${activeTab === tab ? 'hb-tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Question list */}
      <div className="hb-question-list">
        {questions.map((q) => (
          <div key={q.id} className="hb-question-card">
            <div className="hb-question-header">
              <span className={`hb-question-badge hb-badge-${q.badgeColor}`}>
                {q.number}
              </span>
              {q.status === 'completed' && (
                <CheckCircle2 size={22} className="hb-check-icon" />
              )}
            </div>
            <h4 className="hb-question-text">{q.question}</h4>
            {q.answer && <p className="hb-question-answer">{q.answer}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};
