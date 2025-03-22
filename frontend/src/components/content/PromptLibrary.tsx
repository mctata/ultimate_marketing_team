import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Search as SearchIcon,
  ContentCopy as ContentCopyIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  History as HistoryIcon,
  LocalOffer as LocalOfferIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  PlayArrow as PlayArrowIcon,
  Code as CodeIcon,
  AddBox as AddBoxIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';

interface PromptExample {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  popularity: number;
  isFavorite: boolean;
}

interface PromptLibraryProps {
  onUsePrompt?: (prompt: PromptExample) => void;
}

const PromptLibrary = ({ onUsePrompt }: PromptLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptExample | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Mock prompt examples
  const promptExamples: PromptExample[] = [
    {
      id: 'blog-1',
      title: 'Problem-Solution Blog Post',
      description: 'A blog post that identifies a common problem and provides a solution.',
      content: 'Create a blog post titled "[Problem]: [Solution]" that addresses [specific problem] faced by [target audience]. Begin by describing the problem and its impact. Then introduce [solution approach] as an effective solution. Include 3-5 practical steps to implement this solution, with specific examples. Conclude with the benefits of solving this problem and a call to action.',
      category: 'blog',
      tags: ['problem-solution', 'how-to', 'practical'],
      popularity: 94,
      isFavorite: false
    },
    {
      id: 'email-1',
      title: 'Product Launch Announcement',
      description: 'Email announcing a new product or feature to existing customers.',
      content: 'Craft an email announcing the launch of [product name], designed to [main benefit]. Begin with an engaging subject line that highlights the product\'s primary value. The first paragraph should create excitement about the innovation. Then describe 3 key features and their benefits to the customer. Include social proof if available. End with a clear call-to-action and a limited-time offer to create urgency.',
      category: 'email',
      tags: ['product launch', 'announcement', 'promotional'],
      popularity: 87,
      isFavorite: false
    },
    {
      id: 'social-1',
      title: 'Engaging Question Post',
      description: 'Social media post with a question that encourages audience engagement.',
      content: 'Create an engaging social media post for [platform] that asks the audience a thought-provoking question about [topic]. The question should be personally relevant to the audience and easy to answer. Include a striking statistic or fact related to the question to add credibility. End with a clear call-to-action asking followers to share their thoughts in the comments. Keep the tone conversational and authentic.',
      category: 'social',
      tags: ['engagement', 'question', 'conversation starter'],
      popularity: 92,
      isFavorite: false
    },
    {
      id: 'ad-1',
      title: 'AIDA Framework Ad Copy',
      description: 'Advertisement copy following the Attention, Interest, Desire, Action framework.',
      content: 'Write ad copy for [product/service] following the AIDA framework: \n1. Attention: Start with a headline that grabs attention by highlighting a pain point or unique benefit\n2. Interest: Develop interest by explaining how [product/service] works and its unique approach\n3. Desire: Build desire by describing specific benefits and including social proof\n4. Action: End with a clear, compelling call-to-action that creates urgency\n\nThe ad should be targeted at [audience] and emphasize [key value proposition].',
      category: 'ad',
      tags: ['AIDA', 'framework', 'conversion'],
      popularity: 88,
      isFavorite: false
    },
    {
      id: 'blog-2',
      title: 'Listicle Blog Post',
      description: 'Easy-to-scan list-based article with valuable tips or examples.',
      content: 'Create a listicle blog post titled "[Number] [Adjective] Ways to [Achieve Goal/Solve Problem]" targeted at [audience]. Start with a brief introduction explaining why this topic matters to the reader. Then provide [number] distinct points, each with its own subheading, short explanation, and specific example or actionable tip. Include a brief conclusion summarizing the key takeaways and a call to action. The tone should be [formal/conversational/inspirational] and the length should be approximately 1200-1500 words.',
      category: 'blog',
      tags: ['listicle', 'tips', 'numbered'],
      popularity: 95,
      isFavorite: false
    },
    {
      id: 'email-2',
      title: 'Re-engagement Email',
      description: 'Email to win back inactive subscribers or customers.',
      content: 'Create a re-engagement email for customers who haven\'t interacted with our [product/service/content] in [time period]. Begin with a subject line that creates curiosity or offers clear value. Open with an acknowledgment of their absence without being accusatory. Highlight 2-3 new features, improvements, or valuable content they\'ve missed. Include a special incentive like [specific offer] to encourage them to return. Close with a simple, low-friction call to action. The tone should be friendly but not desperate.',
      category: 'email',
      tags: ['re-engagement', 'win-back', 'inactive customers'],
      popularity: 83,
      isFavorite: false
    },
    {
      id: 'social-2',
      title: 'Behind-the-Scenes Post',
      description: 'Social media post showing the human side of your brand.',
      content: 'Create a behind-the-scenes social media post for [platform] that showcases [specific aspect of your business]. Begin with an engaging opening line that creates curiosity. Describe what happens behind the scenes in an authentic, conversational way. Highlight one or two team members and their contributions. Include a personal anecdote or unexpected fact that humanizes the brand. End with a question that invites followers to share their thoughts or experiences. The post should be accompanied by [type of visual content].',
      category: 'social',
      tags: ['behind-the-scenes', 'authentic', 'brand story'],
      popularity: 89,
      isFavorite: false
    },
    {
      id: 'ad-2',
      title: 'PAS Framework Ad Copy',
      description: 'Advertisement copy following the Problem, Agitation, Solution framework.',
      content: 'Write ad copy using the Problem-Agitation-Solution (PAS) framework for [product/service]. \n1. Problem: Identify a specific problem that [target audience] faces related to [topic/need]\n2. Agitation: Expand on the problem, emphasizing the negative effects and pain points it causes\n3. Solution: Present [product/service] as the ideal solution, highlighting how it addresses the specific problem\n\nInclude a clear value proposition and end with a compelling call-to-action. The total length should be [character/word count] to fit [platform/format].',
      category: 'ad',
      tags: ['PAS', 'framework', 'problem-solution'],
      popularity: 86,
      isFavorite: false
    }
  ];
  
  // Filter prompts based on search query and category filter
  const filteredPrompts = promptExamples.filter(prompt => {
    // Apply search filter
    const matchesSearch = searchQuery === '' || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply category filter
    const matchesCategory = categoryFilter === 'all' || prompt.category === categoryFilter;
    
    // Apply favorites filter
    const matchesFavorites = categoryFilter !== 'favorites' || favorites.includes(prompt.id);
    
    return matchesSearch && matchesCategory && matchesFavorites;
  });
  
  const handleOpenDetails = (prompt: PromptExample) => {
    setSelectedPrompt(prompt);
    setDetailsOpen(true);
  };
  
  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };
  
  const handleUsePrompt = (prompt: PromptExample) => {
    if (onUsePrompt) {
      onUsePrompt(prompt);
    }
    setDetailsOpen(false);
  };
  
  const handleCopyPrompt = (content: string) => {
    navigator.clipboard.writeText(content);
    // You could add a notification here
  };
  
  const handleToggleFavorite = (promptId: string) => {
    if (favorites.includes(promptId)) {
      setFavorites(favorites.filter(id => id !== promptId));
    } else {
      setFavorites([...favorites, promptId]);
    }
  };
  
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      blog: '#4caf50',
      email: '#2196f3',
      social: '#9c27b0',
      ad: '#f44336'
    };
    return colors[category] || '#607d8b';
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <LightbulbIcon sx={{ mr: 1, color: 'primary.main' }} />
            Prompt Library
          </Typography>
          
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
            <TextField
              placeholder="Search prompts..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              }}
              sx={{ width: 250, mr: 2 }}
            />
            
            <Tooltip title="Filter by category">
              <IconButton onClick={() => {}}>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Tabs
          value={categoryFilter}
          onChange={(e, newValue) => setCategoryFilter(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Prompts" value="all" />
          <Tab label="Blog Posts" value="blog" />
          <Tab label="Email" value="email" />
          <Tab label="Social Media" value="social" />
          <Tab label="Ads" value="ad" />
          <Tab 
            label="Favorites" 
            value="favorites" 
            icon={<StarIcon fontSize="small" />} 
            iconPosition="start" 
          />
        </Tabs>
        
        <Grid container spacing={3}>
          {filteredPrompts.length === 0 ? (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No prompts found matching your search criteria.
                </Typography>
              </Box>
            </Grid>
          ) : (
            filteredPrompts.map((prompt) => (
              <Grid item xs={12} sm={6} md={4} key={prompt.id}>
                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={prompt.category}
                        size="small"
                        sx={{
                          bgcolor: getCategoryColor(prompt.category),
                          color: 'white',
                          mr: 1,
                          textTransform: 'capitalize'
                        }}
                      />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          color: 'text.secondary'
                        }}
                      >
                        <HistoryIcon fontSize="small" sx={{ fontSize: 14, mr: 0.5 }} />
                        {prompt.popularity}% success rate
                      </Typography>
                      <IconButton 
                        size="small" 
                        sx={{ ml: 'auto' }}
                        onClick={() => handleToggleFavorite(prompt.id)}
                      >
                        {favorites.includes(prompt.id) ? (
                          <StarIcon fontSize="small" color="primary" />
                        ) : (
                          <StarBorderIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                    
                    <Typography variant="subtitle1" gutterBottom>
                      {prompt.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {prompt.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {prompt.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                      size="small" 
                      onClick={() => handleOpenDetails(prompt)}
                      fullWidth
                      variant="outlined"
                    >
                      View Prompt
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleUsePrompt(prompt)}
                      fullWidth
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                    >
                      Use
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
        
        {/* Add Prompt Button */}
        <Box sx={{ position: 'fixed', bottom: 20, right: 20 }}>
          <Tooltip title="Add New Prompt">
            <IconButton 
              color="primary" 
              size="large"
              sx={{ 
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                boxShadow: 3
              }}
            >
              <AddBoxIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
      
      {/* Prompt Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        {selectedPrompt && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6">
                  {selectedPrompt.title}
                </Typography>
                <IconButton 
                  sx={{ ml: 'auto' }} 
                  onClick={() => handleToggleFavorite(selectedPrompt.id)}
                >
                  {favorites.includes(selectedPrompt.id) ? (
                    <StarIcon color="primary" />
                  ) : (
                    <StarBorderIcon />
                  )}
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle2" gutterBottom>
                    Prompt Content
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      bgcolor: '#f8f9fa',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {selectedPrompt.content}
                  </Paper>
                  
                  <Button 
                    startIcon={<ContentCopyIcon />} 
                    variant="outlined" 
                    size="small"
                    onClick={() => handleCopyPrompt(selectedPrompt.content)}
                  >
                    Copy to Clipboard
                  </Button>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Prompt Details
                  </Typography>
                  <List dense disablePadding>
                    <ListItem disablePadding sx={{ pb: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <LocalOfferIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Category" 
                        secondary={selectedPrompt.category}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body2', fontWeight: 'medium', textTransform: 'capitalize' }}
                      />
                    </ListItem>
                    
                    <ListItem disablePadding sx={{ pb: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <HistoryIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Success Rate" 
                        secondary={`${selectedPrompt.popularity}%`}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                      />
                    </ListItem>
                  </List>
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedPrompt.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{ height: 24 }}
                      />
                    ))}
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                    Usage Tips
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Replace placeholders in [brackets] with your specific information. This prompt works best when you provide detailed information for each placeholder.
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails}>Close</Button>
              <Button 
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={() => handleUsePrompt(selectedPrompt)}
              >
                Use This Prompt
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PromptLibrary;