import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Grid, 
  Chip, 
  Button, 
  IconButton, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  SelectChangeEvent,
  Pagination
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import GoogleIcon from '@mui/icons-material/Google';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';

// Mock data for competitor ads
const mockCompetitorAds = [
  {
    id: 'ad1',
    competitor: 'Competitor A',
    platform: 'facebook',
    title: 'Boost Your Marketing ROI',
    description: 'Our all-in-one marketing platform helps businesses increase their ROI by up to 45%. Try it free for 14 days!',
    imageUrl: 'https://placehold.co/600x400/2196f3/ffffff?text=Marketing+ROI',
    dateDetected: '2023-06-10',
    keywords: ['marketing roi', 'marketing platform', 'business growth'],
    estimatedSpend: 5000,
    engagement: { likes: 245, comments: 32, shares: 78 }
  },
  {
    id: 'ad2',
    competitor: 'Competitor B',
    platform: 'google',
    title: 'AI-Powered Marketing Tools',
    description: 'Leverage artificial intelligence to optimize your marketing campaigns. Get started today with our award-winning platform.',
    imageUrl: 'https://placehold.co/600x400/4caf50/ffffff?text=AI+Marketing',
    dateDetected: '2023-06-12',
    keywords: ['ai marketing', 'marketing automation', 'campaign optimization'],
    estimatedSpend: 7500,
    engagement: { clicks: 3200, impressions: 125000, ctr: 2.56 }
  },
  {
    id: 'ad3',
    competitor: 'Competitor C',
    platform: 'instagram',
    title: 'Create Stunning Social Media Campaigns',
    description: 'Design eye-catching social media campaigns that convert. Used by top brands worldwide.',
    imageUrl: 'https://placehold.co/600x400/ff9800/ffffff?text=Social+Media',
    dateDetected: '2023-06-15',
    keywords: ['social media', 'campaign design', 'social conversion'],
    estimatedSpend: 3200,
    engagement: { likes: 1245, comments: 132, shares: 278 }
  },
  {
    id: 'ad4',
    competitor: 'Competitor A',
    platform: 'linkedin',
    title: 'Enterprise Marketing Suite',
    description: 'Trusted by Fortune 500 companies. Our enterprise marketing suite provides everything you need to scale your marketing efforts.',
    imageUrl: 'https://placehold.co/600x400/9c27b0/ffffff?text=Enterprise+Marketing',
    dateDetected: '2023-06-16',
    keywords: ['enterprise marketing', 'marketing suite', 'fortune 500'],
    estimatedSpend: 8500,
    engagement: { likes: 145, comments: 22, shares: 38 }
  },
  {
    id: 'ad5',
    competitor: 'Competitor B',
    platform: 'twitter',
    title: '24/7 Marketing Analytics',
    description: 'Real-time marketing analytics that help you make better decisions. Monitor your campaigns around the clock.',
    imageUrl: 'https://placehold.co/600x400/e91e63/ffffff?text=Marketing+Analytics',
    dateDetected: '2023-06-18',
    keywords: ['marketing analytics', 'real-time monitoring', 'campaign insights'],
    estimatedSpend: 4200,
    engagement: { likes: 98, retweets: 25, replies: 12 }
  },
  {
    id: 'ad6',
    competitor: 'Competitor C',
    platform: 'google',
    title: 'Multi-Channel Marketing Platform',
    description: 'Reach your audience across every channel with our integrated marketing platform. Seamless coordination of all your campaigns.',
    imageUrl: 'https://placehold.co/600x400/607d8b/ffffff?text=Multi+Channel',
    dateDetected: '2023-06-20',
    keywords: ['multi-channel marketing', 'integrated platform', 'campaign coordination'],
    estimatedSpend: 6300,
    engagement: { clicks: 2800, impressions: 95000, ctr: 2.95 }
  }
];

const CompetitorAdFeed: React.FC = () => {
  const theme = useTheme();
  const [filter, setFilter] = useState('all');
  const [competitor, setCompetitor] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [savedAds, setSavedAds] = useState<string[]>([]);
  const [alertedAds, setAlertedAds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 3;
  
  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilter(event.target.value);
    setPage(1);
  };
  
  const handleCompetitorChange = (event: SelectChangeEvent) => {
    setCompetitor(event.target.value);
    setPage(1);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };
  
  const handleSaveAd = (adId: string) => {
    if (savedAds.includes(adId)) {
      setSavedAds(savedAds.filter(id => id !== adId));
    } else {
      setSavedAds([...savedAds, adId]);
    }
  };
  
  const handleAlertAd = (adId: string) => {
    if (alertedAds.includes(adId)) {
      setAlertedAds(alertedAds.filter(id => id !== adId));
    } else {
      setAlertedAds([...alertedAds, adId]);
    }
  };
  
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  // Apply filters to the ads list
  const filteredAds = mockCompetitorAds.filter(ad => {
    // Filter by platform
    if (filter !== 'all' && ad.platform !== filter) return false;
    
    // Filter by competitor
    if (competitor !== 'all' && ad.competitor !== competitor) return false;
    
    // Filter by search term
    if (searchTerm && !ad.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !ad.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !ad.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }
    
    return true;
  });
  
  // Get current page items
  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAds = filteredAds.slice(indexOfFirstItem, indexOfLastItem);
  
  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <FacebookIcon />;
      case 'instagram':
        return <InstagramIcon />;
      case 'google':
        return <GoogleIcon />;
      case 'linkedin':
        return <LinkedInIcon />;
      case 'twitter':
        return <TwitterIcon />;
      default:
        return null;
    }
  };
  
  // Format platform name
  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return 'Facebook';
      case 'instagram':
        return 'Instagram';
      case 'google':
        return 'Google Ads';
      case 'linkedin':
        return 'LinkedIn';
      case 'twitter':
        return 'Twitter';
      default:
        return platform;
    }
  };
  
  // Get unique competitors
  const competitors = Array.from(new Set(mockCompetitorAds.map(ad => ad.competitor)));
  
  return (
    <Box>
      <Box sx={{ mb: 4, p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>Competitor Ad Monitoring</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="platform-filter-label">Platform</InputLabel>
              <Select
                labelId="platform-filter-label"
                id="platform-filter"
                value={filter}
                label="Platform"
                onChange={handleFilterChange}
              >
                <MenuItem value="all">All Platforms</MenuItem>
                <MenuItem value="facebook">Facebook</MenuItem>
                <MenuItem value="instagram">Instagram</MenuItem>
                <MenuItem value="google">Google Ads</MenuItem>
                <MenuItem value="linkedin">LinkedIn</MenuItem>
                <MenuItem value="twitter">Twitter</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="competitor-filter-label">Competitor</InputLabel>
              <Select
                labelId="competitor-filter-label"
                id="competitor-filter"
                value={competitor}
                label="Competitor"
                onChange={handleCompetitorChange}
              >
                <MenuItem value="all">All Competitors</MenuItem>
                {competitors.map((comp, index) => (
                  <MenuItem key={index} value={comp}>{comp}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by keyword, title or description"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Box>
      
      {filteredAds.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">No ads found matching your criteria.</Typography>
          <Typography variant="body1" color="text.secondary">Try adjusting your filters or search term.</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Found {filteredAds.length} competitor ads
            </Typography>
          </Box>
          
          {currentAds.map((ad) => (
            <Card key={ad.id} sx={{ mb: 3, overflow: 'visible' }}>
              <Grid container>
                <Grid item xs={12} md={4}>
                  <CardMedia
                    component="img"
                    image={ad.imageUrl}
                    alt={ad.title}
                    sx={{ height: { xs: 200, md: '100%' }, minHeight: { md: 250 } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          icon={getPlatformIcon(ad.platform)} 
                          label={getPlatformName(ad.platform)} 
                          size="small" 
                        />
                        <Typography variant="caption" color="text.secondary">
                          Detected: {new Date(ad.dateDetected).toLocaleDateString()}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <IconButton 
                          size="small" 
                          color={savedAds.includes(ad.id) ? 'primary' : 'default'} 
                          onClick={() => handleSaveAd(ad.id)}
                          title={savedAds.includes(ad.id) ? 'Remove from saved' : 'Save ad'}
                        >
                          {savedAds.includes(ad.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                        </IconButton>
                        
                        <IconButton 
                          size="small" 
                          color={alertedAds.includes(ad.id) ? 'primary' : 'default'} 
                          onClick={() => handleAlertAd(ad.id)}
                          title={alertedAds.includes(ad.id) ? 'Remove alert' : 'Get alerts for similar ads'}
                        >
                          {alertedAds.includes(ad.id) ? <NotificationsActiveIcon /> : <NotificationsNoneIcon />}
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Typography variant="h6" gutterBottom component="div">
                      {ad.title}
                    </Typography>
                    
                    <Typography variant="subtitle2" color="primary.main" gutterBottom>
                      {ad.competitor}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {ad.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {ad.keywords.map((keyword, index) => (
                        <Chip key={index} label={keyword} size="small" variant="outlined" />
                      ))}
                    </Box>
                    
                    <Box sx={{ mt: 'auto' }}>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Estimated Spend</Typography>
                          <Typography variant="body1" fontWeight="bold">
                            ${ad.estimatedSpend.toLocaleString()}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Engagement</Typography>
                          <Typography variant="body1">
                            {ad.engagement.likes !== undefined && `${ad.engagement.likes.toLocaleString()} likes`}
                            {ad.engagement.clicks !== undefined && `${ad.engagement.clicks.toLocaleString()} clicks`}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Grid>
              </Grid>
            </Card>
          ))}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination 
              count={Math.ceil(filteredAds.length / itemsPerPage)} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default CompetitorAdFeed;