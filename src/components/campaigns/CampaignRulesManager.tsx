import { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Grid,
  Alert,
  Divider
} from '@mui/material';
import {
  AutoFixHigh as AutoFixHighIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Speed as SpeedIcon,
  List as ListIcon
} from '@mui/icons-material';

import CampaignRulesList from './CampaignRulesList';
import ScheduledCampaignRules from './ScheduledCampaignRules';
import PerformanceThresholdsEditor from './PerformanceThresholdsEditor';
import CampaignRuleNotifications from './CampaignRuleNotifications';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rules-tabpanel-${index}`}
      aria-labelledby={`rules-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `rules-tab-${index}`,
    'aria-controls': `rules-tabpanel-${index}`,
  };
}

interface CampaignRulesManagerProps {
  campaignId: string;
  campaignName: string;
}

const CampaignRulesManager = ({ campaignId, campaignName }: CampaignRulesManagerProps) => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRuleSelected = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    setTabValue(3); // Switch to notifications tab
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          <AutoFixHighIcon sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
          Campaign Automation Rules
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage automation rules and triggers for campaign: <strong>{campaignName}</strong>
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="campaign rules tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            icon={<ListIcon />} 
            label="All Rules" 
            {...a11yProps(0)} 
          />
          <Tab 
            icon={<ScheduleIcon />} 
            label="Scheduled Rules" 
            {...a11yProps(1)} 
          />
          <Tab 
            icon={<SpeedIcon />} 
            label="Performance Thresholds" 
            {...a11yProps(2)} 
          />
          <Tab 
            icon={<NotificationsIcon />} 
            label="Notifications" 
            {...a11yProps(3)} 
            disabled={!selectedRuleId}
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <CampaignRulesList 
          campaignId={campaignId} 
          onSelectForNotifications={handleRuleSelected}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ScheduledCampaignRules campaignId={campaignId} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <PerformanceThresholdsEditor campaignId={campaignId} />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {selectedRuleId ? (
          <CampaignRuleNotifications ruleId={selectedRuleId} />
        ) : (
          <Alert severity="info">
            Please select a rule from the "All Rules" tab to configure notifications.
          </Alert>
        )}
      </TabPanel>
    </Paper>
  );
};

export default CampaignRulesManager;