import { apiClient, isNetworkOrServerError } from './client';
import { EventItem } from '../types';
import { MOCK_EVENTS } from '../constants/mockData';

export interface GetSeminarsOptions {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface GetSeminarsResponse {
  seminars: EventItem[];
  totalPages: number;
}

export const seminarsApi = {
  async getSeminars(options?: GetSeminarsOptions): Promise<GetSeminarsResponse> {
    try {
      const params: Record<string, any> = {};
      if (options?.search) params.search = options.search;
      if (options?.category && options.category !== 'all') params.category = options.category;
      if (options?.page) params.page = options.page;
      if (options?.limit) params.limit = options.limit;

      const res = await apiClient.get('/seminars', { params });
      const data = res.data;

      const seminars: EventItem[] = data.seminars || (Array.isArray(data) ? data : []);
      const totalPages: number = data.pagination?.pages || 1;

      return { seminars, totalPages };
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return { seminars: MOCK_EVENTS, totalPages: 1 };
      }
      throw err;
    }
  },

  async getSeminarById(id: string): Promise<EventItem> {
    try {
      const res = await apiClient.get<EventItem | { seminar: EventItem }>(`/seminars/${id}`);
      return (res.data as any).seminar ? (res.data as any).seminar : (res.data as EventItem);
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_EVENTS.find(e => e._id === id) || MOCK_EVENTS[0];
      }
      throw err;
    }
  },

  async registerForSeminar(id: string): Promise<void> {
    try {
      await apiClient.post(`/seminars/${id}/register`);
    } catch (err) {
      if (!isNetworkOrServerError(err)) throw err;
    }
  },

  async unregisterFromSeminar(id: string): Promise<void> {
    try {
      await apiClient.post(`/seminars/${id}/unregister`);
    } catch (err) {
      if (!isNetworkOrServerError(err)) throw err;
    }
  },

  async getCategoriesStats(): Promise<Array<{ name: string; count: number }>> {
    try {
      const res = await apiClient.get('/seminars/categories/stats');
      return res.data?.categories || [];
    } catch (err) {
      return [];
    }
  }
};
