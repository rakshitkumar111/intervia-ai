import React, { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, Briefcase, Award, Layers, Globe, FileText, Building2, UserCheck, Clock, CheckSquare, Search, BookOpen, ShieldCheck, FileUp, Zap, Target, RefreshCw } from 'lucide-react';
import { interviewApi } from '../services/interviewApi';
import { resumeApi } from '../services/resumeApi';
import { InterviewMode, DifficultyLevel, ExperienceLevel, InterviewLanguage, Resume, JDAnalysisResult } from '../types';
import { speechEngine } from '../services/speechEngine';

interface SetupInterviewPageProps {
  onNavigate: (tab: string, param?: any) => void;
  initialResumeId?: number;
  initialResume?: Resume;
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
  initialResumeId,
  initialResume
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
  const [durationMode] = useState<string>('Standard');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);

  const [resumeId, setResumeId] = useState<number | undefined>(initialResumeId || initialResume?.id);
  const [resumes, setResumes] = useState<Resume[]>(initialResume ? [initialResume] : []);
  const [resumeLinkedInfo, setResumeLinkedInfo] = useState<{
    resume: Resume;
    extractedRole: string;
    extractedDomain: string;
    extractedLevel: ExperienceLevel;
  } | null>(null);

  const [jdAnalysis, setJdAnalysis] = useState<JDAnalysisResult | null>(null);
  const [analyzingJD, setAnalyzingJD] = useState(false);
  const [uploadingJDFile, setUploadingJDFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jdFileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-extraction function from a parsed resume
  const applyResumeData = (res: Resume) => {
    setResumeId(res.id);
    setMode('Resume-Based');

    // 1. Extract Target Role & Domain
    let detectedRole = '';
    let matchedDomain = 'Technology';

    if (res.parsed_experience && res.parsed_experience.length > 0) {
      for (const exp of res.parsed_experience) {
        if (exp.role && exp.role.trim().length > 2) {
          detectedRole = exp.role.trim();
          break;
        }
      }
    }

    if (!detectedRole && res.summary) {
      const summaryLower = res.summary.toLowerCase();
      for (const [domKey, domData] of Object.entries(DOMAINS)) {
        for (const role of domData.roles) {
          if (summaryLower.includes(role.toLowerCase())) {
            detectedRole = role;
            matchedDomain = domKey;
            break;
          }
        }
        if (detectedRole) break;
      }
    }

    if (detectedRole) {
      const lower = detectedRole.toLowerCase();
      let matchedExact = false;
      for (const [domKey, domData] of Object.entries(DOMAINS)) {
        for (const r of domData.roles) {
          if (r.toLowerCase() === lower || lower.includes(r.toLowerCase()) || r.toLowerCase().includes(lower)) {
            matchedDomain = domKey;
            setTargetRole(r);
            matchedExact = true;
            break;
          }
        }
        if (matchedExact) break;
      }
      if (!matchedExact) {
        if (lower.includes('sales') || lower.includes('marketing') || lower.includes('growth')) matchedDomain = 'Sales';
        else if (lower.includes('hr') || lower.includes('recruiter') || lower.includes('talent')) matchedDomain = 'HR';
        else if (lower.includes('finance') || lower.includes('analyst') || lower.includes('accountant')) matchedDomain = 'Finance';
        else if (lower.includes('manager') || lower.includes('product') || lower.includes('project') || lower.includes('scrum')) matchedDomain = 'Business';
        else if (lower.includes('engineer') || lower.includes('developer') || lower.includes('data') || lower.includes('security') || lower.includes('cloud')) matchedDomain = 'Technology';

        setCustomRoleInput(detectedRole);
      }
      setSelectedDomainKey(matchedDomain);
    } else if (res.parsed_skills && res.parsed_skills.length > 0) {
      const skillsStr = res.parsed_skills.join(' ').toLowerCase();
      if (skillsStr.includes('python') || skillsStr.includes('react') || skillsStr.includes('javascript') || skillsStr.includes('java') || skillsStr.includes('aws') || skillsStr.includes('sql') || skillsStr.includes('docker')) {
        matchedDomain = 'Technology';
        if (skillsStr.includes('react') || skillsStr.includes('frontend') || skillsStr.includes('css') || skillsStr.includes('tailwind')) {
          setTargetRole('Frontend Developer');
        } else if (skillsStr.includes('machine learning') || skillsStr.includes('data') || skillsStr.includes('nlp')) {
          setTargetRole('Machine Learning Engineer');
        } else {
          setTargetRole('Full Stack Software Engineer');
        }
      } else if (skillsStr.includes('marketing') || skillsStr.includes('seo') || skillsStr.includes('sales')) {
        matchedDomain = 'Sales';
        setTargetRole('Digital Marketing Specialist');
      } else if (skillsStr.includes('finance') || skillsStr.includes('accounting') || skillsStr.includes('tax')) {
        matchedDomain = 'Finance';
        setTargetRole('Financial Analyst');
      }
      setSelectedDomainKey(matchedDomain);
    }

    // 2. Experience level inference
    let level: ExperienceLevel = 'Mid-Level';
    const expCount = res.parsed_experience?.length || 0;
    const allText = `${res.summary || ''} ${res.parsed_experience?.map(e => (e.role || '') + ' ' + (e.details || '')).join(' ') || ''}`.toLowerCase();

    if (allText.includes('senior') || allText.includes('lead') || allText.includes('principal') || allText.includes('architect') || expCount >= 4) {
      level = allText.includes('lead') || allText.includes('manager') ? 'Lead / Manager' : 'Senior';
    } else if (allText.includes('intern') || allText.includes('student')) {
      level = 'Internship';
    } else if (allText.includes('fresher') || expCount === 0) {
      level = 'Fresher';
    } else if (expCount <= 2) {
      level = 'Junior';
    } else {
      level = 'Mid-Level';
    }
    setExperienceLevel(level);

    // 3. Pre-fill Job Description with skills context if JD is empty
    if (!jobDescription.trim()) {
      const skillsText = res.parsed_skills?.length ? `Extracted Competencies: ${res.parsed_skills.join(', ')}.` : '';
      const summaryText = res.summary ? `\nProfile Summary: ${res.summary}` : '';
      if (skillsText || summaryText) {
        setJobDescription(`${skillsText}${summaryText}`);
      }
    }

    setResumeLinkedInfo({
      resume: res,
      extractedRole: detectedRole || targetRole,
      extractedDomain: matchedDomain,
      extractedLevel: level
    });
  };

  // Immediate application if initialResume was passed in props
  useEffect(() => {
    if (initialResume) {
      applyResumeData(initialResume);
    }
  }, [initialResume]);

  // Load candidate resumes and link matching initialResumeId
  useEffect(() => {
    async function loadResumes() {
      try {
        const data = await resumeApi.getMyResumes();
        setResumes(data);

        const targetId = initialResumeId || initialResume?.id;
        if (targetId) {
          const matched = data.find((r) => r.id === targetId);
          if (matched) {
            applyResumeData(matched);
          }
        }
      } catch (e) {
        console.error('Failed to fetch resumes:', e);
      }
    }
    loadResumes();
  }, [initialResumeId]);

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
      if (res.extracted_text) {
        setJobDescription(res.extracted_text);
      }
      if (res.analysis) {
        setJdAnalysis(res.analysis);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse and analyze JD file.');
    } finally {
      setUploadingJDFile(false);
    }
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    // Synchronously request fullscreen and unlock speech on direct user click gesture
    speechEngine.unlockAudio();
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          (document.documentElement as any).webkitRequestFullscreen();
        }
      }
    } catch (fsErr) {
      console.warn('Fullscreen entry error on setup click:', fsErr);
    }

    setLoading(true);
    setError(null);

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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Universal AI Interview Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Configure Your Universal AI Interview
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Dynamic AI interviewer for ANY legitimate job role, domain, experience level, and language.
        </p>
      </div>

      {/* Auto-Fetched Resume Feedback Banner */}
      {resumeLinkedInfo && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-white border border-purple-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/25 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">
                  Resume Auto-Configured: {resumeLinkedInfo.resume.filename}
                </h3>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
                  Resume Mode Active
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Extracted Role: <strong className="text-slate-900">{resumeLinkedInfo.extractedRole}</strong> &bull; Level: <strong className="text-slate-900">{resumeLinkedInfo.extractedLevel}</strong> &bull; Domain: <strong className="text-slate-900">{resumeLinkedInfo.extractedDomain}</strong>
              </p>
              {resumeLinkedInfo.resume.parsed_skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {resumeLinkedInfo.resume.parsed_skills.slice(0, 8).map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 bg-white border border-purple-200 text-purple-800 rounded-md text-[11px] font-medium shadow-xs">
                      {skill}
                    </span>
                  ))}
                  {resumeLinkedInfo.resume.parsed_skills.length > 8 && (
                    <span className="px-1.5 py-0.5 text-slate-500 text-[11px]">
                      +{resumeLinkedInfo.resume.parsed_skills.length - 8} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={() => onNavigate('resume')}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              Change Resume
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleStartInterview} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">

        {/* Practice Mode vs Mock Interview Switcher */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Interview Environment Type</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setIsPracticeMode(false)}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                !isPracticeMode
                  ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-sm ring-2 ring-purple-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${!isPracticeMode ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'}`}>
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Official Mock Interview</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Realistic simulation. No hints, strict hiring committee evaluation, and official assessment report.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsPracticeMode(true)}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                isPracticeMode
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${isPracticeMode ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'}`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Interactive Practice Mode</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Learning mode. In-question hints, instant answer critique, and suggested ideal answers.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 1. Industry / Domain Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
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
                      ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-sm ring-2 ring-purple-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-purple-200 hover:bg-purple-50/30'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-purple-900' : 'text-slate-800'}`}>
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-600" />
              <span>Target Job Role</span>
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Target Company (Optional)</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Google, Microsoft, Amazon, Infosys, Startup..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* 3. Experience Level & Interview Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <span>Experience Level</span>
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span>Interview Type / Mode</span>
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as InterviewMode)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-600" />
              <span>Difficulty Level</span>
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
            >
              <option value="Easy">Easy (Fundamentals & Concepts)</option>
              <option value="Medium">Medium (Standard Industry Rigor)</option>
              <option value="Hard">Hard (Deep Architecture & Edge Cases)</option>
              <option value="Adaptive">Adaptive (Dynamic AI Scaling)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-600" />
              <span>Interview Language</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as InterviewLanguage)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Hinglish">Hinglish (Hindi + English)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Number of Questions</span>
            </label>
            <select
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
            >
              <option value={3}>3 Questions (Quick Screen - 10 min)</option>
              <option value={5}>5 Questions (Standard Round - 20 min)</option>
              <option value={8}>8 Questions (Deep Technical - 35 min)</option>
              <option value={10}>10 Questions (Comprehensive - 45 min)</option>
            </select>
          </div>
        </div>

        {/* 5. Resume Selection & Auto-Extraction */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Link Uploaded Resume (Optional)</span>
            </span>
            <div className="flex items-center gap-3">
              {resumeId && (
                <button
                  type="button"
                  onClick={() => {
                    const found = resumes.find(r => r.id === resumeId);
                    if (found) applyResumeData(found);
                  }}
                  className="text-purple-600 hover:text-purple-700 text-xs font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Re-Sync Resume Data</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigate('resume')}
                className="text-purple-600 hover:text-purple-700 text-xs font-semibold"
              >
                + Upload New Resume
              </button>
            </div>
          </label>
          <select
            value={resumeId || ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined;
              setResumeId(val);
              if (val) {
                const selected = resumes.find(r => r.id === val);
                if (selected) {
                  applyResumeData(selected);
                }
              } else {
                setResumeLinkedInfo(null);
              }
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-purple-600" />
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
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>{uploadingJDFile ? 'Uploading...' : 'Upload JD File'}</span>
              </button>

              {jobDescription.trim() && (
                <button
                  type="button"
                  onClick={handleAnalyzeJD}
                  disabled={analyzingJD}
                  className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
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
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
          />

          {/* 4-Way Skill Alignment & Plan Card */}
          {jdAnalysis && (
            <div className="mt-3 p-4 bg-slate-50 border border-purple-200 rounded-2xl space-y-3 text-xs shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-slate-900">JD vs Resume Alignment:</span>
                </div>
                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 font-bold rounded-lg border border-purple-200">
                  {jdAnalysis.match_percentage}% Match Score
                </span>
              </div>

              {/* 4-Way Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-emerald-800 font-bold block mb-1">✓ Matched Skills ({jdAnalysis.matched_skills.length})</span>
                  <p className="text-slate-700 line-clamp-2">{jdAnalysis.matched_skills.join(', ') || 'None directly matched'}</p>
                </div>

                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-rose-800 font-bold block mb-1">⚠ Missing Skills ({jdAnalysis.missing_skills.length})</span>
                  <p className="text-slate-700 line-clamp-2">{jdAnalysis.missing_skills.join(', ') || 'No missing requirements'}</p>
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-amber-800 font-bold block mb-1">⚡ Partial Matches ({jdAnalysis.partial_matches?.length || 0})</span>
                  <p className="text-slate-700 line-clamp-2">{jdAnalysis.partial_matches?.join(', ') || 'None'}</p>
                </div>

                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <span className="text-indigo-800 font-bold block mb-1">★ Extra Resume Skills ({jdAnalysis.extra_resume_skills?.length || 0})</span>
                  <p className="text-slate-700 line-clamp-2">{jdAnalysis.extra_resume_skills?.slice(0, 4).join(', ') || 'None'}</p>
                </div>
              </div>

              {/* Priority Focus Areas */}
              {jdAnalysis.recommended_focus_areas.length > 0 && (
                <div className="pt-2 border-t border-slate-200 text-[11px]">
                  <span className="text-purple-800 font-semibold block mb-1">🎯 Personalized Question Focus:</span>
                  <ul className="list-disc list-inside text-slate-600 space-y-0.5">
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
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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