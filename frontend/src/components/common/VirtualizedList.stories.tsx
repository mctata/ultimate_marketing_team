import type { Meta, StoryObj } from '@storybook/react';
import VirtualizedList from './VirtualizedList';
import { Box, Paper, Typography, Divider } from '@mui/material';

const meta: Meta<typeof VirtualizedList> = {
  title: 'Common/VirtualizedList',
  component: VirtualizedList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof VirtualizedList>;

// Create mock data
const generateMockItems = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    title: `Item ${i + 1}`,
    description: `This is the description for item ${i + 1}`,
  }));
};

// Item renderer
const renderListItem = (item: any) => (
  <Paper 
    sx={{ 
      p: 2, 
      m: 1, 
      border: '1px solid #eee',
      '&:hover': {
        boxShadow: 1,
        bgcolor: 'rgba(0, 0, 0, 0.01)',
      }
    }}
  >
    <Typography variant="subtitle1" fontWeight="bold">{item.title}</Typography>
    <Typography variant="body2" color="text.secondary">{item.description}</Typography>
  </Paper>
);

export const Default: Story = {
  args: {
    data: generateMockItems(100),
    height: 400,
    width: '100%',
    itemSize: 85,
    renderItem: renderListItem,
    keyExtractor: (item) => item.id,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    height: 400,
    width: '100%',
    renderItem: renderListItem,
    emptyMessage: 'No items available',
  },
};

export const CustomItemHeight: Story = {
  args: {
    data: generateMockItems(50),
    height: 500,
    width: '100%',
    itemSize: 120,
    renderItem: (item) => (
      <Paper 
        sx={{ 
          p: 3, 
          m: 1, 
          border: '1px solid #eee', 
          height: 100,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6">{item.title}</Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="body1">{item.description}</Typography>
      </Paper>
    ),
    keyExtractor: (item) => item.id,
  },
};

export const LargeDataSet: Story = {
  args: {
    data: generateMockItems(10000),
    height: 600,
    width: '100%',
    itemSize: 85,
    renderItem: renderListItem,
    keyExtractor: (item) => item.id,
  },
};