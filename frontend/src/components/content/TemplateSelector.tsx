import { useState, useEffect } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Typography, 
  Paper, 
  Skeleton, 
  Chip,
  FormHelperText
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

export interface Template {
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
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch from an API
    setLoading(true);
    // Mock data - would be replaced with API call
    setTimeout(() => {
      setTemplates([
        { 
          id: 'blog-standard', 
          name: 'Standard Blog Post', 
          description: 'A general-purpose blog post template with introduction, body, and conclusion sections.',
          type: 'blog',
          tags: ['blog', 'general'],
          lastModified: '2025-03-01' 
        },
        { 
          id: 'email-newsletter', 
          name: 'Weekly Newsletter', 
          description: 'Email newsletter template with header, content sections, and footer.',
          type: 'email',
          tags: ['newsletter', 'weekly'],
          lastModified: '2025-03-05' 
        },
        { 
          id: 'social-announcement', 
          name: 'Product Announcement', 
          description: 'Social media post announcing a new product or feature.',
          type: 'social',
          tags: ['product', 'announcement'],
          lastModified: '2025-03-10' 
        },
        { 
          id: 'ad-carousel', 
          name: 'Image Carousel Ad', 
          description: 'Multi-image carousel ad with captions and call-to-action.',
          type: 'ad',
          tags: ['carousel', 'image'],
          lastModified: '2025-03-15' 
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleChange = (event: SelectChangeEvent) => {
    onSelect(event.target.value as string);
  };

  const getTemplateTypeColor = (type: Template['type']) => {
    const colors: Record<Template['type'], string> = {
      blog: '#4caf50',
      email: '#2196f3',
      social: '#9c27b0',
      ad: '#f44336',
      landing: '#ff9800',
      other: '#607d8b'
    };
    return colors[type];
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <Skeleton variant="rectangular" width="100%" height={60} />
      </Box>
    );
  }

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