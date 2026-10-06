import { request } from './api';
import { Resume } from '../types';

export const resumeApi = {
  async uploadResume(file: File): Promise<Resume> {
    const formData = new FormData();
    formData.append('file', file);

    return request<Resume>('/resume/upload', {
      method: 'POST',
      body: formData,
    });
  },

  async getMyResumes(): Promise<Resume[]> {
    return request<Resume[]>('/resume/my-resumes');
  },

  async getResume(resumeId: number): Promise<Resume> {
    return request<Resume>(`/resume/${resumeId}`);
  },

  async deleteResume(resumeId: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/resume/${resumeId}`, {
      method: 'DELETE',
    });
  },
};
