import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

export interface GenerationStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  progress?: number; // 0-100
  message?: string;
}

interface GenerationProgressProps {
  jobId: string;
  onCancel?: () => void;
  onComplete?: (result: any) => void;
}

const GenerationProgress = ({ jobId, onCancel, onComplete }: GenerationProgressProps) => {
  const [steps, setSteps] = useState<GenerationStep[]>([
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
  ]);
  
  const [activeStep, setActiveStep] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  // Mock function to simulate getting progress updates from a websocket
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let currentProgress = 0;
    let currentStep = 0;
    
    const simulateProgress = () => {
      if (currentStep < steps.length) {
        // Update step status
        setSteps(prevSteps => {
          const newSteps = [...prevSteps];
          
          // Set current step to in-progress
          if (newSteps[currentStep].status === 'pending') {
            newSteps[currentStep].status = 'in-progress';
            newSteps[currentStep].progress = 0;
          }
          
          // Update progress of current step
          if (newSteps[currentStep].status === 'in-progress') {
            const stepProgress = (newSteps[currentStep].progress || 0) + Math.random() * 10;
            
            if (stepProgress >= 100) {
              // Complete current step
              newSteps[currentStep].status = 'completed';
              newSteps[currentStep].progress = 100;
              
              // Move to next step
              currentStep++;
              
              // Start next step if available
              if (currentStep < newSteps.length) {
                newSteps[currentStep].status = 'in-progress';
                newSteps[currentStep].progress = 0;
              }
            } else {
              newSteps[currentStep].progress = stepProgress;
            }
          }
          
          return newSteps;
        });
        
        // Update active step
        setActiveStep(currentStep);
        
        // Calculate overall progress
        const newOverallProgress = (currentStep * 100 + (steps[currentStep]?.progress || 0)) / steps.length;
        setOverallProgress(newOverallProgress);
        
        // Check if all steps are complete
        if (currentStep >= steps.length) {
          setIsComplete(true);
          
          // Simulate completion with result
          setTimeout(() => {
            setResult({
              content: "This is the generated content based on your template and variables.",
              metrics: {
                readability: 85,
                grammar: 92,
                seo: 78,
                engagement: 80
              },
              suggestions: [
                "Consider adding more specific examples to strengthen your arguments.",
                "The introduction could be more compelling with a stronger hook.",
                "Add more statistics to support your main points."
              ]
            });
            
            // Call onComplete callback if provided
            if (onComplete) {
              onComplete(result);
            }
          }, 1000);
          
          clearInterval(timer);
        }
      }
    };
    
    // Start simulation
    timer = setInterval(simulateProgress, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, [jobId]);
  
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

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Content Generation in Progress
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Your content is being generated. This might take a few moments.
        </Typography>
        
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
        <Box sx={{ mt: 2, p: 2, bgcolor: '#fdeded', borderRadius: 1 }}>
          <Typography color="error" variant="body2">
            <ErrorIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
            {error}
          </Typography>
        </Box>
      )}
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        {!isComplete && onCancel && (
          <Button 
            variant="outlined" 
            color="inherit" 
            onClick={onCancel}
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