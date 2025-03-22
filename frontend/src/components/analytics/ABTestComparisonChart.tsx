import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LabelList,
  TooltipProps
} from 'recharts';
import { Card, CardContent, Typography, Box, useTheme, Chip, Grid } from '@mui/material';

export interface ABTestVariant {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface ABTestMetric {
  name: string;
  key: string;
  formatter?: (value: number) => string;
  higherIsBetter?: boolean;
}

export interface ABTestResult {
  variant: string;
  [key: string]: any; // Metrics like clickRate, conversionRate, etc.
}

interface ABTestComparisonChartProps {
  title: string;
  description?: string;
  variants: ABTestVariant[];
  metrics: ABTestMetric[];
  results: ABTestResult[];
  height?: number | string;
  showRelativeChange?: boolean;
  confidenceThreshold?: number;
  selectedMetric?: string;
  onSelectMetric?: (metric: string) => void;
}

const ABTestComparisonChart: React.FC<ABTestComparisonChartProps> = ({
  title,
  description,
  variants,
  metrics,
  results,
  height = 400,
  showRelativeChange = true,
  confidenceThreshold = 95,
  selectedMetric,
  onSelectMetric,
}) => {
  const theme = useTheme();
  
  // Default to the first metric if none selected
  const activeMetric = selectedMetric || metrics[0]?.key;
  
  // Calculate statistics for the selected metric
  const activeMetricObj = metrics.find(m => m.key === activeMetric);
  const formatter = activeMetricObj?.formatter || ((value: number) => `${value.toFixed(2)}`);
  const higherIsBetter = activeMetricObj?.higherIsBetter !== false; // Default to true
  
  // Find baseline variant (typically the first one or one named 'control')
  const baselineVariant = variants.find(v => v.name.toLowerCase() === 'control') || variants[0];
  
  // Calculate baseline value for the selected metric
  const baselineResult = results.find(r => r.variant === baselineVariant.id);
  const baselineValue = baselineResult ? baselineResult[activeMetric] : 0;
  
  // Process data for chart
  const chartData = variants.map(variant => {
    const result = results.find(r => r.variant === variant.id) || { variant: variant.id };
    const value = result[activeMetric] || 0;
    const isBaseline = variant.id === baselineVariant.id;
    
    // Calculate lift compared to baseline
    let lift = 0;
    let liftPercent = 0;
    
    if (!isBaseline && baselineValue !== 0) {
      lift = value - baselineValue;
      liftPercent = (lift / baselineValue) * 100;
    }
    
    // Determine if the difference is statistically significant
    // In a real app, this would likely come from the backend with proper statistical testing
    const isSignificant = !isBaseline && (Math.abs(liftPercent) > 5);
    
    return {
      name: variant.name,
      variantId: variant.id,
      value,
      lift,
      liftPercent,
      isBaseline,
      isSignificant,
      isPositive: higherIsBetter ? lift > 0 : lift < 0,
    };
  });
  
  // Function to get the appropriate color for the lift value
  const getLiftColor = (liftPercent: number, isSignificant: boolean) => {
    if (!isSignificant) return theme.palette.text.secondary;
    
    const isPositive = (higherIsBetter && liftPercent > 0) || (!higherIsBetter && liftPercent < 0);
    return isPositive ? theme.palette.success.main : theme.palette.error.main;
  };
  
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const data = entry.payload;
      
      return (
        <Card sx={{ p: 1, border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {data.name}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 2 }}>
              {activeMetricObj?.name || activeMetric}:
            </Typography>
            <Typography variant="body2" component="span" sx={{ fontWeight: 'medium' }}>
              {formatter(data.value)}
            </Typography>
          </Box>
          
          {!data.isBaseline && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 2 }}>
                  Change vs Control:
                </Typography>
                <Typography 
                  variant="body2" 
                  component="span" 
                  sx={{ 
                    fontWeight: 'medium',
                    color: getLiftColor(data.liftPercent, data.isSignificant)
                  }}
                >
                  {data.liftPercent >= 0 ? '+' : ''}{data.liftPercent.toFixed(2)}%
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 2 }}>
                  Significant:
                </Typography>
                <Typography variant="body2" component="span" sx={{ fontWeight: 'medium' }}>
                  {data.isSignificant ? 'Yes' : 'No'}
                </Typography>
              </Box>
            </>
          )}
        </Card>
      );
    }
    return null;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="div" gutterBottom>
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {metrics.map(metric => (
              <Chip 
                key={metric.key}
                label={metric.name}
                color={metric.key === activeMetric ? 'primary' : 'default'}
                onClick={() => onSelectMetric && onSelectMetric(metric.key)}
                size="small"
              />
            ))}
          </Box>
        </Box>
        
        <Box sx={{ 
          flexGrow: 1,
          width: '100%', 
          height: typeof height === 'string' ? height : `${height}px`,
        }}>
          <ResponsiveContainer width="100%" height="70%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                stroke={theme.palette.text.secondary}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke={theme.palette.text.secondary}
                tickFormatter={formatter}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                fill={theme.palette.primary.main} 
                barSize={50}
              >
                <LabelList dataKey="value" position="top" formatter={formatter} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          {showRelativeChange && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Relative Change vs Control ({baselineVariant.name})
              </Typography>
              <Grid container spacing={2}>
                {chartData.filter(d => !d.isBaseline).map((variant) => (
                  <Grid item xs={12} sm={6} md={4} key={variant.variantId}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      p: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      backgroundColor: theme.palette.background.paper
                    }}>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {variant.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: getLiftColor(variant.liftPercent, variant.isSignificant)
                        }}
                      >
                        {variant.liftPercent >= 0 ? '+' : ''}{variant.liftPercent.toFixed(2)}%
                        {variant.isSignificant && (
                          <Box 
                            component="span" 
                            sx={{ 
                              display: 'inline-block',
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: variant.isPositive ? theme.palette.success.main : theme.palette.error.main,
                              ml: 0.5
                            }}
                          />
                        )}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ABTestComparisonChart;