// Service for handling image uploads and management
import api from './api';

interface UploadResponse {
  url: string;
  public_id: string; // Corresponds to filename in our API
  success: boolean;
  error?: string;
  width?: number;
  height?: number;
  size?: number;
}

interface UploadOptions {
  width?: number;
  height?: number;
  quality?: number;
}

// Upload an image to the server
export const uploadImage = async (
  file: File, 
  options: UploadOptions = {}
): Promise<UploadResponse> => {
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size exceeds 5MB limit');
  }
  
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: JPG, PNG, GIF, WebP');
  }
  
  try {
    // Create FormData object for the file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Add optional parameters for image processing
    if (options.width) {
      formData.append('width', options.width.toString());
    }
    
    if (options.height) {
      formData.append('height', options.height.toString());
    }
    
    if (options.quality) {
      formData.append('quality', options.quality.toString());
    }
    
    // Make the API call to upload the image
    const response = await api.post('/content/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // In development, we might want to fall back to object URLs if the API call fails
    if (process.env.NODE_ENV === 'development' && !response.data) {
      console.warn('Using local object URL for image preview in development');
      const objectUrl = URL.createObjectURL(file);
      return {
        url: objectUrl,
        public_id: `local_${Date.now()}`,
        success: true
      };
    }
    
    // Return the uploaded image data
    return {
      url: response.data.url,
      public_id: response.data.filename,
      success: true,
      width: response.data.width,
      height: response.data.height,
      size: response.data.size
    };
  } catch (error: any) {
    console.error('Error uploading image:', error);
    
    // For development, provide a fallback to still show the image
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using local object URL for image preview in development');
      const objectUrl = URL.createObjectURL(file);
      return {
        url: objectUrl,
        public_id: `local_${Date.now()}`,
        success: true
      };
    }
    
    return {
      url: '',
      public_id: '',
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to upload image'
    };
  }
};

// Delete an image from storage
export const deleteImage = async (publicId: string): Promise<boolean> => {
  // Skip API call for local object URLs created in development mode
  if (publicId.startsWith('local_')) {
    console.log(`Skipping delete for local image: ${publicId}`);
    return true;
  }
  
  try {
    // Call the API to delete the image
    await api.delete(`/content/images/${publicId}`);
    console.log(`Image deleted: ${publicId}`);
    return true;
  } catch (error: any) {
    console.error('Error deleting image:', error);
    
    // In development, return success even if API call fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('Development mode: Pretending image deletion succeeded');
      return true;
    }
    
    return false;
  }
};

// Get a signed URL for an image (useful for private images)
export const getSignedUrl = async (publicId: string): Promise<string> => {
  // For local development object URLs
  if (publicId.startsWith('local_')) {
    return publicId;
  }
  
  try {
    // In a production implementation, this would call your backend API
    // to get a signed URL with temporary access to a private image
    const response = await api.get(`/content/images/${publicId}/signed-url`);
    return response.data.url;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    
    // Fallback for development
    return `/uploads/images/${publicId}`;
  }
};

/**
 * Optimize and transform an image URL
 * In a production app, this would be used with cloud storage like Cloudinary
 */
export const optimizeImageUrl = (url: string, options: {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale';
  quality?: number;
} = {}): string => {
  // Skip processing for local object URLs
  if (url.startsWith('blob:')) {
    return url;
  }
  
  // For API-based images, we can append query parameters for on-the-fly processing
  // This assumes your API or CDN supports this. If not, you'd return the original URL
  const params = new URLSearchParams();
  
  if (options.width) {
    params.append('w', options.width.toString());
  }
  
  if (options.height) {
    params.append('h', options.height.toString());
  }
  
  if (options.crop) {
    params.append('fit', options.crop);
  }
  
  if (options.quality) {
    params.append('q', options.quality.toString());
  }
  
  const queryString = params.toString();
  if (queryString) {
    return `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
  }
  
  return url;
};

export default {
  uploadImage,
  deleteImage,
  getSignedUrl,
  optimizeImageUrl
};