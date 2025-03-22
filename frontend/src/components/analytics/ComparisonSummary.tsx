import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  useTheme, 
  Divider,
  Grid,
  Paper,
  Chip,
  LinearProgress,
  CircularProgress,
  Avatar
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';

export interface ComparisonItem {
  metric: string;
  baseline: {
    value: number;
    label: string;
  };
  current: {
    value: number;
    label: string;
  };
  changePercent: number;
  isPositive: boolean;
  unit?: string;
  target?: number;
  goalCompletion?: number; // 0-100
  notes?: string;
}

interface ComparisonSummaryProps {
  title: string;
  description?: string;
  comparisonItems: ComparisonItem[];
  baselinePeriod: string;
  currentPeriod: string;
  isLoading?: boolean;
  showGoals?: boolean;
}

const ComparisonSummary: React.FC<ComparisonSummaryProps> = ({
  title,
  description,
  comparisonItems,
  baselinePeriod,
  currentPeriod,
  isLoading = false,
  showGoals = true,
}) => {
  const theme = useTheme();

  // Helper function to render trend icon
  const renderTrendIcon = (item: ComparisonItem) => {
    const { changePercent, isPositive } = item;
    
    if (Math.abs(changePercent) < 0.5) {
      return (
        <TrendingFlatIcon 
          sx={{ 
            color: theme.palette.warning.main,
            fontSize: '1.25rem'
          }}
        />
      );
    }
    
    if (changePercent > 0) {
      return (
        <TrendingUpIcon 
          sx={{ 
            color: isPositive ? theme.palette.success.main : theme.palette.error.main,
            fontSize: '1.25rem'
          }}
        />
      );
    } else {
      return (
        <TrendingDownIcon 
          sx={{ 
            color: isPositive ? theme.palette.success.main : theme.palette.error.main,
            fontSize: '1.25rem'
          }}
        />
      );
    }
  };

  // Helper to format numbers
  const formatValue = (value: number, unit?: string) => {
    // Format large numbers
    let formatted = '';
    if (value >= 1000000) {
      formatted = `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      formatted = `${(value / 1000).toFixed(1)}K`;
    } else {
      formatted = value.toLocaleString();
    }
    
    // Add unit if provided
    if (unit) {
      formatted += unit;
    }
    
    return formatted;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" component="div" gutterBottom>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  width: '40%',
                  justifyContent: 'center' 
                }}
              >
                <Avatar
                  sx={{ 
                    bgcolor: theme.palette.grey[200], 
                    color: theme.palette.text.secondary,
                    width: 32,
                    height: 32,
                    mr: 1
                  }}
                >
                  A
                </Avatar>
                <Typography variant="subtitle2">
                  {baselinePeriod}
                </Typography>
              </Box>
              
              <ArrowRightAltIcon sx={{ color: theme.palette.action.active }} />
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  width: '40%',
                  justifyContent: 'center' 
                }}
              >
                <Avatar
                  sx={{ 
                    bgcolor: theme.palette.primary.main, 
                    width: 32,
                    height: 32,
                    mr: 1
                  }}
                >
                  B
                </Avatar>
                <Typography variant="subtitle2">
                  {currentPeriod}
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {comparisonItems.map((item, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">
                    {item.metric}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {renderTrendIcon(item)}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        ml: 0.5, 
                        color: item.isPositive ? theme.palette.success.main : theme.palette.error.main,
                        fontWeight: 'medium'
                      }}
                    >
                      {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
                
                <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={5}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {item.baseline.label}
                      </Typography>
                      <Typography variant="h6">
                        {formatValue(item.baseline.value, item.unit)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <ArrowRightAltIcon 
                        sx={{ 
                          color: theme.palette.action.active,
                          fontSize: '2rem' 
                        }} 
                      />
                    </Grid>
                    
                    <Grid item xs={5}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {item.current.label}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: item.isPositive ? 
                            (item.changePercent > 0 ? theme.palette.success.main : theme.palette.error.main) :
                            (item.changePercent < 0 ? theme.palette.success.main : theme.palette.error.main)
                        }}
                      >
                        {formatValue(item.current.value, item.unit)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
                
                {showGoals && item.target !== undefined && (
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Goal: {formatValue(item.target, item.unit)}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {item.goalCompletion !== undefined && item.goalCompletion >= 100 ? (
                          <CheckCircleIcon 
                            sx={{ 
                              color: theme.palette.success.main,
                              fontSize: '1rem',
                              mr: 0.5
                            }} 
                          />
                        ) : (
                          <CancelIcon 
                            sx={{ 
                              color: theme.palette.warning.main,
                              fontSize: '1rem',
                              mr: 0.5
                            }} 
                          />
                        )}
                        
                        <Typography 
                          variant="caption" 
                          sx={{
                            fontWeight: 'medium',
                            color: item.goalCompletion !== undefined && item.goalCompletion >= 100 ?
                              theme.palette.success.main : theme.palette.warning.main
                          }}
                        >
                          {item.goalCompletion !== undefined ? `${Math.min(item.goalCompletion, 100).toFixed(0)}% Complete` : 'No data'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {item.goalCompletion !== undefined && (
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(item.goalCompletion, 100)} 
                        sx={{ 
                          height: 4, 
                          borderRadius: 2,
                          bgcolor: theme.palette.action.hover,
                          '.MuiLinearProgress-bar': {
                            bgcolor: item.goalCompletion >= 100 ? 
                              theme.palette.success.main : 
                              (item.goalCompletion >= 70 ? theme.palette.warning.main : theme.palette.error.main)
                          }
                        }} 
                      />
                    )}
                  </Box>
                )}
                
                {item.notes && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {item.notes}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ComparisonSummary;