export type TemplateType = 'vertical-4' | 'vertical-3' | 'vertical-6' | 'horizontal-4' | 'horizontal-line-4';

export type FrameType = 'frame' | 'overlay';

export type FilterType = 'normal' | 'bright' | 'grayscale';

export type ModeType = 'basic' | 'special';

export interface PrintOption {
  count: number;
  price: number;
  includeQR?: boolean;
}

export interface TemplateConfig {
  id: TemplateType;
  name: string;
  cuts: number;
  layout: 'vertical' | 'horizontal';
  canvasWidth: number;
  canvasHeight: number;
  cutPositions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  overlays?: string[]; // Array of overlay URLs for each cut
  compositeFrameUrl?: string; // Frame for final composite (full template size)
  visible?: boolean; // Whether to show in template selection
  basePrice?: number; // Base price for this template
}

export interface CapturedPhoto {
  id: number;
  imageData: string;
  timestamp: number;
}

export type PhotoBoothState = 
  | 'init'
  | 'mode-select'
  | 'theme-select'
  | 'template-select'
  | 'frame-select'
  | 'print-select'
  | 'payment'
  | 'preview'
  | 'capturing'
  | 'composing'
  | 'result';
