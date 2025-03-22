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
  Skeleton,
  Alert
} from '@mui/material';
import {
  Help as HelpIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useTemplates } from '../../hooks/useContentGeneration';
import { TemplateVariable as ApiTemplateVariable } from '../../services/contentGenerationService';

// Map API variable to component's internal variable format
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
  const { getTemplate } = useTemplates();
  const [template, setTemplate] = useState<any>(null);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Map API template variable to component's internal variable format
  const mapApiVariableToInternal = (apiVar: ApiTemplateVariable): TemplateVariable => {
    const mappedType = (): 'text' | 'number' | 'date' | 'select' | 'multiline' => {
      switch (apiVar.type) {
        case 'string': return 'text';
        case 'text': return 'multiline';
        case 'number': return 'number';
        case 'boolean': return 'select';
        case 'select': return 'select';
        default: return 'text';
      }
    };

    return {
      name: apiVar.label,
      key: apiVar.name,
      description: apiVar.description || '',
      type: mappedType(),
      required: apiVar.required,
      defaultValue: apiVar.default_value?.toString() || '',
      options: apiVar.type === 'select' && apiVar.options ? 
        apiVar.options.map(opt => opt.label) : 
        apiVar.type === 'boolean' ? ['Yes', 'No'] : undefined,
      validation: {
        min: apiVar.min,
        max: apiVar.max,
        pattern: apiVar.validation,
        message: `Must be between ${apiVar.min || 0} and ${apiVar.max || 'unlimited'} characters`
      }
    };
  };

  useEffect(() => {
    if (!templateId) {
      setLoading(false);
      setVariables([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Fetch template details from API
    getTemplate(templateId)
      .then(templateData => {
        setTemplate(templateData);
        
        // Map API variables to component variables
        if (templateData && templateData.variables) {
          const mappedVariables = templateData.variables.map(mapApiVariableToInternal);
          setVariables(mappedVariables);
        } else {
          setVariables([]);
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching template:', err);
        setError('Failed to load template variables. Please try again.');
        setLoading(false);
      });
  }, [templateId, getTemplate]);

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
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
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