import axios from 'axios';
import { API_BASE_URL } from '../config';

// Define types
export interface CalendarItem {
  id: number;
  project_id: number;
  content_draft_id: number | null;
  scheduled_date: string;
  published_date: string | null;
  status: string;
  title?: string;
  content_type?: string;
  platform?: string;
}

// Type interfaces needed by contentSlice.ts
export interface CalendarEntry {
  startDate: string;
  endDate: string;
}

export interface CalendarEntryResponse {
  data: any[];
}

export interface BestTimeRecommendation {
  platform: string;
  day_of_week: number;
  hour_of_day: number;
  average_engagement: number;
  confidence: number;
}

export interface SchedulingInsight {
  insight_type: string;
  description: string;
  severity: string;
  start_date?: string;
  end_date?: string;
  affected_content_ids?: number[];
  recommendation: string;
}

export interface ScheduleItemRequest {
  project_id: number;
  content_draft_id: number | null;
  scheduled_date: string;
  status: string;
  platform?: string;
  content_type?: string;
}

export interface BulkScheduleRequest {
  items: ScheduleItemRequest[];
}

const contentCalendarService = {
  // Get calendar entries (original implementation)
  getCalendarEntriesOriginal: async (
    projectId: number, 
    startDate?: string, 
    endDate?: string, 
    status?: string
  ): Promise<CalendarItem[]> => {
    let url = `${API_BASE_URL}/content-calendar/?project_id=${projectId}`;
    
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    if (status) url += `&status=${status}`;
    
    const response = await axios.get<CalendarItem[]>(url);
    return response.data;
  },
  
  // Implementation for contentSlice.ts
  getCalendarEntries: async (
    dateRange: CalendarEntry
  ): Promise<CalendarEntryResponse> => {
    let url = `${API_BASE_URL}/content-calendar/`;
    
    if (dateRange.startDate) url += `&start_date=${dateRange.startDate}`;
    if (dateRange.endDate) url += `&end_date=${dateRange.endDate}`;
    
    const response = await axios.get<any[]>(url);
    return { data: response.data };
  },
  
  // Get a single calendar entry
  getCalendarEntry: async (entryId: number): Promise<CalendarItem> => {
    const response = await axios.get<CalendarItem>(`${API_BASE_URL}/content-calendar/${entryId}`);
    return response.data;
  },
  
  // Create a calendar entry
  createCalendarEntry: async (entry: ScheduleItemRequest): Promise<CalendarItem> => {
    const response = await axios.post<CalendarItem>(`${API_BASE_URL}/content-calendar/`, entry);
    return response.data;
  },
  
  // Update a calendar entry
  updateCalendarEntry: async (entryId: number, updates: Partial<ScheduleItemRequest>): Promise<CalendarItem> => {
    const response = await axios.put<CalendarItem>(`${API_BASE_URL}/content-calendar/${entryId}`, updates);
    return response.data;
  },
  
  // Delete a calendar entry
  deleteCalendarEntry: async (entryId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/content-calendar/${entryId}`);
  },
  
  // Bulk create calendar entries
  bulkCreateCalendarEntries: async (entries: BulkScheduleRequest): Promise<CalendarItem[]> => {
    const response = await axios.post<CalendarItem[]>(`${API_BASE_URL}/content-calendar/bulk`, entries);
    return response.data;
  },
  
  // Bulk update calendar entries
  bulkUpdateCalendarEntries: async (entryIds: number[], updates: Partial<ScheduleItemRequest>): Promise<CalendarItem[]> => {
    const response = await axios.put<CalendarItem[]>(`${API_BASE_URL}/content-calendar/bulk`, {
      item_ids: entryIds,
      updates: updates
    });
    return response.data;
  },
  
  // Publish content
  publishContent: async (entryId: number): Promise<CalendarItem> => {
    const response = await axios.post<CalendarItem>(`${API_BASE_URL}/content-calendar/${entryId}/publish`);
    return response.data;
  },
  
  // Get scheduling insights
  getSchedulingInsights: async (
    projectId: number, 
    startDate: string, 
    endDate: string
  ): Promise<SchedulingInsight[]> => {
    const response = await axios.get<SchedulingInsight[]>(
      `${API_BASE_URL}/content-calendar/insights/conflicts?project_id=${projectId}&start_date=${startDate}&end_date=${endDate}`
    );
    return response.data;
  },
  
  // Get best time recommendations
  getBestTimeRecommendations: async (projectId: number): Promise<BestTimeRecommendation[]> => {
    const response = await axios.get<BestTimeRecommendation[]>(
      `${API_BASE_URL}/content-calendar/insights/best-times?project_id=${projectId}`
    );
    return response.data;
  },
  
  // Implementation for contentSlice.ts
  // Get calendar insights
  getCalendarInsights: async (brandId: string): Promise<{data: any[]}> => {
    const response = await axios.get<any[]>(
      `${API_BASE_URL}/content-calendar/insights?brand_id=${brandId}`
    );
    return { data: response.data };
  },
  
  // Publish a calendar entry
  publishCalendarEntry: async (entryId: string): Promise<{data: any}> => {
    const response = await axios.post<any>(
      `${API_BASE_URL}/content-calendar/${entryId}/publish`
    );
    return { data: response.data };
  }
};

export default contentCalendarService;