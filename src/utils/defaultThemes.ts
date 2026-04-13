import { UploadedFrame, saveFrame, getFrames, uploadFrameImage } from './frameStorage';
import { TemplateType, ModeType } from '../types/photobooth';

// Initialize default special themes if they don't exist
export const initializeDefaultThemes = async () => {
  const frames = getFrames();
  
  // Check if we already have special themes
  const hasSpecialThemes = frames.some(f => f.mode === 'special');
  
  if (hasSpecialThemes) {
    console.log('Default special themes already exist');
    return;
  }
  
  console.log('Creating default special themes...');
  
  // Create default themes for each template
  const templates: Array<{ type: TemplateType; cuts: number }> = [
    { type: 'vertical-4', cuts: 4 },
    { type: 'vertical-3', cuts: 3 },
    { type: 'horizontal-4', cuts: 4 },
    { type: 'horizontal-line-4', cuts: 4 },
  ];
  
  const themes = [
    { name: '빈티지 필름', color: '#f4e4c1', textColor: '#8b7355' },
    { name: '시크 블랙', color: '#2a2a2a', textColor: '#ffffff' },
  ];
  
  for (const { type: templateType, cuts } of templates) {
    for (const theme of themes) {
      // Create URL-safe ID (no Korean characters)
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const baseId = `default-special-${templateType}-${timestamp}-${randomSuffix}`;
      
      try {
        // Create and upload overlay layers (one for each cut)
        const overlayFrameId = `${baseId}-overlay`;
        const uploadedSlots: string[] = [];
        
        for (let i = 0; i < cuts; i++) {
          const overlayDataUrl = createDefaultOverlayLayer(i, cuts, theme.color, theme.textColor);
          const filename = `overlay-slot-${i}.png`;
          
          try {
            const { publicUrl } = await uploadFrameImage(overlayDataUrl, overlayFrameId, filename);
            uploadedSlots[i] = publicUrl;
          } catch (error) {
            console.error(`Failed to upload overlay slot ${i}:`, error);
            uploadedSlots[i] = overlayDataUrl; // Fallback to dataUrl
          }
        }
        
        const overlayFrame: UploadedFrame = {
          id: overlayFrameId,
          name: theme.name,
          templateType,
          frameType: 'overlay',
          mode: 'special',
          overlaySlots: uploadedSlots,
          enabled: true,
          uploadedAt: Date.now(),
        };
        await saveFrame(overlayFrame);
        
        // Create and upload composite frame
        const compositeFrameId = `${baseId}-frame`;
        const compositeDataUrl = createDefaultFrame(templateType, theme.name, theme.color, theme.textColor);
        
        let imageUrl = compositeDataUrl;
        let storagePath = undefined;
        
        try {
          const result = await uploadFrameImage(compositeDataUrl, compositeFrameId, 'frame.png');
          imageUrl = result.publicUrl;
          storagePath = result.path;
        } catch (error) {
          console.error('Failed to upload composite frame:', error);
          // Fallback to dataUrl
        }
        
        const frameData: UploadedFrame = {
          id: compositeFrameId,
          name: theme.name,
          templateType,
          frameType: 'frame',
          mode: 'special',
          imageUrl,
          storagePath,
          dataUrl: compositeDataUrl, // Keep as fallback
          enabled: true,
          uploadedAt: Date.now(),
        };
        await saveFrame(frameData);
        
        console.log(`✅ Created default theme: ${theme.name} for ${templateType}`);
      } catch (error) {
        console.error(`Failed to create theme ${theme.name} for ${templateType}:`, error);
      }
    }
  }
  
  console.log('Default special themes created successfully');
};

// Create a default overlay layer (600x900) - on top of the photo
const createDefaultOverlayLayer = (cutIndex: number, totalCuts: number, color: string, textColor: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;
  
  // Transparent background
  ctx.clearRect(0, 0, 600, 900);
  
  // Add corner decorations
  ctx.fillStyle = color;
  const cornerSize = 30;
  
  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(10 + cornerSize, 10);
  ctx.lineTo(10, 10 + cornerSize);
  ctx.closePath();
  ctx.fill();
  
  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(590, 10);
  ctx.lineTo(590 - cornerSize, 10);
  ctx.lineTo(590, 10 + cornerSize);
  ctx.closePath();
  ctx.fill();
  
  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(10, 890);
  ctx.lineTo(10 + cornerSize, 890);
  ctx.lineTo(10, 890 - cornerSize);
  ctx.closePath();
  ctx.fill();
  
  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(590, 890);
  ctx.lineTo(590 - cornerSize, 890);
  ctx.lineTo(590, 890 - cornerSize);
  ctx.closePath();
  ctx.fill();
  
  // Add cut number at bottom
  ctx.fillStyle = textColor;
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${cutIndex + 1}/${totalCuts}`, 300, 870);
  
  return canvas.toDataURL('image/png');
};

// Create a default frame with template-specific dimensions
const createDefaultFrame = (templateType: TemplateType, name: string, color: string, textColor: string): string => {
  const dimensions: Record<TemplateType, { width: number; height: number }> = {
    'vertical-4': { width: 1340, height: 2080 },
    'vertical-3': { width: 1320, height: 2060 },
    'vertical-6': { width: 1340, height: 2080 },
    'horizontal-4': { width: 1940, height: 1480 },
    'horizontal-line-4': { width: 3780, height: 860 },
  };
  
  const { width, height } = dimensions[templateType];
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  // Fill with semi-transparent color
  ctx.fillStyle = color + '30'; // 30 = ~19% opacity in hex
  ctx.fillRect(0, 0, width, height);
  
  // Add decorative border
  ctx.strokeStyle = color;
  ctx.lineWidth = 40;
  ctx.strokeRect(20, 20, width - 40, height - 40);
  
  // Add theme name at top
  ctx.fillStyle = textColor;
  ctx.font = 'bold 60px Pretendard, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, width / 2, 110);
  
  // Add decorative line under title
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 150, 150);
  ctx.lineTo(width / 2 + 150, 150);
  ctx.stroke();
  
  return canvas.toDataURL('image/png');
};
