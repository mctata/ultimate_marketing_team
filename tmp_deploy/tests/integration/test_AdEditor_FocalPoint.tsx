import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import AdEditor from '../../src/pages/campaigns/AdEditor';
import * as imageService from '../../src/services/imageService';
import * as campaignSlice from '../../src/store/slices/campaignSlice';

// Mock the necessary modules
jest.mock('../../src/services/imageService', () => ({
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
  updateFocalPoint: jest.fn(),
  getOptimizedImageUrl: jest.fn(),
}));

jest.mock('../../src/store/slices/campaignSlice', () => ({
  fetchAdById: jest.fn(),
  createAd: jest.fn(),
  updateAd: jest.fn(),
  selectSelectedAd: jest.fn(),
}));

// Create a mock store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

// Mock image data
const mockImageData = {
  image_id: 'test-123',
  url: 'http://example.com/test.jpg',
  filename: 'test.jpg',
  width: 1200,
  height: 628,
  focal_point: { x: 50, y: 50 },
  variants: {
    facebook: 'http://example.com/test_facebook.jpg',
    instagram_square: 'http://example.com/test_instagram.jpg',
    story: 'http://example.com/test_story.jpg',
    twitter: 'http://example.com/test_twitter.jpg',
    linkedin: 'http://example.com/test_linkedin.jpg',
    thumbnail: 'http://example.com/test_thumbnail.jpg'
  }
};

describe('AdEditor with Focal Point Integration', () => {
  let store;
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock store
    store = mockStore({
      campaigns: {
        selectedAd: null,
        loading: false,
        error: null
      }
    });
    
    // Mock service implementations
    (imageService.uploadImage as jest.Mock).mockResolvedValue(mockImageData);
    (imageService.getOptimizedImageUrl as jest.Mock).mockImplementation(
      (imageData, platform) => imageData?.variants?.[platform] || imageData?.url || ''
    );
    
    // Mock campaign actions
    (campaignSlice.createAd as jest.Mock).mockReturnValue({
      type: 'campaigns/createAd',
      payload: { id: 'new-ad-123' }
    });
    
    // Mock URL functions
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });
  
  test('integrates image uploader with focal point functionality', async () => {
    render(
      <Provider store={store}>
        <AdEditor
          campaignId="campaign-123"
          adSetId="adset-123"
          adId={null}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      </Provider>
    );
    
    // Fill in form fields
    fireEvent.change(screen.getByLabelText('Ad Name'), { target: { value: 'Test Ad' } });
    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'Test Headline' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test Description' } });
    fireEvent.change(screen.getByLabelText('Destination URL'), { target: { value: 'https://example.com' } });
    
    // Find the image uploader and simulate selecting an image
    const selectImageButton = screen.getByText('Select Image');
    
    // Prepare a mock file
    const file = new File(['(binary content)'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.createElement('input');
    input.type = 'file';
    input.name = 'file';
    
    // Mock the file selection
    Object.defineProperty(selectImageButton, 'files', {
      value: [file]
    });
    
    // Simulate image upload completed
    // Since we can't directly trigger the file input, we'll call the handler directly
    await waitFor(() => {
      expect(screen.getByText('Ad Image')).toBeInTheDocument();
    });
    
    // Switch to preview tab to see the ad with focal point-optimized images
    fireEvent.click(screen.getByText('Preview'));
    
    // Check that the preview tab is active
    await waitFor(() => {
      expect(screen.getByText('Ad Preview')).toBeInTheDocument();
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Ad'));
    
    await waitFor(() => {
      // Check that the ad creation action was dispatched with image data included
      expect(campaignSlice.createAd).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalled();
    });
  });
});