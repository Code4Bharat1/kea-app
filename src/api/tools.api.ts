import { apiClient, isNetworkOrServerError } from './client';
import { ToolItem, ToolCategoryStat } from '../types';

export interface GetToolsParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetToolsResponse {
  tools: ToolItem[];
  totalPages: number;
  total: number;
}

export const MOCK_TOOLS: ToolItem[] = [
  {
    _id: 'tool_1',
    name: 'AutoCAD Mechanical & Civil Suite',
    category: '2D CAD Drafting',
    description: 'Industry-standard 2D and 3D CAD software application used in architecture, construction, and manufacturing to design blueprints.',
    version: '2026.1',
    platform: 'Windows',
    license: 'Paid',
    fileSize: '3.2 GB',
    features: ['Precision 2D Drafting', 'Parametric Constraints', 'DWG Interoperability'],
    requirements: ['Windows 11 64-bit', '16 GB RAM', 'Dedicated GPU'],
    downloadLink: 'https://www.autodesk.com',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'tool_2',
    name: 'FreeCAD Parametric 3D Modeler',
    category: 'Parametric CAD',
    description: 'Open-source parametric 3D modeler made primarily to design real-life objects of any size.',
    version: '0.21.2',
    platform: 'Cross-platform',
    license: 'Open Source',
    fileSize: '540 MB',
    features: ['Parametric Modeling', 'FEM Workbench', 'Python Scripting Engine'],
    requirements: ['Windows / Mac / Linux', '4 GB RAM'],
    downloadLink: 'https://www.freecad.org',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'tool_3',
    name: 'STAAD.Pro Structural Analysis',
    category: 'Structural Analysis (Frame/Truss)',
    description: 'Leading 3D structural analysis and design software supporting over 90 international steel, concrete, and timber design codes.',
    version: '2025.2',
    platform: 'Windows',
    license: 'Paid',
    fileSize: '1.8 GB',
    features: ['Seismic Analysis', 'Finite Element Modeling', 'Steel Connection Design'],
    requirements: ['Windows 10/11', '8 GB RAM'],
    downloadLink: 'https://www.bentley.com',
    createdAt: new Date().toISOString(),
  },
];

export const toolsApi = {
  async getTools(params?: GetToolsParams): Promise<GetToolsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.category && params.category !== 'All tools') {
        queryParams.append('category', params.category);
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
      const endpoint = `/tools${queryString ? `?${queryString}` : ''}`;
      const res = await apiClient.get<any>(endpoint);

      const toolsList = Array.isArray(res.data)
        ? res.data
        : (res.data.tools || res.data.data || []);

      const total = res.data.pagination?.total || toolsList.length;
      const totalPages = res.data.pagination?.pages || 1;

      if (toolsList.length > 0) {
        return { tools: toolsList, totalPages, total };
      }

      let filtered = [...MOCK_TOOLS];
      if (params?.category && params.category !== 'All tools') {
        filtered = filtered.filter((t) => t.category === params.category);
      }
      if (params?.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.name.toLowerCase().includes(s) ||
            t.description?.toLowerCase().includes(s) ||
            t.category?.toLowerCase().includes(s)
        );
      }
      return { tools: filtered, totalPages: 1, total: filtered.length };
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        let filtered = [...MOCK_TOOLS];
        if (params?.category && params.category !== 'All tools') {
          filtered = filtered.filter((t) => t.category === params.category);
        }
        if (params?.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.name.toLowerCase().includes(s) ||
              t.description?.toLowerCase().includes(s) ||
              t.category?.toLowerCase().includes(s)
          );
        }
        return { tools: filtered, totalPages: 1, total: filtered.length };
      }
      throw err;
    }
  },

  async getCategoryStats(): Promise<ToolCategoryStat[]> {
    try {
      const res = await apiClient.get<{ categories: ToolCategoryStat[] }>('/tools/categories/stats');
      return res.data.categories || [];
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return [
          { name: 'All tools', count: MOCK_TOOLS.length },
          { name: '2D CAD Drafting', count: 1 },
          { name: 'Parametric CAD', count: 1 },
          { name: 'Structural Analysis (Frame/Truss)', count: 1 },
        ];
      }
      return [];
    }
  },

  async getToolById(id: string): Promise<ToolItem> {
    try {
      const res = await apiClient.get<ToolItem | { tool: ToolItem }>(`/tools/${id}`);
      return (res.data as any).tool ? (res.data as any).tool : (res.data as ToolItem);
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_TOOLS.find((t) => t._id === id) || MOCK_TOOLS[0];
      }
      throw err;
    }
  },

  async createTool(data: any): Promise<ToolItem> {
    const res = await apiClient.post('/tools', data);
    return res.data;
  },

  async uploadToolFile(formData: FormData): Promise<{ url: string; fileSize?: string }> {
    const res = await apiClient.post('/tools/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async incrementDownloads(id: string): Promise<void> {
    try {
      await apiClient.post(`/tools/${id}/download`);
    } catch (e) {
      // non-critical
    }
  },
};
