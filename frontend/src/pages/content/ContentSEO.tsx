import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  CardHeader,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckIcon from '@mui/icons-material/Check';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CodeIcon from '@mui/icons-material/Code';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import SyncIcon from '@mui/icons-material/Sync';
import HistoryIcon from '@mui/icons-material/History';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import GoogleIcon from '@mui/icons-material/Google';
import RefreshIcon from '@mui/icons-material/Refresh';
import BarChartIcon from '@mui/icons-material/BarChart';

import { useSnackbar } from 'notistack';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import seoService, {
  ContentSEOValidationRequest,
  ContentSEOValidationResponse,
  StructuredDataRequest,
  ContentUpdateRequest,
  GoogleOAuthResponse,
  AuthorizationStatusResponse
} from '../../services/seoService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`seo-tabpanel-${index}`}
      aria-labelledby={`seo-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ContentSEO: React.FC = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);
  const [contentText, setContentText] = useState<string>('');
  const [contentTitle, setContentTitle] = useState<string>('');
  const [primaryKeyword, setPrimaryKeyword] = useState<string>('');
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);
  const [secondaryKeywordInput, setSecondaryKeywordInput] = useState<string>('');
  const [contentType, setContentType] = useState<string>('blog_post');
  const [validationResults, setValidationResults] = useState<ContentSEOValidationResponse | null>(null);
  const [schemaType, setSchemaType] = useState<string>('BlogPosting');
  const [structuredDataResults, setStructuredDataResults] = useState<any>(null);
  const [schemaMetadata, setSchemaMetadata] = useState<any>({
    title: '',
    description: '',
    author: { name: '', url: '' },
    publisher: { name: 'Ultimate Marketing Team', logo: 'https://example.com/logo.png' },
    datePublished: new Date().toISOString(),
    featuredImage: '',
    url: ''
  });
  const [searchPerformance, setSearchPerformance] = useState<any>(null);
  const [keywordOpportunities, setKeywordOpportunities] = useState<any>(null);
  const [updateRecommendations, setUpdateRecommendations] = useState<any>(null);
  const [contentAge, setContentAge] = useState<number>(30);
  const [updateSchedule, setUpdateSchedule] = useState<any>(null);
  
  // Google Search Console Authentication
  const [isGoogleAuthorized, setIsGoogleAuthorized] = useState<boolean>(false);
  const [authUrl, setAuthUrl] = useState<string>('');
  const [authState, setAuthState] = useState<string>('');
  const [authDialogOpen, setAuthDialogOpen] = useState<boolean>(false);
  const [authCheckLoading, setAuthCheckLoading] = useState<boolean>(false);
  const [searchDataRange, setSearchDataRange] = useState<{start: string, end: string}>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 28); // Default to 28 days
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [deviceData, setDeviceData] = useState<any[]>([]);

  // Brand ID - in real implementation, this would come from the context or route params
  const brandId = 1;

  // Check if Google Search Console is authorized
  const checkGoogleAuthStatus = async () => {
    setAuthCheckLoading(true);
    try {
      const authStatus = await seoService.checkAuthorizationStatus(brandId);
      setIsGoogleAuthorized(authStatus.is_authorized);
      if (authStatus.is_authorized) {
        enqueueSnackbar('Google Search Console is authorized', { variant: 'success' });
      }
    } catch (error) {
      console.error('Error checking Google auth status:', error);
      setIsGoogleAuthorized(false);
    } finally {
      setAuthCheckLoading(false);
    }
  };

  // Initialize Google OAuth flow
  const initializeGoogleAuth = async () => {
    setLoading(true);
    try {
      const response = await seoService.initializeGoogleAuth(brandId);
      setAuthUrl(response.auth_url);
      setAuthState(response.state);
      setAuthDialogOpen(true);
    } catch (error) {
      console.error('Error initializing Google Auth:', error);
      enqueueSnackbar('Failed to initialize Google authentication', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Process OAuth callback (this would normally be handled by a dedicated callback route)
  const handleAuthCallback = async (code: string) => {
    setLoading(true);
    try {
      await seoService.processOAuthCallback(code, authState, brandId);
      setIsGoogleAuthorized(true);
      setAuthDialogOpen(false);
      enqueueSnackbar('Successfully authenticated with Google Search Console', { variant: 'success' });
      
      // Reload data after successful authentication
      await loadSearchPerformance();
      await loadKeywordOpportunities();
    } catch (error) {
      console.error('Error processing OAuth callback:', error);
      enqueueSnackbar('Failed to complete Google authentication', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog close
  const handleAuthDialogClose = () => {
    setAuthDialogOpen(false);
  };

  // Format data for charts
  const formatChartData = (performance: any) => {
    if (!performance || !performance.trends) return [];
    
    const { trends } = performance;
    
    // Format data for time series charts
    const chartData = trends.dates?.map((date: string, index: number) => ({
      date,
      clicks: trends.clicks[index] || 0,
      impressions: trends.impressions[index] || 0,
      ctr: (trends.ctr[index] || 0) * 100, // Convert to percentage
      position: trends.position[index] || 0
    })) || [];
    
    setChartData(chartData);
    
    // Format device data for pie chart
    if (performance.devices) {
      const deviceData = [
        { name: 'Mobile', value: performance.devices.MOBILE.clicks || 0 },
        { name: 'Desktop', value: performance.devices.DESKTOP.clicks || 0 },
        { name: 'Tablet', value: performance.devices.TABLET.clicks || 0 }
      ];
      setDeviceData(deviceData);
    }
  };

  // Load content data when component mounts
  useEffect(() => {
    if (contentId) {
      // Fetch content data
      // In a real implementation, this would load content from an API
      setLoading(true);
      
      // Mock content data for development
      setTimeout(() => {
        setContentTitle('10 Effective Marketing Strategies for 2025');
        setContentText(
          `# 10 Effective Marketing Strategies for 2025\n\nMarketing continues to evolve rapidly as technology advances and consumer behaviors change. Here are the top strategies that will dominate marketing in 2025.\n\n## Content Marketing Evolution\n\nContent marketing remains the cornerstone of digital strategy, but has evolved significantly. Brands now focus on creating comprehensive, value-driven content ecosystems rather than one-off blog posts.\n\nKey points:\n- Integration of AI for personalized content delivery\n- Focus on video and interactive content experiences\n- Content optimization for voice search and featured snippets\n\n## Data-Driven Decision Making\n\nMarketing decisions in 2025 are increasingly backed by comprehensive data analysis. The most successful marketers leverage predictive analytics and machine learning to anticipate market trends and consumer needs.\n\n## Omnichannel Integration\n\nThe lines between marketing channels continue to blur. Successful strategies now seamlessly integrate the customer experience across all touchpoints - from social media to email, website to in-store.`
        );
        setPrimaryKeyword('marketing strategies 2025');
        setSecondaryKeywords(['content marketing trends', 'data-driven marketing', 'omnichannel marketing']);
        setContentType('blog_post');
        setLoading(false);
      }, 1000);
      
      // Check if Google Search Console is authorized
      checkGoogleAuthStatus();
    }
  }, [contentId]);
  
  // Load search performance data when authorization status changes
  useEffect(() => {
    if (contentId && isGoogleAuthorized) {
      loadSearchPerformance();
      loadKeywordOpportunities();
    }
  }, [contentId, isGoogleAuthorized]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddSecondaryKeyword = () => {
    if (secondaryKeywordInput && !secondaryKeywords.includes(secondaryKeywordInput)) {
      setSecondaryKeywords([...secondaryKeywords, secondaryKeywordInput]);
      setSecondaryKeywordInput('');
    }
  };

  const handleRemoveSecondaryKeyword = (keyword: string) => {
    setSecondaryKeywords(secondaryKeywords.filter(k => k !== keyword));
  };

  const handleValidateContent = async () => {
    if (!contentText || !contentTitle || !primaryKeyword) {
      enqueueSnackbar('Please fill in all required fields', { variant: 'error' });
      return;
    }

    setLoading(true);

    try {
      const request: ContentSEOValidationRequest = {
        content_text: contentText,
        content_type: contentType,
        title: contentTitle,
        primary_keyword: primaryKeyword,
        secondary_keywords: secondaryKeywords,
        url: `https://example.com/blog/${contentTitle.toLowerCase().replace(/\s+/g, '-')}`
      };

      const results = await seoService.validateContent(request);
      setValidationResults(results);
      enqueueSnackbar('Content validation completed', { variant: 'success' });
    } catch (error) {
      console.error('Error validating content:', error);
      enqueueSnackbar('Error validating content', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStructuredData = async () => {
    if (!contentText) {
      enqueueSnackbar('Please enter content text', { variant: 'error' });
      return;
    }

    setLoading(true);

    try {
      // Prefill metadata with content data if empty
      const metadata = {
        ...schemaMetadata,
        title: schemaMetadata.title || contentTitle,
        description: schemaMetadata.description || contentText.substring(0, 160) + '...'
      };

      const request: StructuredDataRequest = {
        content_text: contentText,
        schema_type: schemaType,
        metadata: metadata
      };

      const results = await seoService.generateStructuredData(request);
      setStructuredDataResults(results);
      enqueueSnackbar('Structured data generated successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error generating structured data:', error);
      enqueueSnackbar('Error generating structured data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDetectSchemaType = async () => {
    if (!contentText || !contentTitle) {
      enqueueSnackbar('Please enter content text and title', { variant: 'error' });
      return;
    }

    setLoading(true);

    try {
      const results = await seoService.detectSchemaType({
        text: contentText,
        title: contentTitle
      });

      if (results.status === 'success') {
        setSchemaType(results.recommended_schema);
        enqueueSnackbar(`Detected schema type: ${results.recommended_schema}`, { variant: 'info' });
      }
    } catch (error) {
      console.error('Error detecting schema type:', error);
      enqueueSnackbar('Error detecting schema type', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadSearchPerformance = async () => {
    try {
      // Get content-specific search data
      if (contentId) {
        setLoading(true);
        const results = await seoService.getContentSearchData(parseInt(contentId), brandId);
        
        if (results.data) {
          setSearchPerformance(results.data);
          formatChartData(results.data);
        } else {
          enqueueSnackbar('Failed to load search performance data', { variant: 'warning' });
        }
      }
    } catch (error) {
      console.error('Error loading search performance:', error);
      enqueueSnackbar('Error loading search performance data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadKeywordOpportunities = async () => {
    try {
      if (contentId) {
        const results = await seoService.getKeywordOpportunities(parseInt(contentId), brandId);
        setKeywordOpportunities(results.opportunities);
      }
    } catch (error) {
      console.error('Error loading keyword opportunities:', error);
    }
  };

  const loadContentUpdateRecommendations = async () => {
    if (!contentId || !contentText) {
      enqueueSnackbar('Content ID and text are required', { variant: 'error' });
      return;
    }

    setLoading(true);

    try {
      const request: ContentUpdateRequest = {
        content_id: parseInt(contentId),
        content_text: contentText
      };

      const results = await seoService.getContentUpdateRecommendations(request, brandId);
      setUpdateRecommendations(results.recommendations);
      enqueueSnackbar('Update recommendations loaded', { variant: 'success' });
    } catch (error) {
      console.error('Error loading update recommendations:', error);
      enqueueSnackbar('Error loading update recommendations', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadUpdateSchedule = async () => {
    if (!contentId) {
      return;
    }

    setLoading(true);

    try {
      const results = await seoService.getContentUpdateSchedule(parseInt(contentId), brandId, contentAge);
      setUpdateSchedule(results);
      enqueueSnackbar('Update schedule loaded', { variant: 'success' });
    } catch (error) {
      console.error('Error loading update schedule:', error);
      enqueueSnackbar('Error loading update schedule', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    enqueueSnackbar('Copied to clipboard', { variant: 'success' });
  };

  const renderValidationScoreCard = (title: string, score: number, color: string, icon: React.ReactNode) => (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {icon}
          <Typography variant="h4" sx={{ ml: 1, color }}>
            {score}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={score}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              bgcolor: color
            }
          }}
        />
      </CardContent>
    </Card>
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckIcon color="success" />;
    if (score >= 60) return <WarningIcon color="warning" />;
    return <ErrorOutlineIcon color="error" />;
  };

  const renderIssuesList = (issues: string[], suggestions: string[], title: string) => (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardHeader title={title} />
      <CardContent>
        {issues.length > 0 ? (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Issues:
            </Typography>
            <List dense>
              {issues.map((issue, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <ErrorOutlineIcon color="error" />
                  </ListItemIcon>
                  <ListItemText primary={issue} />
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <Alert severity="success" sx={{ mb: 2 }}>
            No issues found
          </Alert>
        )}

        {suggestions.length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Suggestions:
            </Typography>
            <List dense>
              {suggestions.map((suggestion, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <LightbulbIcon color="info" />
                  </ListItemIcon>
                  <ListItemText primary={suggestion} />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderValidationTab = () => (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Content Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Content Title"
              fullWidth
              value={contentTitle}
              onChange={(e) => setContentTitle(e.target.value)}
              margin="normal"
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Content Type</InputLabel>
              <Select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                label="Content Type"
              >
                <MenuItem value="blog_post">Blog Post</MenuItem>
                <MenuItem value="article">Article</MenuItem>
                <MenuItem value="landing_page">Landing Page</MenuItem>
                <MenuItem value="product_page">Product Page</MenuItem>
                <MenuItem value="guide">Guide</MenuItem>
                <MenuItem value="how_to">How-To</MenuItem>
                <MenuItem value="news">News</MenuItem>
                <MenuItem value="press_release">Press Release</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Primary Keyword"
              fullWidth
              value={primaryKeyword}
              onChange={(e) => setPrimaryKeyword(e.target.value)}
              margin="normal"
              required
              helperText="The main keyword you want to rank for"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Secondary Keyword"
              fullWidth
              value={secondaryKeywordInput}
              onChange={(e) => setSecondaryKeywordInput(e.target.value)}
              margin="normal"
              helperText="Press Enter or Add button to add keywords"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSecondaryKeyword();
                }
              }}
              InputProps={{
                endAdornment: (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddSecondaryKeyword}
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    Add
                  </Button>
                )
              }}
            />
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {secondaryKeywords.map((keyword) => (
                <Chip
                  key={keyword}
                  label={keyword}
                  onDelete={() => handleRemoveSecondaryKeyword(keyword)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Content Text"
              fullWidth
              multiline
              rows={8}
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              margin="normal"
              required
              helperText="Paste your content here (markdown supported)"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleValidateContent}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Validate Content'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {validationResults && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Validation Results
          </Typography>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              {renderValidationScoreCard(
                'Overall Score',
                validationResults.overall_score,
                getScoreColor(validationResults.overall_score),
                getScoreIcon(validationResults.overall_score)
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderValidationScoreCard(
                'Title Optimization',
                validationResults.title_validation.score,
                getScoreColor(validationResults.title_validation.score),
                getScoreIcon(validationResults.title_validation.score)
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderValidationScoreCard(
                'Content Structure',
                validationResults.structure_validation.score,
                getScoreColor(validationResults.structure_validation.score),
                getScoreIcon(validationResults.structure_validation.score)
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderValidationScoreCard(
                'Keyword Usage',
                validationResults.keyword_validation.score,
                getScoreColor(validationResults.keyword_validation.score),
                getScoreIcon(validationResults.keyword_validation.score)
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderValidationScoreCard(
                'Readability',
                validationResults.readability_validation.score,
                getScoreColor(validationResults.readability_validation.score),
                getScoreIcon(validationResults.readability_validation.score)
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderValidationScoreCard(
                'E-E-A-T Signals',
                validationResults.eeat_validation.score,
                getScoreColor(validationResults.eeat_validation.score),
                getScoreIcon(validationResults.eeat_validation.score)
              )}
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>
            Priority Recommendations
          </Typography>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <List>
                {validationResults.recommendations
                  .sort((a, b) => a.priority - b.priority)
                  .slice(0, 3)
                  .map((rec, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {rec.priority === 1 ? (
                          <PriorityHighIcon color="error" />
                        ) : (
                          <InfoIcon color="info" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={rec.issue}
                        secondary={`Priority: ${rec.priority} | Impact Score: ${rec.score_impact}`}
                      />
                    </ListItem>
                  ))}
              </List>
            </CardContent>
          </Card>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Title Validation Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderIssuesList(
                validationResults.title_validation.issues,
                validationResults.title_validation.suggestions,
                'Title Validation'
              )}
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Content Structure Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderIssuesList(
                validationResults.structure_validation.issues,
                validationResults.structure_validation.suggestions,
                'Content Structure'
              )}
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Keyword Usage Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderIssuesList(
                validationResults.keyword_validation.issues,
                validationResults.keyword_validation.suggestions,
                'Keyword Usage'
              )}
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Readability Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderIssuesList(
                validationResults.readability_validation.issues,
                validationResults.readability_validation.suggestions,
                'Readability'
              )}
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>E-E-A-T Signal Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderIssuesList(
                validationResults.eeat_validation.issues,
                validationResults.eeat_validation.suggestions,
                'E-E-A-T Signals'
              )}
            </AccordionDetails>
          </Accordion>

          {validationResults.url_validation && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>URL Validation Details</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderIssuesList(
                  validationResults.url_validation.issues,
                  validationResults.url_validation.suggestions,
                  'URL Validation'
                )}
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}
    </Box>
  );

  // Create colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Render the authentication dialog
  const renderAuthDialog = () => (
    <Dialog open={authDialogOpen} onClose={handleAuthDialogClose} maxWidth="md">
      <DialogTitle>Connect to Google Search Console</DialogTitle>
      <DialogContent>
        <DialogContentText>
          To view real search performance data for your content, you need to authenticate with Google Search Console.
          Click the button below to open Google's authorization page in a new window.
        </DialogContentText>
        <Box sx={{ mt: 2, mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<GoogleIcon />}
            onClick={() => window.open(authUrl, '_blank')}
            sx={{ mr: 2 }}
          >
            Authorize with Google
          </Button>
        </Box>
        <DialogContentText>
          After completing authorization, paste the code from Google below:
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="auth-code"
          label="Authorization Code"
          type="text"
          fullWidth
          variant="outlined"
          sx={{ mt: 1 }}
          onChange={(e) => setAuthState(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleAuthDialogClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={() => handleAuthCallback(authState)}
          color="primary"
          variant="contained"
          disabled={!authState}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderSearchPerformanceTab = () => (
    <Box>
      {/* Authentication Status */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Google Search Console Integration</Typography>
          {authCheckLoading ? (
            <CircularProgress size={24} />
          ) : isGoogleAuthorized ? (
            <Button 
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={loadSearchPerformance}
              disabled={loading}
            >
              Refresh Data
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<GoogleIcon />}
              onClick={initializeGoogleAuth}
              disabled={loading}
            >
              Connect to Google Search Console
            </Button>
          )}
        </Box>
        
        {!isGoogleAuthorized && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <AlertTitle>Connect to Google Search Console</AlertTitle>
            To view real search performance data, you need to connect to Google Search Console.
            This integration provides accurate search metrics for your content including clicks,
            impressions, and rankings.
          </Alert>
        )}
        
        {isGoogleAuthorized && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <AlertTitle>Connected to Google Search Console</AlertTitle>
            Your Google Search Console integration is active. You're seeing real search performance data.
          </Alert>
        )}
        
        {/* Date Range Selector */}
        {isGoogleAuthorized && (
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              value={searchDataRange.start}
              onChange={(e) => setSearchDataRange({...searchDataRange, start: e.target.value})}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <TextField
              label="End Date"
              type="date"
              value={searchDataRange.end}
              onChange={(e) => setSearchDataRange({...searchDataRange, end: e.target.value})}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <Button 
              variant="outlined" 
              size="small"
              onClick={loadSearchPerformance}
              disabled={loading}
            >
              Apply
            </Button>
          </Box>
        )}
      </Paper>

      {/* Search Performance Overview */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search Performance Overview
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && searchPerformance ? (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="textSecondary">
                      Average Position
                    </Typography>
                    <Typography variant="h4">
                      {searchPerformance.average_position.toFixed(1)}
                      {searchPerformance.trends.position[0] > searchPerformance.trends.position[searchPerformance.trends.position.length - 1] ? (
                        <TrendingUpIcon color="success" sx={{ ml: 1 }} />
                      ) : (
                        <TrendingDownIcon color="error" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="textSecondary">
                      Total Clicks
                    </Typography>
                    <Typography variant="h4">
                      {searchPerformance.total_clicks}
                      {searchPerformance.trends.clicks[0] < searchPerformance.trends.clicks[searchPerformance.trends.clicks.length - 1] ? (
                        <TrendingUpIcon color="success" sx={{ ml: 1 }} />
                      ) : (
                        <TrendingDownIcon color="error" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="textSecondary">
                      Total Impressions
                    </Typography>
                    <Typography variant="h4">
                      {searchPerformance.total_impressions}
                      {searchPerformance.trends.impressions[0] < searchPerformance.trends.impressions[searchPerformance.trends.impressions.length - 1] ? (
                        <TrendingUpIcon color="success" sx={{ ml: 1 }} />
                      ) : (
                        <TrendingDownIcon color="error" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="textSecondary">
                      Average CTR
                    </Typography>
                    <Typography variant="h4">
                      {(searchPerformance.average_ctr * 100).toFixed(2)}%
                      {searchPerformance.trends.ctr[0] < searchPerformance.trends.ctr[searchPerformance.trends.ctr.length - 1] ? (
                        <TrendingUpIcon color="success" sx={{ ml: 1 }} />
                      ) : (
                        <TrendingDownIcon color="error" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Performance Trend Charts */}
            {chartData.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Performance Trends
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Clicks & Impressions
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="clicks"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="impressions"
                        stroke="#82ca9d"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
                
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Average Position
                      </Typography>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart
                          data={chartData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis reversed domain={[1, 'dataMax']} />
                          <RechartsTooltip />
                          <Line
                            type="monotone"
                            dataKey="position"
                            stroke="#ff7300"
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        CTR (%)
                      </Typography>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart
                          data={chartData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Area
                            type="monotone"
                            dataKey="ctr"
                            stroke="#8884d8"
                            fill="#8884d8"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            <Typography variant="h6" gutterBottom>
              Top Performing Queries
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Query</TableCell>
                    <TableCell align="right">Clicks</TableCell>
                    <TableCell align="right">Impressions</TableCell>
                    <TableCell align="right">CTR</TableCell>
                    <TableCell align="right">Position</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchPerformance.top_queries.map((query: any, index: number) => (
                    <TableRow key={index} hover>
                      <TableCell>{query.query}</TableCell>
                      <TableCell align="right">{query.clicks}</TableCell>
                      <TableCell align="right">{query.impressions}</TableCell>
                      <TableCell align="right">
                        {((query.clicks / query.impressions) * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell align="right">{query.position.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" gutterBottom>
              Device Breakdown
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">Mobile</Typography>
                        <Typography variant="h4">
                          {searchPerformance.devices.MOBILE.clicks} clicks
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {searchPerformance.devices.MOBILE.impressions} impressions
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          CTR:{' '}
                          {(
                            (searchPerformance.devices.MOBILE.clicks /
                              searchPerformance.devices.MOBILE.impressions) *
                            100
                          ).toFixed(2)}
                          %
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">Desktop</Typography>
                        <Typography variant="h4">
                          {searchPerformance.devices.DESKTOP.clicks} clicks
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {searchPerformance.devices.DESKTOP.impressions} impressions
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          CTR:{' '}
                          {(
                            (searchPerformance.devices.DESKTOP.clicks /
                              searchPerformance.devices.DESKTOP.impressions) *
                            100
                          ).toFixed(2)}
                          %
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">Tablet</Typography>
                        <Typography variant="h4">
                          {searchPerformance.devices.TABLET.clicks} clicks
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {searchPerformance.devices.TABLET.impressions} impressions
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          CTR:{' '}
                          {(
                            (searchPerformance.devices.TABLET.clicks /
                              searchPerformance.devices.TABLET.impressions) *
                            100
                          ).toFixed(2)}
                          %
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} md={4}>
                {deviceData.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Device Distribution (Clicks)
                    </Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={deviceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {deviceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                )}
              </Grid>
            </Grid>
          </>
        ) : (
          !loading && (
            <Box sx={{ p: 3 }}>
              <Alert severity="info">
                {isGoogleAuthorized
                  ? 'No search performance data available for this content.'
                  : 'Connect to Google Search Console to view search performance data.'}
              </Alert>
            </Box>
          )
        )}
      </Paper>
      
      {/* Render authentication dialog */}
      {renderAuthDialog()}
    </Box>
  );

  const renderKeywordOpportunitiesTab = () => (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Keyword Opportunities
        </Typography>

        {keywordOpportunities ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Keyword</TableCell>
                  <TableCell align="right">Current Ranking</TableCell>
                  <TableCell align="right">Search Volume</TableCell>
                  <TableCell align="right">Competition</TableCell>
                  <TableCell align="right">Opportunity Score</TableCell>
                  <TableCell>Recommended Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {keywordOpportunities.map((keyword: any, index: number) => (
                  <TableRow key={index} hover>
                    <TableCell>{keyword.keyword}</TableCell>
                    <TableCell align="right">
                      {keyword.current_ranking ? keyword.current_ranking : 'Not Ranking'}
                    </TableCell>
                    <TableCell align="right">{keyword.search_volume}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={keyword.competition}
                        color={
                          keyword.competition === 'LOW'
                            ? 'success'
                            : keyword.competition === 'MEDIUM'
                            ? 'warning'
                            : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <LinearProgress
                          variant="determinate"
                          value={keyword.opportunity_score}
                          sx={{
                            width: 60,
                            height: 8,
                            borderRadius: 5,
                            mr: 1,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              bgcolor:
                                keyword.opportunity_score >= 80
                                  ? 'success.main'
                                  : keyword.opportunity_score >= 60
                                  ? 'warning.main'
                                  : 'error.main'
                            }
                          }}
                        />
                        {keyword.opportunity_score}
                      </Box>
                    </TableCell>
                    <TableCell>{keyword.recommended_action}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Analyze Search Intent</Typography>
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={() => {
              if (keywordOpportunities) {
                const keywords = keywordOpportunities.map((k: any) => k.keyword).slice(0, 3);
                // Here you would call the search intent analysis endpoint
                enqueueSnackbar(`Analyzing search intent for: ${keywords.join(', ')}`, {
                  variant: 'info'
                });
              }
            }}
          >
            Analyze Top Keywords
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Search Intent Analysis</AlertTitle>
          Search intent analysis helps you understand what users are looking for when they search for these
          keywords. This can guide your content strategy.
        </Alert>

        <Typography variant="body1" paragraph>
          Select up to 3 keywords from the opportunities table above to analyze their search intent.
        </Typography>
      </Paper>
    </Box>
  );

  const renderContentUpdatesTab = () => (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Content Update Recommendations
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={loadContentUpdateRecommendations}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Get Update Recommendations'}
          </Button>
        </Box>

        {updateRecommendations ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Priority</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Recommendation</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {updateRecommendations.map((rec: any, index: number) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Chip
                        label={rec.priority}
                        color={rec.priority === 1 ? 'error' : rec.priority === 2 ? 'warning' : 'info'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{rec.type.replace(/_/g, ' ')}</TableCell>
                    <TableCell>{rec.recommendation}</TableCell>
                    <TableCell>{rec.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            Click the button above to get content update recommendations based on performance data and
            content analysis.
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Update Schedule
        </Typography>

        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Content Age (days)"
              type="number"
              value={contentAge}
              onChange={(e) => setContentAge(parseInt(e.target.value) || 30)}
              fullWidth
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              color="primary"
              onClick={loadUpdateSchedule}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Get Update Schedule'}
            </Button>
          </Grid>
        </Grid>

        {updateSchedule ? (
          <Box>
            <Alert severity={updateSchedule.update_urgency === 'high' ? 'error' : updateSchedule.update_urgency === 'medium' ? 'warning' : 'info'} sx={{ mb: 2 }}>
              <AlertTitle>Update Urgency: {updateSchedule.update_urgency.toUpperCase()}</AlertTitle>
              Next scheduled update: <strong>{updateSchedule.next_update_date}</strong>
            </Alert>

            <Typography variant="subtitle1" gutterBottom>
              Recommended Update Schedule
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Update Type</TableCell>
                    <TableCell>Scheduled Date</TableCell>
                    <TableCell>Priority</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {updateSchedule.update_schedule.map((item: any, index: number) => (
                    <TableRow key={index} hover>
                      <TableCell>{item.type.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{item.scheduled_date}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.priority}
                          color={
                            item.priority === 'high'
                              ? 'error'
                              : item.priority === 'medium'
                              ? 'warning'
                              : 'info'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <Alert severity="info">
            Click the button above to get a recommended update schedule based on content performance and
            age.
          </Alert>
        )}
      </Paper>
    </Box>
  );

  const renderStructuredDataTab = () => (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Generate Structured Data
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Schema Type</InputLabel>
              <Select
                value={schemaType}
                onChange={(e) => setSchemaType(e.target.value)}
                label="Schema Type"
              >
                <MenuItem value="Article">Article</MenuItem>
                <MenuItem value="BlogPosting">BlogPosting</MenuItem>
                <MenuItem value="FAQPage">FAQPage</MenuItem>
                <MenuItem value="HowTo">HowTo</MenuItem>
                <MenuItem value="Product">Product</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleDetectSchemaType}
                disabled={loading}
                sx={{ mr: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Detect Schema Type'}
              </Button>
              <Typography variant="body2" color="textSecondary">
                Auto-detect the best schema type for your content
              </Typography>
            </Box>
          </Grid>

          {schemaType === 'Article' || schemaType === 'BlogPosting' ? (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Title"
                  fullWidth
                  value={schemaMetadata.title || contentTitle}
                  onChange={(e) =>
                    setSchemaMetadata({ ...schemaMetadata, title: e.target.value })
                  }
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Description"
                  fullWidth
                  value={schemaMetadata.description}
                  onChange={(e) =>
                    setSchemaMetadata({ ...schemaMetadata, description: e.target.value })
                  }
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Author Name"
                  fullWidth
                  value={schemaMetadata.author?.name || ''}
                  onChange={(e) =>
                    setSchemaMetadata({
                      ...schemaMetadata,
                      author: { ...schemaMetadata.author, name: e.target.value }
                    })
                  }
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Featured Image URL"
                  fullWidth
                  value={schemaMetadata.featuredImage}
                  onChange={(e) =>
                    setSchemaMetadata({ ...schemaMetadata, featuredImage: e.target.value })
                  }
                  margin="normal"
                />
              </Grid>
            </>
          ) : schemaType === 'Product' ? (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Product Name"
                  fullWidth
                  value={schemaMetadata.name || contentTitle}
                  onChange={(e) =>
                    setSchemaMetadata({ ...schemaMetadata, name: e.target.value })
                  }
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Product Description"
                  fullWidth
                  value={schemaMetadata.description}
                  onChange={(e) =>
                    setSchemaMetadata({ ...schemaMetadata, description: e.target.value })
                  }
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Product Brand"
                  fullWidth
                  value={schemaMetadata.brand || ''}
                  onChange={(e) =>
                    setSchemaMetadata({ ...schemaMetadata, brand: e.target.value })
                  }
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Product Image URL"
                  fullWidth
                  value={schemaMetadata.image}
                  onChange={(e) =>
                    setSchemaMetadata({ ...schemaMetadata, image: e.target.value })
                  }
                  margin="normal"
                />
              </Grid>
            </>
          ) : null}

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateStructuredData}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Generate Structured Data'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {structuredDataResults && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Generated {structuredDataResults.schema_type} Schema</Typography>
            <Tooltip title="Copy JSON-LD to clipboard">
              <IconButton onClick={() => copyToClipboard(JSON.stringify(structuredDataResults.json_ld, null, 2))}>
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Box
            sx={{
              p: 2,
              bgcolor: 'grey.900',
              color: 'grey.100',
              borderRadius: 1,
              overflow: 'auto',
              maxHeight: 400,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              mb: 2
            }}
          >
            <pre>{JSON.stringify(structuredDataResults.json_ld, null, 2)}</pre>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              HTML Script Tag
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}
            >
              <code>{structuredDataResults.json_ld_script}</code>
            </Box>
            <Button
              startIcon={<ContentCopyIcon />}
              onClick={() => copyToClipboard(structuredDataResults.json_ld_script)}
              sx={{ mt: 1 }}
            >
              Copy to Clipboard
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );

  if (loading && !contentTitle) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="SEO tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="SEO Validation" />
            <Tab label="Search Performance" />
            <Tab label="Keyword Opportunities" />
            <Tab label="Content Updates" />
            <Tab label="Structured Data" />
          </Tabs>
        </Box>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        {renderValidationTab()}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {renderSearchPerformanceTab()}
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        {renderKeywordOpportunitiesTab()}
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        {renderContentUpdatesTab()}
      </TabPanel>
      <TabPanel value={tabValue} index={4}>
        {renderStructuredDataTab()}
      </TabPanel>
      
      {/* Authentication Dialog */}
      {renderAuthDialog()}
    </Box>
  );
};

export default ContentSEO;