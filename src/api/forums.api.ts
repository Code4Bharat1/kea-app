import { apiClient, isNetworkOrServerError } from './client';
import { ForumThread, ForumComment } from '../types';
import { MOCK_FORUMS, MOCK_USER } from '../constants/mockData';

export interface GetThreadsOptions {
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface GetThreadsResponse {
  threads: ForumThread[];
  totalPages: number;
}

export interface CategoryStat {
  name: string;
  count: number;
}

export const forumsApi = {
  async getThreads(
    optionsOrCategory?: string | GetThreadsOptions,
    searchArg?: string
  ): Promise<GetThreadsResponse> {
    try {
      const params: Record<string, any> = {};

      if (typeof optionsOrCategory === 'object' && optionsOrCategory !== null) {
        if (optionsOrCategory.category && optionsOrCategory.category !== 'All discussions') {
          params.category = optionsOrCategory.category;
        }
        if (optionsOrCategory.search) params.search = optionsOrCategory.search;
        if (optionsOrCategory.sort) params.sort = optionsOrCategory.sort;
        if (optionsOrCategory.page) params.page = optionsOrCategory.page;
        if (optionsOrCategory.limit) params.limit = optionsOrCategory.limit;
      } else {
        if (optionsOrCategory && optionsOrCategory !== 'All discussions') {
          params.category = optionsOrCategory;
        }
        if (searchArg) params.search = searchArg;
      }

      const res = await apiClient.get('/forums', { params });
      const data = res.data;

      const threads: ForumThread[] = data.threads || (Array.isArray(data) ? data : []);
      const totalPages: number = data.pagination?.pages || 1;

      return { threads, totalPages };
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return { threads: MOCK_FORUMS, totalPages: 1 };
      }
      throw err;
    }
  },

  async getCategoriesStats(): Promise<CategoryStat[]> {
    try {
      const res = await apiClient.get<{ categories: CategoryStat[] }>('/forums/categories/stats');
      return res.data?.categories || [];
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return [
          { name: 'All discussions', count: MOCK_FORUMS.length },
          { name: 'Structural engineering', count: 3 },
          { name: 'Civil & Infrastructure', count: 2 },
          { name: 'General', count: 4 },
        ];
      }
      return [];
    }
  },

  async getThreadById(id: string): Promise<ForumThread> {
    try {
      const res = await apiClient.get<ForumThread | { forum: ForumThread }>(`/forums/${id}`);
      return (res.data as any).forum ? (res.data as any).forum : (res.data as ForumThread);
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_FORUMS.find(f => f._id === id) || MOCK_FORUMS[0];
      }
      throw err;
    }
  },

  async createThread(
    title: string | { title: string; content: string; category?: string; tags?: string[] },
    contentArg?: string,
    categoryArg?: string,
    tagsArg?: string[]
  ): Promise<ForumThread> {
    try {
      let payload: { title: string; content: string; category?: string; tags?: string[] };
      if (typeof title === 'object' && title !== null) {
        payload = title;
      } else {
        payload = { title, content: contentArg || '', category: categoryArg, tags: tagsArg };
      }

      const res = await apiClient.post<ForumThread>('/forums', payload);
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        const titleText = typeof title === 'object' ? title.title : title;
        const contentText = typeof title === 'object' ? title.content : contentArg || '';
        const catText = typeof title === 'object' ? title.category : categoryArg;
        const tagsArr = typeof title === 'object' ? title.tags : tagsArg;
        return {
          _id: `forum_mock_${Date.now()}`,
          title: titleText,
          content: contentText,
          author: { _id: MOCK_USER._id, name: MOCK_USER.name },
          category: catText,
          tags: tagsArr,
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
          createdAt: new Date().toISOString(),
        };
      }
      throw err;
    }
  },

  async deleteThread(threadId: string): Promise<void> {
    try {
      await apiClient.delete(`/forums/${threadId}`);
    } catch (err) {
      if (!isNetworkOrServerError(err)) throw err;
    }
  },

  async togglePin(threadId: string): Promise<void> {
    try {
      await apiClient.patch(`/forums/${threadId}/pin`, {});
    } catch (err) {
      if (!isNetworkOrServerError(err)) throw err;
    }
  },

  async toggleLock(threadId: string): Promise<void> {
    try {
      await apiClient.patch(`/forums/${threadId}/lock`, {});
    } catch (err) {
      if (!isNetworkOrServerError(err)) throw err;
    }
  },

  async createCategory(categoryName: string): Promise<any> {
    try {
      const res = await apiClient.post('/forums/categories', { name: categoryName });
      return res.data;
    } catch (err) {
      if (!isNetworkOrServerError(err)) throw err;
    }
  },

  async addComment(threadId: string, content: string): Promise<ForumComment> {
    try {
      const res = await apiClient.post<ForumComment>(`/forums/${threadId}/comments`, { content });
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return {
          _id: `fc_mock_${Date.now()}`,
          user: { _id: MOCK_USER._id, name: MOCK_USER.name },
          content,
          createdAt: new Date().toISOString(),
        };
      }
      throw err;
    }
  },

  async addReply(threadId: string, content: string): Promise<ForumComment> {
    return this.addComment(threadId, content);
  },

  async likeThread(threadId: string): Promise<{ likesCount: number; isLiked: boolean }> {
    try {
      const res = await apiClient.post<{ likesCount: number; isLiked: boolean }>(`/forums/${threadId}/like`);
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return { likesCount: 13, isLiked: true };
      }
      throw err;
    }
  },

  async unlikeThread(threadId: string): Promise<{ likesCount: number; isLiked: boolean }> {
    try {
      const res = await apiClient.post<{ likesCount: number; isLiked: boolean }>(`/forums/${threadId}/unlike`);
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return { likesCount: 12, isLiked: false };
      }
      throw err;
    }
  },

  async likeReply(threadId: string, replyId: string): Promise<void> {
    try {
      await apiClient.post(`/forums/${threadId}/replies/${replyId}/like`, {});
    } catch (err) {
      if (!isNetworkOrServerError(err)) throw err;
    }
  }
};

