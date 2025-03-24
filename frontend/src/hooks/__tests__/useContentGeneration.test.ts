import { renderHook, act } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from 'react-query';
import React from 'react';
import contentGenerationApi from '../../services/contentGenerationService';
import { useTemplates, useContentGeneration, Generate } from '../useContentGeneration';

// Mock the API service
jest.mock('../../services/contentGenerationService', () => ({
  __esModule: true,
  default: {
    getTemplates: jest.fn(),
    getTemplateById: jest.fn(),
    renderTemplate: jest.fn(),
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    generateContent: jest.fn(),
    getTaskStatus: jest.fn(),
    requestQualityAssessment: jest.fn(),
    getQualityAssessment: jest.fn(),
    getABTests: jest.fn(),
    getABTestById: jest.fn(),
    createABTest: jest.fn(),
    updateABTest: jest.fn(),
    deleteABTest: jest.fn(),
    startABTest: jest.fn(),
    stopABTest: jest.fn(),
  }
}));

// Mock the websocket service
jest.mock('../../services/contentWebSocketService', () => ({
  contentWebSocketService: {
    connect: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true),
    subscribeToGenerationTask: jest.fn().mockReturnValue(() => {}),
  }
}));

// Create a wrapper with React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useContentGeneration hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useTemplates', () => {
    it('should fetch templates successfully', async () => {
      const mockTemplates = [
        { id: '1', name: 'Template 1' },
        { id: '2', name: 'Template 2' },
      ];
      
      (contentGenerationApi.getTemplates as jest.Mock).mockResolvedValue(mockTemplates);
      
      const { result, waitFor } = renderHook(() => useTemplates(), {
        wrapper: createWrapper(),
      });
      
      await waitFor(() => result.current.templatesQuery.isSuccess);
      
      expect(result.current.templatesQuery.data).toEqual(mockTemplates);
      expect(contentGenerationApi.getTemplates).toHaveBeenCalledTimes(1);
    });
    
    it('should handle template rendering', async () => {
      const mockRenderedTemplate = { rendered: 'This is the rendered content' };
      (contentGenerationApi.renderTemplate as jest.Mock).mockResolvedValue(mockRenderedTemplate);
      
      const { result } = renderHook(() => useTemplates(), {
        wrapper: createWrapper(),
      });
      
      await act(async () => {
        result.current.renderTemplate({ 
          templateId: '1', 
          variables: { title: 'Test Title' } 
        });
      });
      
      expect(contentGenerationApi.renderTemplate).toHaveBeenCalledWith(
        '1', 
        { title: 'Test Title' }
      );
    });
  });
  
  describe('useContentGeneration', () => {
    it('should generate content successfully', async () => {
      const mockResponse = { 
        task_id: 'task123', 
        status: 'pending' as const
      };
      
      (contentGenerationApi.generateContent as jest.Mock).mockResolvedValue(mockResponse);
      
      const { result } = renderHook(() => useContentGeneration(), {
        wrapper: createWrapper(),
      });
      
      let response;
      await act(async () => {
        response = await result.current.generateContent({
          content_type: 'blog',
          template_id: '1',
          variables: { title: 'Test Title' }
        });
      });
      
      expect(response).toEqual(mockResponse);
      expect(contentGenerationApi.generateContent).toHaveBeenCalledWith({
        content_type: 'blog',
        template_id: '1',
        variables: { title: 'Test Title' }
      });
    });
    
    it('should handle task status updates', async () => {
      const mockTaskResponse = { 
        task_id: 'task123', 
        status: 'completed' as const,
        result: [{ 
          variation_id: 'var1', 
          content: 'Generated content' 
        }]
      };
      
      const mockGenerateResponse = { 
        task_id: 'task123', 
        status: 'pending' as const
      };
      
      (contentGenerationApi.generateContent as jest.Mock).mockResolvedValue(mockGenerateResponse);
      (contentGenerationApi.getTaskStatus as jest.Mock).mockResolvedValue(mockTaskResponse);
      
      const { result } = renderHook(() => useContentGeneration(), {
        wrapper: createWrapper(),
      });
      
      await act(async () => {
        await result.current.generateContent({
          content_type: 'blog',
          template_id: '1',
          variables: { title: 'Test Title' }
        });
      });
      
      // Manually update the taskStatus state
      act(() => {
        // This simulates what happens when the polling or WebSocket updates occur
        result.current.clearTaskStatus();
      });
    });
  });
  
  describe('Generate function', () => {
    it('should call the API directly', async () => {
      const mockResponse = { 
        task_id: 'task123', 
        status: 'pending' as const
      };
      
      (contentGenerationApi.generateContent as jest.Mock).mockResolvedValue(mockResponse);
      
      const response = await Generate({
        content_type: 'blog',
        template_id: '1',
        variables: { title: 'Test Title' }
      });
      
      expect(response).toEqual(mockResponse);
      expect(contentGenerationApi.generateContent).toHaveBeenCalledWith({
        content_type: 'blog',
        template_id: '1',
        variables: { title: 'Test Title' }
      });
    });
  });
});