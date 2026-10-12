import { apiClient, isNetworkOrServerError } from './client';
import { EventItem } from '../types';
import { MOCK_EVENTS } from '../constants/mockData';

export interface GetEventsOptions {
  search?: string;
  eventType?: string;
  month?: number;
  year?: number;
  location?: string;
  discipline?: string;
  page?: number;
  limit?: number;
}

export interface GetEventsResponse {
  events: EventItem[];
  totalPages: number;
}

export const eventsApi = {
  async getEvents(options?: GetEventsOptions): Promise<GetEventsResponse> {
    try {
      const params: Record<string, any> = {};
      if (options?.search) params.search = options.search;
      if (options?.eventType) params.eventType = options.eventType;
      if (typeof options?.month === 'number') params.month = options.month;
      if (typeof options?.year === 'number') params.year = options.year;
      if (options?.location && options.location !== 'All locations') params.location = options.location;
      if (options?.discipline && options.discipline !== 'Any discipline') params.discipline = options.discipline;
      if (options?.page) params.page = options.page;
      if (options?.limit) params.limit = options.limit;

      const res = await apiClient.get('/events', { params });
      const data = res.data;

      const events: EventItem[] = data.events || (Array.isArray(data) ? data : []);
      const totalPages: number = data.pagination?.pages || 1;

      return { events, totalPages };
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return { events: MOCK_EVENTS, totalPages: 1 };
      }
      throw err;
    }
  },

  async getEventById(id: string): Promise<EventItem> {
    try {
      const res = await apiClient.get<EventItem | { event: EventItem }>(`/events/${id}`);
      return (res.data as any).event ? (res.data as any).event : (res.data as EventItem);
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_EVENTS.find(e => e._id === id) || MOCK_EVENTS[0];
      }
      throw err;
    }
  },

  async registerForEvent(eventId: string): Promise<{ status?: string }> {
    try {
      const res = await apiClient.post(`/events/${eventId}/register`);
      return res.data || {};
    } catch (err) {
      try {
        const res = await apiClient.post('/events/register', { eventId });
        return res.data || {};
      } catch (err2) {
        if (!isNetworkOrServerError(err2)) throw err2;
        return {};
      }
    }
  },

  async unregisterFromEvent(eventId: string): Promise<void> {
    try {
      await apiClient.post(`/events/${eventId}/unregister`);
    } catch (err) {
      try {
        await apiClient.post('/events/unregister', { eventId });
      } catch (err2) {
        if (!isNetworkOrServerError(err2)) throw err2;
      }
    }
  },

  async getPendingRequests(eventId: string): Promise<any[]> {
    try {
      const res = await apiClient.get(`/events/${eventId}/requests`);
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      if (isNetworkOrServerError(err)) return [];
      return [];
    }
  },

  async handleRequestAction(eventId: string, userId: string, action: 'approve' | 'reject'): Promise<void> {
    try {
      await apiClient.post(`/events/${eventId}/requests/${userId}/${action}`);
    } catch (err) {
      if (!isNetworkOrServerError(err)) throw err;
    }
  },

  async getUserEvents(): Promise<EventItem[]> {
    try {
      const res = await apiClient.get<EventItem[] | { events: EventItem[] }>('/events/user-events');
      return Array.isArray(res.data) ? res.data : (res.data as any).events || [];
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_EVENTS.filter(e => e.isRegistered);
      }
      throw err;
    }
  }
};

