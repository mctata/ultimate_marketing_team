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
  FormControl,
  Select,
  MenuItem,
  Switch,
  Modal,
  Fade,
  Backdrop,
} from '@mui/material';
import ReactConfetti from 'react-confetti';
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
  Close as CloseIcon,
  PlayArrow as PlayArrowIcon,
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
  'Confirmation',
  'Success & Next Steps'
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
  const [schedule, setSchedule] = useState<{frequency: string; customFrequency?: string; bestTimes: string[]; customTime: string}>({
    frequency: '',
    customFrequency: '',
    bestTimes: [],
    customTime: ''
  });
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [marketingGoals, setMarketingGoals] = useState<string[]>([]);
  
  // State for tracking the created brand
  const [createdBrandId, setCreatedBrandId] = useState<string>('');
  
  // Input fields state
  const [targetAudienceInput, setTargetAudienceInput] = useState<string>('');
  const [hashtagInput, setHashtagInput] = useState<string>('');
  const [topicInput, setTopicInput] = useState<string>('');
  const [marketingGoalInput, setMarketingGoalInput] = useState<string>('');
  const [customGoalInput, setCustomGoalInput] = useState<string>(''); // Separate state for marketing goals
  
  // Modal & confetti state
  const [openSuccessModal, setOpenSuccessModal] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [activePlatformPreview, setActivePlatformPreview] = useState<string>('Instagram');
  
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
  
  // Check for saved form data on component mount
  useEffect(() => {
    try {
      // Check if there was a previous error during form submission
      const hasError = localStorage.getItem('brandFormError') === 'true';
      
      if (hasError) {
        // Try to recover form data
        const savedData = localStorage.getItem('lastBrandFormData');
        if (savedData) {
          const formData = JSON.parse(savedData);
          
          // Inform user of recovery
          setAnalyzeError("Your previous form data has been recovered due to a submission error");
          
          // Populate form fields
          setBrandName(formData.name || '');
          setBrandDescription(formData.description || '');
          setIndustry(formData.industry || '');
          setUrl(formData.website || '');
          setLogo(formData.logo || '');
          setPrimaryColor(formData.primaryColor || '');
          setSecondaryColor(formData.secondaryColor || '');
          setContentTone(formData.contentTone || '');
          setTargetAudience(formData.targetAudience || []);
          setSocialMediaAccounts(formData.socialMediaAccounts || []);
          setSuggestedTopics(formData.suggestedTopics || []);
          setContentTypes(formData.recommendedContentTypes || []);
          setSchedule({
            frequency: formData.postingFrequency || '',
            customFrequency: formData.postingFrequency === 'Custom' ? formData.postingFrequency : '',
            bestTimes: formData.postingTimes || [],
            customTime: ''
          });
          setMarketingGoals(formData.marketingGoals || []);
          setHashtags(formData.hashtags || []);
          
          // Start at the company info step
          setActiveStep(1);
        }
      }
    } catch (error) {
      console.warn('Error recovering saved form data:', error);
    }
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
  
  // Form validation
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Validate form fields
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Required fields validation
    if (!brandName.trim()) errors.brandName = "Brand name is required";
    if (!industry.trim()) errors.industry = "Industry is required";
    if (!brandDescription.trim()) errors.brandDescription = "Description is required";
    
    // Content strategy validation
    if (contentTypes.length === 0) errors.contentTypes = "At least one content type must be selected";
    if (marketingGoals.length === 0) errors.marketingGoals = "At least one marketing goal must be selected";
    if (schedule.frequency === 'Custom' && !schedule.customFrequency) {
      errors.customFrequency = "Custom frequency description is required";
    }
    if (schedule.bestTimes.length === 0) {
      errors.bestTimes = "At least one posting time must be selected";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission to create brand
  const handleCreateBrand = () => {
    // Validate form before submission
    if (!validateForm()) {
      // Show error message
      setAnalyzeError("Please correct the form errors before submitting");
      return;
    }
    
    // Get the actual frequency to use
    const actualFrequency = schedule.frequency === 'Custom' && schedule.customFrequency 
      ? schedule.customFrequency 
      : schedule.frequency;
      
    // Prepare data for submission
    const brandData = {
      name: brandName.trim(),
      description: brandDescription.trim(),
      industry: industry.trim(),
      website: url,
      logo: logo,
      active: true,
      primaryColor: primaryColor || '#000000',
      secondaryColor: secondaryColor || '#ffffff',
      contentTone: contentTone,
      targetAudience: targetAudience,
      socialMediaAccounts: socialMediaAccounts,
      suggestedTopics: suggestedTopics,
      recommendedContentTypes: contentTypes,
      postingFrequency: actualFrequency,
      postingTimes: schedule.bestTimes,
      marketingGoals: marketingGoals,
      hashtags: hashtags
    };
    
    // Log the data being sent
    console.log('Creating brand with data:', brandData);
    
    // Attempt to save to localStorage for persistence
    try {
      // Generate a unique ID if not provided by the API
      const brandId = Date.now().toString();
      const brandWithId = {...brandData, id: brandId, createdAt: new Date().toISOString()};
      
      // Save to localStorage for persistence
      const existingBrands = JSON.parse(localStorage.getItem('brands') || '[]');
      localStorage.setItem('brands', JSON.stringify([...existingBrands, brandWithId]));
      
      // Also save form data in case of later error
      localStorage.setItem('lastBrandFormData', JSON.stringify(brandWithId));
      
      // Remove any error flags
      localStorage.removeItem('brandFormError');
      
      console.log('Brand data saved to localStorage for persistence');
    } catch (error) {
      console.warn('Failed to store brand data in localStorage:', error);
      // Mark error for recovery
      localStorage.setItem('brandFormError', 'true');
    }
    
    // Submit to API
    createBrand.mutate(brandData, {
      onSuccess: (data) => {
        // Store the created brand ID for reference
        setCreatedBrandId(data.id);
        
        // Start confetti and open modal
        setShowConfetti(true);
        setOpenSuccessModal(true);
        
        // Move to success screen (step 5)
        setActiveStep(5);
      },
      onError: (error) => {
        console.error('Error creating brand:', error);
        
        // Set error flag in localStorage to enable recovery on page reload
        localStorage.setItem('brandFormError', 'true');
        
        // Check form validation again
        if (!validateForm()) {
          // Show specific validation message
          setAnalyzeError(
            "Please check all required fields. We found some issues that need to be fixed before creating your brand."
          );
        } else {
          // Show general error message
          setAnalyzeError(
            "Failed to create brand. Your data has been saved locally. " +
            "You can try again or reload the page to recover your information."
          );
        }
        
        // Scroll to top to show error
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
              helperText={!isValidUrl && url ? "Please enter a valid URL (e.g., https://example.com)" : "Press Enter to analyze"}
              error={!isValidUrl && url.length > 0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isValidUrl) {
                  handleAnalyzeWebsite();
                  e.preventDefault();
                }
              }}
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
        
        {analyzeError && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setAnalyzeError(null)}
          >
            {analyzeError}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Company Name"
              variant="outlined"
              value={brandName}
              onChange={(e) => {
                setBrandName(e.target.value);
                if (formErrors.brandName) {
                  setFormErrors({...formErrors, brandName: ''});
                }
              }}
              required
              error={!!formErrors.brandName}
              helperText={formErrors.brandName}
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              label="Company Description"
              variant="outlined"
              value={brandDescription}
              onChange={(e) => {
                setBrandDescription(e.target.value);
                if (formErrors.brandDescription) {
                  setFormErrors({...formErrors, brandDescription: ''});
                }
              }}
              required
              multiline
              rows={4}
              error={!!formErrors.brandDescription}
              helperText={formErrors.brandDescription}
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              label="Industry"
              variant="outlined"
              value={industry}
              onChange={(e) => {
                setIndustry(e.target.value);
                if (formErrors.industry) {
                  setFormErrors({...formErrors, industry: ''});
                }
              }}
              required
              error={!!formErrors.industry}
              helperText={formErrors.industry}
              sx={{ mb: 3 }}
            />
            
            <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
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
                    InputProps={{
                      endAdornment: analysisResult?.contactInfo?.email && (
                        <>
                          <IconButton 
                            size="small" 
                            href={`mailto:${analysisResult.contactInfo.email}`}
                            target="_blank"
                          >
                            <ArrowForwardIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={() => {
                              if (analysisResult) {
                                setAnalysisResult({
                                  ...analysisResult,
                                  contactInfo: {
                                    ...analysisResult.contactInfo,
                                    email: ''
                                  }
                                });
                              }
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </>
                      )
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
                    InputProps={{
                      endAdornment: analysisResult?.contactInfo?.phone && (
                        <>
                          <IconButton 
                            size="small" 
                            href={`tel:${analysisResult.contactInfo.phone}`}
                            target="_blank"
                          >
                            <ArrowForwardIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={() => {
                              if (analysisResult) {
                                setAnalysisResult({
                                  ...analysisResult,
                                  contactInfo: {
                                    ...analysisResult.contactInfo,
                                    phone: ''
                                  }
                                });
                              }
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </>
                      )
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
                    InputProps={{
                      endAdornment: url && (
                        <>
                          <IconButton 
                            size="small" 
                            href={url.startsWith('http') ? url : `https://${url}`}
                            target="_blank"
                          >
                            <ArrowForwardIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => setUrl('')}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </>
                      )
                    }}
                  />
                </Box>
              </Box>
            </Paper>
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
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                border: '2px dashed #ccc',
                '&:hover': {
                  bgcolor: 'grey.200',
                  '& .upload-overlay': {
                    opacity: 1
                  }
                }
              }}
              component="label"
              >
                {logo ? (
                  <>
                    <img 
                      src={logo} 
                      alt="Company Logo" 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                    <Box 
                      className="upload-overlay"
                      sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        backgroundColor: 'rgba(0,0,0,0.5)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s ease'
                      }}
                    >
                      <EditIcon sx={{ color: 'white', fontSize: '2rem' }} />
                    </Box>
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      No logo detected
                    </Typography>
                    <EditIcon sx={{ color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Click to upload a logo
                    </Typography>
                  </Box>
                )}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">Social Media Accounts</Typography>
                {!socialMediaAccounts.length && (
                  <Button 
                    size="small" 
                    onClick={() => {
                      setSocialMediaAccounts([
                        { platform: 'Facebook', url: '' }
                      ]);
                    }}
                  >
                    Add
                  </Button>
                )}
              </Box>
              
              {socialMediaAccounts.length > 0 ? (
                <Box>
                  {socialMediaAccounts.map((account, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      {/* Social media icon */}
                      {account.platform === 'Twitter' && <TwitterIcon sx={{ mr: 1, color: '#1DA1F2' }} fontSize="small" />}
                      {account.platform === 'Facebook' && <FacebookIcon sx={{ mr: 1, color: '#4267B2' }} fontSize="small" />}
                      {account.platform === 'Instagram' && <InstagramIcon sx={{ mr: 1, color: '#C13584' }} fontSize="small" />}
                      {account.platform === 'LinkedIn' && <LinkedInIcon sx={{ mr: 1, color: '#0077B5' }} fontSize="small" />}
                      {account.platform === 'Pinterest' && <PinterestIcon sx={{ mr: 1, color: '#E60023' }} fontSize="small" />}
                      {account.platform === 'YouTube' && <YouTubeIcon sx={{ mr: 1, color: '#FF0000' }} fontSize="small" />}
                      {account.platform === 'TikTok' && <DomainIcon sx={{ mr: 1, color: '#000000' }} fontSize="small" />}
                      
                      <Box sx={{ ml: 1, flexGrow: 1 }}>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder={`${account.platform} URL`}
                          value={account.url}
                          onChange={(e) => {
                            const updatedAccounts = [...socialMediaAccounts];
                            updatedAccounts[index].url = e.target.value;
                            setSocialMediaAccounts(updatedAccounts);
                          }}
                          InputProps={{
                            endAdornment: (
                              <>
                                {account.url && (
                                  <IconButton 
                                    size="small"
                                    href={account.url.startsWith('http') ? account.url : `https://${account.url}`}
                                    target="_blank"
                                  >
                                    <ArrowForwardIcon fontSize="small" />
                                  </IconButton>
                                )}
                                <IconButton 
                                  size="small"
                                  onClick={() => {
                                    // Remove this account
                                    const updatedAccounts = [...socialMediaAccounts];
                                    updatedAccounts.splice(index, 1);
                                    setSocialMediaAccounts(updatedAccounts);
                                  }}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </>
                            )
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                  
                  <Box sx={{ mt: 2 }}>
                    <Button
                      size="small"
                      onClick={() => {
                        // Find social platforms not yet added
                        const availablePlatforms = ['Facebook', 'Twitter', 'Instagram', 'LinkedIn', 'Pinterest', 'YouTube', 'TikTok'];
                        const usedPlatforms = socialMediaAccounts.map(acc => acc.platform);
                        const unusedPlatforms = availablePlatforms.filter(p => !usedPlatforms.includes(p));
                        
                        // Use first available platform or default to Facebook
                        const nextPlatform = unusedPlatforms.length > 0 ? unusedPlatforms[0] : 'Facebook';
                        
                        setSocialMediaAccounts([
                          ...socialMediaAccounts,
                          { platform: nextPlatform, url: '' }
                        ]);
                      }}
                    >
                      Add Another Account
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No social media accounts detected
                </Typography>
              )}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 1, 
                          mr: 2,
                          border: '1px solid #ddd',
                          bgcolor: primaryColor,
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.1)'
                          }
                        }}
                        onClick={(e) => {
                          const colorInput = document.getElementById('primary-color-input');
                          if (colorInput) {
                            colorInput.click();
                          }
                        }}
                      />
                      <TextField
                        size="small"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        sx={{ width: 120, mr: 1 }}
                      />
                      <Box sx={{ position: 'relative', width: 25, height: 25, ml: 1 }}>
                        <input
                          id="primary-color-input"
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          style={{ 
                            opacity: 0,
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                            cursor: 'pointer'
                          }}
                        />
                        <Box 
                          sx={{ 
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none'
                          }}
                        >
                          <PaletteIcon fontSize="small" />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Secondary Color
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 1, 
                          mr: 2,
                          border: '1px solid #ddd',
                          bgcolor: secondaryColor,
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.1)'
                          }
                        }}
                        onClick={(e) => {
                          const colorInput = document.getElementById('secondary-color-input');
                          if (colorInput) {
                            colorInput.click();
                          }
                        }}
                      />
                      <TextField
                        size="small"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        sx={{ width: 120, mr: 1 }}
                      />
                      <Box sx={{ position: 'relative', width: 25, height: 25, ml: 1 }}>
                        <input
                          id="secondary-color-input"
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          style={{ 
                            opacity: 0,
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                            cursor: 'pointer'
                          }}
                        />
                        <Box 
                          sx={{ 
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none'
                          }}
                        >
                          <PaletteIcon fontSize="small" />
                        </Box>
                      </Box>
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
              <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                <Select
                  value={analysisResult?.fonts?.primary || 'Roboto'}
                  onChange={(e) => {
                    if (analysisResult) {
                      setAnalysisResult({
                        ...analysisResult,
                        fonts: {
                          ...analysisResult.fonts,
                          primary: e.target.value
                        }
                      });
                    }
                  }}
                >
                  <MenuItem value="Roboto">Roboto</MenuItem>
                  <MenuItem value="Open Sans">Open Sans</MenuItem>
                  <MenuItem value="Lato">Lato</MenuItem>
                  <MenuItem value="Montserrat">Montserrat</MenuItem>
                  <MenuItem value="Source Sans Pro">Source Sans Pro</MenuItem>
                </Select>
              </FormControl>
              
              <Typography variant="h6" gutterBottom>
                Content Tone
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select the writing style for your brand's AI-generated content
              </Typography>
              <Box sx={{ mb: 2 }}>
                {contentTone && contentTone.split(',').filter(tone => tone.trim()).map((tone, index) => (
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
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Select tone examples or enter your own:
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {['Professional', 'Analytical', 'Friendly', 'Authoritative', 'Casual', 'Technical', 'Inspirational', 'Humorous'].map(
                  (toneExample) => {
                    // Check if the tone is actually in the list, not just a substring
                    const currentTones = contentTone ? contentTone.split(',').map(t => t.trim()) : [];
                    const isSelected = currentTones.includes(toneExample);
                    
                    return (
                      <Chip
                        key={toneExample}
                        label={toneExample}
                        onClick={() => {
                          if (!isSelected) {
                            const newTones = [...currentTones, toneExample];
                            setContentTone(newTones.join(', '));
                          }
                        }}
                        variant={isSelected ? "filled" : "outlined"}
                        color={isSelected ? "primary" : "default"}
                        size="small"
                      />
                    );
                  }
                )}
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Add custom tone (press Enter)"
                  size="small"
                  value={topicInput} // Reuse topicInput state for simplicity
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && topicInput.trim()) {
                      const customTone = topicInput.trim();
                      if (customTone) {
                        // Get current tones as array
                        const currentTones = contentTone ? contentTone.split(',').map(t => t.trim()) : [];
                        // Add new tone if not already present
                        if (!currentTones.includes(customTone)) {
                          const newTones = [...currentTones, customTone];
                          setContentTone(newTones.join(', '));
                        }
                        setTopicInput(''); // Clear input
                        e.preventDefault();
                      }
                    }
                  }}
                />
                <Button 
                  variant="contained"
                  size="small"
                  disabled={!topicInput.trim()}
                  onClick={() => {
                    const customTone = topicInput.trim();
                    if (customTone) {
                      // Get current tones as array
                      const currentTones = contentTone ? contentTone.split(',').map(t => t.trim()) : [];
                      // Add new tone if not already present
                      if (!currentTones.includes(customTone)) {
                        const newTones = [...currentTones, customTone];
                        setContentTone(newTones.join(', '));
                      }
                      setTopicInput(''); // Clear input
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
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  id="audience-input"
                  size="small"
                  placeholder="Add audience segment"
                  value={targetAudienceInput}
                  onChange={(e) => setTargetAudienceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && targetAudienceInput.trim() !== '') {
                      setTargetAudience([...targetAudience, targetAudienceInput.trim()]);
                      setTargetAudienceInput('');
                      e.preventDefault();
                    }
                  }}
                />
                <Button 
                  variant="contained"
                  size="small"
                  disabled={targetAudienceInput.trim() === ''}
                  onClick={() => {
                    if (targetAudienceInput.trim() !== '') {
                      setTargetAudience([...targetAudience, targetAudienceInput.trim()]);
                      setTargetAudienceInput('');
                    }
                  }}
                >
                  Add
                </Button>
              </Box>
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
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  id="hashtag-input"
                  size="small"
                  placeholder="Add hashtag"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && hashtagInput.trim() !== '') {
                      const tag = hashtagInput.trim().startsWith('#') ? hashtagInput.trim() : `#${hashtagInput.trim()}`;
                      setHashtags([...hashtags, tag]);
                      setHashtagInput('');
                      e.preventDefault();
                    }
                  }}
                />
                <Button 
                  variant="contained"
                  size="small"
                  disabled={hashtagInput.trim() === ''}
                  onClick={() => {
                    if (hashtagInput.trim() !== '') {
                      const tag = hashtagInput.trim().startsWith('#') ? hashtagInput.trim() : `#${hashtagInput.trim()}`;
                      setHashtags([...hashtags, tag]);
                      setHashtagInput('');
                    }
                  }}
                >
                  Add
                </Button>
              </Box>
            </Paper>
            
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">Posting Schedule</Typography>
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Recommended Posting Frequency
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Based on your industry and {socialMediaAccounts.length > 0 ? 
                  `${socialMediaAccounts.map(sm => sm.platform).join(', ')} accounts` : 
                  'social media'}, we recommend the following posting frequency.
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
                Best Times to Post {formErrors.bestTimes && 
                  <Typography component="span" color="error" variant="caption">
                    ({formErrors.bestTimes})
                  </Typography>
                }
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                All times shown in your local timezone (EST). Best times are when your audience is most active.
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
              
              {/* Predefined times */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {['Monday 9:00 AM', 'Tuesday 12:00 PM', 'Wednesday 3:00 PM', 'Thursday 5:00 PM', 'Friday 10:00 AM'].map(
                  (timeOption) => (
                    <Chip
                      key={timeOption}
                      label={timeOption}
                      onClick={() => {
                        if (!schedule.bestTimes.includes(timeOption)) {
                          setSchedule({
                            ...schedule,
                            bestTimes: [...schedule.bestTimes, timeOption]
                          });
                        }
                      }}
                      variant={schedule.bestTimes.includes(timeOption) ? "filled" : "outlined"}
                      color={schedule.bestTimes.includes(timeOption) ? "primary" : "default"}
                      size="small"
                    />
                  )
                )}
              </Box>
              
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ContentCopyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">
                  Content Types
                  {formErrors.contentTypes && 
                    <Typography component="span" color="error" variant="caption" sx={{ ml: 1 }}>
                      ({formErrors.contentTypes})
                    </Typography>
                  }
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                {/* Default content types that are always shown */}
                {[
                  'Blog Posts',
                  'Social Media Content',
                  'Email Newsletters', 
                  'Infographics',
                  'Video Content',
                  'Case Studies',
                  'Landing Pages',
                  'Whitepapers',
                  'Ebooks',
                  'Product Descriptions'
                ].map((type) => (
                  <Grid item xs={6} key={type}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={contentTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Add to content types
                              setContentTypes([...contentTypes, type]);
                            } else {
                              // Remove from content types
                              setContentTypes(contentTypes.filter(t => t !== type));
                            }
                          }}
                        />
                      }
                      label={type}
                    />
                  </Grid>
                ))}
              </Grid>
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
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  id="topic-input"
                  size="small"
                  placeholder="Add topic"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && topicInput.trim() !== '') {
                      setSuggestedTopics([...suggestedTopics, topicInput.trim()]);
                      setTopicInput('');
                      e.preventDefault();
                    }
                  }}
                />
                <Button 
                  variant="contained"
                  size="small"
                  disabled={topicInput.trim() === ''}
                  onClick={() => {
                    if (topicInput.trim() !== '') {
                      setSuggestedTopics([...suggestedTopics, topicInput.trim()]);
                      setTopicInput('');
                    }
                  }}
                >
                  Add
                </Button>
              </Box>
            </Paper>
            
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FlagIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h6">
                  Marketing Goals
                  {formErrors.marketingGoals && 
                    <Typography component="span" color="error" variant="caption" sx={{ ml: 1 }}>
                      ({formErrors.marketingGoals})
                    </Typography>
                  }
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                {[
                  'Increase Brand Awareness',
                  'Generate Quality Leads',
                  'Improve Customer Engagement',
                  'Boost Website Traffic',
                  'Increase Social Media Following',
                  'Drive Conversions and Sales'
                ].map((goal) => (
                  <Grid item xs={12} key={goal}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={marketingGoals.includes(goal)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Add to marketing goals
                              setMarketingGoals([...marketingGoals, goal]);
                            } else {
                              // Remove from marketing goals
                              setMarketingGoals(marketingGoals.filter(g => g !== goal));
                            }
                          }}
                        />
                      }
                      label={goal}
                    />
                  </Grid>
                ))}
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Custom Marketing Goals
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {marketingGoals.filter(goal => 
                    !['Increase Brand Awareness', 'Generate Quality Leads', 'Improve Customer Engagement', 
                     'Boost Website Traffic', 'Increase Social Media Following', 'Drive Conversions and Sales']
                     .includes(goal))
                     .map((goal, index) => (
                    <Chip 
                      key={index}
                      label={goal}
                      onDelete={() => {
                        setMarketingGoals(marketingGoals.filter(g => g !== goal));
                      }}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    id="marketing-goal-input"
                    size="small"
                    placeholder="Add a custom marketing goal"
                    value={customGoalInput}
                    onChange={(e) => {
                      setCustomGoalInput(e.target.value);
                      // Clear any error when user starts typing
                      if (formErrors.marketingGoals) {
                        setFormErrors({...formErrors, marketingGoals: ''});
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // Always prevent default to avoid form submission
                        const trimmedGoal = customGoalInput.trim();
                        if (trimmedGoal !== '') {
                          // Make sure we're not adding a duplicate
                          if (!marketingGoals.includes(trimmedGoal)) {
                            setMarketingGoals(prevGoals => [...prevGoals, trimmedGoal]);
                          }
                          setCustomGoalInput('');
                        }
                      }
                    }}
                  />
                  <Button 
                    variant="contained"
                    size="small"
                    disabled={customGoalInput.trim() === ''}
                    onClick={() => {
                      const trimmedGoal = customGoalInput.trim();
                      if (trimmedGoal !== '') {
                        // Make sure we're not adding a duplicate
                        if (!marketingGoals.includes(trimmedGoal)) {
                          setMarketingGoals(prevGoals => [...prevGoals, trimmedGoal]);
                          
                          // Clear any errors related to marketing goals
                          if (formErrors.marketingGoals) {
                            setFormErrors({...formErrors, marketingGoals: ''});
                          }
                        }
                        setCustomGoalInput('');
                      }
                    }}
                  >
                    Add
                  </Button>
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
              onClick={() => {
                if (validateForm()) {
                  handleCreateBrand();
                } else {
                  // Show error and return to fields with errors
                  setAnalyzeError("Please check all required fields before creating your brand.");
                  
                  // If there are content strategy errors, go to that step
                  if (formErrors.contentTypes || formErrors.marketingGoals || formErrors.bestTimes || formErrors.customFrequency) {
                    setActiveStep(3);
                  } 
                  // If there are company info errors, go to that step
                  else if (formErrors.brandName || formErrors.industry || formErrors.brandDescription) {
                    setActiveStep(1);
                  }
                  
                  // Scroll to top to show error
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
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
  
  // Render the success and next steps screen
  const renderSuccessStep = () => {
    return (
      <Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Quick-Start Content</Typography>
              </Box>
              
              <Box sx={{ mb: 3, p: 3, bgcolor: 'background.default', borderRadius: 2, border: '1px solid #eee' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="medium" sx={{ display: 'flex', alignItems: 'center' }}>
                    <ContentCopyIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                    Announcement Post
                  </Typography>
                  
                  <Chip 
                    label={industry === 'Technology' ? 'Tech' : 
                           industry === 'E-commerce' ? 'Product' : 
                           'Welcome'} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
                
                <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2 }}>
                  <Typography variant="body2" paragraph sx={{ color: primaryColor || 'inherit', fontWeight: 'medium' }}>
                    {industry === 'Technology' ? (
                      `Introducing the latest innovation from ${brandName}!`
                    ) : industry === 'E-commerce' ? (
                      `Discover our newest collection at ${brandName}`
                    ) : (
                      `Welcome to ${brandName}!`
                    )}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {industry === 'Technology' ? (
                      `We're excited to announce our newest solution designed to transform how you ${contentTypes[0] || 'work'}.`
                    ) : industry === 'E-commerce' ? (
                      `We're thrilled to unveil our latest collection featuring ${suggestedTopics[0] || 'exciting new products'}.`
                    ) : (
                      `We're delighted to welcome you to our community where we share insights about ${suggestedTopics[0] || 'our industry'}.`
                    )}
                  </Typography>
                  <Typography variant="body2">
                    {`Learn more about how ${brandName} can help you achieve ${marketingGoals[0] || 'your goals'}.`}
                  </Typography>
                </Paper>
                
                <Chip 
                  label={industry === 'Technology' ? 'Tech Announcement' : 
                         industry === 'E-commerce' ? 'Product Launch' : 
                         'Welcome Post'} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  sx={{ mt: 2 }}
                />
              </Box>
              
              <Typography variant="caption" color="text.secondary" paragraph sx={{ display: 'block', mb: 2 }}>
                This draft is tailored to your brand's style and industry. Preview how it will look on different platforms.
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {['Instagram', 'Twitter', 'LinkedIn', 'Facebook'].map((platform) => (
                      <Chip 
                        key={platform}
                        label={platform}
                        size="small"
                        color={activePlatformPreview === platform ? "primary" : "default"}
                        onClick={() => setActivePlatformPreview(platform)}
                      />
                    ))}
                  </Box>
                </Box>
                
                <Box sx={{ position: 'relative', height: 320, overflow: 'hidden', borderRadius: 2, border: '1px solid #eee' }}>
                  {/* Instagram Preview */}
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      transition: 'opacity 0.3s ease, transform 0.3s ease',
                      opacity: activePlatformPreview === 'Instagram' ? 1 : 0,
                      transform: activePlatformPreview === 'Instagram' ? 'translateX(0)' : 'translateX(-20px)',
                      pointerEvents: activePlatformPreview === 'Instagram' ? 'auto' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: '1px solid #eee' }}>
                      <Avatar sx={{ width: 36, height: 36, mr: 1.5 }} src={logo}>
                        {brandName.slice(0, 1)}
                      </Avatar>
                      <Typography variant="subtitle2">{brandName}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, bgcolor: '#fafafa', overflow: 'hidden' }}>
                      <Card sx={{ height: '100%', boxShadow: 'none', bgcolor: '#fff' }}>
                        <Box sx={{ height: 160, bgcolor: primaryColor || '#f2f2f2' }} />
                        <CardContent>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                            {`Introducing the latest innovation from ${brandName}! We're excited to announce our newest solution. #${brandName.replace(' ', '')}`}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  </Box>
                  
                  {/* Twitter Preview */}
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      transition: 'opacity 0.3s ease, transform 0.3s ease',
                      opacity: activePlatformPreview === 'Twitter' ? 1 : 0,
                      transform: activePlatformPreview === 'Twitter' ? 'translateX(0)' : 'translateX(-20px)',
                      pointerEvents: activePlatformPreview === 'Twitter' ? 'auto' : 'none',
                      p: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', mb: 2 }}>
                      <Avatar sx={{ width: 48, height: 48, mr: 2 }} src={logo}>
                        {brandName.slice(0, 1)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{brandName}</Typography>
                        <Typography variant="caption" color="text.secondary">@{brandName.toLowerCase().replace(/\s+/g, '')}</Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" paragraph>
                      {`Introducing the latest innovation from ${brandName}! We're excited to announce our newest solution designed to transform your experience. Check it out! ${hashtags[0] || '#Innovation'}`}
                    </Typography>
                  </Box>
                  
                  {/* LinkedIn Preview */}
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      transition: 'opacity 0.3s ease, transform 0.3s ease',
                      opacity: activePlatformPreview === 'LinkedIn' ? 1 : 0,
                      transform: activePlatformPreview === 'LinkedIn' ? 'translateX(0)' : 'translateX(-20px)',
                      pointerEvents: activePlatformPreview === 'LinkedIn' ? 'auto' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box sx={{ display: 'flex', p: 2, borderBottom: '1px solid #eee' }}>
                      <Avatar sx={{ width: 48, height: 48, mr: 2 }} src={logo}>
                        {brandName.slice(0, 1)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">{brandName}</Typography>
                        <Typography variant="caption" color="text.secondary">{industry} · {new Date().toLocaleDateString()}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                        Introducing the latest innovation from {brandName}!
                      </Typography>
                      <Typography variant="body2" paragraph>
                        We're excited to announce our newest solution designed to transform your experience and deliver exceptional results.
                      </Typography>
                      <Typography variant="body2">
                        {`Learn more about how ${brandName} can help you achieve ${marketingGoals[0] || 'your goals'}.`}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Facebook Preview */}
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      transition: 'opacity 0.3s ease, transform 0.3s ease',
                      opacity: activePlatformPreview === 'Facebook' ? 1 : 0,
                      transform: activePlatformPreview === 'Facebook' ? 'translateX(0)' : 'translateX(-20px)',
                      pointerEvents: activePlatformPreview === 'Facebook' ? 'auto' : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', p: 2, borderBottom: '1px solid #eee' }}>
                      <Avatar sx={{ width: 40, height: 40, mr: 1.5 }} src={logo}>
                        {brandName.slice(0, 1)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">{brandName}</Typography>
                        <Typography variant="caption" color="text.secondary">Sponsored · {new Date().toLocaleDateString()}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ height: 160, bgcolor: primaryColor || '#f2f2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
                        {brandName} {industry === 'Technology' ? 'Tech' : industry === 'E-commerce' ? 'Collection' : 'Brand'}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" paragraph>
                        {`Introducing the latest innovation from ${brandName}! We're excited to announce our newest solution designed to transform your experience. ${hashtags[0] || '#Innovation'}`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
              
              <Button 
                fullWidth
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/content/new?brandId=${createdBrandId}`)}
              >
                Edit & Schedule
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Onboarding Checklist</Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                {[
                  { label: 'Brand Setup Completed', done: true },
                  { label: 'Create First Content Piece', done: false },
                  { label: 'Connect Social Media Accounts', done: socialMediaAccounts.length > 0 },
                  { label: 'Set Up Email Campaign', done: false },
                  { label: 'Review Analytics Dashboard', done: false },
                  { label: 'Invite Team Members', done: false }
                ].map((item, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      mb: 2,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: item.done ? 'success.light' : 'background.default',
                      opacity: item.done ? 0.8 : 1
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        bgcolor: item.done ? 'success.main' : 'grey.200',
                        color: item.done ? 'white' : 'text.secondary'
                      }}
                    >
                      {item.done ? <CheckIcon fontSize="small" /> : (index + 1)}
                    </Box>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        textDecoration: item.done ? 'line-through' : 'none',
                        color: item.done ? 'text.secondary' : 'text.primary'
                      }}
                    >
                      {item.label}
                    </Typography>
                    {!item.done && (
                      <Box sx={{ flexGrow: 1, textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">
                          {index === 1 ? '2 min' : 
                           index === 2 ? '5 min' : 
                           index === 3 ? '10 min' : 
                           index === 4 ? '3 min' : '1 min'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate(`/brands/${createdBrandId}`)}
                >
                  Go to Brand Dashboard
                </Button>
              </Box>
            </Paper>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Button
                startIcon={<PlayArrowIcon />}
                onClick={() => {}}
              >
                Watch 2-minute demo video
              </Button>
            </Box>
          </Grid>
        </Grid>
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
      case 5:
        return renderSuccessStep();
      default:
        return 'Unknown step';
    }
  };
  
  // Function to get window dimensions for confetti
  const getWindowDimensions = () => {
    const { innerWidth: width, innerHeight: height } = window;
    return { width, height };
  };
  
  // Reference for rendering the confetti
  const windowSize = useRef(getWindowDimensions());
  
  return (
    <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        {showConfetti && (
          <ReactConfetti
            width={windowSize.current.width}
            height={windowSize.current.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.1}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 2000 }}
            onConfettiComplete={() => {
              setTimeout(() => setShowConfetti(false), 3000);
            }}
          />
        )}
        
        <Stepper 
          activeStep={activeStep > 4 ? 4 : activeStep} 
          alternativeLabel
          sx={{ mb: 5, display: activeStep > 5 ? 'none' : 'flex' }}
        >
          {steps.slice(0, 5).map((label, index) => (
            <Step key={label}>
              <StepLabel 
                onClick={() => index <= activeStep && activeStep < 5 && setActiveStep(index)}
                sx={{ 
                  cursor: (index <= activeStep && activeStep < 5) ? 'pointer' : 'default',
                  '&:hover': { 
                    textDecoration: (index <= activeStep && activeStep < 5) ? 'underline' : 'none' 
                  }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {getStepContent(activeStep)}
        
        {/* Success Modal */}
        <Modal
          open={openSuccessModal}
          onClose={() => setOpenSuccessModal(false)}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2100 // Higher than confetti
          }}
        >
          <Fade in={openSuccessModal}>
            <Paper
              elevation={6}
              sx={{
                padding: 4,
                borderRadius: 2,
                maxWidth: 480,
                textAlign: 'center',
                outline: 'none',
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'success.main',
                    margin: '0 auto 16px',
                  }}
                >
                  <CheckIcon sx={{ fontSize: 50 }} />
                </Avatar>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                  Congratulations!
                </Typography>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  {brandName} has been created successfully!
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Let's start creating content that resonates with your audience. We've prepared a customized marketing strategy based on your brand profile.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => setOpenSuccessModal(false)}
                >
                  Back to Setup
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate(`/brands/${createdBrandId}`)}
                >
                  Go to Brand Dashboard
                </Button>
              </Box>
            </Paper>
          </Fade>
        </Modal>
      </Box>
    </ErrorBoundary>
  );
};

export default BrandNew;