import React from 'react';
import { 
  Card, 
  CardContent, 
  Grid, 
  TextField, 
  Button, 
  IconButton, 
  Chip,
  Typography,
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  useTheme,
  Popover,
  Paper,
  Autocomplete
} from '@mui/material';
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import { DateRange } from '@mui/x-date-pickers-pro/internals/models';
import { addDays, format, isValid } from 'date-fns';
import FilterListIcon from '@mui/icons-material/FilterList';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import TuneIcon from '@mui/icons-material/Tune';
import AutorenewIcon from '@mui/icons-material/Autorenew';

export interface FilterOption {
  id: string;
  label: string;
}

export interface FilterDefinition {
  id: string;
  name: string;
  type: 'select' | 'multi-select' | 'search' | 'toggle' | 'date-range';
  options?: FilterOption[];
  defaultValue?: any;
}

export interface FilterState {
  [key: string]: any;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
}

interface DashboardFiltersProps {
  filterDefinitions: FilterDefinition[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  savedFilters?: SavedFilter[];
  onSaveFilter?: (name: string) => void;
  onLoadFilter?: (filterId: string) => void;
  onDeleteFilter?: (filterId: string) => void;
  onExport?: () => void;
  refreshInterval?: number;
  onRefreshIntervalChange?: (interval: number) => void;
  isAutoRefreshEnabled?: boolean;
  onAutoRefreshToggle?: () => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

// Predefined date ranges
const PREDEFINED_RANGES = [
  { label: 'Today', range: [new Date(), new Date()] },
  { label: 'Yesterday', range: [addDays(new Date(), -1), addDays(new Date(), -1)] },
  { label: 'Last 7 days', range: [addDays(new Date(), -6), new Date()] },
  { label: 'Last 30 days', range: [addDays(new Date(), -29), new Date()] },
  { label: 'This month', range: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()] },
  { label: 'Last month', range: [new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), new Date(new Date().getFullYear(), new Date().getMonth(), 0)] }
];

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filterDefinitions,
  filters,
  onFiltersChange,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
  onExport,
  refreshInterval = 0,
  onRefreshIntervalChange,
  isAutoRefreshEnabled = false,
  onAutoRefreshToggle,
  isLoading = false,
  onRefresh
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [saveFilterName, setSaveFilterName] = React.useState('');
  const [saveAnchorEl, setSaveAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const [loadAnchorEl, setLoadAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const saveOpen = Boolean(saveAnchorEl);
  const loadOpen = Boolean(loadAnchorEl);
  
  // Handle filter changes
  const handleFilterChange = (id: string, value: any) => {
    onFiltersChange({
      ...filters,
      [id]: value
    });
  };
  
  // Handle predefined range selection
  const handlePredefinedRange = (range: Date[]) => {
    if (range.length === 2 && isValid(range[0]) && isValid(range[1])) {
      handleFilterChange('dateRange', range);
    }
  };
  
  // Open save filter dialog
  const handleSaveClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSaveAnchorEl(event.currentTarget);
  };
  
  // Open load filter dialog
  const handleLoadClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setLoadAnchorEl(event.currentTarget);
  };
  
  // Save current filter
  const handleSaveFilter = () => {
    if (saveFilterName.trim() && onSaveFilter) {
      onSaveFilter(saveFilterName.trim());
      setSaveFilterName('');
      setSaveAnchorEl(null);
    }
  };
  
  // Load a saved filter
  const handleLoadFilter = (filterId: string) => {
    if (onLoadFilter) {
      onLoadFilter(filterId);
      setLoadAnchorEl(null);
    }
  };
  
  // Delete a saved filter
  const handleDeleteFilter = (filterId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onDeleteFilter) {
      onDeleteFilter(filterId);
    }
  };
  
  // Handle refresh interval change
  const handleRefreshIntervalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (onRefreshIntervalChange && !isNaN(value)) {
      onRefreshIntervalChange(value);
    }
  };
  
  // Render each filter based on its type
  const renderFilter = (filter: FilterDefinition) => {
    const { id, name, type, options, defaultValue } = filter;
    const value = filters[id] !== undefined ? filters[id] : defaultValue;
    
    switch (type) {
      case 'select':
        return (
          <FormControl fullWidth size="small">
            <InputLabel id={`filter-${id}-label`}>{name}</InputLabel>
            <Select
              labelId={`filter-${id}-label`}
              id={`filter-${id}`}
              value={value || ''}
              label={name}
              onChange={(e) => handleFilterChange(id, e.target.value)}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {options?.map(option => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
        
      case 'multi-select':
        return (
          <FormControl fullWidth size="small">
            <InputLabel id={`filter-${id}-label`}>{name}</InputLabel>
            <Select
              labelId={`filter-${id}-label`}
              id={`filter-${id}`}
              multiple
              value={value || []}
              onChange={(e) => handleFilterChange(id, e.target.value)}
              input={<OutlinedInput label={name} />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((selectedId) => {
                    const selectedOption = options?.find(option => option.id === selectedId);
                    return (
                      <Chip 
                        key={selectedId} 
                        label={selectedOption?.label || selectedId} 
                        size="small" 
                      />
                    );
                  })}
                </Box>
              )}
            >
              {options?.map(option => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
        
      case 'search':
        return (
          <Autocomplete
            multiple
            id={`filter-${id}`}
            options={options || []}
            getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
            value={value || []}
            onChange={(_, newValue) => handleFilterChange(id, newValue)}
            renderInput={(params) => (
              <TextField {...params} label={name} placeholder={name} size="small" />
            )}
            renderTags={(selected, getTagProps) =>
              selected.map((option, index) => {
                const label = typeof option === 'string' ? option : option.label;
                return (
                  <Chip 
                    {...getTagProps({ index })}
                    key={index} 
                    label={label} 
                    size="small" 
                  />
                );
              })
            }
            size="small"
          />
        );
        
      case 'toggle':
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {options?.map(option => (
                <Chip
                  key={option.id}
                  label={option.label}
                  clickable
                  color={value === option.id ? 'primary' : 'default'}
                  onClick={() => handleFilterChange(id, value === option.id ? null : option.id)}
                />
              ))}
            </Box>
          </Box>
        );
        
      case 'date-range':
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {name}
            </Typography>
            <DateRangePicker
              value={value || [null, null]}
              onChange={(newValue: DateRange<Date>) => handleFilterChange(id, newValue)}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true
                }
              }}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {PREDEFINED_RANGES.map((rangeOption, index) => (
                <Chip
                  key={index}
                  label={rangeOption.label}
                  size="small"
                  onClick={() => handlePredefinedRange(rangeOption.range)}
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              onClick={() => setIsExpanded(!isExpanded)}
              color={isExpanded ? 'primary' : 'default'}
              size="small"
              sx={{ mr: 1 }}
            >
              <FilterListIcon />
            </IconButton>
            <Typography variant="subtitle1" component="div">
              Filters
            </Typography>
            
            {Object.keys(filters).length > 0 && (
              <Chip 
                label={Object.keys(filters).length} 
                size="small" 
                color="primary" 
                sx={{ ml: 1 }} 
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onSaveFilter && (
              <>
                <Button 
                  startIcon={<SaveIcon />}
                  size="small"
                  onClick={handleSaveClick}
                >
                  Save
                </Button>
                <Popover
                  open={saveOpen}
                  anchorEl={saveAnchorEl}
                  onClose={() => setSaveAnchorEl(null)}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <Paper sx={{ p: 2, width: 300 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Save Current Filters
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      label="Filter Name"
                      value={saveFilterName}
                      onChange={(e) => setSaveFilterName(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <Button 
                      fullWidth 
                      variant="contained" 
                      onClick={handleSaveFilter}
                      disabled={!saveFilterName.trim()}
                    >
                      Save
                    </Button>
                  </Paper>
                </Popover>
              </>
            )}
            
            {onLoadFilter && savedFilters.length > 0 && (
              <>
                <Button 
                  size="small"
                  onClick={handleLoadClick}
                >
                  Load
                </Button>
                <Popover
                  open={loadOpen}
                  anchorEl={loadAnchorEl}
                  onClose={() => setLoadAnchorEl(null)}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <Paper sx={{ p: 2, width: 300, maxHeight: 400, overflow: 'auto' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Saved Filters
                    </Typography>
                    {savedFilters.map(filter => (
                      <Box 
                        key={filter.id}
                        sx={{ 
                          p: 1, 
                          mb: 1, 
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.divider}`,
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover
                          }
                        }}
                        onClick={() => handleLoadFilter(filter.id)}
                      >
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {filter.name}
                        </Typography>
                        {onDeleteFilter && (
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleDeleteFilter(filter.id, e)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                  </Paper>
                </Popover>
              </>
            )}
            
            {onExport && (
              <Button 
                startIcon={<DownloadIcon />}
                size="small"
                onClick={onExport}
              >
                Export
              </Button>
            )}
            
            {onRefresh && (
              <Button 
                startIcon={<AutorenewIcon />}
                size="small"
                onClick={onRefresh}
                disabled={isLoading}
              >
                Refresh
              </Button>
            )}
          </Box>
        </Box>
        
        {/* Advanced refresh settings */}
        {onRefreshIntervalChange && onAutoRefreshToggle && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: 2,
              p: 1,
              borderRadius: 1,
              backgroundColor: theme.palette.action.hover
            }}
          >
            <Chip
              icon={<AutorenewIcon />}
              label={isAutoRefreshEnabled ? "Auto refresh on" : "Auto refresh off"}
              color={isAutoRefreshEnabled ? "success" : "default"}
              onClick={onAutoRefreshToggle}
              variant={isAutoRefreshEnabled ? "filled" : "outlined"}
            />
            
            {isAutoRefreshEnabled && (
              <TextField
                label="Interval (seconds)"
                type="number"
                size="small"
                value={refreshInterval}
                onChange={handleRefreshIntervalChange}
                InputProps={{
                  inputProps: { min: 5, max: 3600 }
                }}
                sx={{ width: 150 }}
              />
            )}
          </Box>
        )}
        
        {/* Filter grid, shown when expanded */}
        {isExpanded && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {filterDefinitions.map(filter => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={filter.id}>
                {renderFilter(filter)}
              </Grid>
            ))}
          </Grid>
        )}
        
        {/* Active filters summary */}
        {!isExpanded && Object.keys(filters).length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(filters).map(([key, value]) => {
              if (!value || (Array.isArray(value) && value.length === 0)) return null;
              
              const filterDef = filterDefinitions.find(f => f.id === key);
              if (!filterDef) return null;
              
              let displayValue: string;
              
              if (filterDef.type === 'date-range' && Array.isArray(value) && value.length === 2) {
                // Format date range
                const [start, end] = value as Date[];
                if (isValid(start) && isValid(end)) {
                  displayValue = `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
                } else {
                  return null;
                }
              } else if (Array.isArray(value)) {
                // Handle arrays (multi-select)
                if (value.length === 0) return null;
                
                // Map IDs to labels if options exist
                if (filterDef.options) {
                  const labels = value.map(v => {
                    const option = filterDef.options?.find(o => o.id === v);
                    return option?.label || v;
                  });
                  displayValue = labels.join(', ');
                } else {
                  displayValue = value.join(', ');
                }
              } else if (filterDef.type === 'select' || filterDef.type === 'toggle') {
                // Map ID to label for select
                const option = filterDef.options?.find(o => o.id === value);
                displayValue = option?.label || value;
              } else {
                // Simple value
                displayValue = value.toString();
              }
              
              return (
                <Chip
                  key={key}
                  label={`${filterDef.name}: ${displayValue}`}
                  onDelete={() => handleFilterChange(key, filterDef.type === 'multi-select' ? [] : null)}
                  size="small"
                />
              );
            })}
            
            {Object.keys(filters).length > 0 && (
              <Chip
                label="Clear All"
                onClick={() => onFiltersChange({})}
                size="small"
                color="error"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardFilters;