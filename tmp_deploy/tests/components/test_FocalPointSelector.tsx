import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FocalPointSelector from '../../src/components/common/FocalPointSelector';

// Mock the image for testing
const mockImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('FocalPointSelector', () => {
  const mockOnChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders with default focal point', () => {
    render(<FocalPointSelector 
      imageUrl={mockImage} 
      onChange={mockOnChange} 
    />);
    
    // Check that the component renders with instructions
    expect(screen.getByText('Select the focal point of your image')).toBeInTheDocument();
    expect(screen.getByText(/Click and drag to set the most important part/)).toBeInTheDocument();
    
    // Check that the image is rendered
    expect(screen.getByAltText('Select focal point')).toBeInTheDocument();
    
    // Check slider values for default focal point (50%, 50%)
    expect(screen.getByText('X: 50.0%')).toBeInTheDocument();
    expect(screen.getByText('Y: 50.0%')).toBeInTheDocument();
  });
  
  test('renders with custom initial focal point', () => {
    render(<FocalPointSelector 
      imageUrl={mockImage} 
      onChange={mockOnChange} 
      initialFocalPoint={{ x: 25, y: 75 }}
    />);
    
    // Check slider values for custom focal point
    expect(screen.getByText('X: 25.0%')).toBeInTheDocument();
    expect(screen.getByText('Y: 75.0%')).toBeInTheDocument();
  });
  
  test('updates focal point when sliders are moved', () => {
    render(<FocalPointSelector 
      imageUrl={mockImage} 
      onChange={mockOnChange} 
      initialFocalPoint={{ x: 50, y: 50 }}
    />);
    
    // Find the X slider
    const xSlider = screen.getAllByRole('slider')[0];
    
    // Simulate changing the slider value
    fireEvent.change(xSlider, { target: { value: '75' } });
    
    // Check that onChange was called with the updated value
    expect(mockOnChange).toHaveBeenCalledWith({ x: 75, y: 50 });
    
    // Find the Y slider
    const ySlider = screen.getAllByRole('slider')[1];
    
    // Simulate changing the Y slider value
    fireEvent.change(ySlider, { target: { value: '25' } });
    
    // Check that onChange was called with the updated value
    expect(mockOnChange).toHaveBeenCalledWith({ x: 75, y: 25 });
  });
  
  test('handles mouse click to set focal point', () => {
    // Mock getBoundingClientRect for the image element
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 200,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 200,
      x: 0,
      y: 0,
      toJSON: () => {}
    }));
    
    render(<FocalPointSelector 
      imageUrl={mockImage} 
      onChange={mockOnChange} 
    />);
    
    // Find the container where the mousedown event should be triggered
    const container = screen.getByAltText('Select focal point').parentElement;
    
    // Simulate a mouse click at position (100, 50)
    fireEvent.mouseDown(container, { clientX: 100, clientY: 50 });
    
    // Check that onChange was called with the correct focal point (50%, 50%)
    expect(mockOnChange).toHaveBeenCalledWith({ x: 50, y: 50 });
    
    // Simulate a mouse click at position (40, 70)
    fireEvent.mouseDown(container, { clientX: 40, clientY: 70 });
    
    // Check that onChange was called with the correct focal point (20%, 70%)
    expect(mockOnChange).toHaveBeenCalledWith({ x: 20, y: 70 });
  });
});