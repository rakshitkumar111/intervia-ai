import React from 'react';
import { Bot, Sparkles, Mic, FileText, Award, ShieldCheck, ArrowRight, CheckCircle2, Play, Users, Cpu, Layers } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 -z-10 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 -z-10 w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top announcement pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Autonomous Virtual Humanoid Interviewer</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl leading-tight sm:leading-none mb-6">
          Intelligent Candidate Assessment Powered by{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-blue-400 to-indigo-400">
            Humanoid AI
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed mb-10">
          Experience real-time interactive technical and behavioral interviews with an expressive humanoid avatar. Features continuous speech recognition, multi-criteria NLP answer evaluation, resume parsing, and instant executive hiring reports.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <button
            onClick={() => onNavigate('register')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-brand-600/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <span>Start Practice Interview</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('login')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm transition-all"
          >
            Sign In with Demo Account
          </button>
        </div>

        {/* Feature Grid Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl text-left mt-8">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-brand-400 flex items-center justify-center mb-4 border border-brand-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Procedural Humanoid Avatar</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Expressive 2.5D rigged virtual interviewer with active lip-synchronization, natural eye blinking, breathing animations, and dynamic conversational state machines.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Adaptive Dynamic AI Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generates customized question paths tailored to extracted resume skills and dynamically injects deep-dive follow-up questions based on candidate answers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">6-Dimensional Scoring & PDF</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluates relevance, correctness, technical depth, clarity, completeness, and confidence, delivering an executive hiring report and downloadable PDF.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Domains Section */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800/60 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-3">Comprehensive Domain Coverage</h2>
          <p className="text-2xl font-bold text-slate-100 mb-8">Supported Interview Modes & Technical Categories</p>

          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {[
              "Data Structures & Algorithms",
              "Database Management Systems (DBMS)",
              "Operating Systems & Multithreading",
              "Computer Networks & Protocols",
              "Object-Oriented Programming (OOP)",
              "Full Stack & Web Architecture",
              "AI / Machine Learning & NLP",
              "Cybersecurity & Threat Analysis",
              "HR & Behavioral (STAR Method)",
              "Resume Deep-Dive & Projects"
            ].map((tag, i) => (
              <span key={i} className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-medium border border-slate-800 hover:border-slate-700 transition-colors">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
