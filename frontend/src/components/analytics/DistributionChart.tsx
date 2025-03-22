import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  TooltipProps
} from 'recharts';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';

export interface DistributionDataPoint {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

interface DistributionChartProps {
  title: string;
  description?: string;
  data: DistributionDataPoint[];
  colors?: string[];
  height?: number | string;
  formatValue?: (value: number) => string;
  formatPercentage?: (value: number) => string;
  showLegend?: boolean;
  centerLabel?: string | React.ReactNode;
}

const DistributionChart: React.FC<DistributionChartProps> = ({
  title,
  description,
  data,
  colors,
  height = 300,
  formatValue = (value) => value.toString(),
  formatPercentage = (value) => `${value.toFixed(1)}%`,
  showLegend = true,
  centerLabel,
}) => {
  const theme = useTheme();
  
  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    // Additional colors with modified shades
    theme.palette.primary.light,
    theme.palette.secondary.light,
    theme.palette.success.light,
    theme.palette.error.light,
    theme.palette.warning.light,
    theme.palette.info.light,
  ];
  
  const chartColors = colors || defaultColors;
  
  // Calculate percentages if not provided
  const processedData = React.useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map(item => ({
      ...item,
      percentage: item.percentage || (item.value / total * 100)
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const data = entry.payload as DistributionDataPoint;
      
      return (
        <Card sx={{ p: 1, border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {data.name}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 2 }}>
              Value:
            </Typography>
            <Typography variant="body2" component="span" sx={{ fontWeight: 'medium' }}>
              {formatValue(data.value)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 2 }}>
              Percentage:
            </Typography>
            <Typography variant="body2" component="span" sx={{ fontWeight: 'medium' }}>
              {formatPercentage(data.percentage || 0)}
            </Typography>
          </Box>
        </Card>
      );
    }
    return null;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mt: 2 }}>
        {payload.map((entry: any, index: number) => (
          <Box 
            key={`legend-${index}`} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mx: 1, 
              mb: 0.5 
            }}
          >
            <Box 
              component="span" 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                backgroundColor: entry.color, 
                display: 'inline-block',
                mr: 1 
              }} 
            />
            <Typography variant="body2" sx={{ mr: 0.5 }}>
              {entry.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ({formatPercentage(processedData.find(item => item.name === entry.value)?.percentage || 0)})
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  const CenterLabel = () => (
    <text 
      x="50%" 
      y="50%" 
      textAnchor="middle" 
      dominantBaseline="middle"
      style={{ 
        fontFamily: theme.typography.fontFamily, 
        fontSize: theme.typography.body1.fontSize,
        fill: theme.palette.text.primary
      }}
    >
      {centerLabel}
    </text>
  );

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" component="div" gutterBottom>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {description}
          </Typography>
        )}
        <Box sx={{ flexGrow: 1, width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius="80%"
                innerRadius="55%"
                paddingAngle={2}
                dataKey="value"
              >
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || chartColors[index % chartColors.length]} 
                  />
                ))}
                {centerLabel && <CenterLabel />}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend content={renderLegend} />}
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DistributionChart;