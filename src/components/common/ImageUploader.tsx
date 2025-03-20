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

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface ImageUploaderProps {
  initialImageUrl?: string;
  onImageChange: (imageUrl: string | null, file?: File) => void;
  aspectRatio?: number; // width/height, e.g., 1.91 for Facebook feed ads (1200x628)
}

const ImageUploader = ({ initialImageUrl, onImageChange, aspectRatio = 1.91 }: ImageUploaderProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (file: File | null) => {
    if (!file) {
      setError(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds maximum limit (5MB)`);
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`Invalid file type. Allowed types: JPG, PNG, GIF, WebP`);
      return;
    }

    setError(null);
    setIsLoading(true);

    // Create a local object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setImageUrl(objectUrl);
    
    // For now, we're just using the object URL locally
    // In a real application, you would upload to cloud storage here
    onImageChange(objectUrl, file);
    setIsLoading(false);
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
  const handleRemoveImage = () => {
    setImageUrl(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

      {/* Drop zone or image preview */}
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
              : (imageUrl ? 'none' : `2px dashed ${theme.palette.divider}`),
          background: theme => 
            isDragging 
              ? alpha(theme.palette.primary.main, 0.05) 
              : (imageUrl ? 'none' : alpha(theme.palette.divider, 0.05)),
          '&:hover': {
            background: theme => imageUrl 
              ? alpha(theme.palette.common.black, 0.05) 
              : alpha(theme.palette.divider, 0.1),
          }
        }}
        onClick={handleButtonClick}
      >
        {isLoading ? (
          <CircularProgress />
        ) : imageUrl ? (
          <>
            <img
              src={imageUrl}
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
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleButtonClick(); 
                }}
                sx={{ color: 'white', mr: 1 }}
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
              JPG, PNG, GIF, WebP • Max 5MB
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

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
        Recommended dimensions: {aspectRatio === 1.91 ? '1200×628px (1.91:1)' : 
          aspectRatio === 1 ? '1080×1080px (1:1)' : 'Varies by platform'}
      </Typography>
    </Box>
  );
};

export default ImageUploader;