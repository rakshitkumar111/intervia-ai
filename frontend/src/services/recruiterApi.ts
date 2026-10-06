import { request } from './api';

export interface InterviewInviteCreate {
  candidate_name: string;
  candidate_email: string;
  target_role: string;
  domain?: string;
  experience_level?: string;
  mode?: string;
  difficulty?: string;
  language?: string;
  total_questions?: number;
  expires_in_days?: number;
}

export interface InterviewInviteResponse {
  id: number;
  invite_token: string;
  invite_url: string;
  candidate_name: string;
  candidate_email: string;
  target_role: string;
  mode: string;
  difficulty: string;
  language: string;
  total_questions: number;
  status: string;
  created_at: string;
  expires_at: string;
  interview_id?: number | null;
}

export interface CandidateLeaderboardItem {
  interview_id: number;
  candidate_name: string;
  target_role: string;
  domain: string;
  experience_level: string;
  overall_score: number;
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  verdict: string;
  integrity_score: number;
  completed_at?: string;
  pdf_report_path?: string;
}

export interface CandidateAnswerReplay {
  question_number: number;
  question_text: string;
  candidate_answer: string;
  score: number;
  technical_score: number;
  feedback: string;
  speaking_pace_wpm?: number;
  filler_word_count?: number;
}

export interface CandidateSessionReplayResponse {
  interview_id: number;
  candidate_name: string;
  target_role: string;
  overall_score: number;
  verdict: string;
  integrity_events_count: number;
  answers: CandidateAnswerReplay[];
}

export const recruiterApi = {
  createInvite: (data: InterviewInviteCreate) =>
    request<InterviewInviteResponse>('/recruiter/invites', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getInvites: () =>
    request<InterviewInviteResponse[]>('/recruiter/invites'),

  getInviteInfo: (inviteToken: string) =>
    request<{
      valid: boolean;
      candidate_name: string;
      candidate_email: string;
      target_role: string;
      domain: string;
      experience_level: string;
      mode: string;
      difficulty: string;
      language: string;
      total_questions: number;
      status: string;
      expires_at: string;
      interview_id?: number | null;
    }>(`/recruiter/invite-info/${inviteToken}`),

  joinInterviewByToken: (inviteToken: string) =>
    request<{
      valid: boolean;
      access_token: string;
      user: {
        id: number;
        email: string;
        full_name: string;
        role: string;
      };
      interview_id: number;
      candidate_name: string;
      target_role: string;
      status: string;
      total_questions: number;
      current_index: number;
      expires_at: string;
    }>(`/recruiter/join/${inviteToken}`),

  getLeaderboard: () =>
    request<CandidateLeaderboardItem[]>('/recruiter/leaderboard'),

  getSessionReplay: (interviewId: number) =>
    request<CandidateSessionReplayResponse>(`/recruiter/replay/${interviewId}`),
};
