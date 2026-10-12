import { apiClient, isNetworkOrServerError } from './client';
import { GalleryItem, GalleryCategoryStat } from '../types';

export interface GetGalleryOptions {
  category?: string;
  search?: string;
  year?: string;
  page?: number;
  limit?: number;
}

export interface GetGalleryResponse {
  items: GalleryItem[];
  totalPages: number;
}

const MOCK_GALLERY_ITEMS: GalleryItem[] = [
  {
    _id: 'mock_gal_1',
    title: 'KEA Annual Technical Symposium 2025',
    description: 'Highlights and celebrations from our flagship engineering symposium bringing together alumni and students.',
    category: 'Event Category',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    uploadedBy: {
      _id: 'u1',
      name: 'Er. Imran Khan',
    },
    tags: ['symposium', 'conference', 'kea2025'],
    likes: ['u1', 'u2'],
    comments: [
      {
        _id: 'c1',
        user: { _id: 'u2', name: 'Er. Sarah Shaikh' },
        content: 'Wonderful organization and informative keynote sessions!',
        createdAt: new Date().toISOString(),
      },
    ],
    eventDate: '2025-11-15',
    location: 'Mumbai, India',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'mock_gal_2',
    title: 'Inspiring Alumni Community',
    description: 'KEA has provided me with an invaluable network of Kokani engineering leaders across the Middle East. Proud to be a member!',
    category: 'Testimonials',
    uploadedBy: {
      _id: 'u2',
      name: 'Er. Asif Patel',
    },
    likes: ['u1'],
    comments: [],
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'mock_gal_3',
    title: 'Smart Infrastructure & Bridge Project',
    description: 'Showcasing our completed cable-stayed bridge design project built by our KEA member team.',
    category: 'Project Showcase',
    imageUrl: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800',
    uploadedBy: {
      _id: 'u3',
      name: 'Er. Zubair Ahmed',
    },
    tags: ['civil', 'bridge', 'infrastructure'],
    likes: ['u1', 'u2', 'u3'],
    comments: [],
    eventDate: '2025-08-10',
    location: 'Dubai, UAE',
    createdAt: new Date().toISOString(),
  },
];

export const galleryApi = {
  async getGallery(options?: GetGalleryOptions): Promise<GetGalleryResponse> {
    try {
      const params: Record<string, any> = {};
      if (options?.category && options.category !== 'All photos') params.category = options.category;
      if (options?.search) params.search = options.search;
      if (options?.year && options.year !== 'All years') params.year = options.year;
      if (options?.page) params.page = options.page;
      if (options?.limit) params.limit = options.limit;

      const res = await apiClient.get('/gallery', { params });
      const data = res.data;

      const items: GalleryItem[] = data.items || (Array.isArray(data) ? data : []);
      const totalPages: number = data.pagination?.pages || 1;

      return { items, totalPages };
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        let items = [...MOCK_GALLERY_ITEMS];
        if (options?.category && options.category !== 'All photos') {
          items = items.filter((i) => i.category === options.category);
        }
        if (options?.search) {
          const q = options.search.toLowerCase();
          items = items.filter(
            (i) =>
              i.title.toLowerCase().includes(q) ||
              (i.description && i.description.toLowerCase().includes(q))
          );
        }
        return { items, totalPages: 1 };
      }
      throw err;
    }
  },

  async getGalleryItem(id: string): Promise<GalleryItem> {
    try {
      const res = await apiClient.get<GalleryItem>(`/gallery/${id}`);
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        return MOCK_GALLERY_ITEMS.find((i) => i._id === id) || MOCK_GALLERY_ITEMS[0];
      }
      throw err;
    }
  },

  async getCategoryStats(): Promise<{ categories: GalleryCategoryStat[] }> {
    try {
      const res = await apiClient.get('/gallery/categories/stats');
      const categories = res.data.categories || [
        { name: 'All photos', count: 3 },
        { name: 'Event Category', count: 1 },
        { name: 'Project Showcase', count: 1 },
        { name: 'Member Activities', count: 0 },
        { name: 'Good Wishes', count: 0 },
        { name: 'Testimonials', count: 1 },
      ];
      return { categories };
    } catch (err) {
      return {
        categories: [
          { name: 'All photos', count: 3 },
          { name: 'Event Category', count: 1 },
          { name: 'Project Showcase', count: 1 },
          { name: 'Member Activities', count: 0 },
          { name: 'Good Wishes', count: 0 },
          { name: 'Testimonials', count: 1 },
        ],
      };
    }
  },

  async uploadGalleryItem(itemData: Partial<GalleryItem>): Promise<GalleryItem> {
    try {
      const res = await apiClient.post('/gallery', itemData);
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        const newItem: GalleryItem = {
          _id: `mock_gal_${Date.now()}`,
          title: itemData.title || 'Untitled',
          description: itemData.description,
          category: itemData.category || 'Good Wishes',
          imageUrl: itemData.imageUrl,
          location: itemData.location,
          eventDate: itemData.eventDate,
          tags: typeof itemData.tags === 'string' ? (itemData.tags as any).split(',').map((t: string) => t.trim()) : itemData.tags,
          uploadedBy: { _id: 'me', name: 'You' },
          likes: [],
          comments: [],
          createdAt: new Date().toISOString(),
        };
        MOCK_GALLERY_ITEMS.unshift(newItem);
        return newItem;
      }
      throw err;
    }
  },

  async likeGalleryItem(id: string): Promise<void> {
    try {
      await apiClient.post(`/gallery/${id}/like`);
    } catch (err) {
      if (!isNetworkOrServerError(err)) throw err;
    }
  },

  async commentGalleryItem(id: string, content: string): Promise<GalleryItem> {
    try {
      const res = await apiClient.post(`/gallery/${id}/comment`, { content });
      return res.data;
    } catch (err) {
      if (isNetworkOrServerError(err)) {
        const item = MOCK_GALLERY_ITEMS.find((i) => i._id === id);
        if (item) {
          if (!item.comments) item.comments = [];
          item.comments.push({
            _id: `c_${Date.now()}`,
            user: { _id: 'me', name: 'You' },
            content,
            createdAt: new Date().toISOString(),
          });
          return item;
        }
      }
      throw err;
    }
  },
};
