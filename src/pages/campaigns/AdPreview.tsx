import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Divider,
  Avatar,
  IconButton,
  Grid,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  MoreHoriz as MoreHorizIcon,
  Favorite as FavoriteIcon,
  InsertComment as InsertCommentIcon,
  Bookmark as BookmarkIcon,
  Public as PublicIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Language as LanguageIcon,
  LinkedIn as LinkedInIcon,
} from '@mui/icons-material';
import { Ad } from '../../services/campaignService';
import { getOptimizedImageUrl } from '../../services/imageService';
import { ImageData } from '../../components/common/ImageUploader';

// Tab panel component for switching between different platform previews
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
      id={`platform-preview-tabpanel-${index}`}
      aria-labelledby={`platform-preview-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface AdPreviewProps {
  ad: Ad;
  imageData?: ImageData | null;
}

const AdPreview = ({ ad, imageData }: AdPreviewProps) => {
  const [platformTab, setPlatformTab] = useState(0);
  
  // Helper function to get the optimal image for each platform
  const getImageForPlatform = (platform: string): string => {
    if (imageData && imageData.variants && imageData.variants[platform]) {
      return imageData.variants[platform];
    }
    return ad.image_url || 'https://via.placeholder.com/800x400?text=Ad+Image';
  };
  
  const handlePlatformChange = (_: React.SyntheticEvent, newValue: number) => {
    setPlatformTab(newValue);
  };
  
  // Mock company name and profile information
  const companyName = 'YourBrandName';
  const companyLogo = 'https://via.placeholder.com/50x50';
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  
  return (
    <Box>
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={platformTab}
          onChange={handlePlatformChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="platform preview tabs"
        >
          <Tab icon={<FacebookIcon />} label="Facebook" id="platform-preview-tab-0" />
          <Tab icon={<InstagramIcon />} label="Instagram" id="platform-preview-tab-1" />
          <Tab icon={<LinkedInIcon />} label="LinkedIn" id="platform-preview-tab-2" />
          <Tab icon={<LanguageIcon />} label="Display" id="platform-preview-tab-3" />
        </Tabs>
      </Paper>
      
      {/* Facebook Ad Preview */}
      <TabPanel value={platformTab} index={0}>
        <Paper sx={{ maxWidth: 550, mx: 'auto', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar src={companyLogo} sx={{ mr: 1 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" fontWeight="medium">{companyName}</Typography>
              <Typography variant="caption" color="textSecondary">
                {currentDate} · <PublicIcon fontSize="inherit" sx={{ fontSize: 12, mb: -0.3 }} />
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="primary">Sponsored</Typography>
              <IconButton size="small">
                <MoreHorizIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          
          <Typography variant="body2" sx={{ px: 2, pb: 1 }}>
            {ad.description}
          </Typography>
          
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              height="300"
              image={getImageForPlatform('facebook')}
              alt={ad.headline}
            />
          </Box>
          
          <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="caption" color="textSecondary">{companyName.toUpperCase()}</Typography>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              {ad.headline}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              sx={{ textTransform: 'none', mt: 1 }}
            >
              {ad.call_to_action}
            </Button>
          </Box>
          
          <Divider />
          
          <Box sx={{ display: 'flex', p: 1 }}>
            <Button startIcon={<ThumbUpIcon />} sx={{ flex: 1, color: 'text.secondary' }}>Like</Button>
            <Button startIcon={<CommentIcon />} sx={{ flex: 1, color: 'text.secondary' }}>Comment</Button>
            <Button startIcon={<ShareIcon />} sx={{ flex: 1, color: 'text.secondary' }}>Share</Button>
          </Box>
        </Paper>
      </TabPanel>
      
      {/* Instagram Ad Preview */}
      <TabPanel value={platformTab} index={1}>
        <Paper sx={{ maxWidth: 400, mx: 'auto', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center' }}>
            <Avatar src={companyLogo} sx={{ width: 32, height: 32, mr: 1.5 }} />
            <Typography variant="subtitle2" fontWeight="medium">{companyName}</Typography>
            <Typography variant="caption" color="primary" sx={{ ml: 'auto', mr: 0.5 }}>Sponsored</Typography>
            <IconButton size="small">
              <MoreHorizIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <CardMedia
            component="img"
            image={getImageForPlatform('instagram_square')}
            alt={ad.headline}
            sx={{ aspectRatio: '1/1', objectFit: 'cover' }}
          />
          
          <Box sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', mb: 1 }}>
              <IconButton size="small">
                <FavoriteIcon fontSize="small" />
              </IconButton>
              <IconButton size="small">
                <InsertCommentIcon fontSize="small" />
              </IconButton>
              <IconButton size="small">
                <ShareIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" sx={{ ml: 'auto' }}>
                <BookmarkIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Typography variant="subtitle2" fontWeight="medium">{companyName}</Typography>
            <Typography variant="body2" paragraph>
              {ad.headline}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5 }}>
              {ad.description.substring(0, 125)}{ad.description.length > 125 ? '...' : ''}
            </Typography>
            
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              sx={{ textTransform: 'none', borderRadius: 4 }}
            >
              {ad.call_to_action}
            </Button>
          </Box>
        </Paper>
      </TabPanel>
      
      {/* LinkedIn Ad Preview */}
      <TabPanel value={platformTab} index={2}>
        <Paper sx={{ maxWidth: 550, mx: 'auto', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar src={companyLogo} sx={{ mr: 1.5, width: 48, height: 48 }} />
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">{companyName}</Typography>
              <Typography variant="caption" color="textSecondary">Sponsored · {currentDate}</Typography>
            </Box>
            <IconButton size="small" sx={{ ml: 'auto' }}>
              <MoreHorizIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Typography variant="body2" sx={{ px: 2, pb: 2 }}>
            {ad.description}
          </Typography>
          
          <CardMedia
            component="img"
            image={getImageForPlatform('linkedin')}
            alt={ad.headline}
            sx={{ height: 300 }}
          />
          
          <Box sx={{ p: 2, bgcolor: '#f8f8f8' }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {ad.headline}
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
              {ad.url}
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ textTransform: 'none', mt: 1 }}
            >
              {ad.call_to_action}
            </Button>
          </Box>
          
          <Divider />
          
          <Box sx={{ display: 'flex', p: 1.5 }}>
            <Button startIcon={<ThumbUpIcon />} sx={{ color: 'text.secondary', mr: 1 }}>Like</Button>
            <Button startIcon={<CommentIcon />} sx={{ color: 'text.secondary', mr: 1 }}>Comment</Button>
            <Button startIcon={<ShareIcon />} sx={{ color: 'text.secondary' }}>Share</Button>
          </Box>
        </Paper>
      </TabPanel>
      
      {/* Display Ad Preview */}
      <TabPanel value={platformTab} index={3}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={6}>
            {/* Horizontal Banner */}
            <Typography variant="subtitle2" gutterBottom align="center">
              Horizontal Banner (728×90)
            </Typography>
            <Paper sx={{ height: 90, width: '100%', maxWidth: 728, mx: 'auto', mb: 4, overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', height: '100%' }}>
                <Box 
                  component="img" 
                  src={getImageForPlatform('facebook')} 
                  alt={ad.headline}
                  sx={{ height: '100%', width: 160, objectFit: 'cover' }}
                />
                <Box sx={{ p: 1.5, width: 'calc(100% - 160px)' }}>
                  <Typography variant="subtitle2" fontWeight="bold" noWrap>
                    {ad.headline}
                  </Typography>
                  <Typography variant="caption" noWrap sx={{ display: 'block', mb: 0.5 }}>
                    {ad.description.substring(0, 60)}{ad.description.length > 60 ? '...' : ''}
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="small" 
                    sx={{ textTransform: 'none', mt: 'auto' }}
                  >
                    {ad.call_to_action}
                  </Button>
                </Box>
              </Box>
            </Paper>
            
            {/* Square Ad */}
            <Typography variant="subtitle2" gutterBottom align="center">
              Square Ad (300×250)
            </Typography>
            <Paper sx={{ width: 300, height: 250, mx: 'auto', overflow: 'hidden' }}>
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box 
                  component="img" 
                  src={getImageForPlatform('twitter')} 
                  alt={ad.headline}
                  sx={{ width: '100%', height: 125, objectFit: 'cover' }}
                />
                <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {ad.headline}
                  </Typography>
                  <Typography variant="caption" sx={{ mb: 1 }}>
                    {ad.description.substring(0, 70)}{ad.description.length > 70 ? '...' : ''}
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="small" 
                    sx={{ textTransform: 'none', mt: 'auto' }}
                  >
                    {ad.call_to_action}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default AdPreview;