import React, { useMemo, useState, useRef, useEffect } from 'react';
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
  Chip,
  Tooltip as MuiTooltip,
  Button,
  Dialog,
  DialogContent
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import AccessibilityIcon from '@mui/icons-material/Accessibility';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { format } from 'date-fns';
import { useChartAccessibility } from '../../context/ChartAccessibilityContext';
import AccessibleDataTable from './AccessibleDataTable';
import ChartAccessibilitySettings from './ChartAccessibilitySettings';
import { 
  useChartKeyboardNavigation, 
  addChartAriaAttributes, 
  makeTooltipAccessible 
} from '../../utils/chartKeyboardNavigation';

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
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const [activeDotInfo, setActiveDotInfo] = useState<{ dataIndex: number, dataKey?: string, value?: any } | null>(null);
  
  // Get accessibility configuration
  const { config, getColorBlindSafeColors, generateChartSummary } = useChartAccessibility();
  
  // Set up keyboard navigation for chart
  const { handleKeyDown, chartId, enabled: keyboardNavigationEnabled } = useChartKeyboardNavigation({
    chartRef: chartContainerRef,
    chartType: chartType,
    data,
    dataKeys,
    onFocusChange: (focusedItem) => {
      setActiveDotInfo(focusedItem);
    },
    onActivate: (item) => {
      // When a user activates an item with keyboard, show the information
      console.log('Item activated:', item);
      // You could trigger a tooltip or show additional information here
    }
  });
  
  // Make sure the data table is shown based on accessibility settings
  useEffect(() => {
    setShowDataTable(config.includeDataTableWithCharts);
  }, [config.includeDataTableWithCharts]);
  
  // Add ARIA attributes to chart container
  useEffect(() => {
    if (chartContainerRef.current) {
      addChartAriaAttributes(
        chartContainerRef.current, 
        title, 
        description || '', 
        chartType === 'area' ? 'area' : 'line'
      );
    }
  }, [title, description, chartType, chartContainerRef.current]);
  
  // Make tooltip accessible
  makeTooltipAccessible(tooltipRef, title);
  
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
  
  const toggleDataTable = () => {
    setShowDataTable(!showDataTable);
  };
  
  const toggleAccessibilitySettings = () => {
    setShowAccessibilitySettings(!showAccessibilitySettings);
  };

  // Get colors based on accessibility settings
  const getChartColors = () => {
    if (config.colorBlindMode !== 'none') {
      return getColorBlindSafeColors();
    }
    
    const defaultColors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.error.main,
      theme.palette.warning.main,
      theme.palette.info.main,
    ];
    
    return colors || defaultColors;
  };

  const chartColors = getChartColors();

  // Format the dates correctly for display
  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedDate: format(new Date(item.date), 'MMM dd')
    }));
  }, [data]);
  
  // Generate accessible data table columns
  const dataTableColumns = useMemo(() => {
    const columns = [
      { id: 'formattedDate', label: 'Date' },
      ...dataKeys.map(key => ({
        id: key,
        label: key,
        format: (value: any) => formatValue(value)
      }))
    ];
    
    return columns;
  }, [dataKeys, formatValue]);
  
  // Generate chart summary for screen readers
  const chartSummary = useMemo(() => {
    return generateChartSummary(title, data, 'timeSeries');
  }, [title, data, generateChartSummary]);

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <Card 
          sx={{ p: 1, border: `1px solid ${theme.palette.divider}` }}
          ref={tooltipRef}
          role="status"
          aria-live="polite"
        >
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
                  mr: 1, 
                  ...(config.patternFill ? {
                    backgroundImage: `linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, transparent 75%, transparent)`,
                    backgroundSize: '10px 10px'
                  } : {})
                }}
                role="presentation"
                aria-hidden="true"
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
    <>
      <Card 
        sx={{ 
          height: isFullscreen ? '100vh' : '100%', 
          position: isFullscreen ? 'fixed' : 'relative', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: isFullscreen ? 1300 : 'auto',
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '2px'
          }
        }}
      >
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: isFullscreen ? 3 : undefined }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box>
              <Typography variant="h6" component="h3" id={`${chartId}-title`}>
                {title}
              </Typography>
              {description && (
                <Typography variant="body2" color="text.secondary" id={`${chartId}-desc`}>
                  {description}
                </Typography>
              )}
              
              {/* Hidden description for screen readers with more verbose information */}
              {config.verboseDescriptions && (
                <Typography 
                  sx={{ 
                    position: 'absolute', 
                    width: '1px', 
                    height: '1px', 
                    padding: 0, 
                    margin: '-1px', 
                    overflow: 'hidden', 
                    clip: 'rect(0, 0, 0, 0)', 
                    whiteSpace: 'nowrap', 
                    borderWidth: 0 
                  }}
                  aria-live="polite"
                >
                  {chartSummary}
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
                
                <MuiTooltip title="Zoom in">
                  <IconButton 
                    size="small" 
                    onClick={handleZoomIn} 
                    sx={{ mr: 0.5 }}
                    aria-label="Zoom in"
                  >
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </MuiTooltip>
                
                <MuiTooltip title="Zoom out">
                  <IconButton 
                    size="small" 
                    onClick={handleZoomOut} 
                    sx={{ mr: 0.5 }}
                    aria-label="Zoom out"
                  >
                    <ZoomOutIcon fontSize="small" />
                  </IconButton>
                </MuiTooltip>
                
                <MuiTooltip title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
                  <IconButton 
                    size="small" 
                    onClick={handleFullscreen} 
                    sx={{ mr: 0.5 }}
                    aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  >
                    <FullscreenIcon fontSize="small" />
                  </IconButton>
                </MuiTooltip>
                
                <MuiTooltip title="Data table">
                  <IconButton 
                    size="small" 
                    onClick={toggleDataTable} 
                    sx={{ mr: 0.5 }}
                    aria-label="Toggle data table"
                    aria-pressed={showDataTable}
                  >
                    <TableChartIcon fontSize="small" />
                  </IconButton>
                </MuiTooltip>
                
                <MuiTooltip title="Accessibility settings">
                  <IconButton 
                    size="small" 
                    onClick={toggleAccessibilitySettings} 
                    sx={{ mr: 0.5 }}
                    aria-label="Open accessibility settings"
                  >
                    <AccessibilityIcon fontSize="small" />
                  </IconButton>
                </MuiTooltip>
                
                <MuiTooltip title="More options">
                  <IconButton 
                    size="small" 
                    onClick={handleMenuOpen}
                    aria-label="More options"
                    aria-haspopup="true"
                    aria-expanded={Boolean(menuAnchorEl)}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </MuiTooltip>
                
                <Menu
                  anchorEl={menuAnchorEl}
                  open={Boolean(menuAnchorEl)}
                  onClose={handleMenuClose}
                  id={`${chartId}-menu`}
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
          
          <Box 
            sx={{ 
              flexGrow: 1, 
              width: '100%', 
              height: typeof height === 'string' ? height : `${height}px`, 
              transform: `scale(${zoomLevel})`, 
              transformOrigin: 'center center'
            }}
            ref={chartContainerRef}
            tabIndex={keyboardNavigationEnabled ? 0 : -1}
            onKeyDown={handleKeyDown}
            aria-labelledby={`${chartId}-title`}
            aria-describedby={`${chartId}-desc`}
            role="application"
            aria-roledescription="time series chart"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedData}
                margin={{ top: 10, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={theme.palette.divider} 
                />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 12 }}
                  stroke={theme.palette.text.secondary} 
                  label={
                    xAxisLabel && config.enhancedLabels 
                      ? { 
                          value: xAxisLabel, 
                          position: 'insideBottom', 
                          offset: -15,
                          style: { fill: theme.palette.text.primary, fontSize: 12, fontWeight: 'bold' }
                        } 
                      : xAxisLabel 
                        ? { value: xAxisLabel, position: 'insideBottom', offset: -15 }
                        : undefined
                  }
                  tickMargin={8}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke={theme.palette.text.secondary}
                  tickFormatter={formatValue}
                  label={
                    yAxisLabel && config.enhancedLabels
                      ? { 
                          value: yAxisLabel, 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fill: theme.palette.text.primary, fontSize: 12, fontWeight: 'bold' }
                        }
                      : yAxisLabel
                        ? { value: yAxisLabel, angle: -90, position: 'insideLeft' }
                        : undefined
                  }
                  tickMargin={8}
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  wrapperStyle={{ outline: 'none' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 10 }} 
                  formatter={(value, entry) => (
                    <span style={{ color: entry.color, fontWeight: config.highContrast ? 'bold' : 'normal' }}>
                      {value}
                    </span>
                  )}
                />
                
                {/* Draw compare period if provided */}
                {compareWith && (
                  <ReferenceArea
                    x1={compareWith.startDate}
                    x2={compareWith.endDate}
                    strokeOpacity={0.3}
                    stroke={compareWith.color || theme.palette.primary.main}
                    fill={compareWith.color || theme.palette.primary.main}
                    fillOpacity={0.1}
                    ifOverflow="extendDomain"
                  />
                )}
                
                {/* Draw reference lines if provided */}
                {referenceLines?.map((line, index) => (
                  <ReferenceLine
                    key={`ref-line-${index}`}
                    y={line.value}
                    stroke={line.color || theme.palette.warning.main}
                    strokeDasharray="3 3"
                    strokeWidth={config.highContrast ? 2 : 1}
                    label={{
                      value: line.label,
                      position: 'right',
                      fill: line.color || theme.palette.warning.main,
                      fontSize: 12,
                      fontWeight: config.highContrast ? 'bold' : 'normal'
                    }}
                    ifOverflow="extendDomain"
                  />
                ))}
                
                {/* Draw reference points if provided */}
                {referencePoints?.map((point, index) => (
                  <ReferenceDot
                    key={`ref-point-${index}`}
                    x={point.date}
                    y={point.value}
                    r={config.highContrast ? 8 : 6}
                    fill={point.color || theme.palette.error.main}
                    stroke={config.highContrast ? theme.palette.common.white : "none"}
                    strokeWidth={config.highContrast ? 2 : 0}
                    ifOverflow="extendDomain"
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
                    fillOpacity={chartType === 'area' ? (config.highContrast ? 0.3 : 0.2) : 0}
                    activeDot={{ 
                      r: config.highContrast ? 10 : 8,
                      stroke: config.highContrast ? theme.palette.common.white : undefined,
                      strokeWidth: config.highContrast ? 2 : 0
                    }}
                    strokeWidth={config.highContrast ? 3 : 2}
                    dot={{ r: 4, strokeWidth: 1 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
          
          {/* Annotations section */}
          {annotations && annotations.length > 0 && (
            <Box 
              sx={{ mt: 2, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}
              role="region"
              aria-label="Chart annotations"
            >
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
                      color: annotation.color || theme.palette.info.main,
                      borderWidth: config.highContrast ? 2 : 1,
                      fontWeight: config.highContrast ? 'bold' : 'normal'
                    }}
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {/* Accessible data table for screen readers and data examination */}
          {showDataTable && (
            <AccessibleDataTable
              title={title}
              description={description}
              data={formattedData}
              columns={dataTableColumns}
              caption={`Table representation of ${title} chart data`}
              hideByDefault={false}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Accessibility settings dialog */}
      <Dialog 
        open={showAccessibilitySettings} 
        onClose={toggleAccessibilitySettings}
        aria-labelledby="accessibility-settings-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <ChartAccessibilitySettings onClose={toggleAccessibilitySettings} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TimeSeriesChart;