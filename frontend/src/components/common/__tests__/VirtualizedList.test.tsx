import React from 'react';
import { render, screen } from '@testing-library/react';
import VirtualizedList from '../VirtualizedList';
import { vi } from 'vitest';

// Mock the react-window and react-virtualized-auto-sizer components
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount }: { children: any; itemCount: number }) => {
    const items = [];
    for (let i = 0; i < itemCount; i++) {
      items.push(children({ index: i, style: {} }));
    }
    return <div data-testid="virtualized-list">{items}</div>;
  },
}));

vi.mock('react-virtualized-auto-sizer', () => ({
  default: ({ children }: { children: (size: { width: number; height: number }) => React.ReactNode }) => {
    return <div>{children({ width: 100, height: 100 })}</div>;
  },
}));

describe('VirtualizedList', () => {
  const mockData = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
  ];

  it('renders empty message when data is empty', () => {
    render(
      <VirtualizedList
        data={[]}
        renderItem={() => <div>Item</div>}
        emptyMessage="No items found"
      />
    );

    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders items correctly', () => {
    render(
      <VirtualizedList
        data={mockData}
        renderItem={(item) => <div>{item.name}</div>}
        keyExtractor={(item) => item.id}
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('uses default keyExtractor when not provided', () => {
    render(
      <VirtualizedList
        data={mockData}
        renderItem={(item) => <div>{item.name}</div>}
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });
});