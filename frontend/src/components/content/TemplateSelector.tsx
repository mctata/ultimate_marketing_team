import { useState } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Typography, 
  Skeleton, 
  Chip,
  FormHelperText,
  Alert
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useTemplates } from '../../hooks/useContentGeneration';
import { Template } from '../../types/templates';

// Map API template to component's internal template format
// Uses fields from imported Template interface
interface TemplateView {
  id: string;
  name: string;
  description: string;
  type: 'blog' | 'email' | 'social' | 'ad' | 'landing' | 'other';
  tags: string[];
  lastModified: string;
}

interface TemplateSelectorProps {
  onSelect: (templateId: string) => void;
  selectedTemplateId?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

const TemplateSelector = ({ 
  onSelect, 
  selectedTemplateId,
  error = false,
  helperText,
  disabled = false
}: TemplateSelectorProps) => {
  // Use the API hook
  const { templatesQuery } = useTemplates();
  
  // Map API templates to view templates
  const mapApiTemplateToView = (apiTemplate: Template): TemplateView => ({
    id: apiTemplate.id,
    name: apiTemplate.name,
    description: apiTemplate.description,
    // Map content_type to type or use 'other' as fallback
    type: (apiTemplate.content_type as 'blog' | 'email' | 'social' | 'ad' | 'landing' | 'other') || 'other',
    tags: apiTemplate.tags || [],
    lastModified: apiTemplate.updated_at
  });

  const handleChange = (event: SelectChangeEvent) => {
    onSelect(event.target.value as string);
  };

  const getTemplateTypeColor = (type: TemplateView['type']) => {
    const colors: Record<TemplateView['type'], string> = {
      blog: '#4caf50',
      email: '#2196f3',
      social: '#9c27b0',
      ad: '#f44336',
      landing: '#ff9800',
      other: '#607d8b'
    };
    return colors[type];
  };

  // Check loading state
  if (templatesQuery.isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <Skeleton variant="rectangular" width="100%" height={60} />
      </Box>
    );
  }

  // Handle error state
  if (templatesQuery.isError) {
    return (
      <Alert severity="error" sx={{ width: '100%' }}>
        Error loading templates. Please try again later.
      </Alert>
    );
  }

  // Map API templates to view templates
  const templates: TemplateView[] = (templatesQuery.data || []).map(mapApiTemplateToView);

  return (
    <FormControl fullWidth error={error} disabled={disabled}>
      <InputLabel id="template-select-label">Content Template</InputLabel>
      <Select
        labelId="template-select-label"
        id="template-select"
        value={selectedTemplateId || ''}
        label="Content Template"
        onChange={handleChange}
        sx={{ mb: 2 }}
        renderValue={(selected) => {
          const template = templates.find(t => t.id === selected);
          if (!template) return <em>Select a template</em>;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {template.name}
              <Chip 
                label={template.type} 
                size="small" 
                sx={{ 
                  ml: 1, 
                  bgcolor: getTemplateTypeColor(template.type),
                  color: 'white'
                }} 
              />
            </Box>
          );
        }}
      >
        <MenuItem value="" disabled>
          <em>Select a template</em>
        </MenuItem>
        {templates.map((template) => (
          <MenuItem key={template.id} value={template.id}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">
                  {template.name}
                </Typography>
                <Chip 
                  label={template.type} 
                  size="small" 
                  sx={{ 
                    bgcolor: getTemplateTypeColor(template.type),
                    color: 'white'
                  }} 
                />
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                {template.description}
              </Typography>
              <Box sx={{ display: 'flex', mt: 0.5, gap: 0.5 }}>
                {template.tags.map(tag => (
                  <Chip 
                    key={tag} 
                    label={tag} 
                    size="small" 
                    variant="outlined" 
                    sx={{ height: 20, fontSize: '0.7rem' }} 
                  />
                ))}
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default TemplateSelector;