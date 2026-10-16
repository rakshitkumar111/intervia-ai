import React, { useState, useEffect } from 'react';
import {
  Bot, Sparkles, Mic, FileText, Award, ShieldCheck, ArrowRight,
  CheckCircle2, Play, Users, Cpu, Layers, Diamond, Zap, Brain,
  MessageSquare, BarChart3, Target, Clock, TrendingUp, Star,
  ChevronRight, Monitor, Code2, Headphones
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
}

/* Rotating text animation words */
const rotatingWords = ['technical interviews', 'behavioral rounds', 'live coding', 'system design', 'HR screening'];

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setIsAnimating(false);
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col" style={{ color: '#1a1a2e' }}>

      {/* ────────── HERO SECTION ────────── */}
      <section className="relative overflow-hidden" style={{ background: '#fafafa' }}>
        {/* Subtle gradient blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(108,92,231,0.04)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(129,140,248,0.04)' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left Column — Copy */}
            <div className="max-w-xl">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
                style={{ background: 'rgba(108,92,231,0.08)', color: '#6c5ce7' }}
              >
                <Zap className="w-3.5 h-3.5" />
                Best AI Tool for Interview Candidates
              </div>

              {/* Headline */}
              <h1 className="text-[42px] sm:text-5xl lg:text-[56px] font-extrabold leading-[1.1] tracking-tight mb-6" style={{ color: '#1a1a2e' }}>
                Get Real-Time,{' '}
                <br className="hidden sm:block" />
                AI Interview{' '}
                <br className="hidden sm:block" />
                Support
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg leading-relaxed mb-8 max-w-md" style={{ color: '#6b6b80' }}>
                Receive instant, personalized, and actionable support for all interview scenarios — powered by our adaptive humanoid AI engine.
              </p>

              {/* CTA */}
              <div>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-7 py-3.5 rounded-xl font-bold text-sm transition-all transform hover:-translate-y-0.5 inline-flex items-center justify-center"
                  style={{
                    background: '#d4f65b',
                    color: '#111118',
                    boxShadow: '0 4px 14px rgba(212, 246, 91, 0.35)',
                  }}
                >
                  Start Now for Free
                </button>
              </div>
              <p className="text-xs mt-3" style={{ color: '#9b9bae' }}>No Credit Card Needed</p>
            </div>

            {/* Right Column — Product Preview Card */}
            <div className="relative lg:pl-4">
              <div
                className="rounded-2xl overflow-hidden relative"
                style={{
                  background: '#1a1a2e',
                  boxShadow: '0 25px 60px rgba(26,26,46,0.3), 0 10px 20px rgba(0,0,0,0.15)',
                }}
              >
                {/* Card header */}
                <div className="px-6 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(108,92,231,0.2)' }}>
                      <Brain className="w-4 h-4" style={{ color: '#818cf8' }} />
                    </div>
                    <span className="text-sm font-semibold text-white">Interview Copilot</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e' }} />
                    <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Live</span>
                  </div>
                </div>

                {/* Card body — two-column */}
                <div className="grid grid-cols-5 gap-0">
                  {/* Left: Prompt/Question area */}
                  <div className="col-span-3 p-5" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#6c5ce7' }}>
                        <MessageSquare className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Current Question</span>
                    </div>
                    <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      <span className="font-semibold text-white">Problem:</span> As a senior engineer at Meta, our team was tasked with optimizing the news feed algorithm. The challenge was the increasing data volume and complexity, which made our...
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: 'rgba(108,92,231,0.15)', color: '#818cf8' }}>System Design</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>Algorithms</span>
                    </div>
                  </div>

                  {/* Right: Sentiments + Context */}
                  <div className="col-span-2 p-4 space-y-4">
                    {/* Sentiments */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <BarChart3 className="w-3 h-3" style={{ color: '#818cf8' }} />
                        <span className="text-[11px] font-semibold text-white">Sentiments</span>
                      </div>
                      <p className="text-[10px] mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Recommended tones:</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold" style={{ background: '#6c5ce7', color: 'white' }}>Passionate</span>
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold" style={{ background: 'rgba(108,92,231,0.15)', color: '#818cf8' }}>Ambitious</span>
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold" style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf' }}>Interested</span>
                      </div>
                    </div>

                    {/* Context retrieval */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Target className="w-3 h-3" style={{ color: '#818cf8' }} />
                        <span className="text-[11px] font-semibold text-white">Context retrieval</span>
                      </div>
                      <p className="text-[10px] mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Google's mission and values.</p>
                      <div className="space-y-1.5">
                        {['Move Fast', 'Focus on Long-Term Impact', 'Build Awesome Things'].map((item, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <ChevronRight className="w-2.5 h-2.5" style={{ color: '#818cf8' }} />
                            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="px-5 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(108,92,231,0.2)' }}>
                      <Headphones className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
                    </div>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <Code2 className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} />
                    </div>
                  </div>
                  <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <Sparkles className="w-3 h-3" style={{ color: '#818cf8' }} />
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Receive tailored assistance instantly</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────── ROTATING HEADLINE + STATS ────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: '#ffffff', borderTop: '1px solid #f0eff5' }}>
        <div className="max-w-7xl mx-auto text-center">
          {/* Rotating Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight" style={{ color: '#1a1a2e' }}>
            Ace your next{' '}
            <span
              className="inline-block transition-all duration-300 ease-in-out"
              style={{
                color: '#6c5ce7',
                textDecoration: 'underline',
                textDecorationColor: 'rgba(108,92,231,0.3)',
                textUnderlineOffset: '6px',
                opacity: isAnimating ? 0 : 1,
                transform: isAnimating ? 'translateY(8px)' : 'translateY(0)',
              }}
            >
              {rotatingWords[currentWordIndex]}
            </span>
          </h2>
          <p className="text-lg mb-14" style={{ color: '#6b6b80' }}>with AI interview copilot</p>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: '95%', label: 'Success rate for candidates', icon: <TrendingUp className="w-5 h-5" /> },
              { value: '5,000+', label: 'Mock interviews conducted', icon: <Users className="w-5 h-5" /> },
              { value: '1,000+', label: 'Companies covered', icon: <Monitor className="w-5 h-5" /> },
              { value: '4.9★', label: 'Average user rating', icon: <Star className="w-5 h-5" /> },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div
                  className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all group-hover:scale-110"
                  style={{ background: 'rgba(108,92,231,0.06)', color: '#6c5ce7' }}
                >
                  {stat.icon}
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold mb-1" style={{ color: '#1a1a2e' }}>{stat.value}</p>
                <p className="text-sm" style={{ color: '#9b9bae' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── FEATURES SECTION ────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: '#fafafa', borderTop: '1px solid #f0eff5' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6c5ce7' }}>
              Comprehensive Platform
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-3 mb-4" style={{ color: '#1a1a2e' }}>
              Everything you need to ace interviews
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: '#6b6b80' }}>
              Our platform combines cutting-edge AI with a production-grade assessment engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Bot className="w-6 h-6" />,
                color: '#6c5ce7',
                bg: 'rgba(108,92,231,0.06)',
                title: 'Humanoid AI Avatar',
                desc: 'Expressive 2.5D rigged virtual interviewer with lip-sync, eye blinking, breathing animations, and dynamic conversational state machines.',
              },
              {
                icon: <Brain className="w-6 h-6" />,
                color: '#818cf8',
                bg: 'rgba(129,140,248,0.06)',
                title: 'Adaptive Question Engine',
                desc: 'Generates customized question paths tailored to your resume and dynamically adjusts difficulty based on your performance.',
              },
              {
                icon: <Award className="w-6 h-6" />,
                color: '#22c55e',
                bg: 'rgba(34,197,94,0.06)',
                title: '6-Dimension Scoring',
                desc: 'Evaluates relevance, correctness, technical depth, clarity, completeness, and confidence with an executive PDF report.',
              },
              {
                icon: <Mic className="w-6 h-6" />,
                color: '#f59e0b',
                bg: 'rgba(245,158,11,0.06)',
                title: 'Speech Recognition',
                desc: 'Continuous real-time speech-to-text with natural language understanding for truly conversational interviews.',
              },
              {
                icon: <ShieldCheck className="w-6 h-6" />,
                color: '#e74c4c',
                bg: 'rgba(231,76,76,0.06)',
                title: 'Proctoring & Integrity',
                desc: 'Tab-switch detection, face tracking, and behavior analysis ensure interview integrity and fair assessments.',
              },
              {
                icon: <FileText className="w-6 h-6" />,
                color: '#2dd4bf',
                bg: 'rgba(45,212,191,0.06)',
                title: 'Resume Deep-Dive',
                desc: 'AI-powered resume parsing extracts skills, projects, and experience to generate hyper-personalized questions.',
              },
            ].map((card, i) => (
              <div
                key={i}
                className="p-7 rounded-2xl transition-all hover:-translate-y-1 group cursor-default"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e3ee',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                  style={{ background: card.bg, color: card.color }}
                >
                  {card.icon}
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: '#1a1a2e' }}>{card.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6b6b80' }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── DOMAINS SECTION ────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ background: '#ffffff', borderTop: '1px solid #f0eff5' }}>
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6c5ce7' }}>
            Domain Coverage
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-3 mb-8" style={{ color: '#1a1a2e' }}>
            Supported Interview Categories
          </h2>

          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {[
              'Data Structures & Algorithms',
              'Database Management (DBMS)',
              'Operating Systems',
              'Computer Networks',
              'OOP Concepts',
              'Full Stack & Web Architecture',
              'AI / Machine Learning & NLP',
              'Cybersecurity',
              'HR & Behavioral (STAR)',
              'Resume Deep-Dive & Projects',
            ].map((tag, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all cursor-default hover:-translate-y-0.5"
                style={{
                  background: '#fafafa',
                  border: '1px solid #e5e3ee',
                  color: '#4a4a60',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── BOTTOM CTA ────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: '#1a1a2e' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to ace your next interview?
          </h2>
          <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Join thousands of candidates who've improved their interview skills with our AI-powered platform.
          </p>
          <div className="flex items-center justify-center">
            <button
              onClick={() => onNavigate('register')}
              className="px-8 py-3.5 rounded-xl font-bold text-sm transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              style={{
                background: '#d4f65b',
                color: '#111118',
                boxShadow: '0 4px 14px rgba(212, 246, 91, 0.3)',
              }}
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
