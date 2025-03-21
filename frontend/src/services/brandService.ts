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

class BrandService {
  /**
   * Get all brands
   */
  async getBrands(): Promise<Brand[]> {
    return apiMethods.get<Brand[]>('/brands');
  }

  /**
   * Get a single brand by ID
   */
  async getBrandById(id: string): Promise<Brand> {
    return apiMethods.get<Brand>(`/brands/${id}`);
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