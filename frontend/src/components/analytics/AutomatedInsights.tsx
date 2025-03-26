import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  IconButton,
  Tooltip,
  Button,
  Skeleton,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import RefreshIcon from '@mui/icons-material/Refresh';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';

export interface Insight {
  id: string;
  title: string;
  description: string;
  category: 'performance' | 'anomaly' | 'trend' | 'opportunity' | 'prediction';
  severity: 'low' | 'medium' | 'high';
  trend?: 'up' | 'down' | 'flat';
  percent?: number;
  createdAt: string;
  metrics?: {
    name: string;
    value: number | string;
    change?: number;
    trend?: 'up' | 'down' | 'flat'; 
  }[];
  isNew?: boolean;
  isSaved?: boolean;
}

interface AutomatedInsightsProps {
  insights: Insight[];
  title?: string;
  description?: string;
  isLoading?: boolean;
  onInsightSave?: (insightId: string, isSaved: boolean) => void;
  onRefresh?: () => void;
  onCreateAlert?: (insightId: string) => void;
  maxItems?: number;
  showCategories?: string[];
}

const AutomatedInsights: React.FC<AutomatedInsightsProps> = ({
  insights,
  title = 'Automated Insights',
  description = 'AI-powered analysis of your metrics',
  isLoading = false,
  onInsightSave,
  onRefresh,
  onCreateAlert,
  maxItems = 5,
  showCategories
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<string | false>(false);
  const [visibleInsights, setVisibleInsights] = useState(maxItems);

  // Filter insights by categories if provided
  const filteredInsights = (showCategories && Array.isArray(showCategories) && insights)
    ? insights.filter(insight => showCategories.includes(insight.category))
    : insights || [];

  // Handle accordion expansion
  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  // Load more insights
  const handleLoadMore = () => {
    setVisibleInsights(prev => prev + 5);
  };

  // Helper to get trend icon and color
  const getTrendDetails = (trend?: string) => {
    if (!trend) return { icon: null, color: theme.palette.text.secondary };

    switch (trend) {
      case 'up':
        return { 
          icon: <TrendingUpIcon fontSize="small" />, 
          color: theme.palette.success.main 
        };
      case 'down':
        return { 
          icon: <TrendingDownIcon fontSize="small" />, 
          color: theme.palette.error.main 
        };
      default:
        return { 
          icon: <TrendingFlatIcon fontSize="small" />, 
          color: theme.palette.warning.main 
        };
    }
  };

  // Helper to get category chip details
  const getCategoryDetails = (category: string) => {
    switch (category) {
      case 'performance':
        return { 
          label: 'Performance', 
          color: theme.palette.primary.main,
          icon: '📊'
        };
      case 'anomaly':
        return { 
          label: 'Anomaly', 
          color: theme.palette.error.main,
          icon: '⚠️'
        };
      case 'trend':
        return { 
          label: 'Trend', 
          color: theme.palette.info.main,
          icon: '📈'
        };
      case 'opportunity':
        return { 
          label: 'Opportunity', 
          color: theme.palette.success.main,
          icon: '💡'
        };
      case 'prediction':
        return { 
          label: 'Prediction', 
          color: theme.palette.secondary.main,
          icon: '🔮'
        };
      default:
        return { 
          label: category, 
          color: theme.palette.grey[500],
          icon: 'ℹ️'
        };
    }
  };

  // Helper to get severity details
  const getSeverityDetails = (severity: string) => {
    switch (severity) {
      case 'high':
        return { 
          label: 'High', 
          color: theme.palette.error.main
        };
      case 'medium':
        return { 
          label: 'Medium', 
          color: theme.palette.warning.main
        };
      default:
        return { 
          label: 'Low', 
          color: theme.palette.success.main
        };
    }
  };

  // Format date from ISO string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LightbulbOutlinedIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
            <Typography variant="h6" component="div">
              {title}
            </Typography>
          </Box>
          
          {onRefresh && (
            <Tooltip title="Refresh Insights">
              <IconButton size="small" onClick={onRefresh} disabled={isLoading}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        {description && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {description}
          </Typography>
        )}
      </CardContent>

      {isLoading ? (
        <Box sx={{ p: 2 }}>
          {[...Array(3)].map((_, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Skeleton variant="rectangular" height={20} width="80%" sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={15} width="60%" />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Skeleton variant="rectangular" height={24} width={80} />
                <Skeleton variant="rectangular" height={24} width={60} />
              </Box>
              <Skeleton variant="rectangular" height={1} sx={{ my: 2 }} />
            </Box>
          ))}
        </Box>
      ) : (
        <>
          <Box sx={{ px: 2, py: 0, flexGrow: 1, overflow: 'auto' }}>
            {filteredInsights.length === 0 ? (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  py: 4
                }}
              >
                <LightbulbOutlinedIcon sx={{ fontSize: 40, color: theme.palette.action.disabled, mb: 2 }} />
                <Typography variant="body1" color="text.secondary" align="center">
                  No insights available.
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Insights will appear here once there's enough data to analyze.
                </Typography>
              </Box>
            ) : (
              filteredInsights.slice(0, visibleInsights).map((insight, index) => {
                const categoryDetails = getCategoryDetails(insight.category);
                const severityDetails = getSeverityDetails(insight.severity);
                
                return (
                  <Accordion 
                    key={insight.id}
                    expanded={expanded === insight.id}
                    onChange={handleChange(insight.id)}
                    elevation={0}
                    disableGutters
                    sx={{ 
                      '&:before': { display: 'none' },
                      border: expanded === insight.id ? `1px solid ${theme.palette.divider}` : 'none',
                      mb: 2,
                      backgroundColor: insight.isNew 
                        ? alpha(theme.palette.primary.light, 0.1) 
                        : 'transparent'
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls={`insight-${insight.id}-content`}
                      id={`insight-${insight.id}-header`}
                      sx={{ px: 1 }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, mr: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography 
                            variant="subtitle1" 
                            component="div" 
                            sx={{ 
                              fontWeight: insight.isNew ? 'bold' : 'medium',
                              mr: 1
                            }}
                          >
                            {insight.title}
                          </Typography>
                          
                          {insight.isNew && (
                            <Chip 
                              label="New" 
                              size="small" 
                              color="primary" 
                              sx={{ height: 20, fontSize: '0.6875rem' }} 
                            />
                          )}
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {insight.description.length > 120 
                            ? `${insight.description.substring(0, 120)}...` 
                            : insight.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          <Chip 
                            icon={<Box component="span" sx={{ mr: -0.5 }}>{categoryDetails.icon}</Box>}
                            label={categoryDetails.label} 
                            size="small"
                            sx={{ 
                              backgroundColor: alpha(categoryDetails.color, 0.1),
                              color: categoryDetails.color,
                              fontWeight: 'medium',
                              height: 24
                            }}
                          />
                          
                          <Chip 
                            label={`Priority: ${severityDetails.label}`} 
                            size="small"
                            sx={{ 
                              backgroundColor: alpha(severityDetails.color, 0.1),
                              color: severityDetails.color,
                              fontWeight: 'medium',
                              height: 24
                            }}
                          />
                          
                          {insight.trend && (
                            <Chip 
                              icon={getTrendDetails(insight.trend).icon || undefined}
                              label={insight.percent ? `${insight.percent > 0 ? '+' : ''}${insight.percent}%` : ''}
                              size="small"
                              sx={{ 
                                backgroundColor: alpha(getTrendDetails(insight.trend).color, 0.1),
                                color: getTrendDetails(insight.trend).color,
                                fontWeight: 'medium',
                                height: 24
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </AccordionSummary>
                    
                    <AccordionDetails sx={{ px: 1, pb: 2 }}>
                      <Typography variant="body2" paragraph>
                        {insight.description}
                      </Typography>
                      
                      {insight.metrics && insight.metrics.length > 0 && (
                        <Box sx={{ mt: 2, mb: 3 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Key Metrics
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            {insight.metrics.map((metric, idx) => (
                              <Card 
                                key={idx} 
                                variant="outlined" 
                                sx={{ 
                                  minWidth: 150,
                                  flex: '1 0 auto',
                                  maxWidth: 200
                                }}
                              >
                                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {metric.name}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                                    <Typography variant="h6" component="div" sx={{ mr: 1 }}>
                                      {metric.value}
                                    </Typography>
                                    {metric.change && (
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        color: getTrendDetails(metric.trend).color
                                      }}>
                                        {getTrendDetails(metric.trend).icon}
                                        <Typography variant="caption" sx={{ ml: 0.5 }}>
                                          {metric.change > 0 ? '+' : ''}{metric.change}%
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </CardContent>
                              </Card>
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mt: 2,
                        pt: 2,
                        borderTop: `1px solid ${theme.palette.divider}`
                      }}>
                        <Typography variant="caption" color="text.secondary">
                          Generated {formatDate(insight.createdAt)}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {onCreateAlert && (
                            <Tooltip title="Create Alert">
                              <IconButton 
                                size="small" 
                                onClick={() => onCreateAlert(insight.id)}
                              >
                                <NotificationsIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {onInsightSave && (
                            <Tooltip title={insight.isSaved ? "Remove Bookmark" : "Bookmark"}>
                              <IconButton 
                                size="small" 
                                onClick={() => onInsightSave(insight.id, !insight.isSaved)}
                              >
                                {insight.isSaved 
                                  ? <BookmarkIcon fontSize="small" color="primary" /> 
                                  : <BookmarkBorderIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              })
            )}
          </Box>
          
          {filteredInsights.length > visibleInsights && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button onClick={handleLoadMore} size="small">
                Load More Insights
              </Button>
            </Box>
          )}
        </>
      )}
    </Card>
  );
};

export default AutomatedInsights;