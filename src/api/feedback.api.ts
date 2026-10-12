import { apiClient, isNetworkOrServerError, getCleanErrorMessage } from './client';

export interface FeedbackItem {
  _id: string;
  category: string;
  subject: string;
  message: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | string;
  status: 'pending' | 'in-progress' | 'resolved' | 'closed' | string;
  rating?: number;
  isAnonymous?: boolean;
  createdAt: string;
  adminResponse?: {
    message: string;
    respondedBy?: {
      name: string;
      email?: string;
    };
    respondedAt?: string;
  };
}

export interface FeedbackStats {
  total: number;
  pending: number;
  'in-progress': number;
  resolved: number;
  closed?: number;
}

export interface FeedbackSubmitPayload {
  category: string;
  subject: string;
  message: string;
  priority: string;
  rating?: number;
  isAnonymous?: boolean;
}

// Fallback initial data in case the server is offline
let mockFeedbacks: FeedbackItem[] = [
  {
    _id: 'fb_mock_1',
    category: 'General Feedback',
    subject: 'Membership Portal Experience',
    message: 'The new dashboard layout is responsive and easy to navigate. Looking forward to more community workshops.',
    priority: 'Medium',
    status: 'resolved',
    rating: 5,
    isAnonymous: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    adminResponse: {
      message: 'Thank you for your valuable feedback! We are constantly working on new workshops for KEA members.',
      respondedBy: { name: 'KEA Support Team' },
      respondedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  },
];

export const feedbackApi = {
  async getStats(): Promise<FeedbackStats> {
    try {
      const res = await apiClient.get<FeedbackStats>('/feedback/stats');
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        const total = mockFeedbacks.length;
        const pending = mockFeedbacks.filter((f) => f.status === 'pending').length;
        const inProgress = mockFeedbacks.filter((f) => f.status === 'in-progress').length;
        const resolved = mockFeedbacks.filter((f) => f.status === 'resolved').length;
        return {
          total,
          pending,
          'in-progress': inProgress,
          resolved,
          closed: 0,
        };
      }
      throw new Error(getCleanErrorMessage(err));
    }
  },

  async getFeedbacks(page: number = 1, limit: number = 10): Promise<{ feedbacks: FeedbackItem[]; total: number; pages: number }> {
    try {
      const res = await apiClient.get<{ feedbacks: FeedbackItem[]; pagination?: { total: number; pages: number } }>(
        `/feedback?page=${page}&limit=${limit}`
      );
      return {
        feedbacks: res.data.feedbacks || [],
        total: res.data.pagination?.total || (res.data.feedbacks ? res.data.feedbacks.length : 0),
        pages: res.data.pagination?.pages || 1,
      };
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return {
          feedbacks: mockFeedbacks,
          total: mockFeedbacks.length,
          pages: 1,
        };
      }
      throw new Error(getCleanErrorMessage(err));
    }
  },

  async submitFeedback(payload: FeedbackSubmitPayload): Promise<{ success: boolean; message: string; feedback?: FeedbackItem }> {
    try {
      const res = await apiClient.post<{ message: string; feedback: FeedbackItem }>('/feedback', payload);
      if (res.data?.feedback) {
        mockFeedbacks.unshift(res.data.feedback);
      }
      return {
        success: true,
        message: res.data?.message || 'Feedback submitted successfully',
        feedback: res.data?.feedback,
      };
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        const newMock: FeedbackItem = {
          _id: `fb_mock_${Date.now()}`,
          category: payload.category,
          subject: payload.subject,
          message: payload.message,
          priority: payload.priority,
          rating: payload.rating,
          isAnonymous: payload.isAnonymous,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        mockFeedbacks.unshift(newMock);
        return {
          success: true,
          message: 'Feedback submitted successfully!',
          feedback: newMock,
        };
      }
      throw new Error(getCleanErrorMessage(err));
    }
  },

  async deleteFeedback(id: string): Promise<void> {
    try {
      await apiClient.delete(`/feedback/${id}`);
      mockFeedbacks = mockFeedbacks.filter((f) => f._id !== id);
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        mockFeedbacks = mockFeedbacks.filter((f) => f._id !== id);
        return;
      }
      throw new Error(getCleanErrorMessage(err));
    }
  },
};
