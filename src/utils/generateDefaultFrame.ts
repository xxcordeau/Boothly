import { TemplateType } from '../types/photobooth';

// Generate a default frame with template-specific dimensions
export const generateDefaultFrame = (templateType: TemplateType, color: string = '#e8f4f8'): string => {
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
  
  // Fill with light background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  // Add subtle border
  ctx.strokeStyle = '#b8d8e8';
  ctx.lineWidth = 20;
  ctx.strokeRect(10, 10, width - 20, height - 20);
  
  // Add decorative corners
  const cornerSize = 60;
  ctx.fillStyle = '#ffffff';
  
  // Top-left
  ctx.fillRect(30, 30, cornerSize, 4);
  ctx.fillRect(30, 30, 4, cornerSize);
  
  // Top-right
  ctx.fillRect(width - 30 - cornerSize, 30, cornerSize, 4);
  ctx.fillRect(width - 34, 30, 4, cornerSize);
  
  // Bottom-left
  ctx.fillRect(30, height - 34, cornerSize, 4);
  ctx.fillRect(30, height - 30 - cornerSize, 4, cornerSize);
  
  // Bottom-right
  ctx.fillRect(width - 30 - cornerSize, height - 34, cornerSize, 4);
  ctx.fillRect(width - 34, height - 30 - cornerSize, 4, cornerSize);
  
  return canvas.toDataURL('image/png');
};
