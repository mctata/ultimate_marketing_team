import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Alert,
  AlertTitle,
  CircularProgress,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  NotificationsActive as NotificationsActiveIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import { AppDispatch } from '../../store';
import { 
  getNotificationConfig, 
  updateNotificationConfig, 
  selectNotificationConfig, 
  selectNotificationConfigLoading, 
  selectNotificationConfigError,
  clearNotificationConfig
} from '../../store/slices/campaignRulesSlice';
import { NotificationConfig } from '../../services/campaignRulesService';

interface CampaignRuleNotificationsProps {
  ruleId: string;
}

const CampaignRuleNotifications = ({ ruleId }: CampaignRuleNotificationsProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const config = useSelector(selectNotificationConfig);
  const loading = useSelector(selectNotificationConfigLoading);
  const error = useSelector(selectNotificationConfigError);
  
  const [formData, setFormData] = useState<Omit<NotificationConfig, 'rule_id'>>({
    notification_type: 'email',
    recipients: [],
    message_template: ''
  });
  
  const [recipient, setRecipient] = useState('');
  const [saved, setSaved] = useState(false);
  
  // Fetch notification configuration
  useEffect(() => {
    dispatch(getNotificationConfig(ruleId));
    
    // Clear notification config when unmounting
    return () => {
      dispatch(clearNotificationConfig());
    };
  }, [dispatch, ruleId]);
  
  // Initialize form when config is fetched
  useEffect(() => {
    if (config) {
      setFormData({
        notification_type: config.notification_type || 'email',
        recipients: config.recipients || [],
        message_template: config.message_template || ''
      });
    }
  }, [config]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({
        ...formData,
        [name]: value
      });
      
      // Clear success message when form is changed
      setSaved(false);
    }
  };
  
  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value);
  };
  
  const addRecipient = () => {
    if (recipient && !formData.recipients.includes(recipient)) {
      setFormData({
        ...formData,
        recipients: [...formData.recipients, recipient]
      });
      setRecipient('');
    }
  };
  
  const removeRecipient = (index: number) => {
    const newRecipients = [...formData.recipients];
    newRecipients.splice(index, 1);
    setFormData({
      ...formData,
      recipients: newRecipients
    });
  };
  
  const handleSave = async () => {
    try {
      await dispatch(updateNotificationConfig({
        ruleId,
        config: formData
      }));
      setSaved(true);
      
      // Hide success message after a few seconds
      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving notification config:', error);
    }
  };
  
  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <EmailIcon />;
      case 'sms':
        return <SmsIcon />;
      case 'in_app':
        return <MessageIcon />;
      case 'slack':
        return <NotificationsIcon />;
      default:
        return <NotificationsIcon />;
    }
  };
  
  const getRecipientPlaceholder = (type: string) => {
    switch (type) {
      case 'email':
        return 'Enter email address...';
      case 'sms':
        return 'Enter phone number...';
      case 'in_app':
        return 'Enter user ID...';
      case 'slack':
        return 'Enter Slack channel or user ID...';
      default:
        return 'Enter recipient...';
    }
  };
  
  const getRecipientLabel = (type: string) => {
    switch (type) {
      case 'email':
        return 'Email Recipients';
      case 'sms':
        return 'SMS Recipients';
      case 'in_app':
        return 'In-App Recipients';
      case 'slack':
        return 'Slack Recipients';
      default:
        return 'Recipients';
    }
  };
  
  const getMessagePlaceholder = (type: string) => {
    switch (type) {
      case 'email':
        return 'Email message template... Use {{variable}} for dynamic content';
      case 'sms':
        return 'SMS message... Keep it concise';
      case 'in_app':
        return 'In-app notification message...';
      case 'slack':
        return 'Slack message... You can use Slack markdown';
      default:
        return 'Notification message...';
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Error loading notification configuration</AlertTitle>
        {error}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <NotificationsActiveIcon sx={{ mr: 1 }} />
        Notification Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Notification Type</InputLabel>
            <Select
              name="notification_type"
              value={formData.notification_type}
              onChange={handleInputChange}
              label="Notification Type"
              startAdornment={
                <Box sx={{ mr: 1 }}>
                  {getNotificationTypeIcon(formData.notification_type)}
                </Box>
              }
            >
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
              <MenuItem value="in_app">In-App</MenuItem>
              <MenuItem value="slack">Slack</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            {getRecipientLabel(formData.notification_type)}
          </Typography>
          
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={recipient}
              onChange={handleRecipientChange}
              placeholder={getRecipientPlaceholder(formData.notification_type)}
              sx={{ mr: 1 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addRecipient}
              disabled={!recipient}
            >
              Add
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {formData.recipients.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No recipients added yet. Add recipients to receive notifications.
              </Typography>
            ) : (
              formData.recipients.map((r, index) => (
                <Chip
                  key={index}
                  label={r}
                  onDelete={() => removeRecipient(index)}
                  icon={getNotificationTypeIcon(formData.notification_type)}
                />
              ))
            )}
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Message Template
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            name="message_template"
            value={formData.message_template}
            onChange={handleInputChange}
            placeholder={getMessagePlaceholder(formData.notification_type)}
            helperText="You can use {{rule_name}}, {{campaign_name}}, {{trigger_condition}}, {{action_taken}}, {{date}} as placeholders."
          />
        </Grid>
        
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>Available Variables</AlertTitle>
            <Typography variant="body2">
              <strong>{{rule_name}}</strong> - Name of the rule<br />
              <strong>{{campaign_name}}</strong> - Name of the campaign<br />
              <strong>{{trigger_condition}}</strong> - The condition that triggered the rule<br />
              <strong>{{action_taken}}</strong> - The action that was taken<br />
              <strong>{{date}}</strong> - Date and time when the rule was triggered<br />
              <strong>{{metrics}}</strong> - Current campaign metrics
            </Typography>
          </Alert>
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading || formData.recipients.length === 0 || !formData.message_template}
            >
              Save Notification Settings
            </Button>
          </Box>
        </Grid>
        
        {saved && (
          <Grid item xs={12}>
            <Alert severity="success">
              Notification settings successfully saved!
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default CampaignRuleNotifications;