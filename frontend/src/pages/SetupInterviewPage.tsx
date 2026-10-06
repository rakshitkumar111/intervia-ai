import React, { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, Briefcase, Award, Layers, Globe, FileText, Building2, UserCheck, Clock, CheckSquare, Search, BookOpen, ShieldCheck, Upload, FileUp, Zap, Target } from 'lucide-react';
import { interviewApi } from '../services/interviewApi';
import { resumeApi } from '../services/resumeApi';
import { InterviewMode, DifficultyLevel, ExperienceLevel, InterviewLanguage, Resume, JDAnalysisResult } from '../types';

interface SetupInterviewPageProps {
  onNavigate: (tab: string, param?: any) => void;
  initialResumeId?: number;
}

const DOMAINS: Record<string, { label: string; roles: string[]; icon: string }> = {
  Technology: {
    label: 'Technology & Software',
    icon: '💻',
    roles: [
      'Full Stack Software Engineer',
      'Frontend Developer',
      'Backend Developer',
      'Data Analyst',
      'Data Scientist',
      'Machine Learning Engineer',
      'DevOps / Cloud Engineer',
      'Cybersecurity Analyst',
      'QA Automation Engineer',
      'Android / Mobile Developer'
    ]
  },
  Business: {
    label: 'Business, Product & Management',
    icon: '📈',
    roles: [
      'Product Manager',
      'Business Analyst',
      'Project Manager',
      'Operations Manager',
      'Scrum Master',
      'Management Consultant'
    ]
  },
  Sales: {
    label: 'Sales, Marketing & Growth',
    icon: '🎯',
    roles: [
      'Sales Executive / BDE',
      'Digital Marketing Specialist',
      'Customer Success Manager',
      'Account Executive',
      'Brand Manager'
    ]
  },
  HR: {
    label: 'Human Resources (HR)',
    icon: '👥',
    roles: [
      'HR Generalist / Executive',
      'Technical Recruiter',
      'Talent Acquisition Specialist',
      'HR Business Partner (HRBP)'
    ]
  },
  Finance: {
    label: 'Finance & Banking',
    icon: '💰',
    roles: [
      'Financial Analyst',
      'Chartered Accountant',
      'Investment Banking Analyst',
      'Credit Risk Analyst',
      'Tax Consultant'
    ]
  },
  Engineering: {
    label: 'Core Engineering',
    icon: '⚙️',
    roles: [
      'Electronics & Embedded Engineer',
      'Mechanical Design Engineer',
      'Civil & Structural Engineer',
      'Electrical Systems Engineer'
    ]
  },
  Healthcare: {
    label: 'Healthcare & Life Sciences',
    icon: '🏥',
    roles: [
      'Healthcare Administrator',
      'Clinical Research Coordinator',
      'Medical Support Specialist',
      'Pharmacist'
    ]
  },
  Education: {
    label: 'Education & Training',
    icon: '📚',
    roles: [
      'Teacher / Educator',
      'University Lecturer',
      'Corporate Trainer',
      'Instructional Designer'
    ]
  },
  Government: {
    label: 'Government & Public Sector',
    icon: '🏛️',
    roles: [
      'Public Administration Officer',
      'Government Policy Analyst',
      'Banking Clerk / PO',
      'Civil Services General'
    ]
  },
  Campus: {
    label: 'Freshers & Campus Placements',
    icon: '🎓',
    roles: [
      'Graduate Engineer Trainee (GET)',
      'Software Engineering Intern',
      'Management Trainee',
      'Campus Placement General'
    ]
  }
};

export const SetupInterviewPage: React.FC<SetupInterviewPageProps> = ({
  onNavigate,
  initialResumeId
}) => {
  const [selectedDomainKey, setSelectedDomainKey] = useState<string>('Technology');
  const [targetRole, setTargetRole] = useState('Full Stack Software Engineer');
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Mid-Level');
  const [mode, setMode] = useState<InterviewMode>('Technical');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [language, setLanguage] = useState<InterviewLanguage>('English');
  const [totalQuestions, setTotalQuestions] = useState<number>(5);
  const [durationMode, setDurationMode] = useState<string>('Standard');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);

  const [resumeId, setResumeId] = useState<number | undefined>(initialResumeId);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jdAnalysis, setJdAnalysis] = useState<JDAnalysisResult | null>(null);
  const [analyzingJD, setAnalyzingJD] = useState(false);
  const [uploadingJDFile, setUploadingJDFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jdFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadResumes() {
      try {
        const data = await resumeApi.getMyResumes();
        setResumes(data);
        if (!resumeId && data.length > 0) {
          setResumeId(data[0].id);
        }
      } catch (e) {
        console.error('Failed to fetch resumes:', e);
      }
    }
    loadResumes();
  }, []);

  const handleDomainSelect = (key: string) => {
    setSelectedDomainKey(key);
    const domainObj = DOMAINS[key];
    if (domainObj && domainObj.roles.length > 0) {
      setTargetRole(domainObj.roles[0]);
    }
  };

  const handleAnalyzeJD = async () => {
    if (!jobDescription.trim()) return;
    setAnalyzingJD(true);
    try {
      const res = await interviewApi.analyzeJD({
        job_description: jobDescription,
        resume_id: resumeId,
        target_role: customRoleInput.trim() || targetRole
      });
      setJdAnalysis(res);
    } catch (e) {
      console.warn('JD analysis error:', e);
    } finally {
      setAnalyzingJD(false);
    }
  };

  const handleJDFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingJDFile(true);
    setError(null);
    try {
      const res = await interviewApi.uploadJD(
        file,
        resumeId,
        customRoleInput.trim() || targetRole
      );
      setJobDescription(res.extracted_text);
      setJdAnalysis(res.analysis);
    } catch (err: any) {
      setError(err.message || 'Failed to parse uploaded Job Description document.');
    } finally {
      setUploadingJDFile(false);
      if (jdFileInputRef.current) jdFileInputRef.current.value = '';
    }
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const finalRole = customRoleInput.trim() || targetRole;

    try {
      const session = await interviewApi.createInterview({
        target_role: finalRole,
        company_name: companyName.trim() || undefined,
        domain: DOMAINS[selectedDomainKey]?.label || selectedDomainKey,
        experience_level: experienceLevel,
        mode,
        category: finalRole,
        difficulty,
        total_questions: totalQuestions,
        duration_mode: durationMode,
        language,
        resume_id: resumeId,
        job_description: jobDescription.trim() || undefined,
        is_practice_mode: isPracticeMode
      });

      // Navigate to live interview stage with interviewId
      onNavigate('live-interview', { interviewId: session.id });
    } catch (err: any) {
      setError(err.message || 'Failed to initialize universal interview session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Universal AI Interview Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Configure Your Universal AI Interview
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Dynamic AI interviewer for ANY legitimate job role, domain, experience level, and language.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleStartInterview} className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8">
        
        {/* Practice Mode vs Mock Interview Switcher */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Interview Environment Type</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setIsPracticeMode(false)}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                !isPracticeMode
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow-xl ring-1 ring-purple-500/50'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">Official Mock Interview</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Realistic simulation. No hints, strict hiring committee evaluation, and official assessment report.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsPracticeMode(true)}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                isPracticeMode
                  ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-xl ring-1 ring-emerald-500/50'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">Interactive Practice Mode</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Learning mode. In-question hints, instant answer critique, and suggested ideal answers.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 1. Industry / Domain Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Select Industry / Domain</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {Object.entries(DOMAINS).map(([key, item]) => {
              const isSelected = selectedDomainKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDomainSelect(key)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-purple-600/15 border-purple-500/80 text-white shadow-lg ring-1 ring-purple-500/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-purple-300' : 'text-slate-200'}`}>
                      {key}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{item.label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Target Job Role & Company */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-400" />
              <span>Target Job Role</span>
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
            >
              {DOMAINS[selectedDomainKey]?.roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Custom Role Input */}
            <div className="mt-2.5">
              <input
                type="text"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                placeholder="Or type custom job role (e.g. LLM Prompt Engineer)..."
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>Target Company (Optional)</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Google, Microsoft, Amazon, Infosys, Startup..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>
        </div>

        {/* 3. Experience Level & Interview Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-400" />
              <span>Experience Level</span>
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
            >
              <option value="Fresher">Fresher / Graduate (0-1 yrs)</option>
              <option value="Internship">Internship / Student</option>
              <option value="Junior">Junior (1-3 yrs)</option>
              <option value="Mid-Level">Mid-Level (3-6 yrs)</option>
              <option value="Senior">Senior (6-10 yrs)</option>
              <option value="Lead / Manager">Lead / Manager (10+ yrs)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span>Interview Type / Mode</span>
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as InterviewMode)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
            >
              <option value="Technical">Technical & Domain Knowledge</option>
              <option value="HR">HR & Cultural Fit</option>
              <option value="Behavioral">Behavioral (STAR Method)</option>
              <option value="Situational">Situational & Scenario Handling</option>
              <option value="Case Study">System Design & Case Studies</option>
              <option value="Mixed">Mixed Comprehensive Interview</option>
              <option value="Resume-Based">Resume-Based Probing</option>
              <option value="Job Description Based">Job Description Alignment</option>
            </select>
          </div>
        </div>

        {/* 4. Difficulty, Language & Question Count */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span>Difficulty Level</span>
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
            >
              <option value="Easy">Easy (Fundamentals & Concepts)</option>
              <option value="Medium">Medium (Standard Industry Rigor)</option>
              <option value="Hard">Hard (Deep Architecture & Edge Cases)</option>
              <option value="Adaptive">Adaptive (Dynamic AI Scaling)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" />
              <span>Interview Language</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as InterviewLanguage)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Hinglish">Hinglish (Hindi + English)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Number of Questions</span>
            </label>
            <select
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
            >
              <option value={3}>3 Questions (Quick Screen - 10 min)</option>
              <option value={5}>5 Questions (Standard Round - 20 min)</option>
              <option value={8}>8 Questions (Deep Technical - 35 min)</option>
              <option value={10}>10 Questions (Comprehensive - 45 min)</option>
            </select>
          </div>
        </div>

        {/* 5. Resume Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Link Uploaded Resume (Optional)</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigate('resume-upload')}
              className="text-purple-400 hover:text-purple-300 text-xs font-medium"
            >
              + Upload New Resume
            </button>
          </label>
          <select
            value={resumeId || ''}
            onChange={(e) => setResumeId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
          >
            <option value="">No Resume (General Universal Assessment)</option>
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.filename} ({r.parsed_skills.slice(0, 4).join(', ')}...)
              </option>
            ))}
          </select>
        </div>

        {/* 6. Job Description Input & Alignment Analyzer */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-purple-400" />
              <span>Job Description (JD Alignment Mode)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={jdFileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={handleJDFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => jdFileInputRef.current?.click()}
                disabled={uploadingJDFile}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>{uploadingJDFile ? 'Uploading...' : 'Upload JD File'}</span>
              </button>

              {jobDescription.trim() && (
                <button
                  type="button"
                  onClick={handleAnalyzeJD}
                  disabled={analyzingJD}
                  className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{analyzingJD ? 'Analyzing...' : 'Analyze Match'}</span>
                </button>
              )}
            </div>
          </div>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={3}
            placeholder="Paste target job description or upload PDF/DOCX/TXT to customize questions specifically to the employer's tech stack and responsibilities..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
          />

          {/* 4-Way Skill Alignment & Plan Card */}
          {jdAnalysis && (
            <div className="mt-3 p-4 bg-slate-950/80 border border-purple-500/30 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-slate-200">JD vs Resume Alignment:</span>
                </div>
                <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 font-bold rounded-lg border border-purple-500/30">
                  {jdAnalysis.match_percentage}% Match Score
                </span>
              </div>

              {/* 4-Way Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 bg-emerald-950/40 border border-emerald-800/40 rounded-xl">
                  <span className="text-emerald-400 font-bold block mb-1">✓ Matched Skills ({jdAnalysis.matched_skills.length})</span>
                  <p className="text-slate-300 line-clamp-2">{jdAnalysis.matched_skills.join(', ') || 'None directly matched'}</p>
                </div>

                <div className="p-2 bg-rose-950/40 border border-rose-800/40 rounded-xl">
                  <span className="text-rose-400 font-bold block mb-1">⚠ Missing Skills ({jdAnalysis.missing_skills.length})</span>
                  <p className="text-slate-300 line-clamp-2">{jdAnalysis.missing_skills.join(', ') || 'No missing requirements'}</p>
                </div>

                <div className="p-2 bg-amber-950/40 border border-amber-800/40 rounded-xl">
                  <span className="text-amber-400 font-bold block mb-1">⚡ Partial Matches ({jdAnalysis.partial_matches?.length || 0})</span>
                  <p className="text-slate-300 line-clamp-2">{jdAnalysis.partial_matches?.join(', ') || 'None'}</p>
                </div>

                <div className="p-2 bg-indigo-950/40 border border-indigo-800/40 rounded-xl">
                  <span className="text-indigo-400 font-bold block mb-1">★ Extra Resume Skills ({jdAnalysis.extra_resume_skills?.length || 0})</span>
                  <p className="text-slate-300 line-clamp-2">{jdAnalysis.extra_resume_skills?.slice(0, 4).join(', ') || 'None'}</p>
                </div>
              </div>

              {/* Priority Focus Areas */}
              {jdAnalysis.recommended_focus_areas.length > 0 && (
                <div className="pt-2 border-t border-slate-800 text-[11px]">
                  <span className="text-purple-300 font-semibold block mb-1">🎯 Personalized Question Focus:</span>
                  <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                    {jdAnalysis.recommended_focus_areas.map((fa, i) => (
                      <li key={i}>{fa}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Start Interview Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating AI Adaptive Interview Plan...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Start Universal AI Interview ({totalQuestions} Questions)</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
