import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import VirtualizedList from '../VirtualizedList';

// Mock the react-window components
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemData }: any) => {
    const items = [];
    for (let i = 0; i < Math.min(itemCount, 10); i++) {
      items.push(
        <div key={i} data-testid={`list-item-${i}`}>
          {children({
            index: i,
            style: {},
            data: itemData,
          })}
        </div>
      );
    }
    return <div data-testid="virtualized-list">{items}</div>;
  },
}));

// Mock the AutoSizer component
vi.mock('react-virtualized-auto-sizer', () => ({
  default: ({ children }: any) => children({ width: 800, height: 600 }),
}));

describe('VirtualizedList', () => {
  const mockItems = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ];

  const renderItem = (item: any, index: number, style: React.CSSProperties) => (
    <div data-testid={`item-${index}`} style={style}>
      {item.name}
    </div>
  );

  it('renders loading state correctly', () => {
    render(
      <VirtualizedList
        items={[]}
        isLoading={true}
        renderItem={renderItem}
        loadingMessage="Custom loading message"
      />
    );

    expect(screen.getByText('Custom loading message')).toBeInTheDocument();
    expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    render(
      <VirtualizedList
        items={[]}
        renderItem={renderItem}
        noItemsMessage="Custom empty message"
      />
    );

    expect(screen.getByText('Custom empty message')).toBeInTheDocument();
    expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();
  });

  it('renders items correctly', () => {
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        height={400}
        itemHeight={50}
      />
    );

    // In our mocked implementation, we only render the first 10 items
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    
    // Check that all mock items are rendered
    mockItems.forEach((_, index) => {
      expect(screen.getByTestId(`list-item-${index}`)).toBeInTheDocument();
    });
  });

  it('applies custom styles and className', () => {
    const { container } = render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        className="custom-class"
        style={{ backgroundColor: 'red' }}
      />
    );

    // Check if the main Box has the custom class
    expect(container.firstChild).toHaveClass('custom-class');
    
    // Check if the style is applied (this depends on how styles are handled in the testing environment)
    expect(container.firstChild).toHaveStyle('background-color: red');
  });

  it('uses custom itemKey function', () => {
    const itemKey = (index: number) => `custom-key-${index}`;
    
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        itemKey={itemKey}
      />
    );

    // Not much we can test here without accessing react-window internals
    // At least ensure that providing a custom itemKey doesn't break the component
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
  });
});