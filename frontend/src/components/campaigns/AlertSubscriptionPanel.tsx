import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  FormControlLabel, 
  Switch, 
  Divider, 
  Button, 
  Chip,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import NotificationsIcon from '@mui/icons-material/Notifications';

interface AlertSubscriptionPanelProps {
  campaignId?: string;
}

const AlertSubscriptionPanel: React.FC<AlertSubscriptionPanelProps> = ({ campaignId }) => {
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [competitorAlertsEnabled, setCompetitorAlertsEnabled] = useState(true);
  const [benchmarkAlertsEnabled, setBenchmarkAlertsEnabled] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [customKeywords, setCustomKeywords] = useState<string[]>([
    'marketing automation', 
    'campaign management', 
    'marketing ROI', 
    'social analytics'
  ]);
  const [newKeyword, setNewKeyword] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState('');
  const [editingKeywordIndex, setEditingKeywordIndex] = useState<number | null>(null);
  const [frequency, setFrequency] = useState('daily');
  
  const handleAlertToggle = () => {
    setAlertsEnabled(!alertsEnabled);
  };
  
  const handleCompetitorAlertToggle = () => {
    setCompetitorAlertsEnabled(!competitorAlertsEnabled);
  };
  
  const handleBenchmarkAlertToggle = () => {
    setBenchmarkAlertsEnabled(!benchmarkAlertsEnabled);
  };
  
  const handleEmailToggle = () => {
    setEmailNotificationsEnabled(!emailNotificationsEnabled);
  };
  
  const handleAddKeyword = () => {
    if (newKeyword.trim() && !customKeywords.includes(newKeyword.trim())) {
      setCustomKeywords([...customKeywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };
  
  const handleDeleteKeyword = (index: number) => {
    const updatedKeywords = [...customKeywords];
    updatedKeywords.splice(index, 1);
    setCustomKeywords(updatedKeywords);
  };
  
  const handleOpenEditDialog = (keyword: string, index: number) => {
    setEditingKeyword(keyword);
    setEditingKeywordIndex(index);
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingKeyword('');
    setEditingKeywordIndex(null);
  };
  
  const handleUpdateKeyword = () => {
    if (editingKeywordIndex !== null && editingKeyword.trim() && !customKeywords.includes(editingKeyword.trim())) {
      const updatedKeywords = [...customKeywords];
      updatedKeywords[editingKeywordIndex] = editingKeyword.trim();
      setCustomKeywords(updatedKeywords);
      handleCloseDialog();
    }
  };
  
  const handleFrequencyChange = (event: SelectChangeEvent) => {
    setFrequency(event.target.value);
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
        <NotificationsIcon /> Benchmark Alert Settings
      </Typography>
      
      <FormControlLabel
        control={<Switch checked={alertsEnabled} onChange={handleAlertToggle} color="primary" />}
        label="Enable benchmark & competitor alerts"
        sx={{ mb: 2 }}
      />
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ opacity: alertsEnabled ? 1 : 0.5, pointerEvents: alertsEnabled ? 'auto' : 'none' }}>
        <Typography variant="subtitle1" gutterBottom>Alert Types</Typography>
        
        <FormControlLabel
          control={<Switch checked={competitorAlertsEnabled} onChange={handleCompetitorAlertToggle} color="primary" size="small" />}
          label="Competitor Ad Alerts"
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, pl: 4 }}>
          Get notified when competitors launch new ads or make significant changes
        </Typography>
        
        <FormControlLabel
          control={<Switch checked={benchmarkAlertsEnabled} onChange={handleBenchmarkAlertToggle} color="primary" size="small" />}
          label="Benchmark Deviation Alerts"
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, pl: 4 }}>
          Get notified when your performance deviates significantly from industry benchmarks
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>Notification Preferences</Typography>
        
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="alert-frequency-label">Alert Frequency</InputLabel>
            <Select
              labelId="alert-frequency-label"
              id="alert-frequency"
              value={frequency}
              label="Alert Frequency"
              onChange={handleFrequencyChange}
            >
              <MenuItem value="realtime">Real-time</MenuItem>
              <MenuItem value="daily">Daily Digest</MenuItem>
              <MenuItem value="weekly">Weekly Summary</MenuItem>
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={<Switch checked={emailNotificationsEnabled} onChange={handleEmailToggle} color="primary" size="small" />}
            label="Email Notifications"
          />
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>Keyword Monitoring</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Get alerted when competitors use these keywords in their ads
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Add keyword to monitor"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <IconButton 
            color="primary" 
            onClick={handleAddKeyword}
            disabled={!newKeyword.trim() || customKeywords.includes(newKeyword.trim())}
          >
            <AddIcon />
          </IconButton>
        </Box>
        
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <List dense>
            {customKeywords.map((keyword, index) => (
              <ListItem key={index}>
                <ListItemText primary={keyword} />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    size="small" 
                    onClick={() => handleOpenEditDialog(keyword, index)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    size="small" 
                    onClick={() => handleDeleteKeyword(index)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {customKeywords.length === 0 && (
              <ListItem>
                <ListItemText 
                  primary="No keywords added" 
                  primaryTypographyProps={{ color: 'text.secondary', fontStyle: 'italic' }}
                />
              </ListItem>
            )}
          </List>
        </Paper>
        
        <Button 
          variant="contained" 
          color="primary" 
          fullWidth
          onClick={() => alert('Preferences saved successfully!')}
        >
          Save Alert Preferences
        </Button>
      </Box>
      
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Edit Keyword</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            value={editingKeyword}
            onChange={(e) => setEditingKeyword(e.target.value)}
            placeholder="Keyword"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleUpdateKeyword} 
            variant="contained" 
            color="primary"
            disabled={!editingKeyword.trim() || (editingKeyword.trim() !== customKeywords[editingKeywordIndex || 0] && customKeywords.includes(editingKeyword.trim()))}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertSubscriptionPanel;