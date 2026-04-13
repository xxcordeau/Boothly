/**
 * Nayax Payment Integration
 * 
 * This utility handles payment processing through Nayax payment system.
 * 
 * 🔧 SETUP INSTRUCTIONS:
 * 1. Go to Admin Panel → Nayax 결제 settings
 * 2. Disable test mode
 * 3. Enter your Nayax API endpoint, API key, and device ID
 * 4. Customize the API request/response format below to match your Nayax contract
 * 5. Test the connection using the "연결 테스트" button
 * 
 * 📚 NAYAX API CUSTOMIZATION:
 * Nayax API specifications may vary depending on your contract.
 * Modify the functions below to match your specific Nayax API documentation:
 * - processNayaxPayment(): Main payment initiation
 * - cancelNayaxPayment(): Cancel/refund a transaction
 * - checkPaymentStatus(): Check transaction status
 * 
 * 💡 COMMON NAYAX API PATTERNS:
 * - Authentication: Usually Bearer token or API key in headers
 * - Payment Flow: POST to initiate → Poll status → Confirm completion
 * - Webhooks: Some implementations use webhooks for async notifications
 */

export type PaymentMethod = 'card' | 'cash';

export interface PaymentRequest {
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message?: string;
  error?: string;
}

// Nayax API Configuration
// TODO: Replace with your actual Nayax API endpoint and credentials
const NAYAX_CONFIG = {
  apiEndpoint: 'YOUR_NAYAX_API_ENDPOINT',
  apiKey: 'YOUR_NAYAX_API_KEY',
  deviceId: 'YOUR_NAYAX_DEVICE_ID',
  // Enable test mode for development
  testMode: true,
};

/**
 * Simulates payment processing for test mode
 */
const simulatePayment = async (
  amount: number,
  method: PaymentMethod
): Promise<PaymentResponse> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Simulate 95% success rate
  const success = Math.random() > 0.05;

  if (success) {
    return {
      success: true,
      transactionId: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message: '결제가 성공적으로 처리되었습니다 (테스트 모드)',
    };
  } else {
    return {
      success: false,
      error: '결제가 거부되었습니다. 다시 시도해주세요. (테스트 모드)',
    };
  }
};

/**
 * Process payment through Nayax
 * 
 * ⚠️ CUSTOMIZE THIS FUNCTION according to your Nayax API documentation
 * 
 * Example scenarios:
 * 1. Direct Payment: Single API call that processes payment immediately
 * 2. Two-Step: Initiate payment → Wait for device confirmation → Poll status
 * 3. Webhook: Initiate payment → Receive webhook callback when complete
 */
export const processNayaxPayment = async (
  request: PaymentRequest
): Promise<PaymentResponse> => {
  // If test mode is enabled, use simulation
  if (NAYAX_CONFIG.testMode) {
    console.log('[Nayax Test Mode] Processing payment:', request);
    return simulatePayment(request.amount, request.method);
  }

  console.log('[Nayax] Processing payment:', request);

  try {
    // STEP 1: Validate configuration
    if (!NAYAX_CONFIG.apiEndpoint || NAYAX_CONFIG.apiEndpoint === 'YOUR_NAYAX_API_ENDPOINT') {
      throw new Error('Nayax API 엔드포인트가 설정되지 않았습니다. 관리자 → Nayax 결제에서 설정해주세요.');
    }
    
    if (!NAYAX_CONFIG.apiKey || NAYAX_CONFIG.apiKey === 'YOUR_NAYAX_API_KEY') {
      throw new Error('Nayax API 키가 설정되지 않았습니다. 관리자 → Nayax 결제에서 설정해주세요.');
    }
    
    // STEP 2: Prepare transaction ID
    const transactionId = request.transactionId || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // STEP 3: Call Nayax API to initiate payment
    // ⚠️ CUSTOMIZE the request format to match your Nayax API spec
    const response = await fetch(NAYAX_CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NAYAX_CONFIG.apiKey}`,
        'X-Device-ID': NAYAX_CONFIG.deviceId,
      },
      body: JSON.stringify({
        // ⚠️ Customize these fields according to your Nayax API documentation:
        amount: request.amount,
        currency: 'KRW', // or your currency
        paymentMethod: request.method, // 'card' or 'cash'
        transactionId: transactionId,
        deviceId: NAYAX_CONFIG.deviceId,
        // Add any additional fields required by your Nayax contract:
        // merchantId: 'YOUR_MERCHANT_ID',
        // locationId: 'YOUR_LOCATION_ID',
        // etc.
      }),
    });

    if (!response.ok) {
      let errorText = '';
      try {
        // Try to read response as UTF-8 text
        errorText = await response.text();
      } catch (e) {
        errorText = '알 수 없는 오류가 발생했습니다.';
      }
      throw new Error(`결제 처리 중 오류가 발생했습니다 (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    console.log('[Nayax] Payment response:', data);

    // STEP 4: Parse response
    // ⚠️ Customize response parsing to match your Nayax API spec
    return {
      success: data.success || data.status === 'approved' || false,
      transactionId: data.transactionId || data.transaction_id || transactionId,
      message: data.message || data.statusMessage,
      error: data.error || data.errorMessage,
    };
  } catch (error) {
    console.error('[Nayax] Payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 결제 오류가 발생했습니다.',
    };
  }
};

/**
 * Cancel an ongoing payment transaction
 */
export const cancelNayaxPayment = async (
  transactionId: string
): Promise<boolean> => {
  if (NAYAX_CONFIG.testMode) {
    console.log('[Nayax Test Mode] Cancelling payment:', transactionId);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  }

  try {
    // TODO: Implement actual Nayax cancellation API call
    const response = await fetch(`${NAYAX_CONFIG.apiEndpoint}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NAYAX_CONFIG.apiKey}`,
        'X-Device-ID': NAYAX_CONFIG.deviceId,
      },
      body: JSON.stringify({
        transactionId,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[Nayax] Cancel payment error:', error);
    return false;
  }
};

/**
 * Check payment status
 */
export const checkPaymentStatus = async (
  transactionId: string
): Promise<PaymentResponse> => {
  if (NAYAX_CONFIG.testMode) {
    console.log('[Nayax Test Mode] Checking payment status:', transactionId);
    return {
      success: true,
      transactionId,
      message: 'Payment completed (Test Mode)',
    };
  }

  try {
    // TODO: Implement actual Nayax status check API call
    const response = await fetch(`${NAYAX_CONFIG.apiEndpoint}/status/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NAYAX_CONFIG.apiKey}`,
        'X-Device-ID': NAYAX_CONFIG.deviceId,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: data.success || false,
      transactionId: data.transactionId,
      message: data.message,
      error: data.error,
    };
  } catch (error) {
    console.error('[Nayax] Check status error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get Nayax configuration for admin settings
 */
export const getNayaxConfig = () => {
  return {
    ...NAYAX_CONFIG,
    // Don't expose sensitive data
    apiKey: NAYAX_CONFIG.apiKey ? '***' : '',
  };
};

/**
 * Update Nayax configuration (for admin use)
 */
export const updateNayaxConfig = (config: Partial<typeof NAYAX_CONFIG>) => {
  Object.assign(NAYAX_CONFIG, config);
  localStorage.setItem('nayax_config', JSON.stringify(config));
};

/**
 * Load saved Nayax configuration from localStorage
 */
export const loadNayaxConfig = () => {
  try {
    const saved = localStorage.getItem('nayax_config');
    if (saved) {
      const config = JSON.parse(saved);
      Object.assign(NAYAX_CONFIG, config);
    }
  } catch (error) {
    console.error('[Nayax] Failed to load config:', error);
  }
};

// Auto-load config on module import
loadNayaxConfig();
