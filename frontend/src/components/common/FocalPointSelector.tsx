import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Slider } from '@mui/material';

interface FocalPointSelectorProps {
  imageUrl: string;
  onChange: (focalPoint: { x: number; y: number }) => void;
  initialFocalPoint?: { x: number; y: number };
}

const FocalPointSelector: React.FC<FocalPointSelectorProps> = ({
  imageUrl,
  onChange,
  initialFocalPoint = { x: 50, y: 50 } // Default to center
}) => {
  const [focalPoint, setFocalPoint] = useState(initialFocalPoint);
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateFocalPoint = (clientX: number, clientY: number) => {
    if (!imageRef.current || !containerRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    
    const newPoint = { x, y };
    setFocalPoint(newPoint);
    onChange(newPoint);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    updateFocalPoint(e.clientX, e.clientY);
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      updateFocalPoint(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add and remove event listeners for drag behavior
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle2" gutterBottom>
        Select the focal point of your image
      </Typography>
      <Typography variant="body2" gutterBottom color="text.secondary">
        Click and drag to set the most important part of the image that should remain visible on all platforms
      </Typography>
      
      <Box 
        ref={containerRef}
        sx={{ 
          position: 'relative',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          borderRadius: 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          my: 2
        }}
        onMouseDown={handleMouseDown}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Select focal point"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
        
        {/* Crosshair showing the focal point */}
        <Box
          sx={{
            position: 'absolute',
            left: `${focalPoint.x}%`,
            top: `${focalPoint.y}%`,
            transform: 'translate(-50%, -50%)',
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid white',
            backgroundColor: 'rgba(25, 118, 210, 0.6)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 0 0 4px rgba(25, 118, 210, 0.3)',
            pointerEvents: 'none'
          }}
        />
        
        {/* Horizontal line */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: `${focalPoint.y}%`,
            width: '100%',
            height: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            boxShadow: '0 0 1px rgba(0,0,0,0.5)',
            pointerEvents: 'none'
          }}
        />
        
        {/* Vertical line */}
        <Box
          sx={{
            position: 'absolute',
            left: `${focalPoint.x}%`,
            top: 0,
            width: '1px',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            boxShadow: '0 0 1px rgba(0,0,0,0.5)',
            pointerEvents: 'none'
          }}
        />
      </Box>

      {/* Fine-tuning sliders */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2">
          X: {focalPoint.x.toFixed(1)}%
        </Typography>
        <Slider
          value={focalPoint.x}
          onChange={(_, value) => {
            const newVal = typeof value === 'number' ? value : value[0];
            setFocalPoint(prev => ({ ...prev, x: newVal }));
            onChange({ ...focalPoint, x: newVal });
          }}
          min={0}
          max={100}
          step={0.1}
          sx={{ mb: 2 }}
        />
        
        <Typography variant="body2">
          Y: {focalPoint.y.toFixed(1)}%
        </Typography>
        <Slider
          value={focalPoint.y}
          onChange={(_, value) => {
            const newVal = typeof value === 'number' ? value : value[0];
            setFocalPoint(prev => ({ ...prev, y: newVal }));
            onChange({ ...focalPoint, y: newVal });
          }}
          min={0}
          max={100}
          step={0.1}
        />
      </Box>
    </Box>
  );
};

export default FocalPointSelector;