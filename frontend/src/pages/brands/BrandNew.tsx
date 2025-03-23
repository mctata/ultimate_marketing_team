import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  useTheme,
  Avatar,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Search as SearchIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ContentCopy as ContentCopyIcon,
  Palette as PaletteIcon,
  FormatColorText as FormatColorTextIcon,
  AltRoute as AltRouteIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Tag as TagIcon,
  Flag as FlagIcon,
  BarChart as BarChartIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  Pinterest as PinterestIcon,
  YouTube as YouTubeIcon,
  Domain as DomainIcon,
} from '@mui/icons-material';
import brandService, { WebsiteAnalysisResult } from '../../services/brandService';
import { useBrands } from '../../hooks/useBrands';
import { ErrorBoundary } from 'react-error-boundary';
import GlobalErrorFallback from '../../components/common/GlobalErrorFallback';

// Define step labels
const steps = [
  'Website Analysis',
  'Review Company Info',
  'Brand Settings',
  'Content Strategy',
  'Confirmation'
];

// Animation keyframes for the pulse effect
const pulseAnimation = `
  @keyframes pulse {
    0% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(1); opacity: 0.7; }
  }
`;

const BrandNew = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { createBrand } = useBrands();
  
  // State for the stepper
  const [activeStep, setActiveStep] = useState(0);
  
  // State for URL input
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  
  // State for analysis status
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<WebsiteAnalysisResult | null>(null);
  
  // State for form edits
  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [industry, setIndustry] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [contentTone, setContentTone] = useState('');
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [socialMediaAccounts, setSocialMediaAccounts] = useState<{platform: string; url: string}[]>([]);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<{frequency: string; bestTimes: string[]}>({
    frequency: '',
    bestTimes: []
  });
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [marketingGoals, setMarketingGoals] = useState<string[]>([]);
  
  // Animation ref for the analysis animation
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if URL is valid
  useEffect(() => {
    try {
      const urlObj = new URL(url);
      setIsValidUrl(urlObj.protocol === 'http:' || urlObj.protocol === 'https:');
    } catch (e) {
      setIsValidUrl(false);
    }
  }, [url]);
  
  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);
  
  // Handle URL input change
  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
    setAnalyzeError(null);
  };
  
  // Start website analysis
  const handleAnalyzeWebsite = async () => {
    if (!isValidUrl) return;
    
    setIsAnalyzing(true);
    setAnalyzeError(null);
    
    try {
      // Simulate analysis steps with a realistic delay
      // In a real implementation, this would be handled by the API
      
      // Start fake animation sequence
      animationRef.current = setTimeout(() => {
        // Actual API call
        brandService.analyzeWebsite(url)
          .then(result => {
            setAnalysisResult(result);
            
            // Set form values from analysis
            setBrandName(result.name);
            setBrandDescription(result.description);
            setLogo(result.logo || '');
            setIndustry(result.industry);
            setPrimaryColor(result.colors.primary);
            setSecondaryColor(result.colors.secondary);
            setContentTone(result.contentTone);
            setTargetAudience(result.targetAudience);
            setSocialMediaAccounts(result.socialMedia);
            setSuggestedTopics(result.topics);
            setContentTypes(result.contentTypes);
            setSchedule(result.schedule);
            setHashtags(result.hashtags);
            setMarketingGoals(result.marketingGoals);
            
            // Move to next step
            setActiveStep(1);
          })
          .catch(err => {
            console.error('Error analyzing website:', err);
            setAnalyzeError('Failed to analyze website. Please try again or enter information manually.');
          })
          .finally(() => {
            setIsAnalyzing(false);
          });
      }, 3000); // Simulate 3 second analysis time
    } catch (error) {
      console.error('Error:', error);
      setAnalyzeError('An unexpected error occurred. Please try again.');
      setIsAnalyzing(false);
    }
  };
  
  // Handle form submission to create brand
  const handleCreateBrand = () => {
    createBrand.mutate({
      name: brandName,
      description: brandDescription,
      industry: industry,
      website: url,
      logo: logo,
      active: true,
      primaryColor: primaryColor,
      secondaryColor: secondaryColor,
      contentTone: contentTone,
      targetAudience: targetAudience,
      socialMediaAccounts: socialMediaAccounts,
      suggestedTopics: suggestedTopics,
      recommendedContentTypes: contentTypes,
    }, {
      onSuccess: (data) => {
        navigate(`/brands/${data.id}`);
      }
    });
  };
  
  // Handle manual entry option
  const handleManualEntry = () => {
    setActiveStep(1);
  };
  
  // Navigate between steps
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Render the website analysis step
  const renderWebsiteAnalysisStep = () => {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        maxWidth: 600,
        mx: 'auto',
        textAlign: 'center'
      }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Let's get your brand set up quickly
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
          Enter your website URL and we'll analyze it to automatically set up your brand profile with the right colors, content preferences, and recommendations.
        </Typography>
        
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
            mb: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <TextField
              fullWidth
              label="Website URL"
              variant="outlined"
              placeholder="https://example.com"
              value={url}
              onChange={handleUrlChange}
              disabled={isAnalyzing}
              helperText={!isValidUrl && url ? "Please enter a valid URL (e.g., https://example.com)" : ""}
              error={!isValidUrl && url.length > 0}
              InputProps={{
                startAdornment: (
                  <SearchIcon color="action" sx={{ mr: 1 }} />
                ),
              }}
              sx={{ mb: 2 }}
            />
          </Box>
          
          {analyzeError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {analyzeError}
            </Alert>
          )}
          
          {isAnalyzing ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <style>{pulseAnimation}</style>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                animation: 'pulse 1.5s infinite ease-in-out'
              }}>
                <CircularProgress size={50} thickness={4} sx={{ mb: 2 }} />
                <Typography variant="h6">
                  Analyzing your website...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Detecting brand colors, content, and style
                </Typography>
              </Box>
              <LinearProgress sx={{ mt: 3, mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                This will take just a moment
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 1 }}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={handleAnalyzeWebsite}
                disabled={!isValidUrl}
              >
                Analyze Website
              </Button>
              <Button
                variant="text"
                size="large" 
                onClick={handleManualEntry}
              >
                Set Up Manually
              </Button>
            </Box>
          )}
        </Paper>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Don't worry, you'll be able to customize everything after the analysis.
        </Typography>
      </Box>
    );
  };
  
  // Render the company info step
  const renderCompanyInfoStep = () => {
    return (
      <Box>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Company Profile
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          We've detected the following information from your website. Feel free to edit any details.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Company Name"
              variant="outlined"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              label="Company Description"
              variant="outlined"
              value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)}
              required
              multiline
              rows={4}
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              label="Industry"
              variant="outlined"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Company Logo
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                height: 150,
                bgcolor: 'grey.100',
                borderRadius: 2,
                mb: 2,
                overflow: 'hidden'
              }}>
                {logo ? (
                  <img 
                    src={logo} 
                    alt="Company Logo" 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No logo detected
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<EditIcon />}
                  component="label"
                >
                  Change Logo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setLogo(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </Button>
              </Box>
            </Paper>
            
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Contact Information
              </Typography>
              
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <TextField
                    size="small"
                    fullWidth
                    value={analysisResult?.contactInfo?.email || ''}
                    placeholder="Email address"
                    onChange={(e) => {
                      if (analysisResult) {
                        setAnalysisResult({
                          ...analysisResult,
                          contactInfo: {
                            ...analysisResult.contactInfo,
                            email: e.target.value
                          }
                        });
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <TextField
                    size="small"
                    fullWidth
                    value={analysisResult?.contactInfo?.phone || ''}
                    placeholder="Phone number"
                    onChange={(e) => {
                      if (analysisResult) {
                        setAnalysisResult({
                          ...analysisResult,
                          contactInfo: {
                            ...analysisResult.contactInfo,
                            phone: e.target.value
                          }
                        });
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LanguageIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <TextField
                    size="small"
                    fullWidth
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button onClick={handleBack}>
            Back
          </Button>
          <Button 
            variant="contained" 
            onClick={handleNext}
            disabled={!brandName || !industry}
          >
            Continue
          </Button>
        </Box>
      </Box>
    );
  };
  
  // Render the brand settings step
  const renderBrandSettingsStep = () => {
    return (
      <Box>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Brand Settings
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          We've extracted your brand's visual identity. Adjust these settings to match your brand guidelines.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PaletteIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">Brand Colors</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Primary Color
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 1, 
                          mr: 2,
                          border: '1px solid #ddd',
                          bgcolor: primaryColor,
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          const colorInput = document.getElementById('primary-color-input');
                          if (colorInput) colorInput.click();
                        }}
                      />
                      <TextField
                        size="small"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        sx={{ width: 120, mr: 1 }}
                      />
                      <input
                        id="primary-color-input"
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        style={{ 
                          width: 0, 
                          height: 0, 
                          padding: 0, 
                          border: 'none',
                          visibility: 'hidden' 
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Secondary Color
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 1, 
                          mr: 2,
                          border: '1px solid #ddd',
                          bgcolor: secondaryColor,
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          const colorInput = document.getElementById('secondary-color-input');
                          if (colorInput) colorInput.click();
                        }}
                      />
                      <TextField
                        size="small"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        sx={{ width: 120, mr: 1 }}
                      />
                      <input
                        id="secondary-color-input"
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        style={{ 
                          width: 0, 
                          height: 0, 
                          padding: 0, 
                          border: 'none',
                          visibility: 'hidden' 
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FormatColorTextIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">Typography & Tone</Typography>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Font Family
              </Typography>
              <TextField
                select
                fullWidth
                value={analysisResult?.fonts?.primary || 'Roboto'}
                size="small"
                sx={{ mb: 3 }}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Source Sans Pro">Source Sans Pro</option>
              </TextField>
              
              <Typography variant="subtitle2" gutterBottom>
                Content Tone
              </Typography>
              <Box sx={{ mb: 2 }}>
                {contentTone.split(',').filter(tone => tone.trim()).map((tone, index) => (
                  <Chip 
                    key={index}
                    label={tone.trim()}
                    onDelete={() => {
                      const tones = contentTone.split(',').filter(t => t.trim());
                      tones.splice(index, 1);
                      setContentTone(tones.join(', '));
                    }}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
              <TextField
                fullWidth
                value={contentTone}
                onChange={(e) => setContentTone(e.target.value)}
                size="small"
                placeholder="e.g., Professional, Friendly, Authoritative"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    if (contentTone) {
                      setContentTone(contentTone + ', ' + e.currentTarget.value);
                    } else {
                      setContentTone(e.currentTarget.value);
                    }
                    e.currentTarget.value = '';
                    e.preventDefault();
                  }
                }}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AltRouteIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">Brand Preview</Typography>
              </Box>
              
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                bgcolor: 'background.default',
                border: '1px solid #ddd',
              }}>
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: primaryColor,
                    color: '#fff',
                    borderRadius: '4px 4px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Box 
                    component="img"
                    src={logo || 'https://placehold.co/40x40?text=Logo'}
                    sx={{ 
                      width: 30, 
                      height: 30,
                      mr: 2,
                      borderRadius: '50%',
                      bgcolor: '#fff',
                      objectFit: 'contain',
                      p: logo ? 0 : 0.5,
                    }}
                  />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {brandName}
                  </Typography>
                </Box>
                
                <Box sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2" paragraph>
                    {brandDescription || 'Company description will appear here.'}
                  </Typography>
                  
                  <Button 
                    size="small" 
                    variant="contained"
                    sx={{ 
                      bgcolor: secondaryColor,
                      '&:hover': {
                        bgcolor: secondaryColor,
                        opacity: 0.9,
                      }
                    }}
                  >
                    Learn More
                  </Button>
                </Box>
                
                <Divider />
                
                <Box sx={{ p: 2 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      color: primaryColor,
                      mb: 1 
                    }}
                  >
                    Latest Content
                  </Typography>
                  
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 1, 
                    bgcolor: '#f5f5f5', 
                    mb: 1 
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      Sample article title would go here
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      This is how your content preview would appear with the selected styles.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button onClick={handleBack}>
            Back
          </Button>
          <Button 
            variant="contained" 
            onClick={handleNext}
          >
            Continue
          </Button>
        </Box>
      </Box>
    );
  };
  
  // Render the content strategy step
  const renderContentStrategyStep = () => {
    return (
      <Box>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Content Strategy
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Based on your website, we've generated these content recommendations.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">Target Audience</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                {targetAudience.map((audience, index) => (
                  <Chip 
                    key={index}
                    label={audience}
                    onDelete={() => {
                      setTargetAudience(targetAudience.filter((_, i) => i !== index));
                    }}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
              
              <TextField
                fullWidth
                size="small"
                placeholder="Add audience segment (press Enter)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    setTargetAudience([...targetAudience, e.currentTarget.value]);
                    e.currentTarget.value = '';
                    e.preventDefault();
                  }
                }}
              />
              <Button 
                size="small" 
                sx={{ mt: 1 }}
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Add audience segment (press Enter)"]') as HTMLInputElement;
                  if (input && input.value) {
                    setTargetAudience([...targetAudience, input.value]);
                    input.value = '';
                  }
                }}
              >
                Add Audience
              </Button>
            </Paper>
            
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TagIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">Recommended Hashtags</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                {hashtags.map((tag, index) => (
                  <Chip 
                    key={index}
                    label={tag}
                    onDelete={() => {
                      setHashtags(hashtags.filter((_, i) => i !== index));
                    }}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
              
              <TextField
                fullWidth
                size="small"
                placeholder="Add hashtag (press Enter)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    setHashtags([...hashtags, e.currentTarget.value]);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </Paper>
            
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">Posting Schedule</Typography>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Recommended Frequency
              </Typography>
              <TextField
                select
                fullWidth
                value={schedule.frequency}
                onChange={(e) => setSchedule({...schedule, frequency: e.target.value})}
                size="small"
                sx={{ mb: 3 }}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Bi-weekly">Bi-weekly</option>
                <option value="Monthly">Monthly</option>
              </TextField>
              
              <Typography variant="subtitle2" gutterBottom>
                Best Times to Post
              </Typography>
              <Box sx={{ mb: 1 }}>
                {schedule.bestTimes.map((time, index) => (
                  <Chip 
                    key={index}
                    label={time}
                    onDelete={() => {
                      setSchedule({
                        ...schedule,
                        bestTimes: schedule.bestTimes.filter((_, i) => i !== index)
                      });
                    }}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <TextField
                  size="small"
                  placeholder="Add custom time (e.g., Monday 3:00 PM)"
                  fullWidth
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      setSchedule({
                        ...schedule,
                        bestTimes: [...schedule.bestTimes, e.currentTarget.value]
                      });
                      e.currentTarget.value = '';
                      e.preventDefault();
                    }
                  }}
                />
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Add custom time (e.g., Monday 3:00 PM)"]') as HTMLInputElement;
                    if (input && input.value) {
                      setSchedule({
                        ...schedule,
                        bestTimes: [...schedule.bestTimes, input.value]
                      });
                      input.value = '';
                    }
                  }}
                >
                  Add
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ContentCopyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">Content Types</Typography>
              </Box>
              
              <Grid container spacing={2}>
                {contentTypes.map((type, index) => (
                  <Grid item xs={6} key={index}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={true}
                          onChange={() => {
                            const updatedTypes = [...contentTypes];
                            updatedTypes.splice(index, 1);
                            setContentTypes(updatedTypes);
                          }}
                        />
                      }
                      label={type}
                    />
                  </Grid>
                ))}
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add content type (press Enter)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      setContentTypes([...contentTypes, e.currentTarget.value]);
                      e.currentTarget.value = '';
                      e.preventDefault();
                    }
                  }}
                />
                <Button 
                  size="small" 
                  sx={{ mt: 1 }}
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Add content type (press Enter)"]') as HTMLInputElement;
                    if (input && input.value) {
                      setContentTypes([...contentTypes, input.value]);
                      input.value = '';
                    }
                  }}
                >
                  Add Content Type
                </Button>
              </Box>
            </Paper>
            
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BarChartIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">Topic Suggestions</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                {suggestedTopics.map((topic, index) => (
                  <Chip 
                    key={index}
                    label={topic}
                    onDelete={() => {
                      setSuggestedTopics(suggestedTopics.filter((_, i) => i !== index));
                    }}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
              
              <TextField
                fullWidth
                size="small"
                placeholder="Add topic (press Enter)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    setSuggestedTopics([...suggestedTopics, e.currentTarget.value]);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </Paper>
            
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FlagIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">Marketing Goals</Typography>
              </Box>
              
              <Grid container spacing={2}>
                {marketingGoals.map((goal, index) => (
                  <Grid item xs={12} key={index}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={true}
                          onChange={() => {
                            const updatedGoals = [...marketingGoals];
                            updatedGoals.splice(index, 1);
                            setMarketingGoals(updatedGoals);
                          }}
                        />
                      }
                      label={goal}
                    />
                  </Grid>
                ))}
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add a marketing goal (press Enter)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      setMarketingGoals([...marketingGoals, e.currentTarget.value]);
                      e.currentTarget.value = '';
                      e.preventDefault();
                    }
                  }}
                />
                <Button 
                  size="small" 
                  sx={{ mt: 1 }}
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Add a marketing goal (press Enter)"]') as HTMLInputElement;
                    if (input && input.value) {
                      setMarketingGoals([...marketingGoals, input.value]);
                      input.value = '';
                    }
                  }}
                >
                  Add Goal
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button onClick={handleBack}>
            Back
          </Button>
          <Button 
            variant="contained" 
            onClick={handleNext}
          >
            Review & Confirm
          </Button>
        </Box>
      </Box>
    );
  };
  
  // Render the confirmation step
  const renderConfirmationStep = () => {
    return (
      <Box>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Review & Confirm
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Here's a summary of your brand setup. Review the details and make any final adjustments before confirming.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Company Profile</Typography>
                <IconButton size="small" onClick={() => setActiveStep(1)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {logo ? (
                  <Avatar 
                    src={logo} 
                    sx={{ width: 60, height: 60, mr: 2 }}
                  />
                ) : (
                  <Avatar 
                    sx={{ width: 60, height: 60, mr: 2 }}
                  >
                    {brandName.slice(0, 2).toUpperCase()}
                  </Avatar>
                )}
                
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {brandName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {industry}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" paragraph>
                {brandDescription}
              </Typography>
              
              <Typography variant="body2">
                <strong>Website:</strong> {url}
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Brand Identity</Typography>
                <IconButton size="small" onClick={() => setActiveStep(2)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Color Palette
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Box sx={{ 
                  width: 80, 
                  height: 30, 
                  bgcolor: primaryColor,
                  borderRadius: 1,
                  boxShadow: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#fff',
                  fontSize: '0.75rem',
                }}>
                  Primary
                </Box>
                <Box sx={{ 
                  width: 80, 
                  height: 30, 
                  bgcolor: secondaryColor,
                  borderRadius: 1,
                  boxShadow: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#fff',
                  fontSize: '0.75rem',
                }}>
                  Secondary
                </Box>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Typography & Tone
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Font:</strong> {analysisResult?.fonts?.primary || 'Roboto'}
              </Typography>
              <Typography variant="body2">
                <strong>Content Tone:</strong> {contentTone}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Content Strategy</Typography>
                <IconButton size="small" onClick={() => setActiveStep(3)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Target Audience
              </Typography>
              <Box sx={{ mb: 2 }}>
                {targetAudience.slice(0, 3).map((audience, index) => (
                  <Chip 
                    key={index}
                    label={audience}
                    size="small"
                    sx={{ m: 0.5 }}
                  />
                ))}
                {targetAudience.length > 3 && (
                  <Chip 
                    label={`+${targetAudience.length - 3} more`}
                    size="small"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                )}
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Content Types
              </Typography>
              <Box sx={{ mb: 2 }}>
                {contentTypes.slice(0, 3).map((type, index) => (
                  <Chip 
                    key={index}
                    label={type}
                    size="small"
                    sx={{ m: 0.5 }}
                  />
                ))}
                {contentTypes.length > 3 && (
                  <Chip 
                    label={`+${contentTypes.length - 3} more`}
                    size="small"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                )}
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Posting Schedule
              </Typography>
              <Typography variant="body2">
                <strong>Frequency:</strong> {schedule.frequency}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Best Times:</strong> {schedule.bestTimes.join(', ')}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Key Topics
              </Typography>
              <Box>
                {suggestedTopics.slice(0, 3).map((topic, index) => (
                  <Chip 
                    key={index}
                    label={topic}
                    size="small"
                    sx={{ m: 0.5 }}
                  />
                ))}
                {suggestedTopics.length > 3 && (
                  <Chip 
                    label={`+${suggestedTopics.length - 3} more`}
                    size="small"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                )}
              </Box>
            </Paper>
            
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Social Media</Typography>
                <IconButton size="small" onClick={() => setActiveStep(1)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Box>
                {socialMediaAccounts.map((account, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    {account.platform === 'Twitter' && <TwitterIcon sx={{ mr: 1.5, color: '#1DA1F2' }} fontSize="small" />}
                    {account.platform === 'Facebook' && <FacebookIcon sx={{ mr: 1.5, color: '#4267B2' }} fontSize="small" />}
                    {account.platform === 'Instagram' && <InstagramIcon sx={{ mr: 1.5, color: '#C13584' }} fontSize="small" />}
                    {account.platform === 'LinkedIn' && <LinkedInIcon sx={{ mr: 1.5, color: '#0077B5' }} fontSize="small" />}
                    {account.platform === 'Pinterest' && <PinterestIcon sx={{ mr: 1.5, color: '#E60023' }} fontSize="small" />}
                    {account.platform === 'YouTube' && <YouTubeIcon sx={{ mr: 1.5, color: '#FF0000' }} fontSize="small" />}
                    {account.platform === 'TikTok' && <Domain sx={{ mr: 1.5 }} fontSize="small" />}
                    <Typography variant="body2">{account.url}</Typography>
                  </Box>
                ))}
                
                {socialMediaAccounts.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No social media accounts detected
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 4,
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          <Button onClick={handleBack}>
            Back
          </Button>
          
          <Box>
            <Button
              variant="contained" 
              size="large"
              onClick={handleCreateBrand}
              startIcon={<CheckIcon />}
              disabled={createBrand.isLoading}
            >
              {createBrand.isLoading ? 'Creating...' : 'Create Brand'}
            </Button>
            {createBrand.isError && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                Error: {(createBrand.error as Error).message}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    );
  };
  
  // Render content based on active step
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderWebsiteAnalysisStep();
      case 1:
        return renderCompanyInfoStep();
      case 2:
        return renderBrandSettingsStep();
      case 3:
        return renderContentStrategyStep();
      case 4:
        return renderConfirmationStep();
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Stepper 
          activeStep={activeStep} 
          alternativeLabel
          sx={{ mb: 5 }}
        >
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel 
                onClick={() => index <= activeStep && setActiveStep(index)}
                sx={{ 
                  cursor: index <= activeStep ? 'pointer' : 'default',
                  '&:hover': { 
                    textDecoration: index <= activeStep ? 'underline' : 'none' 
                  }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {getStepContent(activeStep)}
      </Box>
    </ErrorBoundary>
  );
};

export default BrandNew;