import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  AlertTitle,
  CircularProgress,
  Divider,
  Chip,
  Tooltip,
  IconButton,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

import { AppDispatch } from '../../store';
import {
  getCampaignPerformanceThresholds,
  updateCampaignPerformanceThresholds,
  selectPerformanceThresholds,
  selectPerformanceThresholdsLoading
} from '../../store/slices/campaignRulesSlice';

interface PerformanceThresholdsEditorProps {
  campaignId: string;
}

const PerformanceThresholdsEditor = ({ campaignId }: PerformanceThresholdsEditorProps) => {
  const dispatch = useDispatch<AppDispatch>();
  
  const thresholds = useSelector((state: any) => selectPerformanceThresholds(state, campaignId));
  const loading = useSelector(selectPerformanceThresholdsLoading);
  
  const [formData, setFormData] = useState<Record<string, number>>({
    ctr: 0,
    cpc: 0,
    cpa: 0,
    roas: 0,
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0
  });
  
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch existing thresholds
  useEffect(() => {
    dispatch(getCampaignPerformanceThresholds(campaignId));
  }, [dispatch, campaignId]);
  
  // Initialize form when thresholds are fetched
  useEffect(() => {
    if (thresholds) {
      setFormData(thresholds);
    }
  }, [thresholds]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseFloat(value) || 0
    });
    
    // Clear success message when form is changed
    setSaved(false);
  };
  
  const handleSave = async () => {
    try {
      await dispatch(updateCampaignPerformanceThresholds({
        campaignId,
        thresholds: formData
      }));
      setSaved(true);
      setError(null);
      
      // Hide success message after a few seconds
      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save performance thresholds');
    }
  };
  
  const handleRefresh = () => {
    dispatch(getCampaignPerformanceThresholds(campaignId));
  };
  
  const metricDescriptions: Record<string, string> = {
    ctr: 'Click-Through Rate (%)',
    cpc: 'Cost Per Click (£)',
    cpa: 'Cost Per Acquisition (£)',
    roas: 'Return On Ad Spend (ratio)',
    spend: 'Daily Spend (£)',
    impressions: 'Impressions (count)',
    clicks: 'Clicks (count)',
    conversions: 'Conversions (count)'
  };
  
  const formatMetricName = (key: string): string => {
    return metricDescriptions[key] || key;
  };
  
  if (loading && !thresholds) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <SpeedIcon sx={{ mr: 1 }} />
          Performance Thresholds
        </Typography>
        
        <Tooltip title="Refresh thresholds">
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>About Performance Thresholds</AlertTitle>
        These thresholds are used to determine when campaign rules should automatically resume paused campaigns.
        When an auto-resume rule is configured with a performance threshold, the campaign will only resume if
        the metric has improved by at least the percentage specified below.
      </Alert>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Metric</TableCell>
              <TableCell>Improvement Threshold (%)</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(formData).map((key) => (
              <TableRow key={key}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      {key.toUpperCase()}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <TextField
                    name={key}
                    type="number"
                    value={formData[key]}
                    onChange={handleInputChange}
                    InputProps={{
                      endAdornment: '%',
                    }}
                    sx={{ width: '120px' }}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {formatMetricName(key)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={loading}
        >
          Save Thresholds
        </Button>
      </Box>
      
      {saved && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Performance thresholds saved successfully!
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
};

export default PerformanceThresholdsEditor;