import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import VirtualizedList from './VirtualizedList';
import { Box, Typography, Chip, Avatar } from '@mui/material';

const meta: Meta<typeof VirtualizedList> = {
  title: 'Components/Common/VirtualizedList',
  component: VirtualizedList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    items: { control: 'object' },
    isLoading: { control: 'boolean' },
    height: { control: 'number' },
    itemHeight: { control: 'number' },
    renderItem: { control: false },
    noItemsMessage: { control: 'text' },
    loadingMessage: { control: 'text' },
    className: { control: 'text' },
    style: { control: 'object' },
    overscan: { control: 'number' },
    itemKey: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof VirtualizedList>;

// Helper to generate mock data
const generateItems = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i + 1}`,
    description: `This is the description for item ${i + 1}`,
    status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'pending' : 'inactive',
    date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
  }));
};

// Custom render function for items
const renderListItem = (
  item: { id: string; name: string; description: string; status: string; date: string }, 
  index: number, 
  style: React.CSSProperties
) => {
  // Status colors
  const statusColors = {
    active: 'success',
    pending: 'warning',
    inactive: 'error',
  };
  
  const statusColor = statusColors[item.status as keyof typeof statusColors];
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 2, 
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        backgroundColor: index % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
        '&:hover': {
          backgroundColor: 'rgba(0,0,0,0.05)',
        },
      }}
      style={style}
    >
      <Avatar sx={{ mr: 2, bgcolor: `${statusColor}.main` }}>
        {item.name.charAt(0)}
      </Avatar>
      
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1">{item.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {item.description}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <Chip 
          label={item.status} 
          size="small" 
          color={statusColor as any}
          variant="outlined"
          sx={{ mb: 1 }}
        />
        <Typography variant="caption" color="text.secondary">
          {new Date(item.date).toLocaleDateString()}
        </Typography>
      </Box>
    </Box>
  );
};

export const Default: Story = {
  args: {
    items: generateItems(100),
    height: 400,
    itemHeight: 80,
    renderItem: renderListItem,
  },
};

export const Loading: Story = {
  args: {
    items: [],
    isLoading: true,
    renderItem: renderListItem,
    loadingMessage: 'Loading items...',
  },
};

export const Empty: Story = {
  args: {
    items: [],
    renderItem: renderListItem,
    noItemsMessage: 'No items found',
  },
};

export const CustomStyling: Story = {
  args: {
    items: generateItems(50),
    height: 500,
    itemHeight: 80,
    renderItem: renderListItem,
    style: { 
      border: '1px solid #e0e0e0', 
      borderRadius: '8px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    },
  },
};

export const FewItems: Story = {
  args: {
    items: generateItems(5),
    height: 400,
    itemHeight: 80,
    renderItem: renderListItem,
  },
};