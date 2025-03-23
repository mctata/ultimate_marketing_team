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
}

export interface CreateBrandInput {
  name: string;
  description: string;
  industry: string;
  website: string;
  logo?: string | null;
  active?: boolean;
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

class BrandService {
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
}

export default new BrandService();