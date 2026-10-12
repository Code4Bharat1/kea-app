import { apiClient, isNetworkOrServerError } from './client';
import { NotificationItem } from '../types';
import { MOCK_NOTIFICATIONS } from '../constants/mockData';

export const notificationsApi = {
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const res = await apiClient.get<NotificationItem[] | { notifications: NotificationItem[] }>('/notifications');
      return Array.isArray(res.data) ? res.data : (res.data as any).notifications || [];
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_NOTIFICATIONS;
      }
      throw err;
    }
  },

  async markAsRead(id: string): Promise<void> {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch (err) {
      if (!isNetworkOrServerError(err)) throw err;
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.patch('/notifications/read-all');
    } catch (err) {
      if (!isNetworkOrServerError(err)) throw err;
    }
  }
};

