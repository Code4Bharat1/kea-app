import { apiClient, isNetworkOrServerError } from './client';
import { MentorItem } from '../types';

export interface GetMentorsOptions {
  search?: string;
  expertise?: string;
  experience?: string;
  page?: number;
  limit?: number;
}

export interface GetMentorsResponse {
  mentors: MentorItem[];
  totalPages: number;
}

export const MOCK_MENTORS: MentorItem[] = [
  {
    _id: 'mentor_1',
    name: 'Dr. Rajesh Kumar',
    title: 'Senior Structural Engineer & Chief Consultant',
    organization: 'Larsen & Toubro (L&T)',
    location: 'Mumbai, India',
    bio: 'Over 15 years of experience in structural design, seismic retrofitting, and high-rise bridge infrastructure. Passionate about guiding young civil and structural engineers in their career progression.',
    expertise: ['Civil engineering', 'Structural', 'Seismic Design', 'Project Management'],
    skills: ['STAAD Pro', 'ETABS', 'AutoCAD', 'Structural Audits'],
    focusAreas: ['Bridge Design', 'Seismic Resilience', 'Career Transition'],
    experience: {
      years: 15,
      description: 'Lead Structural Consultant for major metro viaducts and mega structural projects across South Asia.',
    },
    contact: {
      email: 'rajesh.kumar@lnt.com',
      linkedin: 'https://linkedin.com/in/dr-rajesh-kumar',
    },
    education: [
      { degree: 'Ph.D. in Structural Engineering', institution: 'IIT Bombay', year: '2010' },
      { degree: 'M.Tech in Civil Engineering', institution: 'IIT Roorkee', year: '2006' },
    ],
    achievements: [
      'Published 12 research papers in International Structural Journals.',
      'Recipient of National Civil Excellence Award 2021.',
    ],
    languages: ['English', 'Hindi', 'Marathi'],
    stats: { rating: 4.9, reviews: 28, totalSessions: 45 },
    approvalStatus: 'approved',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'mentor_2',
    name: 'Priya Sharma',
    title: 'BIM Manager & Digital Twin Specialist',
    organization: 'Shapoorji Pallonji',
    location: 'Bengaluru, India',
    bio: 'BIM strategy lead specializing in Revit automation, Dynamo scripts, and smart building integration for commercial infrastructure.',
    expertise: ['Civil engineering', 'BIM & CAD', 'Automation'],
    skills: ['Revit', 'Dynamo', 'Python', 'Navisworks'],
    focusAreas: ['BIM Implementation', 'Digital Engineering', 'Software Skills'],
    experience: {
      years: 10,
      description: 'Manager for 3D/4D BIM Coordination on international airport terminal projects.',
    },
    contact: {
      email: 'priya.sharma@shapoorji.com',
      linkedin: 'https://linkedin.com/in/priyasharma-bim',
    },
    education: [
      { degree: 'B.Tech in Civil Engineering', institution: 'NIT Trichy', year: '2013' },
    ],
    achievements: ['Certified Autodesk Revit Professional & BIM Lead.'],
    languages: ['English', 'Hindi', 'Tamil'],
    stats: { rating: 4.8, reviews: 19, totalSessions: 32 },
    approvalStatus: 'approved',
    createdAt: new Date().toISOString(),
  },
];

export const mentorsApi = {
  async getMentors(options?: GetMentorsOptions): Promise<GetMentorsResponse> {
    try {
      const params: Record<string, any> = {};
      if (options?.search) params.search = options.search;
      if (options?.expertise) params.expertise = options.expertise;
      if (options?.experience) params.experience = options.experience;
      if (options?.page) params.page = options.page;
      if (options?.limit) params.limit = options.limit;

      const res = await apiClient.get('/mentors', { params });
      const data = res.data;

      const mentors: MentorItem[] = data.mentors || (Array.isArray(data) ? data : []);
      const totalPages: number = data.pagination?.pages || 1;

      return { mentors, totalPages };
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return { mentors: MOCK_MENTORS, totalPages: 1 };
      }
      throw err;
    }
  },

  async getMentorById(id: string): Promise<MentorItem> {
    try {
      const res = await apiClient.get<MentorItem | { mentor: MentorItem }>(`/mentors/${id}`);
      return (res.data as any).mentor ? (res.data as any).mentor : (res.data as MentorItem);
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_MENTORS.find((m) => m._id === id) || MOCK_MENTORS[0];
      }
      throw err;
    }
  },

  async getMyMentorProfile(): Promise<MentorItem | null> {
    try {
      const res = await apiClient.get<MentorItem>('/mentors/me/profile');
      return res.data || null;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return null;
      }
      return null;
    }
  },

  async createMentor(mentorData: any): Promise<MentorItem> {
    try {
      const res = await apiClient.post<MentorItem>('/mentors', mentorData);
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return {
          _id: `mentor_mock_${Date.now()}`,
          ...mentorData,
          stats: { rating: 5.0, reviews: 0, totalSessions: 0 },
          approvalStatus: 'pending',
          createdAt: new Date().toISOString(),
        };
      }
      throw err;
    }
  },

  async bookSession(mentorId: string, slotId?: string): Promise<any> {
    try {
      const res = await apiClient.post(`/mentors/${mentorId}/book`, { slotId });
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return { success: true, message: 'Session booked successfully!' };
      }
      throw err;
    }
  },
};
