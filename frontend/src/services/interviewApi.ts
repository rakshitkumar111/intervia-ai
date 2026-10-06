import { request } from './api';
import {
  InterviewSession,
  AnswerEvaluation,
  InterviewReport,
  DashboardStats,
  AdminStats,
  InterviewMode,
  DifficultyLevel,
  ExperienceLevel,
  InterviewLanguage,
  JDAnalysisResult,
  IntegrityEvent
} from '../types';

export interface CreateInterviewPayload {
  title?: string;
  candidate_name?: string;
  target_role: string;
  company_name?: string;
  domain?: string;
  experience_level?: ExperienceLevel | string;
  mode: InterviewMode;
  category?: string;
  difficulty: DifficultyLevel;
  total_questions: number;
  duration_mode?: string;
  language?: InterviewLanguage;
  resume_id?: number;
  job_description?: string;
  focus_skills?: string[];
  is_practice_mode?: boolean;
}

export const interviewApi = {
  async createInterview(payload: CreateInterviewPayload): Promise<InterviewSession> {
    return request<InterviewSession>('/interview/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getInterview(interviewId: number): Promise<InterviewSession> {
    return request<InterviewSession>(`/interview/${interviewId}`);
  },

  async startInterview(interviewId: number): Promise<InterviewSession> {
    return request<InterviewSession>(`/interview/${interviewId}/start`, {
      method: 'POST',
    });
  },

  async submitAnswer(
    interviewId: number,
    data: { question_id: number; transcript_text: string; audio_duration_seconds?: number; asked_question_ids?: number[] }
  ): Promise<AnswerEvaluation> {
    return request<AnswerEvaluation>(`/interview/${interviewId}/answer`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getNextQuestion(
    interviewId: number,
    data: {
      previous_question_id?: number;
      previous_question?: string;
      asked_question_ids?: number[];
      candidate_name?: string;
      job_role?: string;
      company_name?: string;
      domain?: string;
      experience_level?: string;
      interview_type?: string;
      difficulty?: string;
      language?: string;
      job_description?: string;
      conversation_history?: Array<{ question: string; answer: string; score: number }>;
    }
  ): Promise<{ success: boolean; is_completed: boolean; question?: any }> {
    return request<{ success: boolean; is_completed: boolean; question?: any }>(`/interview/${interviewId}/next-question`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async completeInterview(interviewId: number): Promise<InterviewReport> {
    return request<InterviewReport>(`/interview/${interviewId}/complete`, {
      method: 'POST',
    });
  },

  async getReport(interviewId: number): Promise<InterviewReport> {
    return request<InterviewReport>(`/interview/${interviewId}/report`);
  },

  async analyzeJD(data: { job_description: string; resume_id?: number; target_role?: string }): Promise<JDAnalysisResult> {
    return request<JDAnalysisResult>('/interview/analyze-jd', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async uploadJD(file: File, resumeId?: number, targetRole?: string): Promise<{ filename: string; extracted_text: string; analysis: JDAnalysisResult }> {
    const formData = new FormData();
    formData.append('file', file);
    if (resumeId) formData.append('resume_id', String(resumeId));
    if (targetRole) formData.append('target_role', targetRole);

    return request<{ filename: string; extracted_text: string; analysis: JDAnalysisResult }>('/interview/upload-jd', {
      method: 'POST',
      body: formData,
    });
  },

  async logIntegrityEvent(
    interviewId: number,
    data: { event_type: string; details?: Record<string, any> }
  ): Promise<IntegrityEvent> {
    return request<IntegrityEvent>(`/interview/${interviewId}/integrity-event`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Dashboard API
  async getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/dashboard/stats');
  },

  async getRecentInterviews(): Promise<any[]> {
    return request<any[]>('/dashboard/recent-interviews');
  },

  // Admin API
  async getAdminStats(): Promise<AdminStats> {
    return request<AdminStats>('/admin/stats');
  },

  async getAdminUsers(skip = 0, limit = 20): Promise<{ total: number; users: any[] }> {
    return request<{ total: number; users: any[] }>(`/admin/users?skip=${skip}&limit=${limit}`);
  },

  async getAdminInterviews(skip = 0, limit = 20): Promise<any[]> {
    return request<any[]>(`/admin/interviews?skip=${skip}&limit=${limit}`);
  },

  async getAdminCandidates(skip = 0, limit = 20): Promise<any[]> {
    return request<any[]>(`/admin/candidates?skip=${skip}&limit=${limit}`);
  },

  async getAdminLogs(limit = 50): Promise<any[]> {
    return request<any[]>(`/admin/logs?limit=${limit}`);
  },

  async getSystemLogs(limit = 50): Promise<any[]> {
    return request<any[]>(`/admin/logs?limit=${limit}`);
  },

  async getAdminHealth(): Promise<any> {
    return request<any>('/admin/health');
  },

  async getAdminIntegrityMetrics(): Promise<any> {
    return request<any>('/admin/integrity-metrics');
  },

  async createAdminUser(data: { full_name: string; email: string; password: string; role?: string }): Promise<any> {
    return request<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateUserStatus(userId: number, isActive: boolean): Promise<any> {
    return request<any>(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive }),
    });
  },

  async updateUserRole(userId: number, role: string): Promise<any> {
    return request<any>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  async deleteUser(userId: number): Promise<any> {
    return request<any>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  async deleteInterview(interviewId: number): Promise<any> {
    return request<any>(`/admin/interviews/${interviewId}`, {
      method: 'DELETE',
    });
  },

  async testAiEngine(): Promise<any> {
    return request<any>('/admin/test-ai', {
      method: 'POST',
    });
  },
};
