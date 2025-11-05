export interface ArtboardPreset {
  name: string;
  width: number;
  height: number;
  label: string;
  category: 'social' | 'print' | 'photo' | 'screens';
}

const presets: ArtboardPreset[] = [
    // Social Media
    { name: 'Instagram Post', width: 1080, height: 1080, label: '1:1 Square', category: 'social' },
    { name: 'Instagram Story', width: 1080, height: 1920, label: '9:16 Story', category: 'social' },
    { name: 'Instagram Portrait', width: 1080, height: 1350, label: '4:5 Portrait', category: 'social' },
    { name: 'YouTube Video', width: 1920, height: 1080, label: '16:9 HD Video', category: 'social' },
    { name: 'YouTube Shorts', width: 1080, height: 1920, label: '9:16 Shorts', category: 'social' },
    { name: 'YouTube Thumbnail', width: 1280, height: 720, label: '16:9 Thumbnail', category: 'social' },
    { name: 'Facebook Post', width: 1200, height: 630, label: '1.91:1 Landscape', category: 'social' },
    { name: 'Facebook Story', width: 1080, height: 1920, label: '9:16 Story', category: 'social' },
    { name: 'X (Twitter) Post', width: 1200, height: 675, label: '16:9 Post', category: 'social' },
    { name: 'TikTok Video', width: 1080, height: 1920, label: '9:16 Video', category: 'social' },
    { name: 'LinkedIn Post', width: 1200, height: 627, label: '1.91:1 Post', category: 'social' },
    { name: 'Pinterest Pin', width: 1000, height: 1500, label: '2:3 Pin', category: 'social' },

    // Print (using 96 DPI for screen representation)
    { name: 'A4 Document', width: 794, height: 1123, label: '210 × 297 mm', category: 'print' },
    { name: 'US Letter', width: 816, height: 1056, label: '8.5 x 11 in', category: 'print' },
    { name: 'A3 Document', width: 1123, height: 1587, label: '297 × 420 mm', category: 'print' },
    { name: 'A5 Document', width: 559, height: 794, label: '148 × 210 mm', category: 'print' },
    { name: 'A6 Postcard', width: 397, height: 559, label: '105 × 148 mm', category: 'print' },
    { name: 'Tabloid', width: 1056, height: 1632, label: '11 x 17 in', category: 'print' },

    // Photo (using 96 DPI)
    { name: '4x6 Photo', width: 576, height: 384, label: 'Landscape', category: 'photo' },
    { name: '5x7 Photo', width: 672, height: 480, label: 'Landscape', category: 'photo' },
    { name: '8x10 Photo', width: 960, height: 768, label: 'Landscape', category: 'photo' },
    { name: '4x6 Photo (Portrait)', width: 384, height: 576, label: 'Portrait', category: 'photo' },
    { name: '5x7 Photo (Portrait)', width: 480, height: 672, label: 'Portrait', category: 'photo' },
    { name: '8x10 Photo (Portrait)', width: 768, height: 960, label: 'Portrait', category: 'photo' },

    // Screens
    { name: 'HD Presentation', width: 1920, height: 1080, label: '16:9 Widescreen', category: 'screens' },
    { name: '4K Presentation', width: 3840, height: 2160, label: '16:9 4K UHD', category: 'screens' },
    { name: 'Modern Mobile', width: 1080, height: 2400, label: '20:9 Phone', category: 'screens' },
    { name: 'Tablet', width: 2048, height: 1536, label: '4:3 Tablet', category: 'screens' },
    { name: 'Laptop', width: 2560, height: 1600, label: '16:10 Laptop', category: 'screens' },
    { name: 'Ultrawide Monitor', width: 3440, height: 1440, label: '21:9 Monitor', category: 'screens' },
];

const defaultPresetNames = new Set([
  'Instagram Post',
  'Instagram Story',
  'YouTube Shorts',
  'YouTube Video',
  'A4 Document',
  'Facebook Post',
]);

export const artboardCategories = {
  default: presets.filter(p => defaultPresetNames.has(p.name)),
  social: presets.filter(p => p.category === 'social'),
  print: presets.filter(p => p.category === 'print'),
  photo: presets.filter(p => p.category === 'photo'),
  screens: presets.filter(p => p.category === 'screens'),
};