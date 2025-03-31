import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageUploader from '../../src/components/common/ImageUploader';
import * as imageService from '../../src/services/imageService';

// Mock the imageService
jest.mock('../../src/services/imageService', () => ({
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
  updateFocalPoint: jest.fn(),
}));

// Mock data
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

describe('ImageUploader', () => {
  const mockOnImageChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock implementations
    (imageService.uploadImage as jest.Mock).mockResolvedValue(mockImageData);
    (imageService.deleteImage as jest.Mock).mockResolvedValue(true);
    (imageService.updateFocalPoint as jest.Mock).mockResolvedValue({
      ...mockImageData,
      focal_point: { x: 60, y: 40 }
    });

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  test('renders empty state correctly', () => {
    render(
      <ImageUploader 
        onImageChange={mockOnImageChange}
      />
    );
    
    // Check that upload text is displayed
    expect(screen.getByText('Drag and drop an image or click to browse')).toBeInTheDocument();
    expect(screen.getByText('JPG, PNG, GIF, WebP • Max 10MB')).toBeInTheDocument();
    expect(screen.getByText('Select Image')).toBeInTheDocument();
  });

  test('renders with initial image', () => {
    render(
      <ImageUploader 
        initialImage={mockImageData}
        onImageChange={mockOnImageChange}
      />
    );
    
    // Image should be displayed
    const image = screen.getByAltText('Upload preview');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockImageData.url);
    
    // Edit and delete buttons should be present
    expect(screen.getByTitle('Adjust focal point')).toBeInTheDocument();
    expect(screen.getByTitle('Remove image')).toBeInTheDocument();
  });

  test('shows focal point editor when edit button is clicked', async () => {
    render(
      <ImageUploader 
        initialImage={mockImageData}
        onImageChange={mockOnImageChange}
      />
    );
    
    // Click the edit focal point button
    fireEvent.click(screen.getByTitle('Adjust focal point'));
    
    // Focal point editor should be displayed
    await waitFor(() => {
      expect(screen.getByText('Select the focal point of your image')).toBeInTheDocument();
    });
    
    // Cancel and Save buttons should be present
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  test('removes image when delete button is clicked', async () => {
    render(
      <ImageUploader 
        initialImage={mockImageData}
        onImageChange={mockOnImageChange}
      />
    );
    
    // Click the remove image button
    fireEvent.click(screen.getByTitle('Remove image'));
    
    // Service should be called to delete the image
    await waitFor(() => {
      expect(imageService.deleteImage).toHaveBeenCalledWith(mockImageData.image_id);
    });
    
    // onImageChange should be called with null
    expect(mockOnImageChange).toHaveBeenCalledWith(null);
  });

  test('displays error message when provided', () => {
    render(
      <ImageUploader 
        onImageChange={mockOnImageChange}
        error="Invalid image format"
      />
    );
    
    // Error message should be displayed
    expect(screen.getByText('Invalid image format')).toBeInTheDocument();
  });
  
  test('shows aspect ratio recommendation', () => {
    render(
      <ImageUploader 
        onImageChange={mockOnImageChange}
        aspectRatio={1.91}
      />
    );
    
    // Aspect ratio recommendation should be displayed
    expect(screen.getByText('Recommended dimensions: 1200×628px (1.91:1)')).toBeInTheDocument();
    
    // Test with different aspect ratio
    render(
      <ImageUploader 
        onImageChange={mockOnImageChange}
        aspectRatio={1}
      />
    );
    
    expect(screen.getByText('Recommended dimensions: 1080×1080px (1:1)')).toBeInTheDocument();
  });
});