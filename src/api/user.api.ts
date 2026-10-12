import { apiClient, isNetworkOrServerError } from './client';
import { User, UserProfile, DashboardStats, ResumeItem, JobItem, JobApplication } from '../types';
import { MOCK_USER, MOCK_DASHBOARD_STATS, MOCK_JOBS, MOCK_RESUMES, MOCK_APPLICATIONS } from '../constants/mockData';
import { storage } from '../utils/storage';

export const userApi = {
  async getMe(): Promise<User> {
    try {
      const res = await apiClient.get<User | { user: User }>('/users/me');
      const data = res.data;
      const userObj = (data as any).user ? (data as any).user : (data as User);
      if (userObj && userObj.email) {
        await storage.setUserData(userObj);
      }
      return userObj;
    } catch (err) {
      const storedUser = await storage.getUserData();
      if (storedUser) {
        console.log('userApi.getMe: Using stored user session');
        return storedUser;
      }
      if (isNetworkOrServerError(err)) {
        console.log('userApi.getMe: Using MOCK_USER fallback');
        return MOCK_USER;
      }
      throw err;
    }
  },

  async updateMe(profile: Partial<UserProfile>): Promise<User> {
    try {
      const res = await apiClient.patch<User | { user: User }>('/users/me', { profile });
      const data = res.data;
      return (data as any).user ? (data as any).user : (data as User);
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return {
          ...MOCK_USER,
          profile: { ...MOCK_USER.profile, ...profile },
        };
      }
      throw err;
    }
  },

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const res = await apiClient.get<DashboardStats>('/users/dashboard/stats');
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_DASHBOARD_STATS;
      }
      throw err;
    }
  },

  async getRecentActivity(): Promise<any[]> {
    try {
      const res = await apiClient.get<any[]>('/users/dashboard/activity');
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return [
          {
            _id: 'act_1',
            type: 'job_application',
            title: 'Applied for Senior Software Engineer',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
          },
          {
            _id: 'act_2',
            type: 'event_registration',
            title: 'Registered for KEA Tech Webinar 2026',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          }
        ];
      }
      return [];
    }
  },


  async getMembers(search?: string, category?: string): Promise<User[]> {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await apiClient.get<User[] | { members: User[] }>('/users/members', { params });
      return Array.isArray(res.data) ? res.data : (res.data as any).members || [];
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return [MOCK_USER];
      }
      throw err;
    }
  },

  async uploadResume(formData: FormData): Promise<ResumeItem> {
    try {
      const res = await apiClient.post<ResumeItem>('/users/me/resumes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_RESUMES[0];
      }
      throw err;
    }
  },

  async getMyResumes(): Promise<ResumeItem[]> {
    try {
      const res = await apiClient.get<ResumeItem[] | { resumes: ResumeItem[] }>('/users/me/resumes');
      return Array.isArray(res.data) ? res.data : (res.data as any).resumes || [];
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_RESUMES;
      }
      throw err;
    }
  },

  async deleteResume(id: string): Promise<void> {
    try {
      await apiClient.delete(`/users/me/resumes/${id}`);
    } catch (err) {
      if (!isNetworkOrServerError(err)) throw err;
    }
  },

  async getViewResumeUrl(id: string): Promise<{ url: string }> {
    try {
      const res = await apiClient.get<{ url: string }>(`/users/me/resumes/${id}/view`);
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return { url: '' };
      }
      throw err;
    }
  },

  async saveJob(jobId: string): Promise<void> {
    try {
      await apiClient.post('/users/jobs/save', { jobId });
    } catch (err) {
      if (!isNetworkOrServerError(err)) throw err;
    }
  },

  async getSavedJobs(): Promise<JobItem[]> {
    try {
      const res = await apiClient.get<JobItem[] | { jobs: JobItem[] }>('/users/jobs/saved');
      return Array.isArray(res.data) ? res.data : (res.data as any).jobs || [];
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_JOBS.filter(j => j.isSaved);
      }
      throw err;
    }
  },

  async deleteSavedJob(id: string): Promise<void> {
    try {
      await apiClient.delete(`/users/jobs/saved/${id}`);
    } catch (err) {
      if (!isNetworkOrServerError(err)) throw err;
    }
  },

  async applyForJob(jobId: string, resumeId?: string, coverLetter?: string): Promise<JobApplication> {
    try {
      const res = await apiClient.post<JobApplication>('/users/jobs/apply', {
        jobId,
        resumeId,
        coverLetter,
      });
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return {
          _id: `app_mock_${Date.now()}`,
          job: jobId,
          user: MOCK_USER._id,
          coverLetter,
          status: 'submitted',
          appliedAt: new Date().toISOString(),
        };
      }
      throw err;
    }
  },

  async getMyApplications(): Promise<JobApplication[]> {
    try {
      const res = await apiClient.get<JobApplication[] | { applications: JobApplication[] }>('/users/jobs/applications');
      return Array.isArray(res.data) ? res.data : (res.data as any).applications || [];
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_APPLICATIONS;
      }
      throw err;
    }
  }
};

