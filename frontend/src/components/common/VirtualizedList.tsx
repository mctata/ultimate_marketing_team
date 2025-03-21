import React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { Box, Typography } from '@mui/material';
import AutoSizer from 'react-virtualized-auto-sizer';

interface VirtualizedListProps<T> {
  data: T[];
  height?: number | string;
  width?: number | string;
  itemSize?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  keyExtractor?: (item: T, index: number) => string;
}

function VirtualizedList<T>({
  data,
  height = 400,
  width = '100%',
  itemSize = 50,
  renderItem,
  emptyMessage = 'No items to display',
  keyExtractor = (_, index) => `item-${index}`,
}: VirtualizedListProps<T>) {
  // If the list is empty, show the empty message
  if (data.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height,
          width,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  // Row renderer function for react-window
  const Row = ({ index, style }: ListChildComponentProps) => {
    const item = data[index];
    return (
      <div style={{ ...style, boxSizing: 'border-box' }} key={keyExtractor(item, index)}>
        {renderItem(item, index)}
      </div>
    );
  };

  return (
    <Box sx={{ height, width }}>
      <AutoSizer>
        {({ height: autoHeight, width: autoWidth }) => (
          <FixedSizeList
            height={autoHeight}
            width={autoWidth}
            itemCount={data.length}
            itemSize={itemSize}
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </Box>
  );
}

export default VirtualizedList;