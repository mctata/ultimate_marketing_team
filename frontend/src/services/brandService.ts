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
  postingFrequency?: string;
  postingTimes?: string[];
  marketingGoals?: string[];
  hashtags?: string[];
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
    try {
      // First try API
      return await apiMethods.post<Brand>('/brands', brandData);
    } catch (error) {
      console.log('Using mock brand creation for development');
      
      // For development: create a mock brand response
      const mockId = Date.now().toString();
      const currentDate = new Date().toISOString();
      
      // Create a complete mock brand with all the properties
      const mockBrand: Brand = {
        id: mockId,
        name: brandData.name,
        description: brandData.description,
        logo: brandData.logo,
        industry: brandData.industry,
        website: brandData.website,
        active: brandData.active || true,
        createdAt: currentDate,
        updatedAt: currentDate,
        primaryColor: brandData.primaryColor,
        secondaryColor: brandData.secondaryColor,
        fontFamily: brandData.fontFamily,
        contentTone: brandData.contentTone,
        targetAudience: brandData.targetAudience,
        socialMediaAccounts: brandData.socialMediaAccounts,
        suggestedTopics: brandData.suggestedTopics,
        recommendedContentTypes: brandData.recommendedContentTypes
      };
      
      // Store the newly created mock brand in the mock brands array
      // so it can be retrieved later when redirecting to the brand page
      mockBrands.push(mockBrand);
      
      return Promise.resolve(mockBrand);
    }
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
    let tone = 'Professional, Analytical';
    let products = ['Software', 'Cloud Services', 'Consulting'];
    let targetAudience = ['Business Professionals', 'IT Decision Makers', 'Software Developers', 'Technology Enthusiasts'];
    let contentTypes = ['Blog Posts', 'Case Studies', 'Whitepapers', 'Video Tutorials'];
    let hashtags = [`#${name}`, '#TechSolutions', '#Innovation', '#DigitalTransformation', '#CloudComputing'];
    let topics = ['Technology Trends', 'Industry News', 'Product Updates', 'Case Studies'];
    let schedule = { frequency: 'Weekly', bestTimes: ['Tuesday 10:00 AM', 'Thursday 2:00 PM'] };
    let marketingGoals = ['Increase Brand Awareness', 'Generate Quality Leads', 'Establish Thought Leadership', 'Drive Product Adoption'];
    
    // Adjust mock data based on domain cues
    if (domainParts.includes('eco') || domain.includes('green') || domain.includes('sustain')) {
      industry = 'Sustainability';
      colors = { primary: '#27ae60', secondary: '#2ecc71' };
      tone = 'Passionate, Educational, Inspirational';
      products = ['Sustainable Products', 'Environmental Services', 'Green Solutions'];
      contentTypes = ['Blog Posts', 'Impact Reports', 'Infographics', 'Success Stories'];
      targetAudience = ['Environmentally Conscious Consumers', 'Corporate Sustainability Officers', 'Green Investors', 'Policy Makers'];
      hashtags = [`#${name}`, '#Sustainability', '#GreenLiving', '#ClimateAction', '#EcoFriendly'];
      topics = ['Sustainability Trends', 'Environmental Impact', 'Green Living Tips', 'Success Stories'];
      schedule = { frequency: 'Weekly', bestTimes: ['Monday 9:00 AM', 'Wednesday 2:00 PM'] };
      marketingGoals = ['Raise Environmental Awareness', 'Grow Community Engagement', 'Drive Sustainable Practices', 'Increase Brand Trust'];
    } 
    else if (domainParts.includes('shop') || domain.includes('store') || domain.includes('buy')) {
      industry = 'E-commerce';
      colors = { primary: '#f39c12', secondary: '#e74c3c' };
      tone = 'Friendly, Conversational, Persuasive';
      products = ['Online Store', 'Physical Products', 'Subscription Services'];
      contentTypes = ['Product Features', 'Customer Reviews', 'Shopping Guides', 'Promotional Content'];
      targetAudience = ['Online Shoppers', 'Millennial Consumers', 'Deal Seekers', 'Loyal Customers'];
      hashtags = [`#${name}Products`, '#ShopNow', '#NewArrivals', '#SaleAlert', '#CustomerFavorites'];
      topics = ['Product Showcases', 'Shopping Guides', 'Seasonal Collections', 'Customer Spotlights'];
      schedule = { frequency: 'Daily', bestTimes: ['Monday 12:00 PM', 'Friday 3:00 PM', 'Saturday 10:00 AM'] };
      marketingGoals = ['Increase Online Sales', 'Reduce Cart Abandonment', 'Improve Customer Retention', 'Expand Product Awareness'];
    }
    else if (domainParts.includes('health') || domain.includes('med') || domain.includes('care') || domain.includes('wellness')) {
      industry = 'Healthcare';
      colors = { primary: '#3498db', secondary: '#1abc9c' };
      tone = 'Caring, Trustworthy, Informative';
      products = ['Healthcare Services', 'Wellness Programs', 'Medical Solutions'];
      contentTypes = ['Educational Articles', 'Expert Interviews', 'Patient Stories', 'Health Tips'];
      targetAudience = ['Patients', 'Healthcare Professionals', 'Caregivers', 'Wellness Enthusiasts'];
      hashtags = [`#${name}Care`, '#HealthTips', '#WellnessMatters', '#HealthcareInnovation'];
      topics = ['Preventative Health', 'Medical Advances', 'Wellness Practices', 'Patient Experiences'];
      schedule = { frequency: 'Weekly', bestTimes: ['Monday 8:00 AM', 'Wednesday 12:00 PM'] };
      marketingGoals = ['Build Patient Trust', 'Educate Target Audience', 'Highlight Expertise', 'Improve Community Health'];
    }
    else if (domainParts.includes('edu') || domain.includes('learn') || domain.includes('academy')) {
      industry = 'Education';
      colors = { primary: '#9b59b6', secondary: '#3498db' };
      tone = 'Educational, Encouraging, Supportive';
      products = ['Courses', 'Educational Resources', 'Learning Programs'];
      contentTypes = ['Tutorials', 'Course Previews', 'Student Success Stories', 'Educational Resources'];
      targetAudience = ['Students', 'Parents', 'Educators', 'Lifelong Learners'];
      hashtags = [`#${name}Learning`, '#Education', '#StudentSuccess', '#LearningTips'];
      topics = ['Learning Techniques', 'Education Trends', 'Student Highlights', 'Course Information'];
      schedule = { frequency: 'Weekly', bestTimes: ['Sunday 7:00 PM', 'Tuesday 3:00 PM'] };
      marketingGoals = ['Increase Enrollment', 'Highlight Student Success', 'Establish Educational Authority', 'Build Learning Community'];
    }
    else if (domainParts.includes('food') || domain.includes('restaurant') || domain.includes('eat') || domain.includes('kitchen')) {
      industry = 'Food & Beverage';
      colors = { primary: '#e74c3c', secondary: '#f1c40f' };
      tone = 'Appetizing, Friendly, Enthusiastic';
      products = ['Food Items', 'Restaurant Services', 'Culinary Experiences'];
      contentTypes = ['Recipes', 'Food Photography', 'Chef Interviews', 'Culinary Tips'];
      targetAudience = ['Food Enthusiasts', 'Home Cooks', 'Dining Patrons', 'Health-Conscious Eaters'];
      hashtags = [`#${name}Eats`, '#FoodLover', '#Delicious', '#FreshIngredients'];
      topics = ['Seasonal Dishes', 'Food Stories', 'Cooking Tips', 'Menu Highlights'];
      schedule = { frequency: 'Daily', bestTimes: ['Tuesday 11:00 AM', 'Friday 5:00 PM', 'Sunday 10:00 AM'] };
      marketingGoals = ['Increase Restaurant Visits', 'Build Food Community', 'Showcase Culinary Expertise', 'Drive Online Orders'];
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
        { platform: 'Instagram', url: `https://instagram.com/${domainParts[0]}` },
        { platform: 'Facebook', url: `https://facebook.com/${domainParts[0]}` }
      ],
      topics: topics,
      contentTypes: contentTypes,
      schedule: schedule,
      targetAudience: targetAudience,
      hashtags: hashtags,
      marketingGoals: marketingGoals
    };
  }
}

export default new BrandService();