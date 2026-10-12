import { apiClient, isNetworkOrServerError } from './client';
import { BlogItem, BlogComment } from '../types';
import { MOCK_BLOGS, MOCK_USER } from '../constants/mockData';

export const blogsApi = {
  async getBlogs(category?: string, search?: string): Promise<BlogItem[]> {
    try {
      const params: Record<string, string> = {};
      if (category) params.category = category;
      if (search) params.search = search;
      const res = await apiClient.get<BlogItem[] | { blogs: BlogItem[] }>('/blogs', { params });
      return Array.isArray(res.data) ? res.data : (res.data as any).blogs || [];
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_BLOGS;
      }
      throw err;
    }
  },

  async getBlogById(id: string): Promise<BlogItem> {
    try {
      const res = await apiClient.get<BlogItem | { blog: BlogItem }>(`/blogs/${id}`);
      return (res.data as any).blog ? (res.data as any).blog : (res.data as BlogItem);
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_BLOGS.find(b => b._id === id) || MOCK_BLOGS[0];
      }
      throw err;
    }
  },

  async getComments(blogId: string): Promise<BlogComment[]> {
    try {
      const res = await apiClient.get<BlogComment[] | { comments: BlogComment[] }>(`/blogs/${blogId}/comments`);
      return Array.isArray(res.data) ? res.data : (res.data as any).comments || [];
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return [
          {
            _id: `comment_mock_${Date.now()}`,
            blog: blogId,
            user: { _id: MOCK_USER._id, name: MOCK_USER.name },
            content: 'Great insightful article for coastal region engineering!',
            createdAt: new Date().toISOString(),
          },
        ];
      }
      throw err;
    }
  },

  async addComment(blogId: string, content: string): Promise<BlogComment> {
    try {
      const res = await apiClient.post<BlogComment>(`/blogs/${blogId}/comments`, { content });
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return {
          _id: `comment_mock_${Date.now()}`,
          blog: blogId,
          user: { _id: MOCK_USER._id, name: MOCK_USER.name },
          content,
          createdAt: new Date().toISOString(),
        };
      }
      throw err;
    }
  },

  async likeBlog(blogId: string): Promise<{ likesCount: number; isLiked: boolean }> {
    try {
      const res = await apiClient.post<{ likesCount: number; isLiked: boolean }>(`/blogs/${blogId}/like`);
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return { likesCount: 25, isLiked: true };
      }
      throw err;
    }
  }
};

