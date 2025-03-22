import { useEffect, useState, useRef, RefObject } from 'react';
import { useChartAccessibility } from '../context/ChartAccessibilityContext';

// Used to create a unique ID for each chart that needs keyboard navigation
let nextChartId = 0;

interface FocusableElement {
  element: SVGElement | HTMLElement;
  dataIndex: number;
  dataKey?: string;
  value?: number | string;
  date?: string;
}

export interface ChartKeyboardNavigationOptions {
  chartRef: RefObject<HTMLDivElement>;
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  data: Record<string, any>[];
  dataKeys: string[];
  onFocusChange?: (focusedItem: { dataIndex: number; dataKey?: string; value?: any }) => void;
  onActivate?: (focusedItem: { dataIndex: number; dataKey?: string; value?: any }) => void;
  debug?: boolean;
}

export const useChartKeyboardNavigation = ({
  chartRef,
  chartType,
  data,
  dataKeys,
  onFocusChange,
  onActivate,
  debug = false
}: ChartKeyboardNavigationOptions) => {
  const { config } = useChartAccessibility();
  const [enabled, setEnabled] = useState(config.keyboardNavigation);
  const [focusIndex, setFocusIndex] = useState<[number, number]>([-1, -1]); // [dataIndex, keyIndex]
  const [focusableElements, setFocusableElements] = useState<FocusableElement[][]>([]);
  const chartId = useRef<string>(`chart-${nextChartId++}`);
  const navAnnouncer = useRef<HTMLDivElement | null>(null);
  
  // Create a div for screen reader announcements if it doesn't exist
  useEffect(() => {
    if (!navAnnouncer.current) {
      const div = document.createElement('div');
      div.id = `${chartId.current}-announcer`;
      div.setAttribute('role', 'status');
      div.setAttribute('aria-live', 'polite');
      div.style.position = 'absolute';
      div.style.width = '1px';
      div.style.height = '1px';
      div.style.overflow = 'hidden';
      div.style.clip = 'rect(0 0 0 0)';
      div.style.clipPath = 'inset(50%)';
      document.body.appendChild(div);
      navAnnouncer.current = div;
    }
    
    return () => {
      if (navAnnouncer.current) {
        document.body.removeChild(navAnnouncer.current);
      }
    };
  }, []);
  
  // Sync with accessibility configuration
  useEffect(() => {
    setEnabled(config.keyboardNavigation);
  }, [config.keyboardNavigation]);
  
  // Find all interactive elements in the chart
  const findFocusableElements = () => {
    if (!chartRef.current || !enabled) return;
    
    const element = chartRef.current;
    const newFocusableElements: FocusableElement[][] = [];
    
    try {
      // Different approaches for different chart types
      switch (chartType) {
        case 'line':
        case 'area':
          // Find the dots/points in line charts
          dataKeys.forEach((key, keyIndex) => {
            const keyElements: FocusableElement[] = [];
            
            // Query for the dots in line chart (both normal and active dots)
            const dotSelector = `.recharts-line-dot, .recharts-active-dot`;
            const dots = element.querySelectorAll(dotSelector);
            
            Array.from(dots).forEach(dot => {
              // Extract data index from classname
              const classes = dot.getAttribute('class') || '';
              const indexMatch = classes.match(/recharts-dot-(\d+)/);
              if (indexMatch) {
                const dataIndex = parseInt(indexMatch[1], 10);
                if (dataIndex >= 0 && dataIndex < data.length) {
                  keyElements.push({
                    element: dot as SVGElement,
                    dataIndex,
                    dataKey: key,
                    value: data[dataIndex][key],
                    date: data[dataIndex].date || data[dataIndex].formattedDate
                  });
                }
              }
            });
            
            if (keyElements.length > 0) {
              newFocusableElements[keyIndex] = keyElements;
            }
          });
          break;
          
        case 'bar':
          // Find the bar elements
          dataKeys.forEach((key, keyIndex) => {
            const keyElements: FocusableElement[] = [];
            
            // Select SVG rectangles representing bars
            const barSelector = `.recharts-bar-rectangle`;
            const bars = element.querySelectorAll(barSelector);
            
            Array.from(bars).forEach(bar => {
              // Extract data index
              const path = bar.querySelector('path');
              if (path) {
                const dataset = bar.getAttribute('data-index');
                if (dataset) {
                  const dataIndex = parseInt(dataset, 10);
                  if (dataIndex >= 0 && dataIndex < data.length) {
                    keyElements.push({
                      element: bar as SVGElement,
                      dataIndex,
                      dataKey: key,
                      value: data[dataIndex][key]
                    });
                  }
                }
              }
            });
            
            if (keyElements.length > 0) {
              newFocusableElements[keyIndex] = keyElements;
            }
          });
          break;
          
        case 'pie':
          // Find pie segments
          const sectors = element.querySelectorAll('.recharts-pie-sector');
          const segmentElements: FocusableElement[] = [];
          
          Array.from(sectors).forEach((sector, index) => {
            if (index < data.length) {
              segmentElements.push({
                element: sector as SVGElement,
                dataIndex: index,
                value: data[index].value,
                dataKey: data[index].name
              });
            }
          });
          
          if (segmentElements.length > 0) {
            newFocusableElements[0] = segmentElements;
          }
          break;
      }
      
      setFocusableElements(newFocusableElements);
      
      if (debug && newFocusableElements.length > 0) {
        console.log('Found focusable elements:', newFocusableElements);
      }
    } catch (error) {
      console.error('Error finding focusable chart elements:', error);
    }
  };
  
  // Set up keyboard navigation
  useEffect(() => {
    if (!enabled || !chartRef.current) return;
    
    // Find elements after chart has rendered
    const timer = setTimeout(() => {
      findFocusableElements();
    }, 500);
    
    // Add tabindex to chart container
    if (chartRef.current) {
      chartRef.current.setAttribute('tabindex', '0');
      chartRef.current.setAttribute('role', 'application');
      chartRef.current.setAttribute('aria-label', `Interactive ${chartType} chart. Use arrow keys to navigate data points.`);
    }
    
    return () => clearTimeout(timer);
  }, [enabled, chartRef.current, data, dataKeys, chartType]);
  
  // Handle keyboard navigation within the chart
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!enabled || focusableElements.length === 0) return;
    
    const [currentDataIndex, currentKeyIndex] = focusIndex;
    
    // If nothing is focused yet, start with the first element
    if (currentDataIndex === -1 || currentKeyIndex === -1) {
      if (focusableElements[0] && focusableElements[0][0]) {
        setFocusIndex([0, 0]);
        focusElement(0, 0);
      }
      return;
    }
    
    let newDataIndex = currentDataIndex;
    let newKeyIndex = currentKeyIndex;
    
    switch (e.key) {
      case 'ArrowRight':
        // Move to next data point (same series)
        if (currentDataIndex < (focusableElements[currentKeyIndex]?.length || 0) - 1) {
          newDataIndex = currentDataIndex + 1;
        }
        break;
        
      case 'ArrowLeft':
        // Move to previous data point (same series)
        if (currentDataIndex > 0) {
          newDataIndex = currentDataIndex - 1;
        }
        break;
        
      case 'ArrowUp':
        // Move to previous data series (same index)
        if (currentKeyIndex > 0) {
          newKeyIndex = currentKeyIndex - 1;
          // Ensure the data index is valid for this series
          if (focusableElements[newKeyIndex]) {
            newDataIndex = Math.min(currentDataIndex, focusableElements[newKeyIndex].length - 1);
          }
        }
        break;
        
      case 'ArrowDown':
        // Move to next data series (same index)
        if (currentKeyIndex < focusableElements.length - 1) {
          newKeyIndex = currentKeyIndex + 1;
          // Ensure the data index is valid for this series
          if (focusableElements[newKeyIndex]) {
            newDataIndex = Math.min(currentDataIndex, focusableElements[newKeyIndex].length - 1);
          }
        }
        break;
        
      case 'Enter':
      case ' ': // Space
        // Activate the current element (e.g., show tooltip or details)
        if (
          focusableElements[currentKeyIndex] && 
          focusableElements[currentKeyIndex][currentDataIndex]
        ) {
          const element = focusableElements[currentKeyIndex][currentDataIndex];
          
          // Call the activation callback
          if (onActivate) {
            onActivate({
              dataIndex: element.dataIndex,
              dataKey: element.dataKey,
              value: element.value
            });
          }
          
          // Prevent default space scrolling
          e.preventDefault();
        }
        return;
        
      default:
        // No relevant key pressed
        return;
    }
    
    // If we're changing focus, update it
    if (newDataIndex !== currentDataIndex || newKeyIndex !== currentKeyIndex) {
      setFocusIndex([newDataIndex, newKeyIndex]);
      focusElement(newDataIndex, newKeyIndex);
    }
  };
  
  // Focus an element and announce its details to screen readers
  const focusElement = (dataIndex: number, keyIndex: number) => {
    if (
      !focusableElements[keyIndex] || 
      !focusableElements[keyIndex][dataIndex]
    ) {
      return;
    }
    
    const element = focusableElements[keyIndex][dataIndex];
    
    // Set element as active/focused
    if (element.element) {
      // Set tabindex to make it focusable
      element.element.setAttribute('tabindex', '0');
      // Focus the element
      element.element.focus();
      
      // If it's an SVG element, add a focus style
      if (element.element instanceof SVGElement) {
        element.element.setAttribute('stroke-width', '3');
        element.element.setAttribute('stroke', 'currentColor');
        
        // Reset previous focus styles
        focusableElements.forEach(series => {
          series.forEach(item => {
            if (item !== element && item.element instanceof SVGElement) {
              item.element.setAttribute('stroke-width', '1');
            }
          });
        });
      }
    }
    
    // Call focus change callback
    if (onFocusChange) {
      onFocusChange({
        dataIndex: element.dataIndex,
        dataKey: element.dataKey,
        value: element.value
      });
    }
    
    // Announce to screen readers
    if (navAnnouncer.current) {
      let announcement = '';
      
      if (chartType === 'line' || chartType === 'area') {
        announcement = `${element.dataKey || 'Series'}, `;
        announcement += element.date ? `Date: ${element.date}, ` : '';
        announcement += `Value: ${element.value}`;
      } else if (chartType === 'pie') {
        announcement = `${element.dataKey}: ${element.value}`;
      } else {
        announcement = `${element.dataKey || 'Series'}: ${element.value}`;
      }
      
      navAnnouncer.current.textContent = announcement;
    }
  };
  
  // Refresh focusable elements when data changes
  useEffect(() => {
    if (enabled) {
      findFocusableElements();
    }
  }, [data, enabled]);
  
  return {
    handleKeyDown,
    focusableElements,
    focusIndex,
    chartId: chartId.current,
    enabled,
  };
};

// Utility function to add appropriate ARIA attributes to chart components
export const addChartAriaAttributes = (
  container: HTMLElement | null,
  title: string,
  description: string,
  chartType: string
) => {
  if (!container) return;
  
  // Add appropriate ARIA role and attributes
  container.setAttribute('role', 'img');
  container.setAttribute('aria-label', `${title}. ${description}`);
  
  // Add a more specific chart type description for screen readers
  const chartTypeDescription = `This is a ${chartType} chart. `;
  
  // If there's no explicit description, add a chart type description
  if (!description) {
    container.setAttribute('aria-label', `${title}. ${chartTypeDescription}`);
  } else if (!description.includes(chartTypeDescription)) {
    container.setAttribute('aria-label', `${title}. ${chartTypeDescription}${description}`);
  }
};

// Export a utility function to make chart tooltips accessible
export const makeTooltipAccessible = (
  tooltipRef: RefObject<HTMLDivElement>,
  title: string
) => {
  useEffect(() => {
    if (tooltipRef.current) {
      tooltipRef.current.setAttribute('role', 'status');
      tooltipRef.current.setAttribute('aria-live', 'polite');
      tooltipRef.current.setAttribute('aria-label', `${title} tooltip`);
    }
  }, [tooltipRef.current, title]);
};