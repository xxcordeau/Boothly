// Frame storage utility using Supabase Storage for images and KV store for metadata
import { FrameType, ModeType, TemplateType } from '../types/photobooth';
import { projectId, publicAnonKey } from './supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-356393ac`;

export interface UploadedFrame {
  id: string;
  name: string;
  templateType: TemplateType;
  frameType: FrameType; // 'frame' or 'overlay'
  mode: ModeType; // 'basic' or 'special'
  imageUrl?: string; // Public URL from Supabase Storage
  storagePath?: string; // Storage path for the frame image
  thumbnailUrl?: string; // Thumbnail image shown before shooting starts
  thumbnailStoragePath?: string; // Storage path for thumbnail
  overlaySlots?: string[]; // For overlay type - array of image URLs for each cut
  dataUrl?: string; // Keep for backward compatibility, but prefer imageUrl
  enabled?: boolean; // Whether this theme is enabled/visible to users
  uploadedAt: number;
}

const STORAGE_KEY = 'photobooth_custom_frames';
let cachedFrames: UploadedFrame[] | null = null;

// Upload frame image to Supabase Storage
export const uploadFrameImage = async (
  dataUrl: string,
  frameId: string,
  filename: string
): Promise<{ publicUrl: string; path: string }> => {
  try {
    // Check if Supabase is configured
    if (!projectId || projectId === 'YOUR_PROJECT_ID' || !publicAnonKey) {
      console.warn('⚠️ Supabase not configured, using dataUrl directly');
      // Return dataUrl as fallback when Supabase is not configured
      return { publicUrl: dataUrl, path: `local/${frameId}/${filename}` };
    }

    const response = await fetch(`${API_URL}/frames/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ dataUrl, frameId, filename }),
    });

    if (!response.ok) {
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload frame image');
      } else {
        // Non-JSON response (like HTML error page) - Supabase function not available
        console.warn('⚠️ Supabase function not available, using dataUrl directly');
        return { publicUrl: dataUrl, path: `local/${frameId}/${filename}` };
      }
    }

    const result = await response.json();
    console.log('✅ Frame image uploaded to Storage:', result.publicUrl);
    return { publicUrl: result.publicUrl, path: result.path };
  } catch (error) {
    console.warn('⚠️ Failed to upload frame image to Supabase, using dataUrl:', error);
    // Fallback to using dataUrl directly
    return { publicUrl: dataUrl, path: `local/${frameId}/${filename}` };
  }
};

// Sync frame metadata to Supabase
const syncMetadataToSupabase = async (frame: UploadedFrame): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/frames`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ frame }),
    });
    
    if (response.ok) {
      console.log('✅ Frame metadata synced to Supabase');
    } else {
      console.warn(`⚠️ Failed to sync frame metadata to Supabase: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.warn('⚠️ Could not sync frame metadata to Supabase (saved locally):', error instanceof Error ? error.message : 'Network error');
    // Don't throw - allow local storage to work even if Supabase is unavailable
  }
};

// Load frames from Supabase and fallback to localStorage
const loadFramesFromSupabase = async (): Promise<UploadedFrame[]> => {
  try {
    const response = await fetch(`${API_URL}/frames`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Frames loaded from Supabase:', result.frames.length);
      // Update localStorage cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.frames));
      return result.frames;
    } else {
      console.warn(`⚠️ Failed to load frames from Supabase: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.warn('⚠️ Could not connect to Supabase (using local cache):', error instanceof Error ? error.message : 'Network error');
  }
  
  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      console.log('📦 Using cached frames from localStorage');
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to load frames from localStorage:', err);
  }
  
  console.log('📋 No frames available (using empty array)');
  return [];
};

// Save frame (both image and metadata)
export const saveFrame = async (frame: UploadedFrame): Promise<void> => {
  const frames = await getFrames();
  const existingIndex = frames.findIndex(f => f.id === frame.id);
  
  if (existingIndex >= 0) {
    frames[existingIndex] = frame;
  } else {
    frames.push(frame);
  }
  
  // Save to localStorage immediately
  localStorage.setItem(STORAGE_KEY, JSON.stringify(frames));
  cachedFrames = frames;
  
  // Sync metadata to Supabase
  await syncMetadataToSupabase(frame);
};

export const getFrames = (): UploadedFrame[] => {
  // Return cached frames if available
  if (cachedFrames !== null) {
    return cachedFrames;
  }
  
  // Try localStorage first for immediate response
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const frames = stored ? JSON.parse(stored) : [];
    cachedFrames = frames;
    
    // Load from Supabase in background
    loadFramesFromSupabase().then(supabaseFrames => {
      cachedFrames = supabaseFrames;
    });
    
    return frames;
  } catch (err) {
    console.error('Failed to load frames:', err);
    return [];
  }
};

export const getFrameByTemplateAndType = (
  templateType: string, 
  frameType: FrameType
): UploadedFrame | null => {
  const frames = getFrames();
  return frames.find(f => f.templateType === templateType && f.frameType === frameType) || null;
};

export const getFramesByMode = (mode: ModeType): UploadedFrame[] => {
  const frames = getFrames();
  return frames.filter(f => f.mode === mode);
};

export const getFramesByModeAndTemplate = (
  mode: ModeType,
  templateType: TemplateType
): UploadedFrame[] => {
  const frames = getFrames();
  return frames.filter(f => f.mode === mode && f.templateType === templateType);
};

export const deleteFrame = async (id: string): Promise<void> => {
  const frames = getFrames();
  const filtered = frames.filter(f => f.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  cachedFrames = filtered;
  
  // Delete from Supabase (both storage and metadata)
  try {
    await fetch(`${API_URL}/frames/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    console.log('✅ Frame deleted from Supabase');
  } catch (error) {
    console.error('❌ Failed to delete frame from Supabase:', error);
  }
};

export const clearAllFrames = async (): Promise<void> => {
  localStorage.removeItem(STORAGE_KEY);
  cachedFrames = [];
  
  // Clear from Supabase
  try {
    await fetch(`${API_URL}/frames`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    console.log('✅ All frames cleared from Supabase');
  } catch (error) {
    console.error('❌ Failed to clear frames from Supabase:', error);
  }
};