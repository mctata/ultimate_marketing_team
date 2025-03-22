import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  useTheme,
  Tooltip,
  Card,
  CardContent,
  Divider,
  IconButton,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ArrowDownward as ArrowDownwardIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

// Types for funnel data
export interface FunnelStage {
  name: string;
  value: number;
  description?: string;
  // Optional configuration
  color?: string;
  icon?: React.ReactNode;
}

export interface FunnelProps {
  stages: FunnelStage[];
  title?: string;
  subtitle?: string;
  height?: number | string;
  loading?: boolean;
  error?: Error | null;
  showConversionRates?: boolean;
  showValuesOnBars?: boolean;
  startWidth?: number; // Width percentage for first stage
  endWidth?: number; // Width percentage for last stage
  onStageClick?: (stage: FunnelStage, index: number) => void;
}

/**
 * Conversion Funnel Component
 * 
 * Displays a visual representation of a conversion funnel with multiple stages
 */
const ConversionFunnel: React.FC<FunnelProps> = ({
  stages,
  title = 'Conversion Funnel',
  subtitle,
  height = 400,
  loading = false,
  error = null,
  showConversionRates = true,
  showValuesOnBars = true,
  startWidth = 90,
  endWidth = 40,
  onStageClick
}) => {
  const theme = useTheme();
  
  // Make sure we have at least 2 stages
  if (!loading && !error && (!stages || stages.length < 2)) {
    return (
      <Alert severity="warning">
        A conversion funnel requires at least 2 stages
      </Alert>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Alert severity="error">
        {error.message || 'An error occurred loading funnel data'}
      </Alert>
    );
  }
  
  // Calculate values for funnel visualization
  const maxValue = Math.max(...stages.map(stage => stage.value));
  const stageHeight = `${100 / stages.length}%`;
  
  // Calculate widths for each stage (funnel shape)
  const calculateWidth = (index: number): number => {
    const totalStages = stages.length - 1;
    if (totalStages === 0) return startWidth; // If only one stage
    
    const ratio = index / totalStages;
    return startWidth - (ratio * (startWidth - endWidth));
  };
  
  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(0);
  };
  
  // Calculate conversion rate between stages
  const getConversionRate = (currentIndex: number): string => {
    if (currentIndex === 0 || !showConversionRates) return '';
    
    const currentValue = stages[currentIndex].value;
    const previousValue = stages[currentIndex - 1].value;
    
    if (previousValue === 0) return '0%';
    
    const rate = (currentValue / previousValue) * 100;
    return `${rate.toFixed(1)}%`;
  };
  
  // Default colors from theme
  const getStageColor = (index: number, customColor?: string): string => {
    if (customColor) return customColor;
    
    const colors = [
      theme.palette.primary.main,
      theme.palette.primary.light,
      theme.palette.secondary.main,
      theme.palette.secondary.light,
      theme.palette.info.main,
      theme.palette.info.light,
      theme.palette.success.main,
      theme.palette.success.light,
    ];
    
    return colors[index % colors.length];
  };
  
  return (
    <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Funnel header */}
      {(title || subtitle) && (
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          {title && (
            <Typography variant="h6" component="h2" gutterBottom>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          <Divider sx={{ my: 1 }} />
        </Box>
      )}
      
      {/* Funnel visualization */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          {stages.map((stage, index) => (
            <React.Fragment key={`stage-${index}`}>
              {/* Stage container */}
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', mb: 1 }}>
                {/* Stage label and value */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight="medium">
                      {stage.name}
                    </Typography>
                    {stage.description && (
                      <Tooltip title={stage.description}>
                        <IconButton size="small">
                          <HelpIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="body2">
                    {formatNumber(stage.value)}
                  </Typography>
                </Box>
                
                {/* Stage bar */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    position: 'relative' 
                  }}
                  onClick={() => onStageClick && onStageClick(stage, index)}
                >
                  <Box 
                    sx={{ 
                      width: `${calculateWidth(index)}%`, 
                      height: 40,
                      backgroundColor: getStageColor(index, stage.color),
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'width 0.5s ease-in-out',
                      cursor: onStageClick ? 'pointer' : 'default',
                      position: 'relative',
                      '&:hover': {
                        opacity: 0.9,
                        boxShadow: 2
                      }
                    }}
                  >
                    {showValuesOnBars && (
                      <Typography 
                        variant="body2" 
                        fontWeight="bold" 
                        color="white"
                        sx={{ 
                          mixBlendMode: 'difference',
                          textShadow: '0px 0px 2px rgba(0,0,0,0.5)'
                        }}
                      >
                        {formatNumber(stage.value)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
              
              {/* Conversion rate arrow between stages */}
              {index < stages.length - 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ArrowDownwardIcon color="action" fontSize="small" />
                    {showConversionRates && (
                      <Typography variant="caption" color="text.secondary">
                        {getConversionRate(index + 1)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </React.Fragment>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ConversionFunnel;