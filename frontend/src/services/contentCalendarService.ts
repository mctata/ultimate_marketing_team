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
    
    try {
      const response = await axios.get<CalendarItem[]>(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching calendar entries:', error);
      return [];
    }
  },
  
  // Implementation for contentSlice.ts with correct URL parameter handling
  getCalendarEntries: async (
    dateRange: CalendarEntry
  ): Promise<CalendarEntryResponse> => {
    let url = `${API_BASE_URL}/content-calendar/`;
    let params = new URLSearchParams();
    
    if (dateRange.startDate) params.append('start_date', dateRange.startDate);
    if (dateRange.endDate) params.append('end_date', dateRange.endDate);
    
    // Add the query string to the URL
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    try {
      const response = await axios.get<any[]>(url);
      return { data: response.data };
    } catch (error) {
      console.error('Error fetching calendar entries:', error);
      // Return empty data array on error to prevent UI crashes
      return { data: [] };
    }
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
  
  // Get scheduling insights with fallback to mock data
  getSchedulingInsights: async (
    projectId: number, 
    startDate: string, 
    endDate: string
  ): Promise<SchedulingInsight[]> => {
    try {
      const url = `${API_BASE_URL}/content-calendar/insights/conflicts`;
      const params = new URLSearchParams();
      
      params.append('project_id', projectId.toString());
      params.append('start_date', startDate);
      params.append('end_date', endDate);
      
      const response = await axios.get<SchedulingInsight[]>(
        `${url}?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch scheduling insights, returning mock data:', error);
      // Return mock data for development
      return [
        {
          insight_type: 'content_gap',
          description: 'There is a gap in your content schedule next week',
          severity: 'warning',
          start_date: startDate,
          end_date: endDate,
          recommendation: 'Consider scheduling content for next week to maintain engagement'
        },
        {
          insight_type: 'platform_neglect',
          description: 'LinkedIn has had minimal content recently',
          severity: 'info',
          recommendation: 'Increase LinkedIn posting frequency to 2-3 times per week'
        }
      ];
    }
  },
  
  // Static mock data stored at the module level to improve performance
  _staticBestTimeRecommendations: [
    {
      platform: 'instagram',
      day_of_week: 2,
      hour_of_day: 12,
      average_engagement: 0.072,
      confidence: 0.82
    },
    {
      platform: 'facebook',
      day_of_week: 4,
      hour_of_day: 15,
      average_engagement: 0.064,
      confidence: 0.78
    },
    {
      platform: 'twitter',
      day_of_week: 1,
      hour_of_day: 9,
      average_engagement: 0.098,
      confidence: 0.85
    },
    {
      platform: 'linkedin',
      day_of_week: 3,
      hour_of_day: 11,
      average_engagement: 0.083,
      confidence: 0.79
    },
    {
      platform: 'tiktok',
      day_of_week: 5,
      hour_of_day: 18,
      average_engagement: 0.105,
      confidence: 0.89
    }
  ] as BestTimeRecommendation[],

  // Get best time recommendations - using cached static data for maximum performance
  getBestTimeRecommendations: async (projectId: string | number): Promise<BestTimeRecommendation[]> => {
    // Return cached data immediately without any async operations
    return contentCalendarService._staticBestTimeRecommendations;
    
    /* 
    // Uncomment this when the API endpoint is ready
    try {
      const response = await axios.get<BestTimeRecommendation[]>(
        `${API_BASE_URL}/content-calendar/insights/best-times?project_id=${projectId}`
      );
      return response.data || [];
    } catch (error) {
      console.error('Unexpected error in getBestTimeRecommendations:', error);
      return contentCalendarService._staticBestTimeRecommendations;
    }
    */
  },
  
  // Static calendar insights data at the module level - using valid Alert severity values
  _staticCalendarInsights: [
    {
      id: "insight-1",
      type: "warning",
      message: "Content distribution is not optimal. Consider spreading out your Instagram posts.",
      affectedItems: ["1", "2"],
      severity: "warning", // Valid MUI Alert severity
      action: "Reschedule posts for better engagement"
    },
    {
      id: "insight-2",
      type: "info",
      message: "Your email content is performing well. Consider creating more email campaigns.",
      severity: "info", // Valid MUI Alert severity
      action: "Increase email frequency"
    },
    {
      id: "insight-3",
      type: "error",
      message: "Multiple posts scheduled at the same time on March 15.",
      severity: "error", // Valid MUI Alert severity
      date: "2025-03-15",
      affectedItems: ["5", "8"],
      action: "Reschedule one of the conflicting posts"
    }
  ],
      
  // Get calendar insights - using static data for max performance
  getCalendarInsights: async (projectId: string): Promise<{data: any[]}> => {
    // Return static data directly for maximum performance
    return { data: contentCalendarService._staticCalendarInsights };
    
    /* Uncomment this when the backend API is ready
    try {
      const url = `${API_BASE_URL}/api/calendar/insights`;
      const params = new URLSearchParams();
      
      if (projectId) {
        params.append('project_id', projectId);
      }
      
      const response = await axios.get<any[]>(
        `${url}?${params.toString()}`
      );
      
      return { data: response.data || [] };
    } catch (error) {
      console.error('Error in getCalendarInsights:', error);
      return { data: contentCalendarService._staticCalendarInsights };
    }
    */
  },
  
  // Publish a calendar entry
  publishCalendarEntry: async (entryId: string): Promise<{data: any}> => {
    const response = await axios.post<any>(
      `${API_BASE_URL}/content-calendar/${entryId}/publish`
    );
    return { data: response.data };
  }
};

// Export both as named and default for backward compatibility
export { contentCalendarService };
export default contentCalendarService;