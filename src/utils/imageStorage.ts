// Store images in Supabase Storage for public sharing
import { projectId, publicAnonKey } from './supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-356393ac`;

interface ImageMetadata {
  id: string;
  fileName: string;
  templateName: string;
  publicUrl: string;
  createdAt: string;
  expiresAt: string;
}

/**
 * Upload image to Supabase Storage
 */
export const saveImage = async (
  dataUrl: string,
  templateName: string,
  preGeneratedId?: string // Optional pre-generated ID
): Promise<string> => {
  try {
    console.log('📤 Uploading image to Supabase Storage...');
    if (preGeneratedId) {
      console.log('🆔 Using pre-generated ID:', preGeneratedId);
    }
    
    // Check if Supabase is configured
    if (!projectId || projectId === 'YOUR_PROJECT_ID' || !publicAnonKey) {
      console.warn('⚠️ Supabase not configured, image cannot be stored remotely');
      throw new Error('Supabase not configured');
    }
    
    const response = await fetch(`${API_URL}/images/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ 
        dataUrl, 
        templateName,
        imageId: preGeneratedId // Send pre-generated ID to server
      }),
    });

    if (!response.ok) {
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      } else {
        // Non-JSON response (like HTML error page) - Supabase function not available
        throw new Error('Supabase function not available');
      }
    }

    const result = await response.json();
    console.log('✅ Image uploaded successfully:', result.imageId);
    console.log('🔗 Public URL:', result.publicUrl);
    
    return result.imageId;
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    throw error;
  }
};

/**
 * Get image metadata by ID
 */
export const getImage = async (imageId: string): Promise<{ dataUrl: string; templateName: string } | null> => {
  try {
    console.log('🔍 Fetching image from Supabase:', imageId);
    
    const response = await fetch(`${API_URL}/images/${imageId}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('❌ Image not found:', imageId);
        return null;
      }
      if (response.status === 410) {
        console.log('⏰ Image expired:', imageId);
        return null;
      }
      throw new Error('Failed to fetch image');
    }

    const result = await response.json();
    const metadata: ImageMetadata = result.metadata;
    
    console.log('✅ Image metadata fetched:', metadata.id);
    
    // Return compatible format with DownloadPage
    return {
      dataUrl: metadata.publicUrl,
      templateName: metadata.templateName,
    };
  } catch (error) {
    console.error('❌ Error fetching image:', error);
    return null;
  }
};

/**
 * Delete expired images (cleanup)
 */
export const deleteOldImages = async (): Promise<void> => {
  try {
    console.log('🧹 Requesting image cleanup...');
    
    const response = await fetch(`${API_URL}/images/cleanup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to cleanup images');
    }

    const result = await response.json();
    console.log(`✅ Cleanup complete. Deleted ${result.deletedCount} images`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
};

/**
 * Generate shareable URL for image
 */
export const getShareableUrl = (imageId: string): string => {
  const baseUrl = window.location.origin;
  // Use React Router format (no hash)
  return `${baseUrl}/download/${imageId}`;
};