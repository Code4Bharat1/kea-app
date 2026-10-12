import { apiClient, isNetworkOrServerError } from './client';
import { JobItem } from '../types';
import { MOCK_JOBS } from '../constants/mockData';

function extractJobsArray(data: any): JobItem[] {
  let items: JobItem[] = [];
  if (Array.isArray(data)) items = data;
  else if (Array.isArray(data?.jobs)) items = data.jobs;
  else if (Array.isArray(data?.data)) items = data.data;
  else if (Array.isArray(data?.data?.jobs)) items = data.data.jobs;
  else if (Array.isArray(data?.items)) items = data.items;

  return items.filter(
    (j) => j && j.title && j.title.trim().length > 0
  );
}

function extractSingleJob(data: any): JobItem {
  if (!data) return MOCK_JOBS[0];
  if (data.job) return data.job;
  if (data.data?.job) return data.data.job;
  if (data.data && typeof data.data === 'object' && data.data._id) return data.data;
  return data as JobItem;
}

export const jobsApi = {
  async getJobs(search?: string, category?: string, type?: string, location?: string): Promise<JobItem[]> {
    try {
      const params: Record<string, string> = {};
      if (search) {
        params.search = search;
        params.q = search;
      }
      if (category && category !== 'All Categories') {
        params.category = category;
        params.discipline = category;
      }
      if (type && type !== 'All Types') {
        params.type = type;
      }
      if (location) {
        params.location = location;
      }
      console.log('🌐 [Fetching Jobs from Backend]: GET /jobs | Params:', params);
      const res = await apiClient.get<any>('/jobs', { params });
      console.log('📥 [Backend Jobs Received Status]:', res.status, '| Data Type:', typeof res.data);
      const jobsList = extractJobsArray(res.data);
      console.log(`✅ [Extracted Jobs Count]: ${jobsList.length} items`);
      return jobsList;
    } catch (err) {
      console.warn('⚠️ [Backend /jobs endpoint failed or offline]:', err);
      if (isNetworkOrServerError(err)) {
        return MOCK_JOBS;
      }
      throw err;
    }
  },

  async getJobById(id: string): Promise<JobItem> {
    try {
      console.log(`🌐 [Fetching Job Detail]: GET /jobs/${id}`);
      const res = await apiClient.get<any>(`/jobs/${id}`);
      return extractSingleJob(res.data);
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_JOBS.find((j) => j._id === id) || MOCK_JOBS[0];
      }
      throw err;
    }
  },

  async createJob(payload: Partial<JobItem>): Promise<JobItem> {
    try {
      console.log('🌐 [Posting Job to Backend]: POST /jobs Payload:', payload.title);
      const res = await apiClient.post<any>('/jobs', payload);
      console.log('📤 [Backend Post Job Response Status]:', res.status);
      return extractSingleJob(res.data);
    } catch (err) {
      console.warn('⚠️ [Backend POST /jobs failed or offline]:', err);
      if (isNetworkOrServerError(err)) {
        const newJob: JobItem = {
          _id: `job_user_${Date.now()}`,
          title: payload.title || 'Untitled Position',
          company: payload.company || 'Private Employer',
          location: payload.location || 'Maharashtra',
          type: payload.type || 'Full-time',
          discipline: payload.discipline || 'Civil Engineering',
          salary: payload.salary || 'Negotiable',
          description: payload.description || '',
          requirements: payload.requirements || [],
          isSaved: false,
          hasApplied: false,
          createdAt: new Date().toISOString(),
        };
        MOCK_JOBS.unshift(newJob);
        return newJob;
      }
      throw err;
    }
  },
};

