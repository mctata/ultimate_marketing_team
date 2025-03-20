// Service for handling image uploads and management
import api from './api';
import { ImageData } from '../components/common/ImageUploader';

interface UploadOptions {
  width?: number;
  height?: number;
  quality?: number;
  focalPoint?: { x: number; y: number };
}

/**
 * Upload an image to the server with focal point information
 * @param file The image file to upload
 * @param options Optional parameters for uploading (width, height, quality, focalPoint)
 * @returns Promise resolving to the uploaded image data
 */
export const uploadImage = async (
  file: File, 
  options: UploadOptions = {}
): Promise<ImageData> => {
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size exceeds 10MB limit');
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
    
    // Add focal point information
    const focalPoint = options.focalPoint || { x: 50, y: 50 }; // default to center
    formData.append('focal_point', JSON.stringify(focalPoint));
    
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
      const imageId = `local_${Date.now()}`;
      
      // Create a mock image data structure
      return {
        image_id: imageId,
        url: objectUrl,
        filename: file.name,
        width: 1200, // Assume default dimensions
        height: 628,
        focal_point: focalPoint,
        variants: {
          facebook: objectUrl,
          instagram_square: objectUrl,
          story: objectUrl,
          twitter: objectUrl,
          linkedin: objectUrl,
          thumbnail: objectUrl
        }
      };
    }
    
    // Return the uploaded image data
    return response.data;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    
    // For development, provide a fallback to still show the image
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using local object URL for image preview in development');
      const objectUrl = URL.createObjectURL(file);
      const imageId = `local_${Date.now()}`;
      const focalPoint = options.focalPoint || { x: 50, y: 50 };
      
      // Create a mock image data structure
      return {
        image_id: imageId,
        url: objectUrl,
        filename: file.name,
        width: 1200, // Assume default dimensions
        height: 628,
        focal_point: focalPoint,
        variants: {
          facebook: objectUrl,
          instagram_square: objectUrl,
          story: objectUrl,
          twitter: objectUrl,
          linkedin: objectUrl,
          thumbnail: objectUrl
        }
      };
    }
    
    throw new Error(error.response?.data?.detail || error.message || 'Failed to upload image');
  }
};

/**
 * Delete an image and all its variants from storage
 * @param imageId The ID of the image to delete
 * @returns Promise resolving to true if deletion was successful
 */
export const deleteImage = async (imageId: string): Promise<boolean> => {
  // Skip API call for local object URLs created in development mode
  if (imageId.startsWith('local_')) {
    console.log(`Skipping delete for local image: ${imageId}`);
    return true;
  }
  
  try {
    // Call the API to delete the image
    await api.delete(`/content/images/${imageId}`);
    console.log(`Image deleted: ${imageId}`);
    return true;
  } catch (error: any) {
    console.error('Error deleting image:', error);
    
    // In development, return success even if API call fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('Development mode: Pretending image deletion succeeded');
      return true;
    }
    
    throw new Error(error.response?.data?.detail || error.message || 'Failed to delete image');
  }
};

/**
 * Update the focal point of an image and regenerate variants
 * @param imageId The ID of the image to update
 * @param focalPoint The new focal point as x,y percentages (0-100)
 * @returns Promise resolving to the updated image data
 */
export const updateFocalPoint = async (
  imageId: string,
  focalPoint: { x: number; y: number }
): Promise<ImageData> => {
  // Skip API call for local object URLs created in development mode
  if (imageId.startsWith('local_')) {
    console.log(`Skipping focal point update for local image: ${imageId}`);
    return {
      image_id: imageId,
      url: imageId, // For local development, imageId is the URL
      filename: `${imageId}.jpg`,
      width: 1200,
      height: 628,
      focal_point: focalPoint,
      variants: {
        facebook: imageId,
        instagram_square: imageId,
        story: imageId,
        twitter: imageId,
        linkedin: imageId,
        thumbnail: imageId
      }
    };
  }
  
  try {
    // Call the API to update the focal point
    const response = await api.put(`/content/images/${imageId}/focal-point`, focalPoint);
    return response.data;
  } catch (error: any) {
    console.error('Error updating focal point:', error);
    
    // In development, return a mock response even if API call fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('Development mode: Mocking focal point update');
      return {
        image_id: imageId,
        url: `/uploads/images/${imageId}`,
        filename: `${imageId}.jpg`,
        width: 1200,
        height: 628,
        focal_point: focalPoint,
        variants: {
          facebook: `/uploads/images/${imageId}_facebook.jpg`,
          instagram_square: `/uploads/images/${imageId}_instagram_square.jpg`,
          story: `/uploads/images/${imageId}_story.jpg`,
          twitter: `/uploads/images/${imageId}_twitter.jpg`,
          linkedin: `/uploads/images/${imageId}_linkedin.jpg`,
          thumbnail: `/uploads/images/${imageId}_thumbnail.jpg`
        }
      };
    }
    
    throw new Error(error.response?.data?.detail || error.message || 'Failed to update focal point');
  }
};

/**
 * Get the optimal variant URL for a specific platform and size
 * @param imageData The image data object
 * @param platform The platform name (facebook, instagram_square, etc.)
 * @returns The URL for the optimized image variant
 */
export const getOptimizedImageUrl = (
  imageData: ImageData | null,
  platform: string = 'facebook'
): string => {
  if (!imageData) return '';
  
  // If the requested variant exists, use it
  if (imageData.variants && imageData.variants[platform]) {
    return imageData.variants[platform];
  }
  
  // Otherwise fall back to original
  return imageData.url;
};

/**
 * Get an appropriate image variant for the specified dimensions
 * @param imageData The image data object
 * @param width Desired width in pixels
 * @param height Desired height in pixels
 * @returns The URL for the most appropriate image variant
 */
export const getImageForDimensions = (
  imageData: ImageData | null,
  width: number,
  height: number
): string => {
  if (!imageData) return '';
  
  // Calculate the aspect ratio
  const aspectRatio = width / height;
  
  // Find closest matching variant
  if (Math.abs(aspectRatio - 1.91) < 0.1) {
    // Facebook/LinkedIn aspect ratio (~1.91:1)
    return getOptimizedImageUrl(imageData, 'facebook');
  } else if (Math.abs(aspectRatio - 1) < 0.1) {
    // Square aspect ratio
    return getOptimizedImageUrl(imageData, 'instagram_square');
  } else if (Math.abs(aspectRatio - 0.56) < 0.1) {
    // Story aspect ratio (~9:16)
    return getOptimizedImageUrl(imageData, 'story');
  } else if (Math.abs(aspectRatio - 1.78) < 0.1) {
    // Twitter/YouTube aspect ratio (~16:9)
    return getOptimizedImageUrl(imageData, 'twitter');
  } else if (width <= 400 && height <= 400) {
    // Small thumbnail
    return getOptimizedImageUrl(imageData, 'thumbnail');
  }
  
  // Default to original if no good match
  return imageData.url;
};

export default {
  uploadImage,
  deleteImage,
  updateFocalPoint,
  getOptimizedImageUrl,
  getImageForDimensions
};