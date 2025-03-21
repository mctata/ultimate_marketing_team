import React, { memo, useMemo } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Box, CircularProgress, Typography } from '@mui/material';

// Generic type for list items
export interface VirtualizedListProps<T> {
  items: T[];
  isLoading?: boolean;
  height?: number | string;
  itemHeight?: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  noItemsMessage?: string;
  loadingMessage?: string;
  className?: string;
  style?: React.CSSProperties;
  overscan?: number;
  itemKey?: (index: number, data: any) => string | number;
}

/**
 * VirtualizedList component for efficiently rendering large lists
 * Uses react-window for virtualization to improve performance
 */
function VirtualizedList<T>({
  items,
  isLoading = false,
  height = 400,
  itemHeight = 50,
  renderItem,
  noItemsMessage = 'No items to display',
  loadingMessage = 'Loading items...',
  className,
  style,
  overscan = 5,
  itemKey = (index) => index,
}: VirtualizedListProps<T>) {
  // Memoize the row renderer to prevent unnecessary re-renders
  const Row = useMemo(() => {
    return memo(({ index, style, data }: ListChildComponentProps) => {
      return renderItem(data.items[index], index, style);
    });
  }, [renderItem]);

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight={200}
        className={className}
        style={style}
      >
        <CircularProgress size={32} />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          {loadingMessage}
        </Typography>
      </Box>
    );
  }

  if (!items.length) {
    return (
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="center" 
        minHeight={200}
        className={className}
        style={style}
      >
        <Typography variant="body2" color="textSecondary">
          {noItemsMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      height={height}
      className={className}
      style={{ 
        width: '100%', 
        ...style 
      }}
    >
      <AutoSizer>
        {({ width, height }) => (
          <FixedSizeList
            height={height}
            width={width}
            itemCount={items.length}
            itemSize={itemHeight}
            itemData={{ items }}
            overscanCount={overscan}
            itemKey={itemKey}
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </Box>
  );
}

export default memo(VirtualizedList) as typeof VirtualizedList;