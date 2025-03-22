import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, useTheme, alpha } from '@mui/material';

export interface HeatmapDataPoint {
  x: string | number;
  y: string | number;
  value: number;
}

interface HeatmapChartProps {
  title: string;
  description?: string;
  data: HeatmapDataPoint[];
  xLabels: string[];
  yLabels: string[];
  colorScale?: [string, string]; // [minColor, maxColor]
  height?: number | string;
  formatValue?: (value: number) => string;
  onCellClick?: (x: string | number, y: string | number, value: number) => void;
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({
  title,
  description,
  data,
  xLabels,
  yLabels,
  colorScale,
  height = 400,
  formatValue = (value) => value.toString(),
  onCellClick,
}) => {
  const theme = useTheme();
  
  const [minValue, maxValue] = useMemo(() => {
    const values = data.map(d => d.value);
    return [Math.min(...values), Math.max(...values)];
  }, [data]);
  
  const defaultColorScale: [string, string] = [
    theme.palette.primary.light,
    theme.palette.primary.dark
  ];
  
  const [minColor, maxColor] = colorScale || defaultColorScale;
  
  const getColorForValue = (value: number) => {
    if (maxValue === minValue) return minColor;
    
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    
    // Parse the colors to get RGB values
    const parseColor = (color: string) => {
      // If color is in hex format
      if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return { r, g, b };
      }
      // Handle other formats or use a more robust color parser if needed
      return { r: 0, g: 0, b: 0 };
    };
    
    const minRgb = parseColor(minColor);
    const maxRgb = parseColor(maxColor);
    
    // Interpolate between the colors
    const r = Math.round(minRgb.r + (maxRgb.r - minRgb.r) * normalizedValue);
    const g = Math.round(minRgb.g + (maxRgb.g - minRgb.g) * normalizedValue);
    const b = Math.round(minRgb.b + (maxRgb.b - minRgb.b) * normalizedValue);
    
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  // Create a 2D array for easy rendering
  const heatmapData = useMemo(() => {
    const dataMap: Record<string, Record<string, number>> = {};
    
    // Initialize with empty values
    yLabels.forEach(y => {
      dataMap[y] = {};
      xLabels.forEach(x => {
        dataMap[y][x] = 0;
      });
    });
    
    // Fill in the data
    data.forEach(d => {
      const xKey = d.x.toString();
      const yKey = d.y.toString();
      if (dataMap[yKey] && xLabels.includes(xKey)) {
        dataMap[yKey][xKey] = d.value;
      }
    });
    
    return dataMap;
  }, [data, xLabels, yLabels]);
  
  // Calculate sizes based on the number of labels
  const cellHeight = useMemo(() => {
    const gridHeight = typeof height === 'number' ? height : 400;
    return (gridHeight - 60) / yLabels.length; // Subtract some space for labels
  }, [height, yLabels.length]);
  
  const cellWidth = useMemo(() => {
    // We'll use a responsive approach for width
    return `${100 / xLabels.length}%`;
  }, [xLabels.length]);
  
  const handleCellClick = (x: string, y: string, value: number) => {
    if (onCellClick) {
      onCellClick(x, y, value);
    }
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
        
        <Box sx={{ 
          flexGrow: 1, 
          width: '100%', 
          height: typeof height === 'string' ? height : `${height}px`,
          overflow: 'auto'
        }}>
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            minWidth: xLabels.length * 40, // Ensure minimum width for many labels
          }}>
            {/* X Labels */}
            <Box sx={{ 
              display: 'flex', 
              ml: 8, // Space for y labels
              borderBottom: `1px solid ${theme.palette.divider}`
            }}>
              {xLabels.map(label => (
                <Box 
                  key={`x-${label}`} 
                  sx={{ 
                    width: cellWidth,
                    textAlign: 'center',
                    p: 1,
                    fontSize: '0.75rem',
                    fontWeight: 'medium',
                    color: theme.palette.text.secondary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transform: 'rotate(-45deg)',
                    transformOrigin: 'bottom left',
                    height: 40,
                    display: 'flex',
                    alignItems: 'flex-end',
                  }}
                >
                  {label}
                </Box>
              ))}
            </Box>
            
            {/* Heatmap grid */}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {yLabels.map(yLabel => (
                <Box 
                  key={`row-${yLabel}`} 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }}
                >
                  {/* Y Label */}
                  <Box 
                    sx={{ 
                      width: 80, 
                      p: 1, 
                      fontSize: '0.75rem',
                      fontWeight: 'medium',
                      color: theme.palette.text.secondary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flexShrink: 0
                    }}
                  >
                    {yLabel}
                  </Box>
                  
                  {/* Row cells */}
                  <Box sx={{ display: 'flex', flexGrow: 1 }}>
                    {xLabels.map(xLabel => {
                      const cellValue = heatmapData[yLabel]?.[xLabel] || 0;
                      return (
                        <Box 
                          key={`cell-${yLabel}-${xLabel}`}
                          sx={{ 
                            width: cellWidth,
                            height: cellHeight,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: getColorForValue(cellValue),
                            color: theme.palette.getContrastText(getColorForValue(cellValue)),
                            fontSize: '0.75rem',
                            fontWeight: 'medium',
                            cursor: onCellClick ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
                              zIndex: 1
                            }
                          }}
                          onClick={() => handleCellClick(xLabel, yLabel, cellValue)}
                          title={`${xLabel}, ${yLabel}: ${formatValue(cellValue)}`}
                        >
                          {formatValue(cellValue)}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
        
        {/* Color scale legend */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mt: 2
        }}>
          <Box sx={{ 
            width: 200, 
            height: 12, 
            borderRadius: 1,
            background: `linear-gradient(to right, ${minColor}, ${maxColor})`,
            mr: 2
          }} />
          <Typography variant="caption" color="text.secondary">
            {formatValue(minValue)} - {formatValue(maxValue)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HeatmapChart;