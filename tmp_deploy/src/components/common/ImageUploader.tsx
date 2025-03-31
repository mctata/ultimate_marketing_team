import { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  IconButton,
  Paper,
  alpha,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import { uploadImage, deleteImage } from '../../services/imageService';
import FocalPointSelector from './FocalPointSelector';

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export interface ImageData {
  image_id: string;
  url: string;
  filename: string;
  width: number;
  height: number;
  focal_point: { x: number; y: number };
  variants: { [key: string]: string };
}

interface ImageUploaderProps {
  initialImage?: ImageData | null;
  onImageChange: (imageData: ImageData | null) => void;
  aspectRatio?: number; // width/height, e.g., 1.91 for Facebook feed ads (1200x628)
  error?: string;
}

const ImageUploader = ({ 
  initialImage, 
  onImageChange, 
  aspectRatio = 1.91, 
  error: externalError 
}: ImageUploaderProps) => {
  const [image, setImage] = useState<ImageData | null>(initialImage || null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFocalPointEditor, setShowFocalPointEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = async (file: File | null) => {
    if (!file) {
      setError(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds maximum limit (10MB)`);
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`Invalid file type. Allowed types: JPG, PNG, GIF, WebP`);
      return;
    }

    setError(null);
    setIsLoading(true);
    
    // Simulated progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 5;
        return next >= 90 ? 90 : next;
      });
    }, 100);

    try {
      // Upload the image to server
      const imageData = await uploadImage(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Update component state and notify parent
      setImage(imageData);
      onImageChange(imageData);
      
      // Reset progress after a short delay
      setTimeout(() => {
        setProgress(0);
        setIsLoading(false);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      setIsLoading(false);
      setProgress(0);
    }
  };

  // Handle the input change event
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  // Open file browser
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  }, []);

  // Remove current image
  const handleRemoveImage = async () => {
    if (!image) return;
    
    setIsLoading(true);
    try {
      // Delete the image on the server
      await deleteImage(image.image_id);
      
      // Update component state and notify parent
      setImage(null);
      onImageChange(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Failed to delete image:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Edit focal point
  const handleEditFocalPoint = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFocalPointEditor(true);
  };
  
  // Handle focal point update
  const handleFocalPointChange = async (focalPoint: { x: number; y: number }) => {
    if (!image) return;
    
    setIsLoading(true);
    try {
      // Update focal point on the server
      const response = await fetch(`/api/content/images/${image.image_id}/focal-point`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(focalPoint),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update focal point');
      }
      
      // Get updated image data with new variants
      const updatedImage = await response.json();
      
      // Update component state and notify parent
      setImage(updatedImage);
      onImageChange(updatedImage);
      setShowFocalPointEditor(false);
    } catch (err) {
      console.error('Failed to update focal point:', err);
      setError(err instanceof Error ? err.message : 'Failed to update focal point');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle cancel focal point editing
  const handleCancelFocalPoint = () => {
    setShowFocalPointEditor(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <input
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={onInputChange}
      />

      {showFocalPointEditor && image ? (
        <Box sx={{ mb: 2 }}>
          <FocalPointSelector
            imageUrl={image.url}
            initialFocalPoint={image.focal_point}
            onChange={handleFocalPointChange}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="outlined"
              color="inherit"
              onClick={handleCancelFocalPoint}
              sx={{ mr: 1 }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="contained"
              color="primary"
              onClick={() => handleFocalPointChange(image.focal_point)}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      ) : (
        /* Drop zone or image preview */
        <Paper
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          elevation={isDragging ? 3 : 1}
          sx={{
            borderRadius: 1,
            height: aspectRatio ? `calc(width / ${aspectRatio})` : 200,
            minHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            border: theme => 
              isDragging 
                ? `2px dashed ${theme.palette.primary.main}` 
                : (image ? 'none' : `2px dashed ${externalError ? theme.palette.error.main : theme.palette.divider}`),
            background: theme => 
              isDragging 
                ? alpha(theme.palette.primary.main, 0.05) 
                : (image ? 'none' : alpha(theme.palette.divider, 0.05)),
            '&:hover': {
              background: theme => image 
                ? alpha(theme.palette.common.black, 0.05) 
                : alpha(theme.palette.divider, 0.1),
            }
          }}
          onClick={handleButtonClick}
        >
          {isLoading ? (
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress variant="determinate" value={progress} size={60} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {progress < 100 ? `Uploading... ${progress}%` : 'Processing...'}
              </Typography>
            </Box>
          ) : image ? (
            <>
              <img
                src={image.url}
                alt="Upload preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <Box 
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  padding: 1,
                  display: 'flex',
                  background: theme => alpha(theme.palette.common.black, 0.5),
                  borderTopLeftRadius: 4,
                }}
              >
                <IconButton 
                  size="small" 
                  onClick={handleEditFocalPoint}
                  sx={{ color: 'white', mr: 1 }}
                  title="Adjust focal point"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleRemoveImage(); 
                  }}
                  sx={{ color: 'white' }}
                  title="Remove image"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <ImageIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                Drag and drop an image or click to browse
              </Typography>
              <Typography variant="body2" color="textSecondary">
                JPG, PNG, GIF, WebP • Max 10MB
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ mt: 2 }}
                onClick={(e) => { e.stopPropagation(); handleButtonClick(); }}
              >
                Select Image
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {(error || externalError) && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error || externalError}
        </Alert>
      )}
      
      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
        Recommended dimensions: {aspectRatio === 1.91 ? '1200×628px (1.91:1)' : 
          aspectRatio === 1 ? '1080×1080px (1:1)' : 
          aspectRatio === 1.78 ? '1200×675px (16:9)' : 'Varies by platform'}
      </Typography>
    </Box>
  );
};

export default ImageUploader;