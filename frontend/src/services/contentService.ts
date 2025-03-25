import { apiMethods } from './api';

export interface ContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  date: string;
  author: string;
  score: number;
  brandId: string;
  performance: {
    views: number;
    engagement: number;
    conversion: number;
  };
}

// Content by brand ID - mock data
const mockContentByBrand: Record<string, ContentItem[]> = {
  // TechPro Solutions
  '1': [
    {
      id: '1-1',
      title: 'Top 10 SaaS Trends for 2025',
      type: 'blog',
      status: 'published',
      date: '2025-03-15',
      author: 'Jane Smith',
      score: 92,
      brandId: '1',
      performance: {
        views: 1250,
        engagement: 4.8,
        conversion: 2.3
      }
    },
    {
      id: '1-2',
      title: 'TechPro Solutions Quarterly Newsletter',
      type: 'email',
      status: 'scheduled',
      date: '2025-03-25',
      author: 'John Doe',
      score: 88,
      brandId: '1',
      performance: {
        views: 0,
        engagement: 0,
        conversion: 0
      }
    },
    {
      id: '1-3',
      title: 'Cloud Solution Case Study: Enterprise Implementation',
      type: 'blog',
      status: 'published',
      date: '2025-03-05',
      author: 'Michael Brown',
      score: 95,
      brandId: '1',
      performance: {
        views: 3200,
        engagement: 5.2,
        conversion: 3.7
      }
    },
    {
      id: '1-4',
      title: 'Developer Conference Announcement',
      type: 'social',
      status: 'draft',
      date: '2025-03-18',
      author: 'Chris Wilson',
      score: 82,
      brandId: '1',
      performance: {
        views: 0,
        engagement: 0,
        conversion: 0
      }
    },
    {
      id: '1-5',
      title: 'How AI is Transforming Enterprise Solutions',
      type: 'blog',
      status: 'published',
      date: '2025-02-20',
      author: 'Jane Smith',
      score: 91,
      brandId: '1',
      performance: {
        views: 1870,
        engagement: 4.9,
        conversion: 2.8
      }
    }
  ],
  
  // GreenLife Organics
  '2': [
    {
      id: '2-1',
      title: 'Sustainable Farming Practices for 2025',
      type: 'blog',
      status: 'published',
      date: '2025-03-12',
      author: 'Emma Green',
      score: 89,
      brandId: '2',
      performance: {
        views: 980,
        engagement: 5.2,
        conversion: 1.8
      }
    },
    {
      id: '2-2',
      title: 'New Organic Product Line Launch',
      type: 'email',
      status: 'scheduled',
      date: '2025-03-22',
      author: 'David Miller',
      score: 85,
      brandId: '2',
      performance: {
        views: 0,
        engagement: 0,
        conversion: 0
      }
    },
    {
      id: '2-3',
      title: 'Earth Day Campaign Announcement',
      type: 'social',
      status: 'draft',
      date: '2025-03-10',
      author: 'Sarah Johnson',
      score: 76,
      brandId: '2',
      performance: {
        views: 0,
        engagement: 0,
        conversion: 0
      }
    },
    {
      id: '2-4',
      title: 'Benefits of Organic Personal Care Products',
      type: 'blog',
      status: 'published',
      date: '2025-02-28',
      author: 'Emily Chen',
      score: 93,
      brandId: '2',
      performance: {
        views: 1450,
        engagement: 6.1,
        conversion: 2.9
      }
    },
    {
      id: '2-5',
      title: 'Organic Recipes for Spring',
      type: 'blog',
      status: 'published',
      date: '2025-03-08',
      author: 'Chef Marco',
      score: 97,
      brandId: '2',
      performance: {
        views: 2100,
        engagement: 7.3,
        conversion: 3.2
      }
    }
  ],
  
  // Urban Fitness
  '3': [
    {
      id: '3-1',
      title: 'Home Workout Equipment Essentials',
      type: 'blog',
      status: 'published',
      date: '2025-03-10',
      author: 'Alex Trainer',
      score: 94,
      brandId: '3',
      performance: {
        views: 1850,
        engagement: 6.7,
        conversion: 4.1
      }
    },
    {
      id: '3-2',
      title: 'Spring Fitness Challenge Announcement',
      type: 'email',
      status: 'scheduled',
      date: '2025-03-20',
      author: 'Fitness Team',
      score: 87,
      brandId: '3',
      performance: {
        views: 0,
        engagement: 0,
        conversion: 0
      }
    },
    {
      id: '3-3',
      title: 'New Subscription Training Program',
      type: 'social',
      status: 'draft',
      date: '2025-03-15',
      author: 'Marketing Team',
      score: 83,
      brandId: '3',
      performance: {
        views: 0,
        engagement: 0,
        conversion: 0
      }
    },
    {
      id: '3-4',
      title: '30-Day Transformation Challenge Results',
      type: 'blog',
      status: 'published',
      date: '2025-02-25',
      author: 'Coach Sarah',
      score: 96,
      brandId: '3',
      performance: {
        views: 2300,
        engagement: 8.2,
        conversion: 5.7
      }
    },
    {
      id: '3-5',
      title: 'Best Nutrition Plans for Muscle Gain',
      type: 'blog',
      status: 'published',
      date: '2025-03-05',
      author: 'Nutritionist Mark',
      score: 91,
      brandId: '3',
      performance: {
        views: 1650,
        engagement: 5.8,
        conversion: 3.2
      }
    }
  ],
  
  // DreamHome Interiors
  '4': [
    {
      id: '4-1',
      title: 'Spring Interior Design Trends 2025',
      type: 'blog',
      status: 'published',
      date: '2025-03-12',
      author: 'Sophia Designer',
      score: 90,
      brandId: '4',
      performance: {
        views: 1320,
        engagement: 4.5,
        conversion: 2.1
      }
    },
    {
      id: '4-2',
      title: 'Luxury Collection Launch',
      type: 'email',
      status: 'scheduled',
      date: '2025-03-28',
      author: 'Marketing Team',
      score: 86,
      brandId: '4',
      performance: {
        views: 0,
        engagement: 0,
        conversion: 0
      }
    },
    {
      id: '4-3',
      title: 'Designer Showcase Event Announcement',
      type: 'social',
      status: 'draft',
      date: '2025-03-16',
      author: 'Events Team',
      score: 79,
      brandId: '4',
      performance: {
        views: 0,
        engagement: 0,
        conversion: 0
      }
    },
    {
      id: '4-4',
      title: 'Home Office Design Inspiration',
      type: 'blog',
      status: 'published',
      date: '2025-03-01',
      author: 'Design Team',
      score: 93,
      brandId: '4',
      performance: {
        views: 1780,
        engagement: 5.7,
        conversion: 3.4
      }
    },
    {
      id: '4-5',
      title: 'Client Transformation: Luxury Villa Redesign',
      type: 'blog',
      status: 'published',
      date: '2025-02-22',
      author: 'Lead Designer',
      score: 98,
      brandId: '4',
      performance: {
        views: 2450,
        engagement: 7.8,
        conversion: 4.6
      }
    }
  ]
};

class ContentService {
  /**
   * Get all content items for a specific brand
   */
  async getContentItems(brandId?: string): Promise<ContentItem[]> {
    try {
      // First try API
      return await apiMethods.get<ContentItem[]>('/content', { params: { brandId } });
    } catch (error) {
      console.log('Using mock content data for development');
      
      // Fall back to mock data for development
      if (brandId && mockContentByBrand[brandId]) {
        return Promise.resolve([...mockContentByBrand[brandId]]);
      }
      
      // If no brand ID or brand not found, return all content
      return Promise.resolve(Object.values(mockContentByBrand).flat());
    }
  }

  /**
   * Get a single content item by ID
   */
  async getContentItemById(id: string): Promise<ContentItem> {
    try {
      // First try API
      return await apiMethods.get<ContentItem>(`/content/${id}`);
    } catch (error) {
      console.log(`Using mock content data for ID: ${id}`);
      
      // Fall back to mock data for development
      const allContent = Object.values(mockContentByBrand).flat();
      const contentItem = allContent.find(item => item.id === id);
      
      if (!contentItem) {
        throw new Error(`Content item with ID ${id} not found`);
      }
      
      return Promise.resolve({...contentItem});
    }
  }
}

export default new ContentService();