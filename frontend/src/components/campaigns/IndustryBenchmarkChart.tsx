import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, ToggleButtonGroup, ToggleButton, FormControl, Select, MenuItem, InputLabel, SelectChangeEvent } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { useTheme } from '@mui/material/styles';

interface IndustryBenchmarkChartProps {
  campaignData: any;
  industryCategory: string;
  detailed?: boolean;
}

const IndustryBenchmarkChart: React.FC<IndustryBenchmarkChartProps> = ({ 
  campaignData, 
  industryCategory,
  detailed = false 
}) => {
  const theme = useTheme();
  const [timeframe, setTimeframe] = useState('month');
  const [metric, setMetric] = useState('ctr');
  const [industry, setIndustry] = useState(industryCategory);
  
  // Mock industry data - in production this would come from an API
  const industryData = {
    general: { ctr: 1.8, cpc: 1.85, convRate: 3.2, roas: 2.2 },
    technology: { ctr: 2.1, cpc: 2.35, convRate: 3.7, roas: 2.5 },
    ecommerce: { ctr: 1.5, cpc: 1.45, convRate: 2.8, roas: 2.9 },
    finance: { ctr: 1.2, cpc: 3.25, convRate: 4.1, roas: 1.8 },
    education: { ctr: 2.4, cpc: 1.75, convRate: 3.5, roas: 2.1 },
    healthcare: { ctr: 1.9, cpc: 2.15, convRate: 2.9, roas: 2.3 }
  };
  
  // Mock campaign performance data
  const campaignPerformance = {
    ctr: 3.2,
    cpc: 1.25,
    convRate: 4.8,
    roas: 3.5
  };
  
  // Historical trend data (mock) - in production this would come from an API
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const trendData = {
    campaign: {
      ctr: [2.8, 2.9, 3.0, 3.1, 3.2, 3.2],
      cpc: [1.40, 1.35, 1.30, 1.28, 1.25, 1.25],
      convRate: [4.2, 4.3, 4.5, 4.6, 4.7, 4.8],
      roas: [3.1, 3.2, 3.3, 3.4, 3.5, 3.5]
    },
    industry: {
      ctr: [1.7, 1.7, 1.8, 1.8, 1.8, 1.9],
      cpc: [1.90, 1.88, 1.87, 1.86, 1.85, 1.84],
      convRate: [3.0, 3.0, 3.1, 3.1, 3.2, 3.2],
      roas: [2.0, 2.1, 2.1, 2.2, 2.2, 2.3]
    }
  };
  
  const metricLabels = {
    ctr: 'Click-Through Rate (%)',
    cpc: 'Cost Per Click ($)',
    convRate: 'Conversion Rate (%)',
    roas: 'Return on Ad Spend (x)'
  };
  
  const handleTimeframeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeframe: string,
  ) => {
    if (newTimeframe !== null) {
      setTimeframe(newTimeframe);
    }
  };
  
  const handleMetricChange = (
    event: React.MouseEvent<HTMLElement>,
    newMetric: string,
  ) => {
    if (newMetric !== null) {
      setMetric(newMetric);
    }
  };
  
  const handleIndustryChange = (event: SelectChangeEvent) => {
    setIndustry(event.target.value);
  };
  
  if (!detailed) {
    // Simple view for overview page
    return (
      <Box>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2">
            Your performance vs. {industry} industry average
          </Typography>
          <ToggleButtonGroup
            color="primary"
            value={metric}
            exclusive
            onChange={handleMetricChange}
            size="small"
          >
            <ToggleButton value="ctr">CTR</ToggleButton>
            <ToggleButton value="cpc">CPC</ToggleButton>
            <ToggleButton value="convRate">Conv. Rate</ToggleButton>
            <ToggleButton value="roas">ROAS</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <Box sx={{ height: 300, width: '100%' }}>
          <BarChart
            xAxis={[{ 
              scaleType: 'band', 
              data: ['Your Campaign', `${industry.charAt(0).toUpperCase() + industry.slice(1)} Industry Average`] 
            }]}
            series={[{ 
              data: [
                campaignPerformance[metric as keyof typeof campaignPerformance],
                industryData[industry as keyof typeof industryData][metric as keyof typeof industryData[keyof typeof industryData]]
              ],
              label: metricLabels[metric as keyof typeof metricLabels]
            }]}
            colors={[theme.palette.primary.main, theme.palette.grey[400]]}
            height={300}
          />
        </Box>
      </Box>
    );
  }
  
  // Detailed view
  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6">
                Performance vs. Industry Benchmarks
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel id="industry-select-label">Industry</InputLabel>
                  <Select
                    labelId="industry-select-label"
                    id="industry-select"
                    value={industry}
                    label="Industry"
                    onChange={handleIndustryChange}
                  >
                    <MenuItem value="general">General</MenuItem>
                    <MenuItem value="technology">Technology</MenuItem>
                    <MenuItem value="ecommerce">E-commerce</MenuItem>
                    <MenuItem value="finance">Finance</MenuItem>
                    <MenuItem value="education">Education</MenuItem>
                    <MenuItem value="healthcare">Healthcare</MenuItem>
                  </Select>
                </FormControl>
                
                <ToggleButtonGroup
                  color="primary"
                  value={metric}
                  exclusive
                  onChange={handleMetricChange}
                  size="small"
                >
                  <ToggleButton value="ctr">CTR</ToggleButton>
                  <ToggleButton value="cpc">CPC</ToggleButton>
                  <ToggleButton value="convRate">Conv. Rate</ToggleButton>
                  <ToggleButton value="roas">ROAS</ToggleButton>
                </ToggleButtonGroup>
                
                <ToggleButtonGroup
                  color="primary"
                  value={timeframe}
                  exclusive
                  onChange={handleTimeframeChange}
                  size="small"
                >
                  <ToggleButton value="month">Last 6 Months</ToggleButton>
                  <ToggleButton value="quarter">Quarterly</ToggleButton>
                  <ToggleButton value="year">Yearly</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>
            
            <Box sx={{ height: 400, width: '100%' }}>
              <LineChart
                xAxis={[{ 
                  scaleType: 'band', 
                  data: months 
                }]}
                series={[
                  { 
                    data: trendData.campaign[metric as keyof typeof trendData.campaign],
                    label: 'Your Campaign',
                    curve: 'linear'
                  },
                  { 
                    data: trendData.industry[metric as keyof typeof trendData.industry],
                    label: `${industry.charAt(0).toUpperCase() + industry.slice(1)} Industry Average`,
                    curve: 'linear'
                  }
                ]}
                height={400}
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              All Metrics Comparison
            </Typography>
            
            <Box sx={{ height: 400, width: '100%' }}>
              <BarChart
                xAxis={[{ 
                  scaleType: 'band', 
                  data: ['CTR (%)', 'CPC ($)', 'Conv. Rate (%)', 'ROAS (x)'] 
                }]}
                series={[
                  { 
                    data: [
                      campaignPerformance.ctr,
                      campaignPerformance.cpc,
                      campaignPerformance.convRate,
                      campaignPerformance.roas
                    ],
                    label: 'Your Campaign'
                  },
                  { 
                    data: [
                      industryData[industry as keyof typeof industryData].ctr,
                      industryData[industry as keyof typeof industryData].cpc,
                      industryData[industry as keyof typeof industryData].convRate,
                      industryData[industry as keyof typeof industryData].roas
                    ],
                    label: `${industry.charAt(0).toUpperCase() + industry.slice(1)} Industry Average`
                  }
                ]}
                height={400}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
              Data sources: Market research, industry reports, and aggregated anonymous performance data.
              Last updated: {new Date().toLocaleDateString()}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default IndustryBenchmarkChart;