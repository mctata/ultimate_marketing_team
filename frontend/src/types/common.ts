/**
 * Common type definitions used across the application
 */

// Date range type for date pickers
export interface DateRange<T = Date> {
  start: T | null;
  end: T | null;
}

// Generic response from API
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Calendar item status types
export type CalendarItemStatus = "draft" | "scheduled" | "published" | "archived";