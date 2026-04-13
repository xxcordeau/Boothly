import { TemplateType, ModeType } from '../types/photobooth';
import { projectId, publicAnonKey } from './supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-356393ac`;

export interface TemplateSettings {
  templateId: TemplateType;
  mode: ModeType;
  visible: boolean;
  basePrice: number;
}

const STORAGE_KEY = 'photobooth_template_settings';
let cachedSettings: TemplateSettings[] | null = null;

// Default settings for all templates (both modes)
// By default, only 4 templates are visible
const DEFAULT_SETTINGS: TemplateSettings[] = [
  // Basic Mode - 4 visible templates by default
  { templateId: 'vertical-4', mode: 'basic', visible: true, basePrice: 5000 },
  { templateId: 'vertical-3', mode: 'basic', visible: true, basePrice: 5000 },
  { templateId: 'horizontal-4', mode: 'basic', visible: true, basePrice: 5000 },
  { templateId: 'horizontal-line-4', mode: 'basic', visible: true, basePrice: 5000 },
  { templateId: 'vertical-6', mode: 'basic', visible: false, basePrice: 5000 },
  // Special Mode - 4 visible templates by default
  { templateId: 'vertical-4', mode: 'special', visible: true, basePrice: 7000 },
  { templateId: 'vertical-3', mode: 'special', visible: true, basePrice: 7000 },
  { templateId: 'horizontal-4', mode: 'special', visible: true, basePrice: 7000 },
  { templateId: 'horizontal-line-4', mode: 'special', visible: true, basePrice: 7000 },
  { templateId: 'vertical-6', mode: 'special', visible: false, basePrice: 7000 },
];

// Load settings from Supabase
const loadSettingsFromSupabase = async (): Promise<TemplateSettings[]> => {
  try {
    const response = await fetch(`${API_URL}/template-settings`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    
    if (response.ok) {
      const result = await response.json();
      const settings = result.settings.length > 0 ? result.settings : DEFAULT_SETTINGS;
      console.log('✅ Template settings loaded from Supabase:', settings.length);
      // Update localStorage cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      return settings;
    } else {
      console.warn(`⚠️ Failed to load settings from Supabase: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.warn('⚠️ Could not connect to Supabase (using local cache or defaults):', error instanceof Error ? error.message : 'Network error');
  }
  
  // Fallback to localStorage or defaults
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      console.log('📦 Using cached template settings from localStorage');
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load template settings from localStorage:', error);
  }
  
  console.log('📋 Using default template settings');
  return DEFAULT_SETTINGS;
};

// Sync settings to Supabase
const syncToSupabase = async (settings: TemplateSettings[]): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/template-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ settings }),
    });
    
    if (response.ok) {
      console.log('✅ Template settings synced to Supabase');
    } else {
      console.warn(`⚠️ Failed to sync settings to Supabase: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.warn('⚠️ Could not sync settings to Supabase (saved locally):', error instanceof Error ? error.message : 'Network error');
  }
};

export const getTemplateSettings = (): TemplateSettings[] => {
  // Return cached settings if available
  if (cachedSettings !== null) {
    return cachedSettings;
  }
  
  // Try localStorage first for immediate response
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      cachedSettings = settings;
      
      // Load from Supabase in background
      loadSettingsFromSupabase().then(supabaseSettings => {
        cachedSettings = supabaseSettings;
      });
      
      return settings;
    }
  } catch (error) {
    console.error('Failed to load template settings:', error);
  }
  
  // Return default settings and load from Supabase in background
  cachedSettings = DEFAULT_SETTINGS;
  loadSettingsFromSupabase().then(supabaseSettings => {
    cachedSettings = supabaseSettings;
  });
  
  return DEFAULT_SETTINGS;
};

export const saveTemplateSettings = (settings: TemplateSettings[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    cachedSettings = settings;
    
    // Sync to Supabase in background
    syncToSupabase(settings);
  } catch (error) {
    console.error('Failed to save template settings:', error);
  }
};

export const getTemplateSetting = (templateId: TemplateType, mode: ModeType): TemplateSettings => {
  const settings = getTemplateSettings();
  const setting = settings.find(s => s.templateId === templateId && s.mode === mode);
  
  if (setting) {
    return setting;
  }
  
  // Return default if not found
  const defaultSetting = DEFAULT_SETTINGS.find(s => s.templateId === templateId && s.mode === mode);
  return defaultSetting || { templateId, mode, visible: true, basePrice: mode === 'basic' ? 5000 : 7000 };
};

export const updateTemplateSetting = (templateId: TemplateType, mode: ModeType, updates: Partial<Omit<TemplateSettings, 'templateId' | 'mode'>>): void => {
  const settings = getTemplateSettings();
  const index = settings.findIndex(s => s.templateId === templateId && s.mode === mode);
  
  if (index >= 0) {
    settings[index] = { ...settings[index], ...updates };
  } else {
    settings.push({
      templateId,
      mode,
      visible: updates.visible ?? true,
      basePrice: updates.basePrice ?? (mode === 'basic' ? 5000 : 7000),
    });
  }
  
  saveTemplateSettings(settings);
};

export const getTemplateSettingsByMode = (mode: ModeType): TemplateSettings[] => {
  const settings = getTemplateSettings();
  return settings.filter(s => s.mode === mode);
};

export const resetTemplateSettings = (): void => {
  saveTemplateSettings(DEFAULT_SETTINGS);
};
