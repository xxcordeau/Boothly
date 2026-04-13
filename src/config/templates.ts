import { TemplateConfig } from '../types/photobooth';

// 4x6 inch photo paper (102x152mm) = 2:3 aspect ratio
// Individual photo size: 600x900 (2:3)
// Frame margin: Top 200px (for logo/QR), sides/bottom 60px (KODAK film style)
export const TEMPLATES: Record<string, TemplateConfig> = {
  'vertical-4': {
    id: 'vertical-4',
    name: '네컷 (세로)',
    cuts: 4,
    layout: 'vertical',
    canvasWidth: 1340,  // 1220 + 60*2 (frame margin), 1220 = 600*2 + 20 gap
    canvasHeight: 2080, // 1820 + 200 (top) + 60 (bottom), 1820 = 900*2 + 20 gap
    cutPositions: [
      // 2x2 grid layout with 200px top margin (for logo/QR), 60px other margins, 20px gap between photos
      { x: 60, y: 200, width: 600, height: 900 },       // Top-left
      { x: 680, y: 200, width: 600, height: 900 },      // Top-right (60 + 600 + 20)
      { x: 60, y: 1120, width: 600, height: 900 },      // Bottom-left (200 + 900 + 20)
      { x: 680, y: 1120, width: 600, height: 900 },     // Bottom-right
    ],
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 0, // No border between photos for clean 2x2 grid
  },
  'vertical-3': {
    id: 'vertical-3',
    name: '네컷 (세로 일렬)',
    cuts: 4,
    layout: 'vertical',
    canvasWidth: 1320,  // 1200 + 60*2 (frame margin)
    canvasHeight: 2060, // 1800 + 200 (top) + 60 (bottom)
    cutPositions: [
      // 4 vertical photos with 200px top margin (for logo/QR), 60px other margins, 20px spacing between
      { x: 160, y: 200, width: 1000, height: 420 },     // 1st photo
      { x: 160, y: 640, width: 1000, height: 420 },     // 2nd photo (200 + 420 + 20)
      { x: 160, y: 1080, width: 1000, height: 420 },    // 3rd photo (200 + 420 + 20 + 420 + 20)
      { x: 160, y: 1520, width: 1000, height: 420 },    // 4th photo (200 + 420 + 20 + 420 + 20 + 420 + 20)
    ],
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 0,
  },
  'vertical-6': {
    id: 'vertical-6',
    name: '여섯컷 (2x3)',
    cuts: 6,
    layout: 'vertical',
    canvasWidth: 1340,  // 1220 + 60*2 (frame margin), 1220 = 600*2 + 20 gap
    canvasHeight: 3000, // 2740 + 200 (top) + 60 (bottom), 2740 = 900*3 + 20*2 gap
    cutPositions: [
      // 2x3 grid layout with 200px top margin (for logo/QR), 60px other margins, 20px gap between photos
      { x: 60, y: 200, width: 600, height: 900 },       // Top-left
      { x: 680, y: 200, width: 600, height: 900 },      // Top-right
      { x: 60, y: 1120, width: 600, height: 900 },      // Middle-left (200 + 900 + 20)
      { x: 680, y: 1120, width: 600, height: 900 },     // Middle-right
      { x: 60, y: 2040, width: 600, height: 900 },      // Bottom-left (200 + 900 + 20 + 900 + 20)
      { x: 680, y: 2040, width: 600, height: 900 },     // Bottom-right
    ],
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 0,
  },
  'horizontal-4': {
    id: 'horizontal-4',
    name: '네컷 (가로 2x2)',
    cuts: 4,
    layout: 'horizontal',
    canvasWidth: 1940,  // 1820 + 60*2 (frame margin), 1820 = 900*2 + 20 gap
    canvasHeight: 1480, // 1220 + 200 (top) + 60 (bottom), 1220 = 600*2 + 20 gap
    cutPositions: [
      // 2x2 grid layout with 200px top margin (for logo/QR), 60px other margins, 20px gap between photos
      { x: 60, y: 200, width: 900, height: 600 },       // Left-top
      { x: 980, y: 200, width: 900, height: 600 },      // Right-top (60 + 900 + 20)
      { x: 60, y: 820, width: 900, height: 600 },       // Left-bottom (200 + 600 + 20)
      { x: 980, y: 820, width: 900, height: 600 },      // Right-bottom
    ],
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 0, // No border for clean 2x2 grid
  },
  'horizontal-line-4': {
    id: 'horizontal-line-4',
    name: '가로 네컷 (일렬)',
    cuts: 4,
    layout: 'horizontal',
    canvasWidth: 3780,  // 3660 + 60*2 (frame margin), 3660 = 900*4 + 20*3 gap
    canvasHeight: 860,  // 600 + 200 (top) + 60 (bottom)
    cutPositions: [
      // 4 photos in a horizontal line with 200px top margin (for logo/QR), 60px other margins, 20px gap between
      { x: 60, y: 200, width: 900, height: 600 },       // 1st photo
      { x: 980, y: 200, width: 900, height: 600 },      // 2nd photo (60 + 900 + 20)
      { x: 1900, y: 200, width: 900, height: 600 },     // 3rd photo (60 + 900 + 20 + 900 + 20)
      { x: 2820, y: 200, width: 900, height: 600 },     // 4th photo (60 + 900 + 20 + 900 + 20 + 900 + 20)
    ],
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 0, // No border for clean horizontal line
  },
};
