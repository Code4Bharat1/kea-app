import { apiClient, isNetworkOrServerError } from './client';
import { ResourceItem, ResourceCategory, ResourceCategoryStat } from '../types';
import { MOCK_RESOURCES } from '../constants/mockData';

export interface GetResourcesParams {
  category?: string;
  subcategory?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetResourcesResponse {
  resources: ResourceItem[];
  totalPages: number;
}

export const resourcesApi = {
  async getResources(params?: GetResourcesParams): Promise<GetResourcesResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.category && params.category !== 'All resources') {
        queryParams.append('category', params.category);
      }
      if (params?.subcategory) {
        queryParams.append('subcategory', params.subcategory);
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }

      const queryString = queryParams.toString();
      const endpoint = `/resources${queryString ? `?${queryString}` : ''}`;
      const res = await apiClient.get<any>(endpoint);

      if (Array.isArray(res.data)) {
        return { resources: res.data, totalPages: 1 };
      }
      return {
        resources: res.data.resources || [],
        totalPages: res.data.pagination?.pages || 1,
      };
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        let filtered = [...MOCK_RESOURCES];
        if (params?.category && params.category !== 'All resources') {
          filtered = filtered.filter(r => r.category === params.category);
        }
        if (params?.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(r => r.title.toLowerCase().includes(s) || r.description?.toLowerCase().includes(s));
        }
        return { resources: filtered, totalPages: 1 };
      }
      throw err;
    }
  },

  async getCategoryStats(): Promise<ResourceCategoryStat[]> {
    try {
      const res = await apiClient.get<{ categories: ResourceCategoryStat[] }>('/resources/categories/stats');
      return res.data.categories || [];
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return [
          { name: 'All resources', count: MOCK_RESOURCES.length },
          { name: 'IT', count: 1 },
          { name: 'Templates & checklists', count: 1 },
          { name: 'Codes & Standards', count: 1 },
        ];
      }
      return [];
    }
  },

  async getResourceCategories(): Promise<ResourceCategory[]> {
    try {
      const res = await apiClient.get<{ success?: boolean; categories: ResourceCategory[] }>('/resource-categories');
      return res.data.categories || [];
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return [
          { _id: 'rc_1', name: 'IT', subcategories: ['Software Architecture', 'Guide', 'DevOps', 'Security'] },
          { _id: 'rc_2', name: 'Templates & checklists', subcategories: ['Civil', 'Checklists', 'Design', 'QA'] },
          { _id: 'rc_3', name: 'Codes & Standards', subcategories: ['IS Codes', 'Eurocodes', 'Building Regulations'] },
        ];
      }
      return [];
    }
  },

  async getResourceById(id: string): Promise<ResourceItem> {
    try {
      const res = await apiClient.get<ResourceItem | { resource: ResourceItem }>(`/resources/${id}`);
      return (res.data as any).resource ? (res.data as any).resource : (res.data as ResourceItem);
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_RESOURCES.find(r => r._id === id) || MOCK_RESOURCES[0];
      }
      throw err;
    }
  },

  async createResource(data: {
    title: string;
    category: string;
    subcategory?: string;
    format: string;
    externalLink?: string;
    tags?: string[];
    description?: string;
    author?: string;
  }): Promise<any> {
    const res = await apiClient.post('/resources', data);
    return res.data;
  },

  async uploadResourceFile(formData: FormData): Promise<any> {
    const res = await apiClient.post('/resources/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async getViewResourceUrl(id: string): Promise<string> {
    const res = await apiClient.get<{ url?: string }>(`/resources/${id}/view`);
    return res.data.url || '';
  }
};


