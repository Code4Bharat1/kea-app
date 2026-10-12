import { apiClient, isNetworkOrServerError } from './client';
import { GroupItem } from '../types';

export interface GetGroupsOptions {
  category?: string;
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface GetGroupsResponse {
  groups: GroupItem[];
  totalPages: number;
}

export interface GroupCategoryStat {
  name: string;
  count: number;
}

export const MOCK_GROUPS: GroupItem[] = [
  {
    _id: 'grp_1',
    name: 'Structural Engineers Forum',
    description: 'A dedicated group for structural engineers to discuss building codes, ETABS/STAAD modeling, and seismic design.',
    category: 'Discipline-based',
    type: 'public',
    discipline: 'Structural Engineering',
    region: 'India',
    memberCount: 142,
    approvalStatus: 'approved',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'grp_2',
    name: 'Mumbai City Chapter',
    description: 'KEA local chapter for engineers residing or working in the Mumbai Metropolitan Region.',
    category: 'City chapters',
    type: 'public',
    discipline: 'General',
    region: 'Mumbai',
    memberCount: 89,
    approvalStatus: 'approved',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'grp_3',
    name: 'BIM & Automation Circle',
    description: 'Revit, Dynamo, Python automation, and digital twin enthusiasts sharing tools & workflows.',
    category: 'Interest-based',
    type: 'public',
    discipline: 'Software & IT',
    region: 'Global',
    memberCount: 210,
    approvalStatus: 'approved',
    createdAt: new Date().toISOString(),
  },
];

export const groupsApi = {
  async getGroups(options?: GetGroupsOptions): Promise<GetGroupsResponse> {
    try {
      const params: Record<string, any> = {};

      if (options?.category && options.category !== 'All groups' && options.category !== 'All') {
        params.category = options.category;
      }
      if (options?.search) {
        params.search = options.search;
      }
      if (options?.type && options.type !== 'All') {
        params.type = options.type.toLowerCase();
      }
      if (options?.page) {
        params.page = options.page;
      }
      if (options?.limit) {
        params.limit = options.limit;
      }

      const res = await apiClient.get('/groups', { params });
      const data = res.data;

      const groups: GroupItem[] = data.groups || (Array.isArray(data) ? data : []);
      const totalPages: number = data.pagination?.pages || 1;

      return { groups, totalPages };
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return { groups: MOCK_GROUPS, totalPages: 1 };
      }
      throw err;
    }
  },

  async getCategoriesStats(): Promise<GroupCategoryStat[]> {
    try {
      const res = await apiClient.get<{ categories: GroupCategoryStat[] }>('/groups/categories/stats');
      return res.data?.categories || [];
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return [
          { name: 'All groups', count: MOCK_GROUPS.length },
          { name: 'General', count: 1 },
          { name: 'Discipline-based', count: 1 },
          { name: 'Interest-based', count: 1 },
          { name: 'City chapters', count: 1 },
        ];
      }
      return [];
    }
  },

  async getGroupById(id: string): Promise<GroupItem> {
    try {
      const res = await apiClient.get<GroupItem | { group: GroupItem }>(`/groups/${id}`);
      return (res.data as any).group ? (res.data as any).group : (res.data as GroupItem);
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_GROUPS.find((g) => g._id === id) || MOCK_GROUPS[0];
      }
      throw err;
    }
  },

  async createGroup(groupData: {
    name: string;
    description: string;
    category: string;
    type: string;
    discipline?: string;
    region?: string;
  }): Promise<{ group?: GroupItem; message?: string }> {
    try {
      const res = await apiClient.post('/groups', groupData);
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return {
          group: {
            _id: `grp_mock_${Date.now()}`,
            ...groupData,
            memberCount: 1,
            approvalStatus: 'pending',
            createdAt: new Date().toISOString(),
          },
        };
      }
      throw err;
    }
  },

  async joinGroup(groupId: string): Promise<any> {
    try {
      const res = await apiClient.post(`/groups/${groupId}/join`, {});
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return { success: true, message: 'Joined group successfully' };
      }
      throw err;
    }
  },

  async getMyPendingGroups(): Promise<GroupItem[]> {
    try {
      const meRes = await apiClient.get('/users/me');
      const userId = meRes.data._id;

      const res = await apiClient.get('/admin/groups?status=pending');
      const allPending: GroupItem[] = res.data.groups || [];

      return allPending.filter(
        (g: any) => g.creator?._id === userId && g.approvalStatus === 'pending'
      );
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return [];
      }
      return [];
    }
  },
};
