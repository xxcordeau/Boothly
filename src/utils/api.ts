import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-356393ac`;

// API Helper function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
    ...options.headers,
  };

  try {
    console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error || `API request failed with status ${response.status}`;
      console.warn(`⚠️ API Error: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    console.log(`✅ API Response received`);
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('⚠️ Network error: Could not connect to server (server may not be deployed yet)');
      throw new Error('Could not connect to server. Please check your network connection.');
    }
    console.warn(`⚠️ API Error:`, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

// ========================================
// Session API
// ========================================

export interface SessionData {
  id: string;
  mode: 'basic' | 'special';
  template: string;
  printCount: number;
  theme?: string | null;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  photos: string[];
}

export const sessionAPI = {
  async create(data: {
    mode: 'basic' | 'special';
    template: string;
    printCount: number;
    theme?: string;
  }): Promise<{ success: boolean; sessionId: string; session: SessionData }> {
    return apiRequest('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async get(sessionId: string): Promise<{ success: boolean; session: SessionData }> {
    return apiRequest(`/sessions/${sessionId}`, {
      method: 'GET',
    });
  },

  async updateStatus(
    sessionId: string,
    status: 'active' | 'completed' | 'cancelled'
  ): Promise<{ success: boolean; session: SessionData }> {
    return apiRequest(`/sessions/${sessionId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// ========================================
// Payment API
// ========================================

export interface PaymentData {
  id: string;
  sessionId: string;
  amount: number;
  method: 'card' | 'cash';
  printCount: number;
  status: string;
  createdAt: string;
}

export const paymentAPI = {
  async record(data: {
    sessionId: string;
    amount: number;
    method: 'card' | 'cash';
    printCount: number;
  }): Promise<{ success: boolean; paymentId: string; payment: PaymentData }> {
    return apiRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async get(paymentId: string): Promise<{ success: boolean; payment: PaymentData }> {
    return apiRequest(`/payments/${paymentId}`, {
      method: 'GET',
    });
  },
};

// ========================================
// Statistics API
// ========================================

export interface DailyStats {
  date: string;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  totalRevenue: number;
  photosCaptured: number;
  printsByCount: Record<number, number>;
  paymentMethods: { card: number; cash: number };
}

export interface AllTimeStats extends Omit<DailyStats, 'date'> {
  dayCount: number;
}

export const statsAPI = {
  async getDaily(): Promise<{ success: boolean; stats: DailyStats }> {
    return apiRequest('/stats/daily', {
      method: 'GET',
    });
  },

  async getAllTime(): Promise<{ success: boolean; stats: AllTimeStats }> {
    return apiRequest('/stats/all-time', {
      method: 'GET',
    });
  },

  async update(type: 'session' | 'payment' | 'photos', data: any): Promise<{ success: boolean; stats: DailyStats }> {
    return apiRequest('/stats/update', {
      method: 'POST',
      body: JSON.stringify({ type, data }),
    });
  },
};

// ========================================
// Settings API
// ========================================

export interface SystemSettings {
  language: string;
  currency: string;
  basePrice: number;
  timezone: string;
  maintenanceMode: boolean;
  updatedAt?: string;
}

export const settingsAPI = {
  async get(): Promise<{ success: boolean; settings: SystemSettings }> {
    return apiRequest('/settings', {
      method: 'GET',
    });
  },

  async update(settings: Partial<SystemSettings>): Promise<{ success: boolean; settings: SystemSettings }> {
    return apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

// ========================================
// Health Check
// ========================================

export const healthAPI = {
  async check(): Promise<{ status: string }> {
    return apiRequest('/health', {
      method: 'GET',
    });
  },
};
