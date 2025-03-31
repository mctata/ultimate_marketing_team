import api from './api';

export interface ContentDraft {
  id: string;
  title: string;
  body: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  created_at: string;
  updated_at: string;
  author_id: string;
  brand_id: string;
  topics: string[];
  tags: string[];
}

export interface ContentTopic {
  id: string;
  name: string;
  description: string;
  brand_id: string;
}

export interface ABTest {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  content_draft_id: string;
  metrics: string[];
}

export interface ABTestVariant {
  id: string;
  test_id: string;
  variant_name: string;
  content: string;
  is_control: boolean;
  performance: Record<string, number>;
}

export interface ContentCalendarItem {
  id: string;
  content_draft_id: string;
  scheduled_date: string;
  platform: string;
  status: 'scheduled' | 'published' | 'failed';
  audience?: Record<string, any>;
}

export interface ContentPerformance {
  content_id: string;
  views: number;
  clicks: number;
  shares: number;
  comments: number;
  conversions: number;
  engagement_rate: number;
  platform_data: Record<string, any>;
  date: string;
}

// Content Draft APIs
export const getDrafts = (params?: { brand_id?: string; status?: string }) => 
  api.get<ContentDraft[]>('/content/drafts', { params });

export const getDraftById = (id: string) => 
  api.get<ContentDraft>(`/content/drafts/${id}`);

export const createDraft = (draft: Omit<ContentDraft, 'id' | 'created_at' | 'updated_at'>) => 
  api.post<ContentDraft>('/content/drafts', draft);

export const updateDraft = (id: string, draft: Partial<ContentDraft>) => 
  api.put<ContentDraft>(`/content/drafts/${id}`, draft);

export const deleteDraft = (id: string) => 
  api.delete(`/content/drafts/${id}`);

// Topics APIs
export const getTopics = (brandId?: string) => 
  api.get<ContentTopic[]>('/content/topics', { params: { brand_id: brandId } });

export const createTopic = (topic: Omit<ContentTopic, 'id'>) => 
  api.post<ContentTopic>('/content/topics', topic);

export const updateTopic = (id: string, topic: Partial<ContentTopic>) => 
  api.put<ContentTopic>(`/content/topics/${id}`, topic);

export const deleteTopic = (id: string) => 
  api.delete(`/content/topics/${id}`);

// Calendar APIs
export const getCalendarItems = (params?: { brand_id?: string; start_date?: string; end_date?: string }) => 
  api.get<ContentCalendarItem[]>('/content/calendar', { params });

export const scheduleContent = (item: Omit<ContentCalendarItem, 'id' | 'status'>) => 
  api.post<ContentCalendarItem>('/content/calendar', item);

export const updateSchedule = (id: string, item: Partial<ContentCalendarItem>) => 
  api.put<ContentCalendarItem>(`/content/calendar/${id}`, item);

export const deleteSchedule = (id: string) => 
  api.delete(`/content/calendar/${id}`);

// A/B Testing APIs
export const getABTests = (contentId?: string) => 
  api.get<ABTest[]>('/content/abtests', { params: { content_id: contentId } });

export const getABTestById = (id: string) => 
  api.get<ABTest>(`/content/abtests/${id}`);

export const createABTest = (test: Omit<ABTest, 'id'>) => 
  api.post<ABTest>('/content/abtests', test);

export const updateABTest = (id: string, test: Partial<ABTest>) => 
  api.put<ABTest>(`/content/abtests/${id}`, test);

export const deleteABTest = (id: string) => 
  api.delete(`/content/abtests/${id}`);

export const getABTestVariants = (testId: string) => 
  api.get<ABTestVariant[]>(`/content/abtests/${testId}/variants`);

export const createABTestVariant = (testId: string, variant: Omit<ABTestVariant, 'id' | 'test_id'>) => 
  api.post<ABTestVariant>(`/content/abtests/${testId}/variants`, variant);

// Performance APIs
export const getContentPerformance = (contentId: string, timeRange?: { start_date: string; end_date: string }) => 
  api.get<ContentPerformance[]>(`/content/performance/${contentId}`, { params: timeRange });

export const getOverallPerformance = (brandId?: string, timeRange?: { start_date: string; end_date: string }) => 
  api.get<Record<string, number>>('/content/performance/overall', { 
    params: { 
      brand_id: brandId,
      ...timeRange
    } 
  });