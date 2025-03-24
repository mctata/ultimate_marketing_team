import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Chip,
  IconButton,
  Button,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
  Collapse
} from '@mui/material';
import { 
  AlarmAdd as AlarmAddIcon,
  CalendarToday as CalendarTodayIcon,
  CheckCircle as CheckCircleIcon,
  InfoOutlined as InfoOutlinedIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  LocalActivity as LocalActivityIcon,
  Lightbulb as LightbulbIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { format, addDays, getDay, setHours, parseISO } from 'date-fns';
import contentCalendarService, { BestTimeRecommendation, SchedulingInsight } from '../../services/contentCalendarService';

// Type definitions
interface SmartSchedulingRecommendationsProps {
  projectId: string | number;
  onApplyRecommendation?: (date: Date, platform: string) => void;
}

// Day of week mapping for easier display
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SmartSchedulingRecommendations: React.FC<SmartSchedulingRecommendationsProps> = ({ 
  projectId,
  onApplyRecommendation
}) => {
  const [bestTimes, setBestTimes] = useState<BestTimeRecommendation[]>([]);
  const [insights, setInsights] = useState<SchedulingInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  
  // Fetch best times and insights for smart scheduling
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get data for smart scheduling
        const [bestTimesData, insightsData] = await Promise.all([
          contentCalendarService.getBestTimeRecommendations(projectId),
          contentCalendarService.getSchedulingInsights(
            Number(projectId), 
            format(new Date(), 'yyyy-MM-dd'),
            format(addDays(new Date(), 30), 'yyyy-MM-dd')
          )
        ]);
        
        setBestTimes(bestTimesData || []);
        setInsights(insightsData || []);
      } catch (error) {
        console.error('Error fetching scheduling recommendations:', error);
        setError('Failed to load scheduling recommendations. Please try again.');
        
        // Set mock data for demonstration purposes
        setBestTimes(generateMockBestTimes());
        setInsights(generateMockInsights());
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [projectId]);
  
  // Generate mock data for best times
  const generateMockBestTimes = (): BestTimeRecommendation[] => {
    const platforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'];
    
    return platforms.map(platform => {
      // Generate stable random values based on platform name
      const hash = platform.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0);
      
      const dayOfWeek = hash % 7;
      const hourOfDay = 8 + (hash % 12); // Hours between 8 AM and 7 PM
      
      return {
        platform,
        day_of_week: dayOfWeek,
        hour_of_day: hourOfDay,
        average_engagement: 0.05 + (hash % 100) / 1000,
        confidence: 0.7 + (hash % 30) / 100
      };
    });
  };
  
  // Generate mock insights
  const generateMockInsights = (): SchedulingInsight[] => {
    return [
      {
        insight_type: 'content_gap',
        description: 'There is a significant gap in your content schedule between May 15-20',
        severity: 'warning',
        start_date: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
        end_date: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
        recommendation: 'Consider scheduling content during this period to maintain audience engagement'
      },
      {
        insight_type: 'platform_neglect',
        description: 'LinkedIn has had minimal content in the past 2 weeks',
        severity: 'info',
        recommendation: 'Increase LinkedIn posting frequency to 2-3 times per week'
      },
      {
        insight_type: 'content_overload',
        description: 'Multiple content pieces scheduled for same day (May 10)',
        severity: 'warning',
        start_date: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
        recommendation: 'Spread content more evenly throughout the week to maximize audience reach'
      }
    ];
  };
  
  // Handle applying a recommendation
  const handleApplyRecommendation = (dayOfWeek: number, hourOfDay: number, platform: string) => {
    if (!onApplyRecommendation) return;
    
    // Calculate the next occurrence of this day of the week
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const daysToAdd = (dayOfWeek - currentDayOfWeek + 7) % 7;
    
    // Create the recommended date
    const recommendedDate = addDays(today, daysToAdd);
    const recommendedDateTime = setHours(recommendedDate, hourOfDay);
    
    // Call the callback function with the recommended date and platform
    onApplyRecommendation(recommendedDateTime, platform);
  };
  
  // Format confidence as percentage
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };
  
  // Format engagement rate
  const formatEngagement = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`;
  };
  
  // Get color based on confidence level
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'info';
    return 'warning';
  };
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AlarmAddIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Smart Scheduling Recommendations</Typography>
        </Box>
        <IconButton onClick={() => setExpanded(!expanded)}>
          {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Box>
      
      <Collapse in={expanded}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1rem' }} />
                Optimal Posting Times by Platform
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {bestTimes.map((recommendation, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined">
                      <CardHeader
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1" component="div" sx={{ textTransform: 'capitalize' }}>
                              {recommendation.platform}
                            </Typography>
                            <Chip
                              label={formatConfidence(recommendation.confidence)}
                              size="small"
                              color={getConfidenceColor(recommendation.confidence) as any}
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        sx={{ pb: 0 }}
                      />
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CalendarTodayIcon sx={{ fontSize: '0.9rem', mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            <strong>{DAY_NAMES[recommendation.day_of_week]}</strong> at {recommendation.hour_of_day > 12 ? 
                              `${recommendation.hour_of_day - 12}:00 PM` : 
                              `${recommendation.hour_of_day}:00 AM`}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <SpeedIcon sx={{ fontSize: '0.9rem', mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            Avg. engagement: <strong>{formatEngagement(recommendation.average_engagement)}</strong>
                          </Typography>
                          <Tooltip title="Based on historical performance data for this platform">
                            <InfoOutlinedIcon sx={{ ml: 0.5, fontSize: '0.9rem', color: 'text.secondary' }} />
                          </Tooltip>
                        </Box>
                        
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleApplyRecommendation(
                            recommendation.day_of_week,
                            recommendation.hour_of_day,
                            recommendation.platform
                          )}
                          startIcon={<CheckCircleIcon />}
                          fullWidth
                        >
                          Apply This Time
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                <LightbulbIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1rem' }} />
                Scheduling Insights & Recommendations
              </Typography>
              
              {insights.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No scheduling insights available at this time.
                </Alert>
              ) : (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {insights.map((insight, index) => (
                    <Grid item xs={12} key={index}>
                      <Card variant="outlined">
                        <CardContent sx={{ display: 'flex' }}>
                          <Box sx={{ pr: 2 }}>
                            <LocalActivityIcon 
                              color={
                                insight.severity === 'critical' ? 'error' : 
                                insight.severity === 'warning' ? 'warning' : 'info'
                              } 
                              fontSize="large" 
                            />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              {insight.description}
                            </Typography>
                            
                            {insight.start_date && insight.end_date && (
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Period: {format(parseISO(insight.start_date), 'PP')} - {format(parseISO(insight.end_date), 'PP')}
                              </Typography>
                            )}
                            
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {insight.recommendation}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </>
        )}
      </Collapse>
    </Paper>
  );
};

export default SmartSchedulingRecommendations;