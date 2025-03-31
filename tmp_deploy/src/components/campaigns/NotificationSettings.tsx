import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Button,
  Grid,
  Divider,
  FormHelperText,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import { AppDispatch } from '../../store';
import {
  fetchNotificationConfig,
  updateNotificationConfig,
  selectNotificationConfig,
  selectNotificationsLoading
} from '../../store/slices/campaignRulesSlice';

interface NotificationSettingsProps {
  ruleId: string;
}

const NotificationSettings = ({ ruleId }: NotificationSettingsProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const notificationConfig = useSelector((state) => selectNotificationConfig(state, ruleId));
  const loading = useSelector(selectNotificationsLoading);
  
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [notificationType, setNotificationType] = useState<'email' | 'sms' | 'in_app' | 'slack'>('email');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  useEffect(() => {
    dispatch(fetchNotificationConfig(ruleId));
  }, [dispatch, ruleId]);
  
  useEffect(() => {
    if (notificationConfig) {
      setRecipients(notificationConfig.recipients || []);
      setNotificationType(notificationConfig.notification_type || 'email');
      setMessageTemplate(notificationConfig.message_template || '');
    }
  }, [notificationConfig]);
  
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const validatePhoneNumber = (phone: string) => {
    return /^\+?[1-9]\d{1,14}$/.test(phone);
  };
  
  const validateRecipient = (recipient: string): boolean => {
    if (notificationType === 'email') {
      return validateEmail(recipient);
    } else if (notificationType === 'sms') {
      return validatePhoneNumber(recipient);
    } else if (notificationType === 'slack') {
      return recipient.startsWith('#') || recipient.startsWith('@');
    }
    return true;
  };
  
  const handleAddRecipient = () => {
    if (!newRecipient.trim()) {
      setErrors({ ...errors, recipient: 'Recipient cannot be empty' });
      return;
    }
    
    if (!validateRecipient(newRecipient)) {
      setErrors({ 
        ...errors, 
        recipient: notificationType === 'email' 
          ? 'Please enter a valid email address' 
          : notificationType === 'sms'
            ? 'Please enter a valid phone number'
            : notificationType === 'slack'
              ? 'Please enter a valid Slack channel (#channel) or user (@user)'
              : 'Invalid recipient format'
      });
      return;
    }
    
    setRecipients([...recipients, newRecipient]);
    setNewRecipient('');
    setErrors({ ...errors, recipient: '' });
  };
  
  const handleRemoveRecipient = (index: number) => {
    const newRecipients = [...recipients];
    newRecipients.splice(index, 1);
    setRecipients(newRecipients);
  };
  
  const handleNotificationTypeChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setNotificationType(e.target.value as 'email' | 'sms' | 'in_app' | 'slack');
    setRecipients([]);
    setNewRecipient('');
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (recipients.length === 0) {
      newErrors.recipients = 'At least one recipient is required';
    }
    
    if (!messageTemplate.trim()) {
      newErrors.messageTemplate = 'Message template is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      await dispatch(updateNotificationConfig({
        ruleId,
        config: {
          notification_type: notificationType,
          recipients,
          message_template: messageTemplate
        }
      }));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };
  
  const getRecipientPlaceholder = () => {
    switch (notificationType) {
      case 'email':
        return 'Email address';
      case 'sms':
        return 'Phone number';
      case 'slack':
        return '#channel or @username';
      default:
        return 'Recipient';
    }
  };
  
  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Notification Settings
        </Typography>
        <Tooltip title="Notifications will be sent when the rule is triggered">
          <InfoIcon color="action" />
        </Tooltip>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Notification Type</InputLabel>
              <Select
                value={notificationType}
                onChange={handleNotificationTypeChange}
                label="Notification Type"
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="in_app">In-App Notification</MenuItem>
                <MenuItem value="slack">Slack</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}>
              <Chip label="Recipients" />
            </Divider>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <TextField
                fullWidth
                label={getRecipientPlaceholder()}
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                error={!!errors.recipient}
                helperText={errors.recipient}
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddRecipient}
                sx={{ mt: 1 }}
              >
                Add
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              {notificationType === 'email' ? 'Email Recipients' :
               notificationType === 'sms' ? 'SMS Recipients' :
               notificationType === 'slack' ? 'Slack Channels/Users' :
               'Notification Recipients'}
            </Typography>
            
            {recipients.length === 0 ? (
              <Alert severity="info" sx={{ mt: 1 }}>
                No recipients added yet.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {recipients.map((recipient, index) => (
                  <Chip
                    key={index}
                    label={recipient}
                    onDelete={() => handleRemoveRecipient(index)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
            
            {errors.recipients && (
              <FormHelperText error>{errors.recipients}</FormHelperText>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}>
              <Chip label="Message Template" />
            </Divider>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Message Template"
              multiline
              rows={4}
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              error={!!errors.messageTemplate}
              helperText={errors.messageTemplate || "Use {{variable}} placeholders for dynamic content"}
            />
            <FormHelperText>
              Available variables: {{campaign_name}}, {{metric}}, {{threshold}}, {{current_value}}, {{action}}
            </FormHelperText>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSave}
              >
                Save Notification Settings
              </Button>
            </Box>
          </Grid>
          
          {saveSuccess && (
            <Grid item xs={12}>
              <Alert severity="success">
                Notification settings saved successfully!
              </Alert>
            </Grid>
          )}
        </Grid>
      )}
    </Paper>
  );
};

export default NotificationSettings;