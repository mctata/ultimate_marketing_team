import { apiMethods } from './api';

export interface Brand {
  id: string;
  name: string;
  description: string;
  logo?: string | null;
  industry: string;
  website: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  contentTone?: string;
  targetAudience?: string[];
  socialMediaAccounts?: {
    platform: string;
    url: string;
  }[];
  suggestedTopics?: string[];
  recommendedContentTypes?: string[];
}

export interface CreateBrandInput {
  name: string;
  description: string;
  industry: string;
  website: string;
  logo?: string | null;
  active?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  contentTone?: string;
  targetAudience?: string[];
  socialMediaAccounts?: {
    platform: string;
    url: string;
  }[];
  suggestedTopics?: string[];
  recommendedContentTypes?: string[];
}

export interface UpdateBrandInput extends Partial<CreateBrandInput> {
  id: string;
}

// Mock data for development
const mockBrands: Brand[] = [
  {
    id: '1',
    name: 'TechPro Solutions',
    description: 'Enterprise software and cloud services provider.',
    logo: 'https://placehold.co/200x200?text=TP',
    industry: 'Technology',
    website: 'https://techpro.example.com',
    active: true,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-03-10T00:00:00Z'
  },
  {
    id: '2',
    name: 'GreenLife Organics',
    description: 'Sustainable organic food and personal care products.',
    logo: 'https://placehold.co/200x200?text=GLO',
    industry: 'Food & Beverage',
    website: 'https://greenlife.example.com',
    active: true,
    createdAt: '2025-02-10T00:00:00Z',
    updatedAt: '2025-03-15T00:00:00Z'
  },
  {
    id: '3',
    name: 'Urban Fitness',
    description: 'Fitness equipment and subscription-based training programs.',
    logo: 'https://placehold.co/200x200?text=UF',
    industry: 'Health & Fitness',
    website: 'https://urbanfitness.example.com',
    active: false,
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-03-05T00:00:00Z'
  },
  {
    id: '4',
    name: 'DreamHome Interiors',
    description: 'Luxury home decor and interior design services.',
    logo: 'https://placehold.co/200x200?text=DHI',
    industry: 'Home & Garden',
    website: 'https://dreamhome.example.com',
    active: true,
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-03-18T00:00:00Z'
  }
];

// Website analysis response type
export interface WebsiteAnalysisResult {
  name: string;
  description: string;
  logo?: string;
  industry: string;
  website: string;
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  fonts: {
    primary: string;
    secondary?: string;
  };
  contentTone: string;
  products: string[];
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  socialMedia: {
    platform: string;
    url: string;
  }[];
  topics: string[];
  contentTypes: string[];
  schedule: {
    frequency: string;
    bestTimes: string[];
  };
  targetAudience: string[];
  hashtags: string[];
  marketingGoals: string[];
}

class BrandService {
  /**
   * Analyze a website URL to extract brand information
   */
  async analyzeWebsite(url: string): Promise<WebsiteAnalysisResult> {
    try {
      // First try API
      return await apiMethods.post<WebsiteAnalysisResult>('/brands/analyze-website', { url });
    } catch (error) {
      console.log('Using mock website analysis for development');
      // Fall back to mock data for development
      return Promise.resolve(this.getMockWebsiteAnalysis(url));
    }
  }

  /**
   * Get all brands
   */
  async getBrands(): Promise<Brand[]> {
    try {
      // First try API
      return await apiMethods.get<Brand[]>('/brands');
    } catch (error) {
      console.log('Using mock brands data for development');
      // Fall back to mock data for development
      return Promise.resolve([...mockBrands]);
    }
  }

  /**
   * Get a single brand by ID
   */
  async getBrandById(id: string): Promise<Brand> {
    try {
      // First try API
      return await apiMethods.get<Brand>(`/brands/${id}`);
    } catch (error) {
      console.log(`Using mock brand data for ID: ${id}`);
      // Fall back to mock data for development
      const brand = mockBrands.find(b => b.id === id);
      if (!brand) {
        throw new Error(`Brand with ID ${id} not found`);
      }
      return Promise.resolve({...brand});
    }
  }

  /**
   * Create a new brand
   */
  async createBrand(brandData: CreateBrandInput): Promise<Brand> {
    return apiMethods.post<Brand>('/brands', brandData);
  }

  /**
   * Update an existing brand
   */
  async updateBrand(id: string, brandData: Partial<CreateBrandInput>): Promise<Brand> {
    return apiMethods.put<Brand>(`/brands/${id}`, brandData);
  }

  /**
   * Delete a brand
   */
  async deleteBrand(id: string): Promise<void> {
    return apiMethods.delete<void>(`/brands/${id}`);
  }

  /**
   * Change brand status (activate/deactivate)
   */
  async updateBrandStatus(id: string, active: boolean): Promise<Brand> {
    return apiMethods.patch<Brand>(`/brands/${id}/status`, { active });
  }

  /**
   * Generate mock website analysis data
   * This is a fallback for development when the API is not available
   */
  private getMockWebsiteAnalysis(url: string): WebsiteAnalysisResult {
    // Extract domain name from URL for more realistic mock data
    const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    const domainParts = domain.split('.');
    const name = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
    
    // Create mock data based on domain
    let industry = 'Technology';
    let colors = { primary: '#3498db', secondary: '#2ecc71' };
    let tone = 'Professional';
    let products = ['Software', 'Cloud Services', 'Consulting'];
    
    // Adjust mock data based on TLD
    if (domainParts.includes('eco') || domain.includes('green')) {
      industry = 'Sustainability';
      colors = { primary: '#27ae60', secondary: '#2ecc71' };
      tone = 'Passionate';
      products = ['Sustainable Products', 'Environmental Services', 'Green Solutions'];
    } else if (domainParts.includes('shop') || domain.includes('store')) {
      industry = 'E-commerce';
      colors = { primary: '#f39c12', secondary: '#e74c3c' };
      tone = 'Friendly';
      products = ['Online Store', 'Physical Products', 'Subscription Services'];
    }
    
    return {
      name: name,
      description: `${name} is a leading provider of innovative solutions in the ${industry.toLowerCase()} industry.`,
      logo: `https://placehold.co/400x400/random?text=${name.substring(0, 2).toUpperCase()}`,
      industry: industry,
      website: url,
      colors: colors,
      fonts: {
        primary: 'Roboto',
        secondary: 'Open Sans'
      },
      contentTone: tone,
      products: products,
      contactInfo: {
        email: `info@${domain}`,
        phone: '+1 (555) 123-4567'
      },
      socialMedia: [
        { platform: 'Twitter', url: `https://twitter.com/${domainParts[0]}` },
        { platform: 'LinkedIn', url: `https://linkedin.com/company/${domainParts[0]}` },
        { platform: 'Instagram', url: `https://instagram.com/${domainParts[0]}` }
      ],
      topics: [
        `${industry} Trends`,
        'Industry News',
        'Product Updates',
        'Customer Success Stories'
      ],
      contentTypes: [
        'Blog Posts',
        'Case Studies',
        'Infographics',
        'Video Tutorials'
      ],
      schedule: {
        frequency: 'Weekly',
        bestTimes: ['Tuesday 10:00 AM', 'Thursday 2:00 PM']
      },
      targetAudience: [
        'Business Professionals',
        'Industry Experts',
        'Decision Makers',
        'Technology Enthusiasts'
      ],
      hashtags: [
        `#${name}`,
        `#${industry}`,
        '#Innovation',
        '#Growth'
      ],
      marketingGoals: [
        'Increase Brand Awareness',
        'Generate Quality Leads',
        'Improve Customer Engagement',
        'Boost Website Traffic'
      ]
    };
  }
}

export default new BrandService();