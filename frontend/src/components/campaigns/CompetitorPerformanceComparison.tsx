import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
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

interface CompetitorPerformanceComparisonProps {
  campaignData: any;
  competitors: CompetitorData[];
}

const CompetitorPerformanceComparison: React.FC<CompetitorPerformanceComparisonProps> = ({ 
  campaignData, 
  competitors 
}) => {
  const theme = useTheme();

  // Mock campaign performance data - in production this would come from API
  const campaignPerformance = {
    ctr: 3.2,
    cpc: 1.25,
    conversions: 520,
    conversionRate: 4.8,
    roas: 3.5
  };

  // Prepare data for charts
  const allCompetitors = [
    { name: 'Your Campaign', ...campaignPerformance },
    ...competitors.map(comp => ({
      name: comp.name,
      ...comp.performance,
      conversionRate: (comp.performance.conversions / (comp.performance.ctr * 1000)) * 100,
      roas: Math.random() * 2 + 1.5 // Mock data
    }))
  ];

  return (
    <Box>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.primary.light }}>
              <TableCell><Typography variant="subtitle2">Campaign</Typography></TableCell>
              <TableCell align="right"><Typography variant="subtitle2">CTR (%)</Typography></TableCell>
              <TableCell align="right"><Typography variant="subtitle2">CPC ($)</Typography></TableCell>
              <TableCell align="right"><Typography variant="subtitle2">Conversions</Typography></TableCell>
              <TableCell align="right"><Typography variant="subtitle2">Conv. Rate (%)</Typography></TableCell>
              <TableCell align="right"><Typography variant="subtitle2">ROAS</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allCompetitors.map((row, index) => (
              <TableRow 
                key={index}
                sx={{ 
                  '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover },
                  ...(index === 0 ? { backgroundColor: theme.palette.primary.lighter || 'rgba(0, 0, 255, 0.08)' } : {})
                }}
              >
                <TableCell component="th" scope="row">
                  <Typography variant="body2" fontWeight={index === 0 ? 'bold' : 'normal'}>
                    {row.name}
                  </Typography>
                </TableCell>
                <TableCell align="right">{row.ctr.toFixed(1)}</TableCell>
                <TableCell align="right">${row.cpc.toFixed(2)}</TableCell>
                <TableCell align="right">{row.conversions}</TableCell>
                <TableCell align="right">{row.conversionRate.toFixed(1)}</TableCell>
                <TableCell align="right">{row.roas.toFixed(1)}x</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="subtitle2" gutterBottom>Key Metrics Comparison</Typography>
      <Box sx={{ height: 300, width: '100%' }}>
        <BarChart
          xAxis={[{ 
            scaleType: 'band', 
            data: allCompetitors.map(c => c.name) 
          }]}
          series={[
            { 
              data: allCompetitors.map(c => c.ctr),
              label: 'CTR (%)'
            }
          ]}
          height={300}
        />
      </Box>
    </Box>
  );
};

export default CompetitorPerformanceComparison;