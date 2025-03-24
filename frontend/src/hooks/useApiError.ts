import { useState, useCallback } from 'react';
import { useToast } from '../components/common/ToastNotification';

export interface ApiError {
  message: string;
  code?: string | number;
  details?: string;
  response?: {
    status?: number;
    data?: any;
  };
}

interface ApiErrorState {
  error: ApiError | null;
  isError: boolean;
}

/**
 * Hook for handling API errors in a standardized way across the application
 */
const useApiError = () => {
  const [apiErrorState, setApiErrorState] = useState<ApiErrorState>({
    error: null,
    isError: false
  });
  
  const toast = useToast();

  /**
   * Set an API error with optional toast notification
   */
  const setApiError = useCallback((error: ApiError | null, showToast: boolean = true) => {
    if (error) {
      setApiErrorState({
        error,
        isError: true
      });
      
      if (showToast) {
        // Format the error message for toast
        const errorMessage = error.message || 'An unexpected error occurred';
        const errorDetail = error.details || 
                           (error.response?.data?.message) || 
                           `Error code: ${error.code || error.response?.status || 'unknown'}`;
        
        toast.showError(errorMessage, errorDetail);
      }
    } else {
      clearApiError();
    }
  }, [toast]);

  /**
   * Clear the current API error
   */
  const clearApiError = useCallback(() => {
    setApiErrorState({
      error: null,
      isError: false
    });
  }, []);

  /**
   * Handle error from a caught exception (typically in try/catch)
   */
  const handleApiError = useCallback((err: any, customMessage?: string, showToast: boolean = true) => {
    console.error('API Error:', err);
    
    const apiError: ApiError = {
      message: customMessage || err.message || 'An unexpected error occurred',
      code: err.code || (err.response?.status ? String(err.response.status) : undefined),
      details: err.details || err.response?.data?.message,
      response: err.response
    };
    
    setApiError(apiError, showToast);
    return apiError;
  }, [setApiError]);
  
  /**
   * Wraps an async operation in error handling
   */
  const withErrorHandling = useCallback(async <T,>(
    operation: () => Promise<T>,
    errorMessage?: string,
    showToast: boolean = true
  ): Promise<T | null> => {
    try {
      clearApiError();
      return await operation();
    } catch (err: any) {
      handleApiError(err, errorMessage, showToast);
      return null;
    }
  }, [handleApiError, clearApiError]);

  return {
    ...apiErrorState,
    setApiError,
    clearApiError,
    handleApiError,
    withErrorHandling,
    ToastComponent: toast.ToastComponent
  };
};

export default useApiError;