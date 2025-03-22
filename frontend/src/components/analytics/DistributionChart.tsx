import React, { useRef, useEffect, useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  TooltipProps
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
  Tooltip as MuiTooltip,
  Dialog,
  DialogContent
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import TableChartIcon from '@mui/icons-material/TableChart';
import AccessibilityIcon from '@mui/icons-material/Accessibility';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useChartAccessibility } from '../../context/ChartAccessibilityContext';
import AccessibleDataTable from './AccessibleDataTable';
import ChartAccessibilitySettings from './ChartAccessibilitySettings';
import { 
  useChartKeyboardNavigation, 
  addChartAriaAttributes, 
  makeTooltipAccessible 
} from '../../utils/chartKeyboardNavigation';

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
  showControls?: boolean;
  onExport?: (format: 'png' | 'svg' | 'csv') => void;
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
  showControls = false,
  onExport,
}) => {
  const theme = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const [activeSectorInfo, setActiveSectorInfo] = useState<{ dataIndex: number, dataKey?: string, value?: any } | null>(null);
  
  // Get accessibility configuration
  const { config, getColorBlindSafeColors, generateChartSummary } = useChartAccessibility();
  
  // Set up keyboard navigation for chart
  const { handleKeyDown, chartId, enabled: keyboardNavigationEnabled } = useChartKeyboardNavigation({
    chartRef: chartContainerRef,
    chartType: 'pie',
    data,
    dataKeys: ['value'],
    onFocusChange: (focusedItem) => {
      setActiveSectorInfo(focusedItem);
    },
    onActivate: (item) => {
      // When a user activates an item with keyboard, show the information
      console.log('Item activated:', item);
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
        'pie'
      );
    }
  }, [title, description, chartContainerRef.current]);
  
  // Make tooltip accessible
  makeTooltipAccessible(tooltipRef, title);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
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
      // Additional colors with modified shades
      theme.palette.primary.light,
      theme.palette.secondary.light,
      theme.palette.success.light,
      theme.palette.error.light,
      theme.palette.warning.light,
      theme.palette.info.light,
    ];
    
    return colors || defaultColors;
  };
  
  const chartColors = getChartColors();
  
  // Calculate percentages if not provided
  const processedData = React.useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map(item => ({
      ...item,
      percentage: item.percentage || (item.value / total * 100)
    }));
  }, [data]);
  
  // Generate accessible data table columns
  const dataTableColumns = React.useMemo(() => {
    return [
      { id: 'name', label: 'Category' },
      { id: 'value', label: 'Value', format: formatValue },
      { id: 'percentage', label: 'Percentage', format: formatPercentage },
    ];
  }, [formatValue, formatPercentage]);
  
  // Generate chart summary for screen readers
  const chartSummary = React.useMemo(() => {
    return generateChartSummary(title, data, 'distribution');
  }, [title, data, generateChartSummary]);

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const data = entry.payload as DistributionDataPoint;
      
      return (
        <Card 
          sx={{ p: 1, border: `1px solid ${theme.palette.divider}` }}
          ref={tooltipRef}
          role="status"
          aria-live="polite"
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {data.name}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 2 }}>
              Value:
            </Typography>
            <Typography variant="body2" component="span" sx={{ fontWeight: config.highContrast ? 'bold' : 'medium' }}>
              {formatValue(data.value)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 2 }}>
              Percentage:
            </Typography>
            <Typography variant="body2" component="span" sx={{ fontWeight: config.highContrast ? 'bold' : 'medium' }}>
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
      <Box 
        sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mt: 2 }}
        role="list"
        aria-label="Chart legend"
      >
        {payload.map((entry: any, index: number) => {
          const itemData = processedData.find(item => item.name === entry.value);
          return (
          <Box 
            key={`legend-${index}`} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mx: 1, 
              mb: 0.5 
            }}
            role="listitem"
          >
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
                  backgroundSize: '8px 8px'
                } : {}),
                border: config.highContrast ? `1px solid ${theme.palette.common.black}` : 'none'
              }}
              role="presentation"
              aria-hidden="true"
            />
            <Typography 
              variant="body2" 
              sx={{ 
                mr: 0.5, 
                fontWeight: config.highContrast ? 'bold' : 'normal' 
              }}
            >
              {entry.value}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontWeight: config.highContrast ? 'medium' : 'normal' }}
            >
              ({formatPercentage(itemData?.percentage || 0)})
            </Typography>
          </Box>
        )})}
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
        fontSize: config.highContrast 
          ? theme.typography.h6.fontSize 
          : theme.typography.body1.fontSize,
        fontWeight: config.highContrast ? 'bold' : 'normal',
        fill: theme.palette.text.primary
      }}
      aria-hidden="true"
    >
      {centerLabel}
    </text>
  );

  return (
    <>
      <Card 
        sx={{ 
          height: '100%',
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '2px'
          }
        }}
      >
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
          
          <Box 
            sx={{ flexGrow: 1, width: '100%', height }}
            ref={chartContainerRef}
            tabIndex={keyboardNavigationEnabled ? 0 : -1}
            onKeyDown={handleKeyDown}
            aria-labelledby={`${chartId}-title`}
            aria-describedby={`${chartId}-desc`}
            role="application"
            aria-roledescription="pie chart"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius="80%"
                  innerRadius="55%"
                  paddingAngle={config.highContrast ? 4 : 2}
                  dataKey="value"
                  stroke={config.highContrast ? theme.palette.background.paper : undefined}
                  strokeWidth={config.highContrast ? 2 : 0}
                  // Add ARIA label for the chart
                  nameKey="name"
                  isAnimationActive={!config.announceDataChanges}
                >
                  {processedData.map((entry, index) => {
                    // Apply pattern fill if needed
                    const fillStyle = config.patternFill ? {
                      backgroundImage: `linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, transparent 75%, transparent)`,
                      backgroundSize: '10px 10px'
                    } : {};
                    
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color || chartColors[index % chartColors.length]}
                        style={fillStyle}
                      />
                    );
                  })}
                  {centerLabel && <CenterLabel />}
                </Pie>
                <Tooltip 
                  content={<CustomTooltip />} 
                  wrapperStyle={{ outline: 'none' }}
                />
                {showLegend && <Legend content={renderLegend} />}
              </PieChart>
            </ResponsiveContainer>
          </Box>
          
          {/* Accessible data table for screen readers and data examination */}
          {showDataTable && (
            <AccessibleDataTable
              title={title}
              description={description}
              data={processedData}
              columns={dataTableColumns}
              caption={`Table representation of ${title} chart data`}
              hideByDefault={false}
              compact
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

export default DistributionChart;