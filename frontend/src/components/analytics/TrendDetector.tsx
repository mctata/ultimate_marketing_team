import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  useTheme, 
  Chip, 
  Divider, 
  Grid,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import HelpIcon from '@mui/icons-material/Help';

export interface DataTrend {
  metric: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  changeType: 'increase' | 'decrease' | 'stable';
  isPositive: boolean;
  isCritical?: boolean;
  unit?: string;
  notes?: string;
}

export interface PatternDetection {
  patternType: 'spike' | 'drop' | 'seasonal' | 'anomaly' | 'cyclical' | 'trend';
  description: string;
  confidence: number;
  metric: string;
  suggestion?: string;
}

interface TrendDetectorProps {
  title: string;
  description?: string;
  trends: DataTrend[];
  patterns?: PatternDetection[];
  timeFrame?: string;
  isLoading?: boolean;
}

const TrendDetector: React.FC<TrendDetectorProps> = ({
  title,
  description,
  trends,
  patterns = [],
  timeFrame = 'Last 30 days',
  isLoading = false,
}) => {
  const theme = useTheme();

  // Helper function to get icon for trend
  const getTrendIcon = (trend: DataTrend) => {
    const { changeType, isPositive } = trend;
    
    if (changeType === 'increase') {
      return (
        <TrendingUpIcon 
          sx={{ 
            color: isPositive ? theme.palette.success.main : theme.palette.error.main,
            fontSize: '1.25rem',
            verticalAlign: 'middle'
          }} 
        />
      );
    } else if (changeType === 'decrease') {
      return (
        <TrendingDownIcon 
          sx={{ 
            color: isPositive ? theme.palette.success.main : theme.palette.error.main,
            fontSize: '1.25rem',
            verticalAlign: 'middle'
          }} 
        />
      );
    }
    
    return null;
  };

  // Helper to format number with unit
  const formatValue = (value: number, unit?: string) => {
    let formattedValue = value.toLocaleString();
    
    // Add unit if provided
    if (unit) {
      formattedValue += unit;
    }
    
    return formattedValue;
  };

  // Helper to get pattern icon
  const getPatternIcon = (pattern: PatternDetection) => {
    switch (pattern.patternType) {
      case 'spike':
        return <TrendingUpIcon sx={{ color: theme.palette.warning.main }} />;
      case 'drop':
        return <TrendingDownIcon sx={{ color: theme.palette.error.main }} />;
      case 'anomaly':
        return <WarningIcon sx={{ color: theme.palette.error.main }} />;
      case 'seasonal':
        return <InfoIcon sx={{ color: theme.palette.info.main }} />;
      case 'cyclical':
        return <InfoIcon sx={{ color: theme.palette.primary.main }} />;
      case 'trend':
        return <TrendingUpIcon sx={{ color: theme.palette.success.main }} />;
      default:
        return <HelpIcon sx={{ color: theme.palette.text.secondary }} />;
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="div" gutterBottom>
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
          <Chip 
            label={timeFrame} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'medium' }}>
              Key Metrics
            </Typography>
            <Grid container spacing={2}>
              {trends.map((trend, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      borderRadius: 1, 
                      bgcolor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow: trend.isCritical ? `0 0 0 2px ${theme.palette.error.main}` : 'none',
                      height: '100%'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {trend.metric}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                      <Typography variant="h5" component="div" sx={{ mr: 1, fontWeight: 'medium' }}>
                        {formatValue(trend.currentValue, trend.unit)}
                      </Typography>
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          color: trend.isPositive ? theme.palette.success.main : theme.palette.error.main
                        }}
                      >
                        {getTrendIcon(trend)}
                        <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                          {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        Previously: {formatValue(trend.previousValue, trend.unit)}
                      </Typography>
                      
                      {trend.isCritical && (
                        <Chip
                          label="Needs Attention"
                          size="small"
                          color="error"
                          sx={{ height: 20, fontSize: '0.625rem' }}
                        />
                      )}
                    </Box>
                    
                    {trend.notes && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {trend.notes}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
            
            {patterns.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'medium' }}>
                  Detected Patterns
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {patterns.map((pattern, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        p: 2, 
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: theme.palette.background.paper
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ mr: 2 }}>
                          {getPatternIcon(pattern)}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2">
                            {pattern.patternType.charAt(0).toUpperCase() + pattern.patternType.slice(1)} detected in {pattern.metric}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {pattern.description}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${pattern.confidence}% confidence`}
                          size="small"
                          color={pattern.confidence > 80 ? 'success' : 'warning'}
                          sx={{ ml: 2 }}
                        />
                      </Box>
                      
                      <LinearProgress 
                        variant="determinate" 
                        value={pattern.confidence} 
                        sx={{ 
                          height: 4, 
                          borderRadius: 2,
                          bgcolor: theme.palette.action.hover,
                          '.MuiLinearProgress-bar': {
                            bgcolor: pattern.confidence > 80 ? theme.palette.success.main : theme.palette.warning.main
                          }
                        }}
                      />
                      
                      {pattern.suggestion && (
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                          <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: '1rem', mr: 1 }} />
                          <Typography variant="body2">
                            {pattern.suggestion}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendDetector;