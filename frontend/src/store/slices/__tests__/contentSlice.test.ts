import { configureStore } from '@reduxjs/toolkit';
import contentReducer, {
  fetchCalendarItems,
  addCalendarItemOptimistic,
  updateCalendarItemOptimistic,
  deleteCalendarItemOptimistic,
  invalidateCalendarCache,
  selectCalendarItemsForDateRange
} from '../contentSlice';

// Mock the service to avoid actual API calls
jest.mock('../../../services/contentCalendarService', () => ({
  getCalendarEntries: jest.fn(() => Promise.resolve({ data: [] }))
}));

describe('Content slice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        content: contentReducer
      }
    });
  });

  it('should handle optimistic item creation correctly', () => {
    // Initial state should have empty items
    expect(Object.keys(store.getState().content.calendar.items).length).toBe(0);

    // Add an item optimistically
    const newItem = {
      id: 'temp-123',
      title: 'Test Item',
      scheduledDate: '2025-01-15T10:00:00Z',
      status: 'scheduled',
      platform: 'twitter',
      contentType: 'social',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.dispatch(addCalendarItemOptimistic(newItem));

    // Check that item was added
    expect(store.getState().content.calendar.items['temp-123']).toEqual(newItem);

    // Check that it's indexed by date
    const dateStr = '2025-01-15';
    expect(store.getState().content.calendar.itemsByDate[dateStr]).toContain('temp-123');
  });

  it('should handle optimistic item updates correctly', () => {
    // Add an item first
    const initialItem = {
      id: 'item-456',
      title: 'Initial Item',
      scheduledDate: '2025-01-16T10:00:00Z',
      status: 'draft',
      platform: 'facebook',
      contentType: 'social',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.dispatch(addCalendarItemOptimistic(initialItem));

    // Update the item
    const updatedItem = {
      ...initialItem,
      title: 'Updated Item',
      scheduledDate: '2025-01-17T10:00:00Z',
      status: 'scheduled'
    };

    store.dispatch(updateCalendarItemOptimistic(updatedItem));

    // Check that the item was updated
    expect(store.getState().content.calendar.items['item-456']).toEqual(updatedItem);

    // Check that date indexing was updated
    expect(store.getState().content.calendar.itemsByDate['2025-01-16']).toBeUndefined();
    expect(store.getState().content.calendar.itemsByDate['2025-01-17']).toContain('item-456');
  });

  it('should handle optimistic item deletion correctly', () => {
    // Add an item first
    const itemToDelete = {
      id: 'delete-789',
      title: 'Item to Delete',
      scheduledDate: '2025-01-18T10:00:00Z',
      status: 'draft',
      platform: 'linkedin',
      contentType: 'post',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.dispatch(addCalendarItemOptimistic(itemToDelete));
    
    // Check that it was added
    expect(store.getState().content.calendar.items['delete-789']).toEqual(itemToDelete);

    // Delete the item
    store.dispatch(deleteCalendarItemOptimistic('delete-789'));

    // Check that it was removed
    expect(store.getState().content.calendar.items['delete-789']).toBeUndefined();
    expect(store.getState().content.calendar.itemsByDate['2025-01-18']).not.toContain('delete-789');
  });

  it('should invalidate cache correctly', () => {
    // Set up some cache data
    store.dispatch({
      type: 'content/fetchCalendarItems/fulfilled',
      payload: {
        items: [],
        dateRange: '2025-01-01_2025-01-31'
      }
    });

    // Check that lastFetched contains the date range
    expect(store.getState().content.calendar.lastFetched['2025-01-01_2025-01-31']).toBeDefined();

    // Invalidate the cache
    store.dispatch(invalidateCalendarCache());

    // Check that lastFetched was cleared
    expect(Object.keys(store.getState().content.calendar.lastFetched).length).toBe(0);
  });

  it('should select items by date range correctly', () => {
    // Add items with different dates
    const items = [
      {
        id: 'item-1',
        title: 'Item 1',
        scheduledDate: '2025-02-10T10:00:00Z',
        status: 'scheduled',
        contentType: 'blog',
        platform: 'website',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'item-2',
        title: 'Item 2',
        scheduledDate: '2025-02-15T10:00:00Z',
        status: 'scheduled',
        contentType: 'social',
        platform: 'instagram',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'item-3',
        title: 'Item 3',
        scheduledDate: '2025-02-20T10:00:00Z',
        status: 'scheduled',
        contentType: 'email',
        platform: 'email',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    items.forEach(item => store.dispatch(addCalendarItemOptimistic(item)));

    // Select items in a specific range
    const selector = selectCalendarItemsForDateRange('2025-02-12T00:00:00Z', '2025-02-18T23:59:59Z');
    const selectedItems = selector(store.getState());

    // Should only include the middle item
    expect(selectedItems.length).toBe(1);
    expect(selectedItems[0].id).toBe('item-2');
  });
});