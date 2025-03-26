import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Define the accessibility configuration interface
export interface ChartAccessibilityConfig {
  // Color settings
  highContrast: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  patternFill: boolean; // Use patterns in addition to colors for distinction
  
  // Text settings  
  includeDataTableWithCharts: boolean; // Include data tables with charts
  enhancedLabels: boolean; // More descriptive text labels
  
  // Interaction settings
  keyboardNavigation: boolean; // Enable keyboard interaction with charts
  tooltipDelay: number; // How long tooltips stay visible in ms
  
  // Screen reader settings
  verboseDescriptions: boolean; // More detailed chart descriptions
  announceDataChanges: boolean; // Announce when data changes
}

// Define the context interface
interface ChartAccessibilityContextProps {
  config: ChartAccessibilityConfig;
  updateConfig: (newConfig: Partial<ChartAccessibilityConfig>) => void;
  getColorBlindSafeColors: () => string[]; // Returns colorblind-safe palette
  getPatternStyles: () => React.CSSProperties[]; // Returns pattern styles for fills
  generateChartSummary: (title: string, data: any[], type: string) => string; // Generates an accessible summary
}

// Default configuration
export const defaultAccessibilityConfig: ChartAccessibilityConfig = {
  highContrast: false,
  colorBlindMode: 'none',
  patternFill: false,
  includeDataTableWithCharts: false,
  enhancedLabels: true,
  keyboardNavigation: true,
  tooltipDelay: 3000,
  verboseDescriptions: false,
  announceDataChanges: false,
};

// Create the context
export const ChartAccessibilityContext = createContext<ChartAccessibilityContextProps>({
  config: defaultAccessibilityConfig,
  updateConfig: () => {},
  getColorBlindSafeColors: () => [],
  getPatternStyles: () => [],
  generateChartSummary: () => '',
});

// Create the provider component
export const ChartAccessibilityProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // Initialize from localStorage if available
  const [config, setConfig] = useState<ChartAccessibilityConfig>(() => {
    const savedConfig = localStorage.getItem('chartAccessibilityConfig');
    return savedConfig ? JSON.parse(savedConfig) : defaultAccessibilityConfig;
  });
  
  // Sync with Redux UI state for theme settings if available
  const darkMode = useSelector((state: RootState) => state.ui?.darkMode) || false;
  const currentTheme = useSelector((state: RootState) => state.ui?.currentTheme) || 'default';
  
  useEffect(() => {
    // If the UI has "highContrast" theme, sync with accessibility settings
    if (typeof currentTheme === 'string' && currentTheme.includes('highContrast')) {
      setConfig(prev => ({ ...prev, highContrast: true }));
    }
  }, [currentTheme]);

  // Update config and save to localStorage
  const updateConfig = (newConfig: Partial<ChartAccessibilityConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem('chartAccessibilityConfig', JSON.stringify(updated));
      return updated;
    });
  };
  
  // Helper function to get colorblind-safe color palettes
  const getColorBlindSafeColors = () => {
    // Color palettes optimized for different types of color blindness
    const palettes: Record<ChartAccessibilityConfig['colorBlindMode'], string[]> = {
      none: [
        '#4153AF', '#E8543E', '#69BE64', '#B85DD9', '#F3AC41', '#5DBBC5',
        '#D35CBA', '#63A875', '#D2CA4E', '#6F7B88', '#AA655F', '#3793C9'
      ],
      protanopia: [
        '#004488', '#DDAA33', '#BB5566', '#000000', '#FFCC00', '#009988',
        '#775500', '#AABBCC', '#FFFFFF', '#99DDFF', '#444444', '#FFDD99'
      ],
      deuteranopia: [
        '#004488', '#DDAA33', '#BB5566', '#000000', '#FFCC00', '#009988',
        '#775500', '#AABBCC', '#FFFFFF', '#99DDFF', '#444444', '#FFDD99'
      ],
      tritanopia: [
        '#EE7733', '#0077BB', '#33BBEE', '#EE3377', '#CC3311', '#009988',
        '#BBBBBB', '#000000', '#FFFFFF', '#AA4499', '#DDDDDD', '#332288'
      ],
      achromatopsia: [
        '#000000', '#575757', '#9E9E9E', '#FFFFFF', '#1A1A1A', '#3B3B3B',
        '#737373', '#ABABAB', '#C8C8C8', '#E0E0E0', '#303030', '#4F4F4F'
      ]
    };
    
    return palettes[config.colorBlindMode];
  };
  
  // Helper function to get pattern styles for fills
  const getPatternStyles = () => {
    // Different pattern styles for chart elements
    if (!config.patternFill) return [];
    
    return [
      { backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, transparent 75%, transparent)', backgroundSize: '10px 10px' },
      { backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, transparent 75%, transparent)', backgroundSize: '10px 10px' },
      { backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, transparent 75%, transparent)', backgroundSize: '10px 10px' },
      { backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.1) 50%, transparent 50%)', backgroundSize: '10px 10px' },
      { backgroundImage: 'linear-gradient(0deg, rgba(0,0,0,0.1) 50%, transparent 50%)', backgroundSize: '10px 10px' },
      { backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 5px, transparent 5px, transparent 10px)' },
      { backgroundImage: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 5px, transparent 5px, transparent 10px)' },
      { backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.1) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.1) 75%)', backgroundSize: '10px 10px' },
    ];
  };
  
  // Define the chart data point interface
  interface ChartDataPoint {
    name?: string;
    value: number;
    date?: string;
    [key: string]: any;
  }
  
  // Helper to generate accessible text summaries of charts
  const generateChartSummary = (title: string, data: ChartDataPoint[], type: string): string => {
    if (!data || data.length === 0) return `${title}: No data available.`;
    
    let summary = `${title}: `;
    
    if (type === 'timeSeries') {
      // For time series: mention trends, highs, lows
      const values = data.map(d => d.value).filter(v => typeof v === 'number');
      const dates = data.map(d => d.date);
      
      if (values.length === 0) return `${title}: No numeric data available.`;
      
      const max = Math.max(...values);
      const min = Math.min(...values);
      const maxIndex = values.indexOf(max);
      const minIndex = values.indexOf(min);
      
      summary += `Time series data from ${dates[0]} to ${dates[dates.length - 1]}. `;
      summary += `Highest value: ${max} on ${dates[maxIndex]}. `;
      summary += `Lowest value: ${min} on ${dates[minIndex]}. `;
      
      // Add trend information
      if (values.length > 1) {
        const firstValue = values[0];
        const lastValue = values[values.length - 1];
        const change = lastValue - firstValue;
        const percentChange = ((change / Math.abs(firstValue)) * 100).toFixed(1);
        
        if (change > 0) {
          summary += `Overall upward trend of ${percentChange}% from beginning to end.`;
        } else if (change < 0) {
          summary += `Overall downward trend of ${percentChange}% from beginning to end.`;
        } else {
          summary += `No overall change from beginning to end.`;
        }
      }
    } else if (type === 'distribution') {
      // For distribution charts: list categories and their proportions
      const total = data.reduce((sum, item) => sum + item.value, 0);
      
      summary += `Distribution data with ${data.length} categories. `;
      
      // Sort by value for more meaningful summary
      const sortedData = [...data].sort((a, b) => b.value - a.value);
      
      // Report top categories
      const topCategories = sortedData.slice(0, Math.min(3, sortedData.length));
      summary += `Top categories: `;
      topCategories.forEach((item, i) => {
        const percentage = ((item.value / total) * 100).toFixed(1);
        summary += `${item.name} (${percentage}%)${i < topCategories.length - 1 ? ', ' : '. '}`;
      });
      
      // Include total
      summary += `Total value across all categories: ${total}.`;
    } else {
      // Generic summary for other chart types
      summary += `Chart contains ${data.length} data points. `;
    }
    
    return summary;
  };
  
  const value = {
    config,
    updateConfig,
    getColorBlindSafeColors,
    getPatternStyles,
    generateChartSummary,
  };
  
  return (
    <ChartAccessibilityContext.Provider value={value}>
      {children}
    </ChartAccessibilityContext.Provider>
  );
};

// Custom hook to use the accessibility context
export const useChartAccessibility = () => useContext(ChartAccessibilityContext);