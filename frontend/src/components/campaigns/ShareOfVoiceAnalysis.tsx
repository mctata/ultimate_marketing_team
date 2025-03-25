import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '@mui/material/styles';

interface CompetitorData {
  id: string;
  name: string;
  shareOfVoice: number;
  performance: {
    ctr: number;
    cpc: number;
    conversions: number;
  };
}

interface ShareOfVoiceAnalysisProps {
  campaignData: any;
  competitors: CompetitorData[];
  detailed?: boolean;
}

const ShareOfVoiceAnalysis: React.FC<ShareOfVoiceAnalysisProps> = ({ 
  campaignData, 
  competitors,
  detailed = false 
}) => {
  const theme = useTheme();

  // Prepare data for pie chart
  const pieData = [
    { id: 0, value: campaignData.shareOfVoice || 35, label: 'Your Campaign' },
    ...competitors.map((comp, index) => ({
      id: index + 1,
      value: comp.shareOfVoice,
      label: comp.name
    }))
  ];

  // Prepare data for monthly trend chart (only shown in detailed view)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  // Mock data for voice share trend - in production this would come from an API
  const trendData = {
    your: [30, 32, 33, 35, 36, 35],
    comp1: [28, 27, 28, 27, 29, 28],
    comp2: [20, 18, 17, 16, 17, 18],
    comp3: [12, 13, 12, 11, 10, 12],
    other: [10, 10, 10, 11, 8, 7]
  };

  const keywordAnalysis = {
    total: 250,
    ranking: {
      top3: 35,
      top10: 120,
      above50: 95
    },
    trendingKeywords: [
      { keyword: 'digital marketing tools', position: 2, volume: 5400 },
      { keyword: 'marketing automation', position: 5, volume: 3200 },
      { keyword: 'social media campaigns', position: 7, volume: 2900 },
      { keyword: 'email marketing platform', position: 12, volume: 1800 },
      { keyword: 'campaign analytics', position: 15, volume: 1500 }
    ]
  };

  if (!detailed) {
    return (
      <Box>
        <Box sx={{ height: 300, width: '100%' }}>
          <PieChart
            series={[
              {
                data: pieData,
                innerRadius: 30,
                outerRadius: 100,
                paddingAngle: 1,
                cornerRadius: 5,
                startAngle: -90,
                endAngle: 270,
                cx: 150,
                cy: 150,
              },
            ]}
            slotProps={{
              legend: { 
                direction: 'column',
                position: { vertical: 'middle', horizontal: 'right' },
                padding: 20,
              },
            }}
            height={300}
          />
        </Box>
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Current share of voice compared to top competitors
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Current Share of Voice</Typography>
            <Box sx={{ height: 300, width: '100%' }}>
              <PieChart
                series={[
                  {
                    data: pieData,
                    innerRadius: 30,
                    outerRadius: 100,
                    paddingAngle: 1,
                    cornerRadius: 5,
                  },
                ]}
                height={300}
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Share of Voice by Channel</Typography>
            <Box sx={{ height: 300, width: '100%' }}>
              <BarChart
                xAxis={[{ 
                  scaleType: 'band', 
                  data: ['Search', 'Social', 'Display', 'Video'] 
                }]}
                series={[
                  { data: [40, 30, 35, 25], label: 'Your Campaign' },
                  { data: [30, 40, 20, 30], label: competitors[0]?.name || 'Competitor A' },
                  { data: [20, 25, 30, 15], label: competitors[1]?.name || 'Competitor B' }
                ]}
                height={300}
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Monthly Trend</Typography>
            <Box sx={{ height: 400, width: '100%' }}>
              <BarChart
                xAxis={[{ scaleType: 'band', data: months }]}
                series={[
                  { data: trendData.your, label: 'Your Campaign' },
                  { data: trendData.comp1, label: competitors[0]?.name || 'Competitor A' },
                  { data: trendData.comp2, label: competitors[1]?.name || 'Competitor B' },
                  { data: trendData.comp3, label: competitors[2]?.name || 'Competitor C' },
                  { data: trendData.other, label: 'Others' },
                ]}
                height={350}
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Keyword Position Distribution</Typography>
            <Box sx={{ height: 300, width: '100%' }}>
              <PieChart
                series={[
                  {
                    data: [
                      { id: 0, value: keywordAnalysis.ranking.top3, label: 'Top 3' },
                      { id: 1, value: keywordAnalysis.ranking.top10 - keywordAnalysis.ranking.top3, label: 'Top 4-10' },
                      { id: 2, value: keywordAnalysis.ranking.above50 - keywordAnalysis.ranking.top10, label: 'Top 11-50' },
                    ],
                    innerRadius: 30,
                    outerRadius: 100,
                    paddingAngle: 1,
                    cornerRadius: 5,
                  },
                ]}
                height={300}
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Top Performing Keywords</Typography>
            <Box sx={{ mt: 2 }}>
              {keywordAnalysis.trendingKeywords.map((keyword, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, p: 1, backgroundColor: index % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'transparent' }}>
                  <Typography variant="body2" sx={{ flex: 3 }}>{keyword.keyword}</Typography>
                  <Typography variant="body2" sx={{ flex: 1, textAlign: 'center' }}>Position: {keyword.position}</Typography>
                  <Typography variant="body2" sx={{ flex: 1, textAlign: 'right' }}>Volume: {keyword.volume.toLocaleString()}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ShareOfVoiceAnalysis;