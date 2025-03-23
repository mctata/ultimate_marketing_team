import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  TextField,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  IconButton,
  Collapse,
  Alert,
  Tooltip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Lightbulb as LightbulbIcon,
  Image as ImageIcon,
  TextFields as TextFieldsIcon,
  Psychology as PsychologyIcon,
  Tune as TuneIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { 
  getPersonalizationSuggestions, 
  getImageRecommendations,
  getToneRecommendations,
  getContentImprovements,
  PersonalizationResponse,
  PersonalizationSuggestion,
  ImageRecommendation,
  ToneRecommendation
} from '../../services/aiPersonalizationService';

interface AIPersonalizationPanelProps {
  templateId: string;
  industryId?: string;
  currentValues: Record<string, string>;
  onPersonalizationApplied: (field: string, value: string) => void;
  onImageSelected?: (imageUrl: string) => void;
  onToneSelected?: (toneId: string) => void;
}

const AIPersonalizationPanel: React.FC<AIPersonalizationPanelProps> = ({
  templateId,
  industryId,
  currentValues,
  onPersonalizationApplied,
  onImageSelected,
  onToneSelected
}) => {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personalizationData, setPersonalizationData] = useState<PersonalizationResponse | null>(null);
  const [targetAudience, setTargetAudience] = useState('');
  const [campaignObjective, setCampaignObjective] = useState('');
  const [brandVoice, setBrandVoice] = useState('');
  const [usePreviousPerformance, setUsePreviousPerformance] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>('suggestions');
  const [showRecommendationDialog, setShowRecommendationDialog] = useState(false);
  const [selectedFieldForInfo, setSelectedFieldForInfo] = useState<PersonalizationSuggestion | null>(null);

  // Generate personalization suggestions
  const generateSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getPersonalizationSuggestions({
        templateId,
        industryId,
        targetAudience: targetAudience || undefined,
        campaignObjective: campaignObjective || undefined,
        brandVoice: brandVoice || undefined,
        previousPerformance: usePreviousPerformance,
        currentValues
      });
      
      setPersonalizationData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to generate personalization suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Handle section toggle
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  // Apply a suggestion
  const applySuggestion = (field: string, value: string) => {
    onPersonalizationApplied(field, value);
  };

  // Show suggestion info dialog
  const showSuggestionInfo = (suggestion: PersonalizationSuggestion) => {
    setSelectedFieldForInfo(suggestion);
    setShowRecommendationDialog(true);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <PsychologyIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">AI-Assisted Personalization</Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Input form */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            label="Target Audience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            fullWidth
            size="small"
            placeholder="e.g., Health-conscious professionals"
            helperText="Who is this content targeting?"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Campaign Objective"
            value={campaignObjective}
            onChange={(e) => setCampaignObjective(e.target.value)}
            fullWidth
            size="small"
            placeholder="e.g., Drive newsletter signups"
            helperText="What is the goal of this content?"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Brand Voice"
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
            fullWidth
            size="small"
            placeholder="e.g., Professional but friendly"
            helperText="How should your brand sound?"
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Chip
          icon={<LightbulbIcon />}
          label={usePreviousPerformance ? "Using performance data" : "Not using performance data"}
          color={usePreviousPerformance ? "success" : "default"}
          onClick={() => setUsePreviousPerformance(!usePreviousPerformance)}
          sx={{ cursor: 'pointer' }}
        />
        
        <Button
          variant="contained"
          color="primary"
          onClick={generateSuggestions}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
        >
          Generate Suggestions
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Results sections */}
      {personalizationData && (
        <Box>
          {/* Field Suggestions */}
          <Paper variant="outlined" sx={{ mb: 2 }}>
            <Box 
              sx={{ 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                cursor: 'pointer',
                bgcolor: expandedSection === 'suggestions' ? 'action.selected' : 'transparent'
              }}
              onClick={() => toggleSection('suggestions')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextFieldsIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="subtitle1">Content Suggestions</Typography>
              </Box>
              {expandedSection === 'suggestions' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
            
            <Collapse in={expandedSection === 'suggestions'}>
              <Divider />
              <List dense>
                {personalizationData.fieldSuggestions.length > 0 ? (
                  personalizationData.fieldSuggestions.map((suggestion, index) => (
                    <ListItem 
                      key={index}
                      secondaryAction={
                        <Box>
                          <Tooltip title="View explanation">
                            <IconButton 
                              edge="end" 
                              size="small" 
                              onClick={() => showSuggestionInfo(suggestion)}
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Apply suggestion">
                            <IconButton 
                              edge="end" 
                              size="small" 
                              onClick={() => applySuggestion(suggestion.field, suggestion.value)}
                              sx={{ ml: 1 }}
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <ListItemIcon>
                        <Chip
                          label={`${Math.round(suggestion.confidence * 100)}%`}
                          size="small"
                          color={suggestion.confidence > 0.7 ? "success" : "warning"}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {suggestion.field}:
                            </Typography>
                            <Typography variant="body2">
                              {suggestion.value}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No content suggestions available." />
                  </ListItem>
                )}
              </List>
            </Collapse>
          </Paper>
          
          {/* Image Recommendations */}
          <Paper variant="outlined" sx={{ mb: 2 }}>
            <Box 
              sx={{ 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                cursor: 'pointer',
                bgcolor: expandedSection === 'images' ? 'action.selected' : 'transparent'
              }}
              onClick={() => toggleSection('images')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ImageIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="subtitle1">Image Recommendations</Typography>
              </Box>
              {expandedSection === 'images' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
            
            <Collapse in={expandedSection === 'images'}>
              <Divider />
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  {personalizationData.imageRecommendations.length > 0 ? (
                    personalizationData.imageRecommendations.map((image) => (
                      <Grid item xs={12} sm={6} md={4} key={image.id}>
                        <Card>
                          <CardActionArea onClick={() => onImageSelected && onImageSelected(image.url)}>
                            <CardMedia
                              component="img"
                              height="140"
                              image={image.url}
                              alt={image.alt}
                            />
                            <CardContent sx={{ p: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" noWrap>{image.description}</Typography>
                                <Chip
                                  label={`${Math.round(image.confidence * 100)}%`}
                                  size="small"
                                  color={image.confidence > 0.7 ? "success" : "warning"}
                                />
                              </Box>
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Typography variant="body2">No image recommendations available.</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Collapse>
          </Paper>
          
          {/* Tone Recommendations */}
          <Paper variant="outlined" sx={{ mb: 2 }}>
            <Box 
              sx={{ 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                cursor: 'pointer',
                bgcolor: expandedSection === 'tones' ? 'action.selected' : 'transparent'
              }}
              onClick={() => toggleSection('tones')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TuneIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="subtitle1">Tone Recommendations</Typography>
              </Box>
              {expandedSection === 'tones' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
            
            <Collapse in={expandedSection === 'tones'}>
              <Divider />
              <List dense>
                {personalizationData.toneRecommendations.length > 0 ? (
                  personalizationData.toneRecommendations.map((tone) => (
                    <ListItem 
                      key={tone.id}
                      secondaryAction={
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onToneSelected && onToneSelected(tone.id)}
                        >
                          Apply
                        </Button>
                      }
                    >
                      <ListItemIcon>
                        <Chip
                          label={`${Math.round(tone.confidence * 100)}%`}
                          size="small"
                          color={tone.confidence > 0.7 ? "success" : "warning"}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={tone.name}
                        secondary={tone.reason}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No tone recommendations available." />
                  </ListItem>
                )}
              </List>
            </Collapse>
          </Paper>
          
          {/* Content Improvements */}
          <Paper variant="outlined">
            <Box 
              sx={{ 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                cursor: 'pointer',
                bgcolor: expandedSection === 'improvements' ? 'action.selected' : 'transparent'
              }}
              onClick={() => toggleSection('improvements')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LightbulbIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="subtitle1">Content Improvements</Typography>
              </Box>
              {expandedSection === 'improvements' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
            
            <Collapse in={expandedSection === 'improvements'}>
              <Divider />
              <List dense>
                {personalizationData.contentImprovements.length > 0 ? (
                  personalizationData.contentImprovements.map((improvement, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <LightbulbIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={improvement} />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No content improvement suggestions available." />
                  </ListItem>
                )}
              </List>
            </Collapse>
          </Paper>
        </Box>
      )}
      
      {/* Recommendation explanation dialog */}
      <Dialog
        open={showRecommendationDialog}
        onClose={() => setShowRecommendationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          AI Recommendation Explanation
          <IconButton
            aria-label="close"
            onClick={() => setShowRecommendationDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedFieldForInfo && (
            <>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Field: {selectedFieldForInfo.field}
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                Recommended value: <strong>{selectedFieldForInfo.value}</strong>
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                Confidence: <Chip
                  label={`${Math.round(selectedFieldForInfo.confidence * 100)}%`}
                  size="small"
                  color={selectedFieldForInfo.confidence > 0.7 ? "success" : "warning"}
                />
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Why this recommendation:
              </Typography>
              
              <Typography variant="body2" paragraph>
                {selectedFieldForInfo.reason}
              </Typography>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                AI recommendations are based on performance data, industry best practices, and target audience preferences. 
                They are suggestions to improve engagement and conversions, but you should always use your judgment for brand alignment.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRecommendationDialog(false)}>
            Close
          </Button>
          {selectedFieldForInfo && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                applySuggestion(selectedFieldForInfo.field, selectedFieldForInfo.value);
                setShowRecommendationDialog(false);
              }}
            >
              Apply This Suggestion
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AIPersonalizationPanel;