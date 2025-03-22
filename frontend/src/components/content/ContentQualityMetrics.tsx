import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Paper,
  Divider,
  Chip,
  Tooltip,
  IconButton,
  Button,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  LightbulbOutlined as LightbulbIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  ArrowUpward as ArrowUpwardIcon,
  QuestionMark as QuestionMarkIcon,
} from '@mui/icons-material';

// Define the metrics data structure
export interface ContentQualityData {
  overallScore: number;
  metrics: {
    readability: number;
    grammar: number;
    seo: number;
    engagement: number;
    brandConsistency: number;
  };
  strengths: string[];
  improvements: string[];
  suggestions: string[];
}

interface ContentQualityMetricsProps {
  data: ContentQualityData;
  onApplySuggestion?: (suggestion: string) => void;
}

const ContentQualityMetrics = ({ data, onApplySuggestion }: ContentQualityMetricsProps) => {
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const getScoreColor = (score: number) => {
    if (score >= 85) return '#4caf50'; // Green
    if (score >= 70) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Average';
    return 'Needs Improvement';
  };

  const getMetricIcon = (score: number) => {
    if (score >= 85) return <CheckCircleIcon fontSize="small" sx={{ color: '#4caf50' }} />;
    if (score >= 70) return <WarningIcon fontSize="small" sx={{ color: '#ff9800' }} />;
    return <ErrorIcon fontSize="small" sx={{ color: '#f44336' }} />;
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Content Quality Analysis</Typography>
        <Tooltip title="Content quality is evaluated based on readability, grammar, SEO optimization, engagement potential, and brand consistency.">
          <IconButton size="small" sx={{ ml: 1 }}>
            <QuestionMarkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Grid container spacing={3}>
        {/* Overall score */}
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              textAlign: 'center', 
              bgcolor: '#f8f9fa', 
              boxShadow: 'none', 
              border: '1px solid #e0e0e0',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Overall Quality Score
              </Typography>
              <Box 
                sx={{ 
                  position: 'relative', 
                  display: 'inline-flex',
                  mb: 1
                }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    border: `8px solid ${getScoreColor(data.overallScore)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h4" fontWeight="bold">
                    {data.overallScore}
                  </Typography>
                </Box>
              </Box>
              <Typography 
                variant="body1" 
                sx={{ fontWeight: 'bold', color: getScoreColor(data.overallScore) }}
              >
                {getScoreLabel(data.overallScore)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Based on 5 quality metrics
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Detailed metrics */}
        <Grid item xs={12} md={8}>
          <Card 
            sx={{ 
              boxShadow: 'none', 
              border: '1px solid #e0e0e0',
              height: '100%'
            }}
          >
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Detailed Metrics
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  {getMetricIcon(data.metrics.readability)}
                  <Typography variant="body2" sx={{ ml: 1 }}>Readability</Typography>
                  <Typography variant="body2" sx={{ ml: 'auto', fontWeight: 'medium' }}>
                    {data.metrics.readability}/100
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={data.metrics.readability} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: '#f0f0f0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getScoreColor(data.metrics.readability),
                    }
                  }} 
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  {getMetricIcon(data.metrics.grammar)}
                  <Typography variant="body2" sx={{ ml: 1 }}>Grammar & Style</Typography>
                  <Typography variant="body2" sx={{ ml: 'auto', fontWeight: 'medium' }}>
                    {data.metrics.grammar}/100
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={data.metrics.grammar} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: '#f0f0f0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getScoreColor(data.metrics.grammar),
                    }
                  }} 
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  {getMetricIcon(data.metrics.seo)}
                  <Typography variant="body2" sx={{ ml: 1 }}>SEO Optimization</Typography>
                  <Typography variant="body2" sx={{ ml: 'auto', fontWeight: 'medium' }}>
                    {data.metrics.seo}/100
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={data.metrics.seo} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: '#f0f0f0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getScoreColor(data.metrics.seo),
                    }
                  }} 
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  {getMetricIcon(data.metrics.engagement)}
                  <Typography variant="body2" sx={{ ml: 1 }}>Engagement Potential</Typography>
                  <Typography variant="body2" sx={{ ml: 'auto', fontWeight: 'medium' }}>
                    {data.metrics.engagement}/100
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={data.metrics.engagement} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: '#f0f0f0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getScoreColor(data.metrics.engagement),
                    }
                  }} 
                />
              </Box>
              
              <Box sx={{ mb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  {getMetricIcon(data.metrics.brandConsistency)}
                  <Typography variant="body2" sx={{ ml: 1 }}>Brand Consistency</Typography>
                  <Typography variant="body2" sx={{ ml: 'auto', fontWeight: 'medium' }}>
                    {data.metrics.brandConsistency}/100
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={data.metrics.brandConsistency} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: '#f0f0f0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getScoreColor(data.metrics.brandConsistency),
                    }
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Strengths and improvements */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <ThumbUpIcon fontSize="small" sx={{ mr: 1, color: '#4caf50' }} />
            Content Strengths
          </Typography>
          
          <List dense disablePadding>
            {data.strengths.map((strength, index) => (
              <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircleIcon fontSize="small" sx={{ color: '#4caf50' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={strength} 
                  primaryTypographyProps={{ variant: 'body2' }} 
                />
              </ListItem>
            ))}
          </List>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <ArrowUpwardIcon fontSize="small" sx={{ mr: 1, color: '#ff9800' }} />
            Areas for Improvement
          </Typography>
          
          <List dense disablePadding>
            {data.improvements.map((improvement, index) => (
              <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <WarningIcon fontSize="small" sx={{ color: '#ff9800' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={improvement} 
                  primaryTypographyProps={{ variant: 'body2' }} 
                />
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
      
      {/* Suggestions */}
      <Box sx={{ mt: 3 }}>
        <Button
          onClick={() => setShowSuggestions(!showSuggestions)}
          endIcon={<ExpandMoreIcon sx={{ transform: showSuggestions ? 'rotate(180deg)' : 'none' }} />}
          sx={{ mb: 1 }}
          color="primary"
          variant="text"
        >
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center' }}>
            <LightbulbIcon fontSize="small" sx={{ mr: 1, color: '#0066cc' }} />
            Improvement Suggestions
          </Typography>
        </Button>
        
        <Collapse in={showSuggestions}>
          <Paper sx={{ p: 2, bgcolor: '#f8fafd', border: '1px solid #e3f2fd' }}>
            <List dense disablePadding>
              {data.suggestions.map((suggestion, index) => (
                <ListItem
                  key={index}
                  disablePadding
                  sx={{ 
                    mb: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box sx={{ display: 'flex', width: '100%' }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <LightbulbIcon fontSize="small" sx={{ color: '#0066cc' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={suggestion}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </Box>
                  
                  {onApplySuggestion && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => onApplySuggestion(suggestion)}
                      sx={{ ml: 4, mt: 1 }}
                    >
                      Apply Suggestion
                    </Button>
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
        </Collapse>
      </Box>
    </Paper>
  );
};

export default ContentQualityMetrics;