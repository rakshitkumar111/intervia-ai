export type Role = 'candidate' | 'recruiter' | 'admin';

export interface CandidateProfile {
  id: number;
  user_id: number;
  target_role: string;
  experience_level: string;
  skills: string[];
  bio?: string;
  phone?: string;
  github_url?: string;
  linkedin_url?: string;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  profile?: CandidateProfile;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Resume {
  id: number;
  user_id: number;
  filename: string;
  file_size_bytes: number;
  parsed_skills: string[];
  parsed_experience: Array<{ role?: string; details?: string }>;
  parsed_education: Array<{ degree?: string; keyword?: string }>;
  parsed_projects: Array<{ title?: string; description?: string }>;
  parsed_certifications: string[];
  summary?: string;
  uploaded_at: string;
}

export type InterviewMode = 
  | 'HR'
  | 'Technical'
  | 'Behavioral'
  | 'Situational'
  | 'Case Study'
  | 'Coding'
  | 'Domain Specific'
  | 'Mixed'
  | 'Resume-Based'
  | 'Job Description Based'
  | 'Mock Interview'
  | 'Practice';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Junior' | 'Mid-Level' | 'Senior' | 'Adaptive';

export type ExperienceLevel = 'Fresher' | 'Internship' | 'Junior' | 'Mid-Level' | 'Senior' | 'Lead / Manager';

export type InterviewLanguage = 'English' | 'Hindi' | 'Hinglish';

export interface InterviewQuestion {
  id: number;
  interview_id: number;
  question_text: string;
  question_number?: number;
  question_type: string;
  category?: string;
  difficulty: string;
  order_index: number;
  is_follow_up: boolean;
  parent_question_id?: number;
  expected_concepts: string[];
  evaluation_criteria?: string[];
  hint?: string;
}

export interface AnswerEvaluation {
  id: number;
  answer_id: number;
  score: number; // 0 - 100
  
  // 8-Dimensional Universal Assessment
  technical_score?: number;
  correctness_score?: number;
  relevance_score?: number;
  problem_solving_score?: number;
  communication_score?: number;
  depth_score?: number;
  practical_score?: number;
  confidence_score?: number;
  
  feedback?: string;
  strengths: string[];
  weaknesses: string[];
  missing_concepts: string[];
  suggestions: string[];
  suggested_ideal_answer?: string;
  evaluated_at: string;
  next_question?: InterviewQuestion;
  is_completed?: boolean;
}

export interface CandidateAnswer {
  id: number;
  interview_id: number;
  question_id: number;
  transcript_text: string;
  audio_duration_seconds: number;
  answered_at: string;
  evaluation?: AnswerEvaluation;
}

export interface InterviewReport {
  id: number;
  interview_id: number;
  candidate_name?: string;
  target_role?: string;
  domain?: string;
  experience_level?: string;
  language?: string;
  
  overall_score: number;
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  confidence_score: number;
  
  verdict: 'STRONG HIRE' | 'HIRE' | 'CONSIDER' | 'NEEDS IMPROVEMENT' | 'NOT READY' | string;
  hiring_readiness?: string;
  executive_summary?: string;
  strengths: string[];
  weaknesses: string[];
  technical_gaps?: string[];
  skill_gaps: string[];
  communication_feedback?: string;
  recommended_topics?: string[];
  recommendations: string[];
  question_breakdown: Array<{
    question_text: string;
    answer_text: string;
    score: number;
    feedback?: string;
  }>;
  pdf_report_path?: string;
  generated_at: string;
}

export interface InterviewSession {
  id: number;
  user_id: number;
  resume_id?: number;
  title: string;
  candidate_name?: string;
  target_role: string;
  company_name?: string;
  domain?: string;
  experience_level?: string;
  mode: InterviewMode;
  category: string;
  difficulty: DifficultyLevel;
  language?: InterviewLanguage;
  duration_mode?: string;
  job_description?: string;
  is_practice_mode?: boolean;
  total_questions: number;
  current_index: number;
  status: 'created' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  overall_score: number;
  duration_seconds: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  questions: InterviewQuestion[];
  report?: InterviewReport;
}

export interface DashboardStats {
  total_interviews: number;
  completed_count: number;
  in_progress_count: number;
  average_score: number;
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  confidence_score: number;
  readiness_index: string;
  category_performance: Array<{ category: string; average_score: number; count: number }>;
  skills: string[];
  strongest_skills: string[];
  weakest_skills: string[];
}

export interface AdminStats {
  total_users: number;
  total_interviews: number;
  completed_interviews: number;
  average_score: number;
  category_distribution: Record<string, number>;
  verdict_distribution: Record<string, number>;
  recent_activity: Array<{
    id: number;
    action: string;
    level: string;
    details: Record<string, any>;
    timestamp: string;
  }>;
}

export interface JDAnalysisResult {
  extracted_role: string;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  matched_skills: string[];
  missing_skills: string[];
  partial_matches?: string[];
  extra_resume_skills?: string[];
  match_percentage: number;
  weightings: {
    resume_projects?: number;
    required_skills?: number;
    technical_questions?: number;
    technical_skills?: number;
    experience?: number;
    problem_solving?: number;
    behavioral?: number;
    communication?: number;
  };
  recommended_focus_areas: string[];
}

export interface IntegrityEvent {
  id: number;
  interview_id: number;
  event_type: string;
  details: Record<string, any>;
  timestamp: string;
}

export type AvatarState = 'IDLE' | 'TALKING' | 'LISTENING' | 'THINKING' | 'PROCESSING';

export type VisemeType = 'REST' | 'AA' | 'EE' | 'IH' | 'OH' | 'OU' | 'MBP' | 'FV' | 'TH' | 'CDGK';
