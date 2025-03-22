import React, { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import { format } from 'date-fns';

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  [key: string]: any;
}

interface TimeSeriesChartProps {
  title: string;
  description?: string;
  data: TimeSeriesDataPoint[];
  dataKeys: string[];
  colors?: string[];
  yAxisLabel?: string;
  xAxisLabel?: string;
  formatValue?: (value: number) => string;
  formatTooltip?: (value: number, name: string, entry: any) => React.ReactNode;
  height?: number | string;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  title,
  description,
  data,
  dataKeys,
  colors,
  yAxisLabel,
  xAxisLabel,
  formatValue = (value) => value.toString(),
  formatTooltip,
  height = 300,
}) => {
  const theme = useTheme();

  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
  ];

  const chartColors = colors || defaultColors;

  // Format the dates correctly for display
  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedDate: format(new Date(item.date), 'MMM dd')
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 1, border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Box key={`tooltip-${index}`} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
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
              <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                {entry.name}:
              </Typography>
              <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>
                {formatTooltip 
                  ? formatTooltip(entry.value as number, entry.name as string, entry) 
                  : formatValue(entry.value as number)}
              </Typography>
            </Box>
          ))}
        </Card>
      );
    }
    return null;
  };

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
            <LineChart
              data={formattedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                stroke={theme.palette.text.secondary} 
                label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -15 } : undefined}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke={theme.palette.text.secondary}
                tickFormatter={formatValue}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              {dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key}
                  stroke={chartColors[index % chartColors.length]}
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TimeSeriesChart;