import React, { useMemo, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  TooltipProps,
  ReferenceArea,
  ReferenceLine,
  ReferenceDot
} from 'recharts';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  useTheme, 
  IconButton, 
  Menu, 
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Chip
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import DownloadIcon from '@mui/icons-material/Download';
import SettingsIcon from '@mui/icons-material/Settings';
import { format } from 'date-fns';

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  [key: string]: any;
}

export interface ReferencePoint {
  date: string;
  value: number;
  label: string;
  color?: string;
}

export interface ComparePeriod {
  label: string;
  startDate: string;
  endDate: string;
  color?: string;
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
  referenceLines?: { value: number; label: string; color?: string }[];
  referencePoints?: ReferencePoint[];
  compareWith?: ComparePeriod;
  showControls?: boolean;
  annotations?: { date: string; text: string; color?: string }[];
  onExport?: (format: 'png' | 'svg' | 'csv') => void;
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
  referenceLines,
  referencePoints,
  compareWith,
  showControls = false,
  annotations,
  onExport,
}) => {
  const theme = useTheme();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: 'line' | 'area' | null,
  ) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };
  
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };
  
  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  const handleExport = (format: 'png' | 'svg' | 'csv') => {
    if (onExport) {
      onExport(format);
    }
    handleMenuClose();
  };

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
    <Card sx={{ height: isFullscreen ? '100vh' : '100%', position: isFullscreen ? 'fixed' : 'relative', top: 0, left: 0, right: 0, bottom: 0, zIndex: isFullscreen ? 1300 : 'auto' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: isFullscreen ? 3 : undefined }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
          
          {showControls && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ToggleButtonGroup
                size="small"
                value={chartType}
                exclusive
                onChange={handleChartTypeChange}
                aria-label="chart type"
                sx={{ mr: 1 }}
              >
                <ToggleButton value="line" aria-label="line chart">
                  Line
                </ToggleButton>
                <ToggleButton value="area" aria-label="area chart">
                  Area
                </ToggleButton>
              </ToggleButtonGroup>
              
              <IconButton size="small" onClick={handleZoomIn} sx={{ mr: 0.5 }}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
              
              <IconButton size="small" onClick={handleZoomOut} sx={{ mr: 0.5 }}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
              
              <IconButton size="small" onClick={handleFullscreen} sx={{ mr: 0.5 }}>
                <FullscreenIcon fontSize="small" />
              </IconButton>
              
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
              
              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => handleExport('png')}>Export as PNG</MenuItem>
                <MenuItem onClick={() => handleExport('svg')}>Export as SVG</MenuItem>
                <MenuItem onClick={() => handleExport('csv')}>Export as CSV</MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
        
        {compareWith && (
          <Box sx={{ mb: 2 }}>
            <Chip 
              label={`Comparing with: ${compareWith.label}`} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </Box>
        )}
        
        <Box sx={{ flexGrow: 1, width: '100%', height: typeof height === 'string' ? height : `${height}px`, transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 10, right: 30, left: 20, bottom: 25 }}
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
              
              {/* Draw compare period if provided */}
              {compareWith && (
                <ReferenceArea
                  x1={compareWith.startDate}
                  x2={compareWith.endDate}
                  strokeOpacity={0.3}
                  stroke={compareWith.color || theme.palette.primary.main}
                  fill={compareWith.color || theme.palette.primary.main}
                  fillOpacity={0.1}
                />
              )}
              
              {/* Draw reference lines if provided */}
              {referenceLines?.map((line, index) => (
                <ReferenceLine
                  key={`ref-line-${index}`}
                  y={line.value}
                  stroke={line.color || theme.palette.warning.main}
                  strokeDasharray="3 3"
                  label={{
                    value: line.label,
                    position: 'right',
                    fill: line.color || theme.palette.warning.main,
                    fontSize: 12
                  }}
                />
              ))}
              
              {/* Draw reference points if provided */}
              {referencePoints?.map((point, index) => (
                <ReferenceDot
                  key={`ref-point-${index}`}
                  x={point.date}
                  y={point.value}
                  r={6}
                  fill={point.color || theme.palette.error.main}
                  stroke="none"
                />
              ))}
              
              {/* Draw data lines */}
              {dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key}
                  stroke={chartColors[index % chartColors.length]}
                  fill={chartType === 'area' ? chartColors[index % chartColors.length] : undefined}
                  fillOpacity={chartType === 'area' ? 0.2 : 0}
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
        
        {/* Annotations section */}
        {annotations && annotations.length > 0 && (
          <Box sx={{ mt: 2, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" gutterBottom>
              Annotations:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {annotations.map((annotation, index) => (
                <Chip 
                  key={`annotation-${index}`}
                  label={`${format(new Date(annotation.date), 'MMM dd')}: ${annotation.text}`}
                  size="small"
                  sx={{ 
                    borderColor: annotation.color || theme.palette.info.main,
                    color: annotation.color || theme.palette.info.main
                  }}
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TimeSeriesChart;