import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  TextField,
  Grid,
  Paper,
  Typography,
  MenuItem,
  Divider,
  InputAdornment,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { AppDispatch } from '../../store';
import {
  fetchAdById,
  createAd,
  updateAd,
  selectSelectedAd,
} from '../../store/slices/campaignSlice';
import { Ad } from '../../services/campaignService';
import { uploadImage } from '../../services/imageService';
import ImageUploader from '../../components/common/ImageUploader';
import AdPreview from './AdPreview';

interface AdEditorProps {
  campaignId: string;
  adSetId: string;
  adId: string | null;
  onSave: () => void;
  onCancel: () => void;
}

// Tab panel component for switching between different sections
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
      id={`ad-editor-tabpanel-${index}`}
      aria-labelledby={`ad-editor-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

// Call to action options
const callToActionOptions = [
  'Learn More',
  'Shop Now',
  'Sign Up',
  'Subscribe',
  'Download',
  'Get Offer',
  'Book Now',
  'Contact Us',
  'Apply Now',
  'Watch Video',
];

const AdEditor = ({ campaignId, adSetId, adId, onSave, onCancel }: AdEditorProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const existingAd = useSelector(selectSelectedAd);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Ad>>({
    name: '',
    status: 'paused',
    headline: '',
    description: '',
    image_url: '',
    call_to_action: 'Learn More',
    url: '',
  });
  
  // Keep track of the uploaded image file
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Fetch ad data if editing
  useEffect(() => {
    if (adId) {
      dispatch(fetchAdById({ campaignId, adSetId, adId }));
    }
  }, [dispatch, campaignId, adSetId, adId]);
  
  // Set form data from existing ad if available
  useEffect(() => {
    if (adId && existingAd) {
      setFormData({
        name: existingAd.name,
        status: existingAd.status,
        headline: existingAd.headline,
        description: existingAd.description,
        image_url: existingAd.image_url,
        call_to_action: existingAd.call_to_action,
        url: existingAd.url,
        content_id: existingAd.content_id,
      });
    }
  }, [adId, existingAd]);
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value as string;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Handle image upload
  const handleImageChange = async (imageUrl: string | null, file?: File) => {
    if (imageUrl === null) {
      // Image was removed
      setFormData(prev => ({ ...prev, image_url: '' }));
      setImageFile(null);
      return;
    }
    
    if (file) {
      setImageFile(file);
      
      // For now, we're using the local object URL for preview
      // In a real application with a backend, we'd upload to cloud storage here
      setFormData(prev => ({ ...prev, image_url: imageUrl }));
      
      try {
        setUploadingImage(true);
        
        // This would upload to a real backend in production
        // Currently it just returns the object URL from our mock service
        const result = await uploadImage(file);
        
        if (result.success) {
          // In a real application, we'd use the cloud URL instead of the object URL
          // setFormData(prev => ({ ...prev, image_url: result.url }));
          
          // Clear any previous image error
          if (formErrors.image_url) {
            setFormErrors(prev => ({ ...prev, image_url: '' }));
          }
        } else {
          setError(`Failed to upload image: ${result.error}`);
        }
      } catch (err: any) {
        setError(`Image upload error: ${err.message}`);
      } finally {
        setUploadingImage(false);
      }
    }
  };
  
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'Ad name is required';
    }
    
    if (!formData.headline?.trim()) {
      errors.headline = 'Headline is required';
    } else if (formData.headline.length > 50) {
      errors.headline = 'Headline must be 50 characters or less';
    }
    
    if (!formData.description?.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length > 200) {
      errors.description = 'Description must be 200 characters or less';
    }
    
    if (!formData.image_url?.trim()) {
      errors.image_url = 'An image is required for the ad';
    }
    
    if (!formData.call_to_action) {
      errors.call_to_action = 'Call to action is required';
    }
    
    if (!formData.url?.trim()) {
      errors.url = 'URL is required';
    } else if (!/^(https?:\/\/)/.test(formData.url)) {
      errors.url = 'URL must start with http:// or https://';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateForm()) {
      // Switch to details tab if there are errors
      setTabValue(0);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // In a real application with a backend:
      // 1. First upload any image file that hasn't been uploaded yet
      // 2. Wait for the upload to complete and get the permanent URL
      // 3. Update the formData with the permanent URL
      // 4. Then create/update the ad with the permanent URL
      
      // For this implementation, we're using the object URL directly
      // In production, you would replace this with code to ensure the image is uploaded first
      
      if (adId) {
        // Update existing ad
        await dispatch(updateAd({
          campaignId,
          adSetId,
          adId,
          ad: formData
        })).unwrap();
      } else {
        // Create new ad
        await dispatch(createAd({
          campaignId,
          adSetId,
          ad: formData as Omit<Ad, 'id' | 'ad_set_id'>
        })).unwrap();
      }
      
      onSave();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Create a preview ad object for the preview component
  const previewAd: Ad = {
    id: adId || 'preview',
    ad_set_id: adSetId,
    name: formData.name || 'Ad Preview',
    status: formData.status as 'active' | 'paused' | 'rejected',
    content_id: formData.content_id || '',
    headline: formData.headline || 'Ad Headline',
    description: formData.description || 'Ad description goes here',
    image_url: formData.image_url || 'https://via.placeholder.com/800x400?text=Ad+Image',
    call_to_action: formData.call_to_action || 'Learn More',
    url: formData.url || 'https://example.com',
    performance: {},
  };
  
  return (
    <Box>
      <Box sx={{ width: '100%', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Ad Details" id="ad-editor-tab-0" />
          <Tab label="Preview" id="ad-editor-tab-1" />
        </Tabs>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Ad Name"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              error={Boolean(formErrors.name)}
              helperText={formErrors.name}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={formData.status || 'paused'}
                onChange={handleSelectChange as any}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Creative Elements
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Headline"
              name="headline"
              value={formData.headline || ''}
              onChange={handleInputChange}
              error={Boolean(formErrors.headline)}
              helperText={formErrors.headline || `${(formData.headline || '').length}/50 characters`}
              required
              inputProps={{ maxLength: 50 }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              multiline
              rows={3}
              error={Boolean(formErrors.description)}
              helperText={formErrors.description || `${(formData.description || '').length}/200 characters`}
              required
              inputProps={{ maxLength: 200 }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Ad Image
            </Typography>
            <ImageUploader
              initialImageUrl={formData.image_url || ''}
              onImageChange={handleImageChange}
              aspectRatio={1.91} // Facebook/Instagram feed ad aspect ratio
            />
            {uploadingImage && <CircularProgress size={24} sx={{ mt: 1 }} />}
            {formErrors.image_url && (
              <FormHelperText error>{formErrors.image_url}</FormHelperText>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Destination & Action
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={Boolean(formErrors.call_to_action)}>
              <InputLabel id="cta-label">Call to Action</InputLabel>
              <Select
                labelId="cta-label"
                name="call_to_action"
                value={formData.call_to_action || ''}
                onChange={handleSelectChange as any}
                label="Call to Action"
                required
              >
                {callToActionOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
              {formErrors.call_to_action && (
                <FormHelperText>{formErrors.call_to_action}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Destination URL"
              name="url"
              value={formData.url || ''}
              onChange={handleInputChange}
              placeholder="https://example.com/landing-page"
              error={Boolean(formErrors.url)}
              helperText={formErrors.url || "The landing page URL where users will be directed"}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">🔗</InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>Ad Preview</Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          This is how your ad will appear on different platforms. The actual appearance may vary slightly on different devices and platforms.
        </Typography>
        <AdPreview ad={previewAd} />
      </TabPanel>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button 
          variant="outlined" 
          onClick={onCancel} 
          sx={{ mr: 2 }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            adId ? 'Update Ad' : 'Create Ad'
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default AdEditor;