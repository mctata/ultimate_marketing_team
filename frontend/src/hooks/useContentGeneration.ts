import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import contentGenerationApi, {
  TaskStatusResponse,
  ABTest,
  ABTestRequest
} from '../services/contentGenerationService';
import {
  Template,
  GenerationRequest,
  GenerationResponse,
  ContentVariation,
  QualityAssessment
} from '../types/templates';
import { contentWebSocketService, ContentGenerationEvent } from '../services/contentWebSocketService';

// Constants
const TEMPLATES_QUERY_KEY = 'templates';
const GENERATED_CONTENT_QUERY_KEY = 'generatedContent';
const TASK_STATUS_QUERY_KEY = 'taskStatus';
const QUALITY_ASSESSMENT_QUERY_KEY = 'qualityAssessment';
const AB_TESTS_QUERY_KEY = 'abTests';
const POLLING_INTERVAL = 3000; // 3 seconds when WebSocket not available

// Hook for templates
export const useTemplates = () => {
  const queryClient = useQueryClient();

  // Fetch all templates
  const templatesQuery = useQuery(
    [TEMPLATES_QUERY_KEY],
    () => contentGenerationApi.getTemplates(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch a specific template
  const getTemplate = useCallback(
    (templateId: string) => {
      return queryClient.fetchQuery(
        [TEMPLATES_QUERY_KEY, templateId],
        () => contentGenerationApi.getTemplateById(templateId)
      );
    },
    [queryClient]
  );

  // Create a new template
  const createTemplateMutation = useMutation(
    (template: Omit<Template, 'id' | 'created_at' | 'updated_at'>) => 
      contentGenerationApi.createTemplate(template),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([TEMPLATES_QUERY_KEY]);
      },
    }
  );

  // Update an existing template
  const updateTemplateMutation = useMutation(
    ({ templateId, template }: { templateId: string; template: Partial<Template> }) => 
      contentGenerationApi.updateTemplate(templateId, template),
    {
      onSuccess: (updatedTemplate) => {
        queryClient.invalidateQueries([TEMPLATES_QUERY_KEY]);
        queryClient.setQueryData(
          [TEMPLATES_QUERY_KEY, updatedTemplate.id],
          updatedTemplate
        );
      },
    }
  );

  // Delete a template
  const deleteTemplateMutation = useMutation(
    (templateId: string) => contentGenerationApi.deleteTemplate(templateId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([TEMPLATES_QUERY_KEY]);
      },
    }
  );

  // Preview a template with variables
  const renderTemplateMutation = useMutation(
    ({ templateId, variables }: { templateId: string; variables: Record<string, any> }) =>
      contentGenerationApi.renderTemplate(templateId, variables)
  );

  return {
    templatesQuery,
    getTemplate,
    createTemplate: createTemplateMutation.mutate,
    updateTemplate: updateTemplateMutation.mutate,
    deleteTemplate: deleteTemplateMutation.mutate,
    renderTemplate: renderTemplateMutation.mutate,
    isCreatingTemplate: createTemplateMutation.isLoading,
    isUpdatingTemplate: updateTemplateMutation.isLoading,
    isDeletingTemplate: deleteTemplateMutation.isLoading,
    isRenderingTemplate: renderTemplateMutation.isLoading,
    renderTemplateResult: renderTemplateMutation.data?.rendered,
    renderTemplateError: renderTemplateMutation.error,
  };
};

// Generate content function - standalone export
export const Generate = async (
  request: GenerationRequest
): Promise<GenerationResponse> => {
  return contentGenerationApi.generateContent(request);
};

// Hook for content generation
export const useContentGeneration = () => {
  const queryClient = useQueryClient();
  const [taskStatus, setTaskStatus] = useState<TaskStatusResponse | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    if (!contentWebSocketService.isConnected()) {
      contentWebSocketService.connect();
    }
    
    setWsConnected(contentWebSocketService.isConnected());
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Generate content
  const generateContentMutation = useMutation(
    (request: GenerationRequest) => contentGenerationApi.generateContent(request),
    {
      onSuccess: (response) => {
        // Initialize task status
        if (response.task_id) {
          setTaskStatus({
            task_id: response.task_id,
            status: response.status,
            progress: response.progress || 0,
            estimated_completion_time: response.estimated_completion_time,
          });

          // If task is already completed, set the result
          if (response.status === 'completed' && response.variations) {
            setTaskStatus(prev => prev ? {
              ...prev,
              status: 'completed',
              result: response.variations,
              progress: 100
            } : null);
          }
        }
      },
    }
  );

  // Poll for task status
  const startPolling = useCallback((taskId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    const checkStatus = async () => {
      try {
        const statusResponse = await contentGenerationApi.getTaskStatus(taskId);
        setTaskStatus(statusResponse);
        
        // Stop polling if completed or failed
        if (statusResponse.status === 'completed' || statusResponse.status === 'failed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } catch (error) {
        console.error('Error polling task status:', error);
      }
    };

    // Initial check
    checkStatus();
    
    // Start polling
    pollingIntervalRef.current = setInterval(checkStatus, POLLING_INTERVAL);
  }, []);

  // Subscribe to real-time updates via WebSocket
  const subscribeToTask = useCallback((taskId: string) => {
    const handleTaskUpdate = (eventData: ContentGenerationEvent) => {
      if (eventData.data) {
        setTaskStatus(prev => ({
          ...prev,
          ...eventData.data,
        } as TaskStatusResponse));
      }
    };

    return contentWebSocketService.subscribeToGenerationTask(taskId, handleTaskUpdate);
  }, []);

  // Generate content with WebSocket or polling fallback
  const generateContent = useCallback((request: GenerationRequest) => {
    return generateContentMutation.mutateAsync(request).then(response => {
      if (response.task_id) {
        if (wsConnected) {
          subscribeToTask(response.task_id);
        } else {
          startPolling(response.task_id);
        }
      }
      return response;
    });
  }, [generateContentMutation, startPolling, subscribeToTask, wsConnected]);

  // Request quality assessment
  const assessContentMutation = useMutation(
    ({ content, contentType }: { content: string; contentType: string }) => 
      contentGenerationApi.requestQualityAssessment(content, contentType)
  );

  // Get quality assessment
  const getQualityAssessment = useCallback((contentId: string) => {
    return queryClient.fetchQuery(
      [QUALITY_ASSESSMENT_QUERY_KEY, contentId],
      () => contentGenerationApi.getQualityAssessment(contentId)
    );
  }, [queryClient]);

  return {
    generateContent,
    assessContent: assessContentMutation.mutate,
    getQualityAssessment,
    taskStatus,
    isGenerating: generateContentMutation.isLoading,
    isAssessing: assessContentMutation.isLoading,
    generationError: generateContentMutation.error,
    assessmentError: assessContentMutation.error,
    clearTaskStatus: () => setTaskStatus(null),
    wsConnected
  };
};

// Hook for A/B Testing
export const useABTesting = () => {
  const queryClient = useQueryClient();

  // Get all AB tests
  const abTestsQuery = useQuery(
    [AB_TESTS_QUERY_KEY],
    () => contentGenerationApi.getABTests(),
    {
      staleTime: 60 * 1000, // 1 minute
    }
  );

  // Get a specific AB test
  const getABTest = useCallback(
    (testId: string) => {
      return queryClient.fetchQuery(
        [AB_TESTS_QUERY_KEY, testId],
        () => contentGenerationApi.getABTestById(testId)
      );
    },
    [queryClient]
  );

  // Create a new AB test
  const createABTestMutation = useMutation(
    (testData: ABTestRequest) => contentGenerationApi.createABTest(testData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([AB_TESTS_QUERY_KEY]);
      },
    }
  );

  // Update an AB test
  const updateABTestMutation = useMutation(
    ({ testId, testData }: { testId: string; testData: Partial<ABTest> }) =>
      contentGenerationApi.updateABTest(testId, testData),
    {
      onSuccess: (updatedTest) => {
        queryClient.invalidateQueries([AB_TESTS_QUERY_KEY]);
        queryClient.setQueryData([AB_TESTS_QUERY_KEY, updatedTest.id], updatedTest);
      },
    }
  );

  // Delete an AB test
  const deleteABTestMutation = useMutation(
    (testId: string) => contentGenerationApi.deleteABTest(testId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([AB_TESTS_QUERY_KEY]);
      },
    }
  );

  // Start an AB test
  const startABTestMutation = useMutation(
    (testId: string) => contentGenerationApi.startABTest(testId),
    {
      onSuccess: (updatedTest) => {
        queryClient.invalidateQueries([AB_TESTS_QUERY_KEY]);
        queryClient.setQueryData([AB_TESTS_QUERY_KEY, updatedTest.id], updatedTest);
      },
    }
  );

  // Stop an AB test
  const stopABTestMutation = useMutation(
    (testId: string) => contentGenerationApi.stopABTest(testId),
    {
      onSuccess: (updatedTest) => {
        queryClient.invalidateQueries([AB_TESTS_QUERY_KEY]);
        queryClient.setQueryData([AB_TESTS_QUERY_KEY, updatedTest.id], updatedTest);
      },
    }
  );

  return {
    abTestsQuery,
    getABTest,
    createABTest: createABTestMutation.mutate,
    updateABTest: updateABTestMutation.mutate,
    deleteABTest: deleteABTestMutation.mutate,
    startABTest: startABTestMutation.mutate,
    stopABTest: stopABTestMutation.mutate,
    isCreatingABTest: createABTestMutation.isLoading,
    isUpdatingABTest: updateABTestMutation.isLoading,
    isDeletingABTest: deleteABTestMutation.isLoading,
    isStartingABTest: startABTestMutation.isLoading,
    isStoppingABTest: stopABTestMutation.isLoading,
  };
};