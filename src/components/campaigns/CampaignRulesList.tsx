import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Collapse,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  PlayArrow as PlayArrowIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PauseCircle as PauseCircleIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

import { AppDispatch } from '../../store';
import {
  fetchCampaignRules,
  fetchCampaignRuleById,
  deleteCampaignRule,
  updateCampaignRule,
  executeRuleManually,
  selectCampaignRules,
  selectCampaignRulesLoading,
  selectCampaignRulesError
} from '../../store/slices/campaignRulesSlice';
import { CampaignRule } from '../../services/campaignRulesService';

import RuleEditor from './RuleEditor';
import RuleExecutionHistory from './RuleExecutionHistory';
import NotificationSettings from './NotificationSettings';

interface CampaignRulesListProps {
  campaignId: string;
}

const CampaignRulesList = ({ campaignId }: CampaignRulesListProps) => {
  const dispatch = useDispatch<AppDispatch>();
  
  const rules = useSelector(selectCampaignRules);
  const loading = useSelector(selectCampaignRulesLoading);
  const error = useSelector(selectCampaignRulesError);
  
  const [openRuleEditor, setOpenRuleEditor] = useState(false);
  const [selectedRule, setSelectedRule] = useState<CampaignRule | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'notifications'>('history');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRule, setMenuRule] = useState<CampaignRule | null>(null);
  
  useEffect(() => {
    dispatch(fetchCampaignRules(campaignId));
  }, [dispatch, campaignId]);
  
  const handleAddRule = () => {
    setSelectedRule(null);
    setOpenRuleEditor(true);
  };
  
  const handleEditRule = (rule: CampaignRule) => {
    setSelectedRule(rule);
    setOpenRuleEditor(true);
  };
  
  const handleRuleEditorSave = () => {
    setOpenRuleEditor(false);
    dispatch(fetchCampaignRules(campaignId));
  };
  
  const handleRuleEditorCancel = () => {
    setOpenRuleEditor(false);
  };
  
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, rule: CampaignRule) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuRule(rule);
  };
  
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setMenuRule(null);
  };
  
  const handleToggleRuleStatus = (rule: CampaignRule) => {
    const newStatus = rule.status === 'active' ? 'inactive' : 'active';
    dispatch(updateCampaignRule({
      ruleId: rule.id,
      rule: { status: newStatus }
    })).then(() => {
      dispatch(fetchCampaignRules(campaignId));
    });
    handleCloseMenu();
  };
  
  const handleExecuteRule = (rule: CampaignRule) => {
    dispatch(executeRuleManually(rule.id)).then(() => {
      // Show the history tab for this rule
      setExpandedRule(rule.id);
      setActiveTab('history');
    });
    handleCloseMenu();
  };
  
  const handleDeleteRule = () => {
    if (menuRule) {
      dispatch(deleteCampaignRule(menuRule.id)).then(() => {
        dispatch(fetchCampaignRules(campaignId));
      });
    }
    setDeleteConfirmOpen(false);
    handleCloseMenu();
  };
  
  const toggleExpandRule = (ruleId: string) => {
    setExpandedRule(expandedRule === ruleId ? null : ruleId);
  };
  
  const getChipColorByStatus = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };
  
  const getIconByConditionType = (type: string) => {
    switch (type) {
      case 'metric_threshold':
        return <WarningIcon color="warning" />;
      case 'time_based':
        return <HistoryIcon color="info" />;
      case 'budget_depleted':
        return <WarningIcon color="error" />;
      case 'roi_based':
        return <TrendingUpIcon color="primary" />;
      default:
        return <WarningIcon />;
    }
  };
  
  const getIconByActionType = (type: string) => {
    switch (type) {
      case 'pause_campaign':
        return <PauseCircleIcon color="warning" />;
      case 'resume_campaign':
        return <PlayArrowIcon color="success" />;
      case 'adjust_budget':
        return <AccountBalanceWalletIcon color="primary" />;
      case 'notify':
        return <NotificationsIcon color="info" />;
      default:
        return <WarningIcon />;
    }
  };
  
  const getConditionDescription = (rule: CampaignRule) => {
    if (rule.condition_type === 'metric_threshold') {
      const operatorMap: Record<string, string> = {
        gt: 'greater than',
        lt: 'less than',
        eq: 'equal to',
        gte: 'greater than or equal to',
        lte: 'less than or equal to'
      };
      
      const operator = operatorMap[rule.condition_operator || 'gt'] || rule.condition_operator;
      
      return `When ${rule.condition_metric} is ${operator} ${rule.condition_value}`;
    } else if (rule.condition_type === 'budget_depleted') {
      return 'When campaign budget is 90% depleted';
    } else if (rule.condition_type === 'time_based') {
      if (rule.schedule_type === 'one_time') {
        return `On ${rule.schedule_start_date} at ${rule.schedule_time}`;
      } else if (rule.schedule_type === 'recurring') {
        const days = rule.schedule_days?.join(', ') || 'selected days';
        return `Every ${days} at ${rule.schedule_time}`;
      } else {
        return 'Based on schedule';
      }
    } else if (rule.condition_type === 'roi_based') {
      return `When ROI falls below ${rule.condition_value}%`;
    }
    
    return 'Custom condition';
  };
  
  const getActionDescription = (rule: CampaignRule) => {
    switch (rule.action_type) {
      case 'pause_campaign':
        return 'Pause campaign';
      case 'resume_campaign':
        return 'Resume campaign';
      case 'adjust_budget':
        return `Adjust budget by ${rule.action_value}%`;
      case 'notify':
        return 'Send notification only';
      default:
        return 'Custom action';
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Campaign Automation Rules
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddRule}
        >
          Add Rule
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : rules.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No automation rules yet
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Create rules to automate campaign management based on performance metrics, budget, or schedule.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddRule}
          >
            Create Your First Rule
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {rules.map((rule) => (
            <Grid item xs={12} key={rule.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6">
                          {rule.name}
                        </Typography>
                        <Chip
                          label={rule.status.charAt(0).toUpperCase() + rule.status.slice(1)}
                          color={getChipColorByStatus(rule.status)}
                          size="small"
                        />
                      </Box>
                      {rule.description && (
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {rule.description}
                        </Typography>
                      )}
                    </Box>
                    <IconButton onClick={(e) => handleOpenMenu(e, rule)}>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getIconByConditionType(rule.condition_type)}
                        <Typography variant="body2">
                          <strong>Condition:</strong> {getConditionDescription(rule)}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getIconByActionType(rule.action_type)}
                        <Typography variant="body2">
                          <strong>Action:</strong> {getActionDescription(rule)}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      {rule.last_triggered_at ? (
                        <Typography variant="body2">
                          <strong>Last triggered:</strong> {format(parseISO(rule.last_triggered_at), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Never triggered
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
                
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => handleEditRule(rule)}
                    startIcon={<EditIcon />}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleExecuteRule(rule)}
                    startIcon={<PlayArrowIcon />}
                  >
                    Run Now
                  </Button>
                  <Button
                    size="small"
                    onClick={() => toggleExpandRule(rule.id)}
                    endIcon={
                      <ExpandMoreIcon
                        sx={{
                          transform: expandedRule === rule.id ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                        }}
                      />
                    }
                  >
                    {expandedRule === rule.id ? 'Hide Details' : 'Show Details'}
                  </Button>
                </CardActions>
                
                <Collapse in={expandedRule === rule.id} timeout="auto" unmountOnExit>
                  <Divider />
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                      <Button
                        variant={activeTab === 'history' ? 'contained' : 'text'}
                        onClick={() => setActiveTab('history')}
                        sx={{ mr: 1 }}
                      >
                        Execution History
                      </Button>
                      <Button
                        variant={activeTab === 'notifications' ? 'contained' : 'text'}
                        onClick={() => setActiveTab('notifications')}
                      >
                        Notification Settings
                      </Button>
                    </Box>
                    
                    {activeTab === 'history' ? (
                      <RuleExecutionHistory campaignId={campaignId} ruleId={rule.id} />
                    ) : (
                      <NotificationSettings ruleId={rule.id} />
                    )}
                  </Box>
                </Collapse>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Rule Editor Dialog */}
      <Dialog open={openRuleEditor} onClose={handleRuleEditorCancel} maxWidth="md" fullWidth>
        <DialogContent>
          <RuleEditor
            campaignId={campaignId}
            rule={selectedRule}
            onSave={handleRuleEditorSave}
            onCancel={handleRuleEditorCancel}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this rule? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteRule} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
      
      {/* Rule Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleEditRule(menuRule!)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Rule</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleToggleRuleStatus(menuRule!)}>
          <ListItemIcon>
            {menuRule?.status === 'active' ? (
              <PauseCircleIcon fontSize="small" />
            ) : (
              <PlayArrowIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {menuRule?.status === 'active' ? 'Deactivate Rule' : 'Activate Rule'}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExecuteRule(menuRule!)}>
          <ListItemIcon>
            <PlayArrowIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Run Now</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setDeleteConfirmOpen(true)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" primaryTypographyProps={{ color: 'error' }} />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CampaignRulesList;