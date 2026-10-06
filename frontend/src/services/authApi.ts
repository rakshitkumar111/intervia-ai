import { request } from './api';
import { AuthResponse, User, CandidateProfile } from '../types';

export const authApi = {
  async register(data: { email: string; password: string; full_name: string; role?: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<User> {
    return request<User>('/auth/me');
  },

  async updateProfile(profile: Partial<CandidateProfile>): Promise<CandidateProfile> {
    return request<CandidateProfile>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },
};
