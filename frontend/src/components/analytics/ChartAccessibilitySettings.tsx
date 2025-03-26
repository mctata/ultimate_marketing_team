import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Switch, 
  FormGroup,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Button,
  useTheme,
  IconButton,
  Tooltip,
  SelectChangeEvent
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import RestoreIcon from '@mui/icons-material/RestoreOutlined';
import { useChartAccessibility, defaultAccessibilityConfig } from '../../context/ChartAccessibilityContext';

interface ChartAccessibilitySettingsProps {
  onClose?: () => void;
}

const ChartAccessibilitySettings: React.FC<ChartAccessibilitySettingsProps> = ({ 
  onClose 
}) => {
  const theme = useTheme();
  const { config, updateConfig } = useChartAccessibility();
  
  const handleSwitchChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({ [name]: event.target.checked });
  };
  
  const handleColorBlindModeChange = (event: SelectChangeEvent) => {
    const value = event.target.value as ChartAccessibilityConfig['colorBlindMode'];
    updateConfig({ colorBlindMode: value });
  };
  
  const handleTooltipDelayChange = (_event: React.ChangeEvent<unknown>, newValue: number | number[]) => {
    updateConfig({ tooltipDelay: newValue as number });
  };
  
  const handleResetDefaults = () => {
    updateConfig(defaultAccessibilityConfig);
  };
  
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2">
            Chart Accessibility Settings
          </Typography>
          
          <Button 
            size="small" 
            startIcon={<RestoreIcon />} 
            onClick={handleResetDefaults}
            variant="outlined"
          >
            Reset Defaults
          </Button>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Customize how charts are displayed and interacted with to improve accessibility.
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Color and Visual Settings */}
        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
          Visual Settings
        </Typography>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Switch 
                checked={config.highContrast} 
                onChange={handleSwitchChange('highContrast')}
                inputProps={{ 'aria-label': 'Toggle high contrast mode' }}
              />
            }
            label={
              <Box display="flex" alignItems="center">
                High Contrast Mode
                <Tooltip title="Increases contrast in charts for better visibility">
                  <IconButton size="small" sx={{ ml: 0.5 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={config.patternFill} 
                onChange={handleSwitchChange('patternFill')}
                inputProps={{ 'aria-label': 'Toggle pattern fills' }}
              />
            }
            label={
              <Box display="flex" alignItems="center">
                Use Patterns in Addition to Colors
                <Tooltip title="Adds patterns to chart elements to help distinguish them without relying solely on color">
                  <IconButton size="small" sx={{ ml: 0.5 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          />
          
          <Box mt={2} mb={1}>
            <FormControl fullWidth size="small">
              <InputLabel id="color-blind-mode-label">Color Blind Mode</InputLabel>
              <Select
                labelId="color-blind-mode-label"
                id="color-blind-mode"
                value={config.colorBlindMode}
                label="Color Blind Mode"
                onChange={handleColorBlindModeChange}
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="protanopia">Protanopia (Red-Blind)</MenuItem>
                <MenuItem value="deuteranopia">Deuteranopia (Green-Blind)</MenuItem>
                <MenuItem value="tritanopia">Tritanopia (Blue-Blind)</MenuItem>
                <MenuItem value="achromatopsia">Achromatopsia (Monochromacy)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </FormGroup>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Text and Screen Reader Settings */}
        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
          Text and Screen Reader
        </Typography>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Switch 
                checked={config.includeDataTableWithCharts} 
                onChange={handleSwitchChange('includeDataTableWithCharts')}
                inputProps={{ 'aria-label': 'Toggle data tables with charts' }}
              />
            }
            label={
              <Box display="flex" alignItems="center">
                Include Data Tables with Charts
                <Tooltip title="Adds accessible HTML tables with the chart data below each chart">
                  <IconButton size="small" sx={{ ml: 0.5 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={config.enhancedLabels} 
                onChange={handleSwitchChange('enhancedLabels')}
                inputProps={{ 'aria-label': 'Toggle enhanced labels' }}
              />
            }
            label={
              <Box display="flex" alignItems="center">
                Enhanced Text Labels
                <Tooltip title="Adds more descriptive labels to charts for better understanding">
                  <IconButton size="small" sx={{ ml: 0.5 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={config.verboseDescriptions} 
                onChange={handleSwitchChange('verboseDescriptions')}
                inputProps={{ 'aria-label': 'Toggle verbose descriptions' }}
              />
            }
            label={
              <Box display="flex" alignItems="center">
                Verbose Chart Descriptions
                <Tooltip title="Provides detailed summaries of chart data for screen readers">
                  <IconButton size="small" sx={{ ml: 0.5 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={config.announceDataChanges} 
                onChange={handleSwitchChange('announceDataChanges')}
                inputProps={{ 'aria-label': 'Toggle announce data changes' }}
              />
            }
            label={
              <Box display="flex" alignItems="center">
                Announce Data Changes
                <Tooltip title="Screen readers will announce when chart data changes">
                  <IconButton size="small" sx={{ ml: 0.5 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          />
        </FormGroup>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Interaction Settings */}
        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
          Interaction Settings
        </Typography>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Switch 
                checked={config.keyboardNavigation} 
                onChange={handleSwitchChange('keyboardNavigation')}
                inputProps={{ 'aria-label': 'Toggle keyboard navigation' }}
              />
            }
            label={
              <Box display="flex" alignItems="center">
                Keyboard Navigation
                <Tooltip title="Enables navigating chart data points using keyboard arrow keys">
                  <IconButton size="small" sx={{ ml: 0.5 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          />
          
          <Box mt={2}>
            <Typography id="tooltip-delay-slider" gutterBottom>
              Tooltip Display Duration (ms): {config.tooltipDelay}
            </Typography>
            <Slider
              aria-labelledby="tooltip-delay-slider"
              value={config.tooltipDelay}
              onChange={handleTooltipDelayChange}
              step={500}
              marks
              min={1000}
              max={5000}
              valueLabelDisplay="auto"
              sx={{ width: '100%' }}
            />
          </Box>
        </FormGroup>
        
        {onClose && (
          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button variant="contained" onClick={onClose}>
              Save Settings
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartAccessibilitySettings;