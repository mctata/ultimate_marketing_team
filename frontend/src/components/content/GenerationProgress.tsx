import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useContentGeneration } from '../../hooks/useContentGeneration';
import { contentWebSocketService, ContentGenerationEvent } from '../../services/contentWebSocketService';
import { TaskStatusResponse, ContentVariation } from '../../services/contentGenerationService';

export interface GenerationStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  progress?: number; // 0-100
  message?: string;
}

interface GenerationProgressProps {
  taskId: string;
  onCancel?: () => void;
  onComplete?: (result: ContentVariation[]) => void;
}

// Define default generation steps
const DEFAULT_STEPS: GenerationStep[] = [
  {
    id: 'template-preparation',
    label: 'Template Preparation',
    description: 'Loading template and preparing variables',
    status: 'pending'
  },
  {
    id: 'content-generation',
    label: 'Content Generation',
    description: 'Generating content based on your specifications',
    status: 'pending'
  },
  {
    id: 'quality-assessment',
    label: 'Quality Assessment',
    description: 'Evaluating content quality and readability',
    status: 'pending'
  },
  {
    id: 'optimization',
    label: 'Content Optimization',
    description: 'Applying final enhancements and improvements',
    status: 'pending'
  }
];

const GenerationProgress = ({ taskId, onCancel, onComplete }: GenerationProgressProps) => {
  const { getTaskStatus, wsConnected } = useContentGeneration();
  const [steps, setSteps] = useState<GenerationStep[]>(DEFAULT_STEPS);
  const [taskStatus, setTaskStatus] = useState<TaskStatusResponse | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Function to update progress based on task status
  const updateProgressFromTaskStatus = useCallback((status: TaskStatusResponse) => {
    setTaskStatus(status);
    
    // Update overall progress
    if (status.progress !== undefined) {
      setOverallProgress(status.progress);
    }

    // Update steps based on status
    if (status.steps_completed !== undefined && status.total_steps !== undefined) {
      // Calculate current step
      const currentStepIndex = Math.min(status.steps_completed, steps.length - 1);
      
      // Update active step
      setActiveStep(currentStepIndex);
      
      // Create new steps array with updated statuses
      setSteps(prevSteps => {
        const newSteps = [...prevSteps];
        
        // Mark completed steps
        for (let i = 0; i < currentStepIndex; i++) {
          newSteps[i].status = 'completed';
          newSteps[i].progress = 100;
        }
        
        // Set current step to in-progress
        if (currentStepIndex < newSteps.length) {
          // Calculate progress for current step
          const stepProgress = status.total_steps ? 
            ((status.progress || 0) - (currentStepIndex * (100 / newSteps.length))) * newSteps.length : 
            50;
          
          newSteps[currentStepIndex].status = 'in-progress';
          newSteps[currentStepIndex].progress = stepProgress;
          newSteps[currentStepIndex].message = status.current_step;
        }
        
        return newSteps;
      });
    }
    
    // Handle completion or error
    if (status.status === 'completed') {
      setIsComplete(true);
      
      // Call onComplete callback if provided
      if (onComplete && status.result) {
        onComplete(status.result);
      }
      
      // Mark all steps as completed
      setSteps(prevSteps => 
        prevSteps.map(step => ({ ...step, status: 'completed', progress: 100 }))
      );
      
      // Clear polling if it's still active
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    } else if (status.status === 'failed') {
      setError(status.error || 'Content generation failed');
      
      // Mark current step as error
      setSteps(prevSteps => {
        const newSteps = [...prevSteps];
        if (activeStep < newSteps.length) {
          newSteps[activeStep].status = 'error';
          newSteps[activeStep].message = status.error;
        }
        return newSteps;
      });
      
      // Clear polling if it's still active
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [steps.length, activeStep, onComplete]);

  // WebSocket subscription
  useEffect(() => {
    if (!taskId) return;
    
    // Function to handle task status from WebSocket
    const handleWebSocketUpdate = (event: ContentGenerationEvent) => {
      if (event.data) {
        updateProgressFromTaskStatus(event.data as TaskStatusResponse);
      }
    };
    
    // Initial fetch of task status
    getTaskStatus(taskId)
      .then(status => {
        updateProgressFromTaskStatus(status);
      })
      .catch(err => {
        console.error('Error fetching task status:', err);
        setError('Failed to fetch generation status');
      });
    
    // Set up WebSocket subscription or polling
    if (wsConnected) {
      // Subscribe to WebSocket updates
      unsubscribeRef.current = contentWebSocketService.subscribeToGenerationTask(
        taskId, 
        handleWebSocketUpdate
      );
    } else {
      // Fall back to polling if WebSocket not available
      const pollInterval = 3000; // 3 seconds
      
      const pollStatus = async () => {
        try {
          const status = await getTaskStatus(taskId);
          updateProgressFromTaskStatus(status);
          
          // Stop polling if task is complete or failed
          if (status.status === 'completed' || status.status === 'failed') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        } catch (err) {
          console.error('Error polling task status:', err);
        }
      };
      
      // Initial poll
      pollStatus();
      
      // Set up polling interval
      pollingIntervalRef.current = setInterval(pollStatus, pollInterval);
    }
    
    // Cleanup function
    return () => {
      // Unsubscribe from WebSocket if subscribed
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      // Clear polling interval if active
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [taskId, getTaskStatus, updateProgressFromTaskStatus, wsConnected]);
  
  const getStepIcon = (status: GenerationStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'in-progress':
        return <CircularProgress size={20} />;
      default:
        return null;
    }
  };

  // Handle cancellation
  const handleCancel = () => {
    if (onCancel) {
      // Call the onCancel callback
      onCancel();
      
      // Unsubscribe and clean up
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Content Generation in Progress
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {isComplete ? 
            'Content generation complete!' : 
            'Your content is being generated. This might take a few moments.'}
        </Typography>
        
        {wsConnected ? (
          <Chip 
            label="Real-time updates" 
            size="small" 
            color="primary" 
            sx={{ mb: 2 }}
          />
        ) : (
          <Chip 
            label="Polling for updates" 
            size="small" 
            color="default" 
            sx={{ mb: 2 }}
          />
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, mt: 2 }}>
          <Typography variant="body2" sx={{ mr: 1 }}>Overall Progress:</Typography>
          <Typography variant="body2" sx={{ ml: 'auto' }}>
            {Math.round(overallProgress)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={overallProgress} 
          sx={{ height: 8, borderRadius: 4 }} 
        />
        
        {taskStatus?.estimated_completion_time && !isComplete && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Estimated completion: {new Date(taskStatus.estimated_completion_time).toLocaleTimeString()}
          </Typography>
        )}
      </Box>
      
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.id} completed={step.status === 'completed'}>
            <StepLabel 
              StepIconComponent={() => getStepIcon(step.status)}
              optional={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {step.status === 'in-progress' && (
                    <Chip 
                      label="Processing" 
                      size="small" 
                      color="primary" 
                      sx={{ height: 20, fontSize: '0.7rem' }} 
                    />
                  )}
                  {step.status === 'completed' && (
                    <Chip 
                      label="Completed" 
                      size="small" 
                      color="success" 
                      sx={{ height: 20, fontSize: '0.7rem' }} 
                    />
                  )}
                  {step.status === 'error' && (
                    <Chip 
                      label="Error" 
                      size="small" 
                      color="error" 
                      sx={{ height: 20, fontSize: '0.7rem' }} 
                    />
                  )}
                </Box>
              }
            >
              {step.label}
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary">
                {step.description}
              </Typography>
              
              {step.status === 'in-progress' && step.progress !== undefined && (
                <Box sx={{ mt: 1, mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={step.progress} 
                    sx={{ height: 4, borderRadius: 2 }} 
                  />
                </Box>
              )}
              
              {step.message && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-start' }}>
                  <InfoIcon color="info" fontSize="small" sx={{ mr: 1, mt: 0.3 }} />
                  <Typography variant="caption">
                    {step.message}
                  </Typography>
                </Box>
              )}
            </StepContent>
          </Step>
        ))}
      </Stepper>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        {!isComplete && onCancel && (
          <Button 
            variant="outlined" 
            color="inherit" 
            onClick={handleCancel}
            disabled={isComplete}
          >
            Cancel Generation
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default GenerationProgress;