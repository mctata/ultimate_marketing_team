import { useState, createContext, useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  FormGroup,
  RadioGroup,
  Radio,
  Button,
  IconButton,
  Tabs,
  Tab,
  Grid,
  useMediaQuery,
  useTheme,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Alert,
  Collapse,
  Tooltip,
  Chip
} from '@mui/material';

import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Visibility as VisibilityIcon,
  FormatSize as FormatSizeIcon,
  Palette as PaletteIcon,
  Check as CheckIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Keyboard as KeyboardIcon,
  Close as CloseIcon,
  Contrast as ContrastIcon,
  TouchApp as TouchAppIcon,
  Accessibility as AccessibilityIcon,
  SettingsApplications as SettingsApplicationsIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

// Mock keyboard shortcuts for help section
const keyboardShortcuts = [
  { key: 'Ctrl+/', description: 'Show keyboard shortcuts' },
  { key: 'Ctrl+B', description: 'Bold text' },
  { key: 'Ctrl+I', description: 'Italic text' },
  { key: 'Ctrl+Z', description: 'Undo' },
  { key: 'Ctrl+Y', description: 'Redo' },
  { key: 'Ctrl+S', description: 'Save content' },
  { key: 'Alt+1-5', description: 'Navigate to main sections' },
  { key: 'Tab', description: 'Navigate forward through focusable elements' },
  { key: 'Shift+Tab', description: 'Navigate backward through focusable elements' },
  { key: 'Esc', description: 'Close dialogs or menus' }
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`accessibility-tabpanel-${index}`}
      aria-labelledby={`accessibility-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3, pb: 1 }}>{children}</Box>}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `accessibility-tab-${index}`,
    'aria-controls': `accessibility-tabpanel-${index}`,
  };
};

// Settings component
const Settings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [successAlert, setSuccessAlert] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  
  // Mock settings - would connect to context provider in real app
  const [preferences, setPreferences] = useState({
    mode: 'light',
    highContrast: false,
    textSize: 'normal',
    reducedMotion: false,
    fontFamily: 'Inter, Roboto, Arial',
    keyboardMode: false
  });
  
  const updatePreference = (key: keyof typeof preferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const resetPreferences = () => {
    setPreferences({
      mode: 'light',
      highContrast: false,
      textSize: 'normal',
      reducedMotion: false,
      fontFamily: 'Inter, Roboto, Arial',
      keyboardMode: false
    });
    
    showSuccess();
  };
  
  const savePreferences = () => {
    // In a real app, this would save to localStorage, API, etc.
    console.log('Saving preferences:', preferences);
    showSuccess();
  };
  
  const showSuccess = () => {
    setSuccessAlert(true);
    setTimeout(() => {
      setSuccessAlert(false);
    }, 5000);
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Collapse in={successAlert}>
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setSuccessAlert(false);
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          Settings saved successfully!
        </Alert>
      </Collapse>
      
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="Settings tabs"
            variant={isMobile ? "fullWidth" : "standard"}
            centered={!isMobile}
          >
            <Tab
              icon={isMobile ? <AccessibilityIcon /> : undefined}
              iconPosition="start"
              label={isMobile ? undefined : "Accessibility"} 
              {...a11yProps(0)}
              aria-label="Accessibility settings"
            />
            <Tab 
              icon={isMobile ? <PaletteIcon /> : undefined}
              iconPosition="start"
              label={isMobile ? undefined : "Appearance"} 
              {...a11yProps(1)}
              aria-label="Appearance settings"
            />
            <Tab 
              icon={isMobile ? <KeyboardIcon /> : undefined}
              iconPosition="start"
              label={isMobile ? undefined : "Keyboard"} 
              {...a11yProps(2)} 
              aria-label="Keyboard settings"
            />
            <Tab 
              icon={isMobile ? <SettingsApplicationsIcon /> : undefined}
              iconPosition="start"
              label={isMobile ? undefined : "Advanced"} 
              {...a11yProps(3)} 
              aria-label="Advanced settings"
            />
          </Tabs>
        </Box>

        {/* Accessibility Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Accessibility Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" gutterBottom>
                  <VisibilityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Visual Preferences
                </Typography>
                
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.highContrast}
                        onChange={e => updatePreference('highContrast', e.target.checked)}
                        name="highContrast"
                        inputProps={{ 'aria-label': 'High contrast mode' }}
                      />
                    }
                    label="High contrast mode"
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    Increases contrast to make text and UI elements more visible
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="text-size-label">Text Size</InputLabel>
                    <Select
                      labelId="text-size-label"
                      id="text-size"
                      value={preferences.textSize}
                      label="Text Size"
                      onChange={e => updatePreference('textSize', e.target.value)}
                    >
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="large">Large (120%)</MenuItem>
                      <MenuItem value="extra-large">Extra Large (140%)</MenuItem>
                    </Select>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Adjusts the size of text throughout the application
                    </Typography>
                  </FormControl>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.reducedMotion}
                        onChange={e => updatePreference('reducedMotion', e.target.checked)}
                        name="reducedMotion"
                        inputProps={{ 'aria-label': 'Reduce animations' }}
                      />
                    }
                    label="Reduce animations"
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    Minimizes animations and transitions for reduced motion sensitivity
                  </Typography>
                </FormGroup>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" gutterBottom>
                  <TouchAppIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Navigation & Controls
                </Typography>
                
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.keyboardMode}
                        onChange={e => updatePreference('keyboardMode', e.target.checked)}
                        name="keyboardMode"
                        inputProps={{ 'aria-label': 'Enhanced keyboard navigation' }}
                      />
                    }
                    label="Enhanced keyboard navigation"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    Improves focus visibility and enables additional keyboard shortcuts
                  </Typography>
                  
                  <Button 
                    variant="outlined" 
                    startIcon={<KeyboardIcon />}
                    onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                    sx={{ mb: 2 }}
                    aria-expanded={showKeyboardShortcuts}
                    aria-controls="keyboard-shortcuts-list"
                  >
                    {showKeyboardShortcuts ? 'Hide Keyboard Shortcuts' : 'Show Keyboard Shortcuts'}
                  </Button>
                  
                  <Collapse in={showKeyboardShortcuts} id="keyboard-shortcuts-list">
                    <Box sx={{ 
                      maxHeight: '200px', 
                      overflowY: 'auto', 
                      border: '1px solid', 
                      borderColor: 'divider',
                      p: 2,
                      mb: 2,
                      borderRadius: 1
                    }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Keyboard Shortcuts
                      </Typography>
                      
                      <Grid container spacing={1}>
                        {keyboardShortcuts.map((shortcut, index) => (
                          <Grid item xs={12} key={index}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                              <Chip 
                                label={shortcut.key} 
                                size="small" 
                                variant="outlined" 
                                sx={{ minWidth: '80px', mr: 1 }}
                              />
                              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                {shortcut.description}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Collapse>
                </FormGroup>
              </Paper>
              
              <Box sx={{ mt: 3 }}>
                <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
                  Your accessibility settings are saved to your profile and will be applied across all your devices.
                </Alert>
                
                <Stack direction="row" spacing={2} justifyContent={isMobile ? "center" : "flex-start"}>
                  <Button 
                    variant="contained" 
                    startIcon={<SaveIcon />}
                    onClick={savePreferences}
                    color="primary"
                  >
                    Save Settings
                  </Button>
                  <Button 
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={resetPreferences}
                  >
                    Reset to Default
                  </Button>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Appearance Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Appearance Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Theme Mode
                </Typography>
                
                <RadioGroup
                  row
                  aria-label="theme-mode"
                  name="theme-mode"
                  value={preferences.mode}
                  onChange={e => updatePreference('mode', e.target.value)}
                >
                  <FormControlLabel 
                    value="light" 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LightModeIcon sx={{ mr: 1 }} />
                        Light
                      </Box>
                    } 
                  />
                  <FormControlLabel 
                    value="dark" 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DarkModeIcon sx={{ mr: 1 }} />
                        Dark
                      </Box>
                    } 
                  />
                </RadioGroup>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Font Family
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="font-family-label">Font Family</InputLabel>
                  <Select
                    labelId="font-family-label"
                    id="font-family"
                    value={preferences.fontFamily}
                    label="Font Family"
                    onChange={e => updatePreference('fontFamily', e.target.value)}
                  >
                    <MenuItem value="Inter, Roboto, Arial">Inter (Default)</MenuItem>
                    <MenuItem value="'Roboto', Arial, sans-serif">Roboto</MenuItem>
                    <MenuItem value="'Open Sans', Arial, sans-serif">Open Sans</MenuItem>
                    <MenuItem value="'Arial', sans-serif">Arial</MenuItem>
                    <MenuItem value="'Times New Roman', serif">Times New Roman</MenuItem>
                  </Select>
                </FormControl>
                
                <Typography variant="body2" sx={{ mb: 2, fontFamily: preferences.fontFamily }}>
                  This is a preview of the selected font family.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Theme Preview
                </Typography>
                
                <Box sx={{ 
                  p: 2, 
                  bgcolor: preferences.mode === 'dark' ? '#121212' : '#ffffff',
                  color: preferences.mode === 'dark' ? '#ffffff' : '#000000',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  fontFamily: preferences.fontFamily
                }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: preferences.mode === 'dark' ? '#ffffff' : '#000000',
                      fontFamily: 'inherit',
                      mb: 1
                    }}
                  >
                    Preview
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: preferences.mode === 'dark' ? '#e0e0e0' : '#212121',
                      fontFamily: 'inherit',
                      mb: 2
                    }}
                  >
                    This is how content will appear with your current settings.
                  </Typography>
                  
                  <Button 
                    variant="contained" 
                    sx={{ 
                      bgcolor: preferences.mode === 'dark' ? '#1976d2' : '#0066cc',
                      color: '#ffffff',
                      mr: 1
                    }}
                  >
                    Primary Button
                  </Button>
                  
                  <Button 
                    variant="outlined"
                    sx={{ 
                      color: preferences.mode === 'dark' ? '#90caf9' : '#0066cc',
                      borderColor: preferences.mode === 'dark' ? '#90caf9' : '#0066cc'
                    }}
                  >
                    Secondary Button
                  </Button>
                </Box>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  Your appearance settings can be changed at any time.
                </Alert>
              </Paper>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              onClick={savePreferences}
              color="primary"
            >
              Save Settings
            </Button>
          </Box>
        </TabPanel>
        
        {/* Keyboard Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Keyboard Navigation Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Keyboard Focus
                </Typography>
                
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.keyboardMode}
                        onChange={e => updatePreference('keyboardMode', e.target.checked)}
                        name="keyboardMode"
                      />
                    }
                    label="Enhanced keyboard navigation"
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    Improves focus visibility and enables additional keyboard shortcuts
                  </Typography>
                  
                  <Box sx={{ py: 2 }}>
                    <Typography id="focus-indicator-size" gutterBottom>
                      Focus Indicator Size
                    </Typography>
                    <Slider
                      aria-labelledby="focus-indicator-size"
                      defaultValue={2}
                      step={1}
                      marks
                      min={1}
                      max={5}
                      valueLabelDisplay="auto"
                      disabled={!preferences.keyboardMode}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Controls the thickness of the focus outline for keyboard navigation
                    </Typography>
                  </Box>
                </FormGroup>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Keyboard Shortcuts
                </Typography>
                
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        defaultChecked
                        name="enableShortcuts"
                      />
                    }
                    label="Enable keyboard shortcuts"
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    Enables keyboard shortcuts for common actions
                  </Typography>
                </FormGroup>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Available Shortcuts
                </Typography>
                
                <Box sx={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto', 
                  border: '1px solid', 
                  borderColor: 'divider',
                  p: 2,
                  borderRadius: 1
                }}>
                  <Grid container spacing={1}>
                    {keyboardShortcuts.map((shortcut, index) => (
                      <Grid item xs={12} key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                          <Chip 
                            label={shortcut.key} 
                            size="small" 
                            variant="outlined" 
                            sx={{ minWidth: '80px', mr: 1 }}
                          />
                          <Typography variant="body2" sx={{ flexGrow: 1 }}>
                            {shortcut.description}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
                
                <Button 
                  variant="text" 
                  sx={{ mt: 2 }}
                >
                  View All Shortcuts
                </Button>
              </Paper>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              onClick={savePreferences}
              color="primary"
            >
              Save Settings
            </Button>
          </Box>
        </TabPanel>
        
        {/* Advanced Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Advanced Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Data & Privacy
                </Typography>
                
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        defaultChecked
                        name="saveSessionData"
                      />
                    }
                    label="Save session data"
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    Saves your work automatically as you edit
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        defaultChecked
                        name="savePreferencesBetweenSessions"
                      />
                    }
                    label="Remember preferences between sessions"
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    Remembers your settings between browser sessions
                  </Typography>
                </FormGroup>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center">
                  <SecurityIcon sx={{ mr: 1 }} />
                  Security Settings
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      defaultChecked
                      name="twoFactorAuth"
                    />
                  }
                  label="Two-factor authentication"
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                  Adds an extra layer of security to your account
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Danger Zone
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Button 
                      variant="outlined" 
                      color="error"
                      fullWidth
                    >
                      Reset All Settings
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      variant="outlined" 
                      color="error"
                      fullWidth
                    >
                      Delete Account Data
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              onClick={savePreferences}
              color="primary"
            >
              Save Settings
            </Button>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Settings;