import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Skeleton
} from '@mui/material';
import {
  Help as HelpIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon
} from '@mui/icons-material';

export interface TemplateVariable {
  name: string;
  key: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiline';
  required: boolean;
  defaultValue?: string;
  options?: string[]; // For select type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

interface TemplateVariablesProps {
  templateId: string;
  onChange: (variables: Record<string, string>) => void;
  initialValues?: Record<string, string>;
  disabled?: boolean;
}

const TemplateVariables = ({
  templateId,
  onChange,
  initialValues = {},
  disabled = false
}: TemplateVariablesProps) => {
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // In a real implementation, this would fetch variables based on the selected template
    setLoading(true);
    
    // Mock data - would be replaced with API call
    setTimeout(() => {
      if (templateId === 'blog-standard') {
        setVariables([
          {
            name: 'Blog Title',
            key: 'title',
            description: 'The main title of the blog post',
            type: 'text',
            required: true,
            defaultValue: '',
            validation: {
              min: 10,
              max: 100,
              message: 'Title should be between 10-100 characters'
            }
          },
          {
            name: 'Topic',
            key: 'topic',
            description: 'The main topic or subject of the blog post',
            type: 'text',
            required: true,
            defaultValue: ''
          },
          {
            name: 'Target Audience',
            key: 'audience',
            description: 'The target audience for this content',
            type: 'select',
            required: true,
            options: ['General', 'Beginners', 'Intermediate', 'Advanced', 'Experts'],
            defaultValue: 'General'
          },
          {
            name: 'Tone',
            key: 'tone',
            description: 'The tone of voice for the content',
            type: 'select',
            required: true,
            options: ['Professional', 'Casual', 'Conversational', 'Formal', 'Technical'],
            defaultValue: 'Professional'
          },
          {
            name: 'Key Points',
            key: 'keyPoints',
            description: 'Main points to cover (one per line)',
            type: 'multiline',
            required: false,
            defaultValue: ''
          }
        ]);
      } else if (templateId === 'email-newsletter') {
        setVariables([
          {
            name: 'Newsletter Subject',
            key: 'subject',
            description: 'Email subject line',
            type: 'text',
            required: true,
            defaultValue: '',
            validation: {
              max: 60,
              message: 'Subject should be maximum 60 characters'
            }
          },
          {
            name: 'Main Story',
            key: 'mainStory',
            description: 'The main story or announcement',
            type: 'text',
            required: true,
            defaultValue: ''
          },
          {
            name: 'Secondary Stories',
            key: 'secondaryStories',
            description: 'Additional stories or announcements (one per line)',
            type: 'multiline',
            required: false,
            defaultValue: ''
          },
          {
            name: 'Call to Action',
            key: 'cta',
            description: 'Primary call-to-action text',
            type: 'text',
            required: true,
            defaultValue: ''
          }
        ]);
      } else if (templateId === 'social-announcement') {
        setVariables([
          {
            name: 'Product Name',
            key: 'productName',
            description: 'Name of the product being announced',
            type: 'text',
            required: true,
            defaultValue: ''
          },
          {
            name: 'Key Feature',
            key: 'keyFeature',
            description: 'The main feature or benefit to highlight',
            type: 'text',
            required: true,
            defaultValue: ''
          },
          {
            name: 'Launch Date',
            key: 'launchDate',
            description: 'When the product launches',
            type: 'date',
            required: true,
            defaultValue: ''
          },
          {
            name: 'Hashtags',
            key: 'hashtags',
            description: 'Hashtags to include (comma separated)',
            type: 'text',
            required: false,
            defaultValue: ''
          }
        ]);
      } else if (templateId === 'ad-carousel') {
        setVariables([
          {
            name: 'Ad Headline',
            key: 'headline',
            description: 'Main headline for the ad',
            type: 'text',
            required: true,
            defaultValue: '',
            validation: {
              max: 40,
              message: 'Headline should be maximum 40 characters'
            }
          },
          {
            name: 'Product Description',
            key: 'description',
            description: 'Short description of the product',
            type: 'text',
            required: true,
            defaultValue: '',
            validation: {
              max: 125,
              message: 'Description should be maximum 125 characters'
            }
          },
          {
            name: 'Image Captions',
            key: 'captions',
            description: 'Captions for each image (one per line)',
            type: 'multiline',
            required: true,
            defaultValue: ''
          },
          {
            name: 'Call to Action',
            key: 'cta',
            description: 'Button text for call-to-action',
            type: 'select',
            required: true,
            options: ['Shop Now', 'Learn More', 'Sign Up', 'Get Started', 'Contact Us'],
            defaultValue: 'Shop Now'
          }
        ]);
      } else {
        setVariables([]);
      }
      
      // Initialize values with defaults from variables
      const newValues = { ...initialValues };
      setLoading(false);
    }, 1000);
  }, [templateId]);

  useEffect(() => {
    // Initialize values with defaults for any missing values
    const newValues = { ...values };
    variables.forEach(variable => {
      if (!(variable.key in newValues) && variable.defaultValue !== undefined) {
        newValues[variable.key] = variable.defaultValue;
      }
    });
    setValues(newValues);
  }, [variables]);

  const handleChange = (key: string, value: string) => {
    const newValues = { ...values, [key]: value };
    setValues(newValues);
    
    // Validate
    const newErrors = { ...errors };
    const variable = variables.find(v => v.key === key);
    
    if (variable?.validation) {
      // Check min length
      if (variable.validation.min !== undefined && value.length < variable.validation.min) {
        newErrors[key] = variable.validation.message || `Minimum ${variable.validation.min} characters required`;
      }
      // Check max length
      else if (variable.validation.max !== undefined && value.length > variable.validation.max) {
        newErrors[key] = variable.validation.message || `Maximum ${variable.validation.max} characters allowed`;
      }
      // Check pattern
      else if (variable.validation.pattern && !new RegExp(variable.validation.pattern).test(value)) {
        newErrors[key] = variable.validation.message || 'Invalid format';
      }
      else {
        delete newErrors[key];
      }
    }
    
    setErrors(newErrors);
    onChange(newValues);
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <Skeleton variant="rectangular" width="100%" height={400} />
      </Box>
    );
  }

  if (!templateId || variables.length === 0) {
    return (
      <Paper sx={{ p: 3, mt: 2, bgcolor: '#f5f5f5', textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Please select a template to see available variables
        </Typography>
      </Paper>
    );
  }

  const requiredVariables = variables.filter(v => v.required);
  const optionalVariables = variables.filter(v => !v.required);

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Template Variables
        <Tooltip title="These variables will be used to generate your content based on the selected template.">
          <IconButton size="small" sx={{ ml: 1 }}>
            <HelpIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Required Information
        </Typography>
        <Grid container spacing={3}>
          {requiredVariables.map((variable) => (
            <Grid item xs={12} md={variable.type === 'multiline' ? 12 : 6} key={variable.key}>
              {variable.type === 'text' && (
                <TextField
                  fullWidth
                  label={variable.name}
                  value={values[variable.key] || ''}
                  onChange={(e) => handleChange(variable.key, e.target.value)}
                  required
                  error={!!errors[variable.key]}
                  helperText={errors[variable.key] || variable.description}
                  disabled={disabled}
                  InputProps={{
                    endAdornment: variable.validation?.max && (
                      <Typography variant="caption" color="text.secondary">
                        {(values[variable.key] || '').length}/{variable.validation.max}
                      </Typography>
                    )
                  }}
                />
              )}
              {variable.type === 'number' && (
                <TextField
                  fullWidth
                  label={variable.name}
                  type="number"
                  value={values[variable.key] || ''}
                  onChange={(e) => handleChange(variable.key, e.target.value)}
                  required
                  error={!!errors[variable.key]}
                  helperText={errors[variable.key] || variable.description}
                  disabled={disabled}
                />
              )}
              {variable.type === 'date' && (
                <TextField
                  fullWidth
                  label={variable.name}
                  type="date"
                  value={values[variable.key] || ''}
                  onChange={(e) => handleChange(variable.key, e.target.value)}
                  required
                  error={!!errors[variable.key]}
                  helperText={errors[variable.key] || variable.description}
                  disabled={disabled}
                  InputLabelProps={{ shrink: true }}
                />
              )}
              {variable.type === 'select' && (
                <TextField
                  fullWidth
                  select
                  label={variable.name}
                  value={values[variable.key] || (variable.options && variable.options[0]) || ''}
                  onChange={(e) => handleChange(variable.key, e.target.value)}
                  required
                  error={!!errors[variable.key]}
                  helperText={errors[variable.key] || variable.description}
                  disabled={disabled}
                >
                  {variable.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </TextField>
              )}
              {variable.type === 'multiline' && (
                <TextField
                  fullWidth
                  label={variable.name}
                  multiline
                  rows={4}
                  value={values[variable.key] || ''}
                  onChange={(e) => handleChange(variable.key, e.target.value)}
                  required
                  error={!!errors[variable.key]}
                  helperText={errors[variable.key] || variable.description}
                  disabled={disabled}
                />
              )}
            </Grid>
          ))}
        </Grid>
      </Paper>

      {optionalVariables.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Optional Variables</Typography>
            <Chip 
              label={`${optionalVariables.length} fields`} 
              size="small" 
              sx={{ ml: 1 }} 
              color="primary" 
              variant="outlined" 
            />
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {optionalVariables.map((variable) => (
                <Grid item xs={12} md={variable.type === 'multiline' ? 12 : 6} key={variable.key}>
                  {variable.type === 'text' && (
                    <TextField
                      fullWidth
                      label={variable.name}
                      value={values[variable.key] || ''}
                      onChange={(e) => handleChange(variable.key, e.target.value)}
                      error={!!errors[variable.key]}
                      helperText={errors[variable.key] || variable.description}
                      disabled={disabled}
                    />
                  )}
                  {variable.type === 'number' && (
                    <TextField
                      fullWidth
                      label={variable.name}
                      type="number"
                      value={values[variable.key] || ''}
                      onChange={(e) => handleChange(variable.key, e.target.value)}
                      error={!!errors[variable.key]}
                      helperText={errors[variable.key] || variable.description}
                      disabled={disabled}
                    />
                  )}
                  {variable.type === 'date' && (
                    <TextField
                      fullWidth
                      label={variable.name}
                      type="date"
                      value={values[variable.key] || ''}
                      onChange={(e) => handleChange(variable.key, e.target.value)}
                      error={!!errors[variable.key]}
                      helperText={errors[variable.key] || variable.description}
                      disabled={disabled}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                  {variable.type === 'select' && (
                    <TextField
                      fullWidth
                      select
                      label={variable.name}
                      value={values[variable.key] || ''}
                      onChange={(e) => handleChange(variable.key, e.target.value)}
                      error={!!errors[variable.key]}
                      helperText={errors[variable.key] || variable.description}
                      disabled={disabled}
                    >
                      {variable.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </TextField>
                  )}
                  {variable.type === 'multiline' && (
                    <TextField
                      fullWidth
                      label={variable.name}
                      multiline
                      rows={4}
                      value={values[variable.key] || ''}
                      onChange={(e) => handleChange(variable.key, e.target.value)}
                      error={!!errors[variable.key]}
                      helperText={errors[variable.key] || variable.description}
                      disabled={disabled}
                    />
                  )}
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
        <InfoIcon fontSize="small" color="info" sx={{ mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          These variables will be used to customize your content based on the selected template
        </Typography>
      </Box>
    </Box>
  );
};

export default TemplateVariables;