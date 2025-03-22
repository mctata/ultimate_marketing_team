import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Backdrop,
  Fade,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  CheckCircle as CheckCircleIcon,
  DoNotDisturb as DoNotDisturbIcon
} from '@mui/icons-material';

export interface TutorialStep {
  title: string;
  content: string;
  targetElementId?: string;
  highlightElement?: boolean;
  image?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface OnboardingTutorialProps {
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip: () => void;
  isOpen: boolean;
  tutorialId: string;
}

/**
 * Interactive onboarding tutorial component
 * 
 * Provides a step-by-step guided tour of the application with highlighting
 * and tooltips to guide users through specific features and workflows.
 */
const OnboardingTutorial = ({
  steps,
  onComplete,
  onSkip,
  isOpen,
  tutorialId
}: OnboardingTutorialProps) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  
  // Calculate position of tooltip based on target element and preferred position
  useEffect(() => {
    if (!isOpen) return;
    
    const currentStep = steps[activeStep];
    if (!currentStep?.targetElementId) {
      // If no target element, center in viewport
      setTooltipPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 150
      });
      setTargetRect(null);
      return;
    }
    
    const targetElement = document.getElementById(currentStep.targetElementId);
    if (!targetElement) {
      console.warn(`Target element with ID ${currentStep.targetElementId} not found`);
      setTooltipPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 150
      });
      setTargetRect(null);
      return;
    }
    
    const rect = targetElement.getBoundingClientRect();
    setTargetRect(rect);
    
    // Calculate tooltip position based on target element and preferred position
    const position = currentStep.position || 'bottom';
    const tooltipWidth = 300;
    const tooltipHeight = 180;
    const margin = 20;
    
    let top = 0;
    let left = 0;
    
    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - margin;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + margin;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - margin;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + margin;
        break;
      case 'center':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
    }
    
    // Ensure tooltip is within viewport
    if (top < 0) top = margin;
    if (left < 0) left = margin;
    if (top + tooltipHeight > window.innerHeight) {
      top = window.innerHeight - tooltipHeight - margin;
    }
    if (left + tooltipWidth > window.innerWidth) {
      left = window.innerWidth - tooltipWidth - margin;
    }
    
    setTooltipPosition({ top, left });
    
    // Scroll target element into view if needed
    if (
      rect.top < 0 ||
      rect.bottom > window.innerHeight ||
      rect.left < 0 ||
      rect.right > window.innerWidth
    ) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeStep, isOpen, steps]);
  
  const handleNext = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (activeStep === steps.length - 1) {
        onComplete();
      } else {
        setActiveStep((prevStep) => prevStep + 1);
      }
    }, 300);
  };
  
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prevStep) => prevStep - 1);
    }
  };
  
  const handleSkip = () => {
    onSkip();
  };
  
  if (!isOpen) return null;
  
  const currentStep = steps[activeStep];
  
  return (
    <Backdrop
      sx={{
        zIndex: theme.zIndex.modal + 1,
        backgroundColor: alpha(theme.palette.background.default, 0.8),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
      open={isOpen}
    >
      {/* Highlight overlay for target element */}
      {targetRect && currentStep.highlightElement && (
        <Box
          sx={{
            position: 'absolute',
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            boxShadow: `0 0 0 9999px ${alpha(theme.palette.background.default, 0.8)}`,
            border: `3px solid ${theme.palette.primary.main}`,
            borderRadius: 1,
            zIndex: theme.zIndex.modal + 2,
            pointerEvents: 'none',
          }}
        />
      )}
      
      {/* Tutorial tooltip */}
      <Fade in={isOpen}>
        <Paper
          elevation={5}
          sx={{
            position: 'absolute',
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: 300,
            minHeight: 180,
            p: 2,
            zIndex: theme.zIndex.modal + 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`tutorial-${tutorialId}-step-${activeStep}-title`}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography 
              variant="subtitle1" 
              fontWeight="bold"
              id={`tutorial-${tutorialId}-step-${activeStep}-title`}
            >
              {currentStep.title}
            </Typography>
            <IconButton 
              size="small" 
              onClick={handleSkip}
              aria-label="Close tutorial"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            {currentStep.content}
          </Typography>
          
          {currentStep.image && (
            <Box 
              component="img" 
              src={currentStep.image}
              alt=""
              sx={{ 
                maxWidth: '100%', 
                maxHeight: 120, 
                display: 'block',
                mx: 'auto',
                mb: 2,
                borderRadius: 1
              }}
            />
          )}
          
          <Stepper 
            activeStep={activeStep} 
            alternativeLabel 
            sx={{ mb: 2 }}
            aria-label="Tutorial progress"
          >
            {steps.map((step, index) => (
              <Step key={index} completed={index < activeStep}>
                <StepLabel>{}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
              startIcon={<PrevIcon />}
              size="small"
              aria-label="Previous step"
            >
              Back
            </Button>
            
            <Button
              onClick={handleSkip}
              color="inherit"
              size="small"
              startIcon={<DoNotDisturbIcon />}
              aria-label="Skip tutorial"
            >
              Skip
            </Button>
            
            <Button
              onClick={handleNext}
              variant="contained"
              color="primary"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={16} /> : activeStep === steps.length - 1 ? <CheckCircleIcon /> : <NextIcon />}
              size="small"
              aria-label={activeStep === steps.length - 1 ? "Finish tutorial" : "Next step"}
            >
              {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </Box>
        </Paper>
      </Fade>
    </Backdrop>
  );
};

export default OnboardingTutorial;