# Nayax 결제 시스템 통합 가이드

이 가이드는 포토부스 애플리케이션에 Nayax 결제 시스템을 통합하는 방법을 설명합니다.

## 📋 목차
1. [개요](#개요)
2. [설정 방법](#설정-방법)
3. [API 커스터마이징](#api-커스터마이징)
4. [테스트 방법](#테스트-방법)
5. [문제 해결](#문제-해결)

---

## 개요

### Nayax란?
Nayax는 무인 자판기, 키오스크, 포토부스 등을 위한 캐시리스 결제 솔루션입니다. 이 시스템은 카드 결제와 현금 결제를 모두 지원합니다.

### 결제 플로우
```
사용자 인화 매수 선택 
  → 결제 방법 선택 (카드/현금)
  → Nayax API로 결제 요청
  → Nayax 기기에서 실제 결제 처리
  → 결제 승인 확인
  → 촬영 단계로 진행
```

---

## 설정 방법

### 1단계: 관리자 페이지 접속

1. 포토부스 화면에서 숨겨진 관리자 버튼 클릭 (화면 좌측 상단 모서리 5회 클릭)
2. 비밀번호 입력: `admin1234`
3. "Nayax 결제" 탭 선택

### 2단계: Nayax 정보 입력

Nayax 담당자로부터 받은 정보를 입력하세요:

| 필드 | 설명 | 예시 |
|------|------|------|
| **API 엔드포인트** | Nayax API 서버 URL | `https://api.nayax.com/v1/payment` |
| **API 키** | 인증용 API 키 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| **디바이스 ID** | 등록된 Nayax 기기 ID | `DEVICE-12345-ABCDE` |

### 3단계: 테스트 모드 설정

- **개발/테스트 환경**: 테스트 모드 **켜기** (ON)
  - 실제 결제 없이 시뮬레이션
  - 항상 승인됨 (95% 성공률로 시뮬레이션)
  
- **운영 환경**: 테스트 모드 **끄기** (OFF)
  - 실제 Nayax API 호출
  - 실제 결제 처리

⚠️ **주의**: 운영 환경에서는 반드시 테스트 모드를 꺼야 합니다!

### 4단계: 설정 저장 및 테스트

1. "설정 저장" 버튼 클릭
2. 테스트 모드가 꺼져 있다면 "연결 테스트" 버튼으로 API 연결 확인
3. 연결 성공 확인

---

## API 커스터마이징

Nayax API 스펙은 계약마다 다를 수 있습니다. `/utils/nayaxPayment.ts` 파일에서 API 호출을 커스터마이징하세요.

### 주요 함수

#### 1. `processNayaxPayment()`
결제를 시작하는 메인 함수입니다.

```typescript
export const processNayaxPayment = async (
  request: PaymentRequest
): Promise<PaymentResponse> => {
  // ...
}
```

**커스터마이징 포인트:**

##### A. 요청 헤더
```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${NAYAX_CONFIG.apiKey}`,
  'X-Device-ID': NAYAX_CONFIG.deviceId,
  // Nayax 문서에 따라 헤더 추가:
  // 'X-Merchant-ID': 'YOUR_MERCHANT_ID',
  // 'X-Location-ID': 'YOUR_LOCATION_ID',
}
```

##### B. 요청 본문
```typescript
body: JSON.stringify({
  amount: request.amount,        // 결제 금액
  currency: 'KRW',              // 통화
  paymentMethod: request.method, // 'card' 또는 'cash'
  transactionId: transactionId,  // 고유 거래 ID
  deviceId: NAYAX_CONFIG.deviceId,
  
  // Nayax 문서에 따라 필드 추가:
  // merchantId: 'YOUR_MERCHANT_ID',
  // locationId: 'YOUR_LOCATION_ID',
  // description: 'Photo Booth Service',
  // customerEmail: 'optional@email.com',
})
```

##### C. 응답 파싱
```typescript
// Nayax 응답 형식에 맞춰 수정
return {
  success: data.success || data.status === 'approved',
  transactionId: data.transactionId || data.transaction_id,
  message: data.message || data.statusMessage,
  error: data.error || data.errorMessage,
};
```

#### 2. `checkPaymentStatus()`
거래 상태를 확인하는 함수입니다. 폴링 방식으로 결제 완료를 확인할 때 사용합니다.

```typescript
export const checkPaymentStatus = async (
  transactionId: string
): Promise<PaymentResponse> => {
  // GET /status/{transactionId}
}
```

#### 3. `cancelNayaxPayment()`
거래를 취소하거나 환불하는 함수입니다.

```typescript
export const cancelNayaxPayment = async (
  transactionId: string
): Promise<boolean> => {
  // POST /cancel
}
```

### 일반적인 Nayax API 패턴

#### 패턴 1: 직접 결제 (동기식)
```typescript
// 하나의 API 호출로 즉시 결제 완료
const response = await fetch(endpoint, { ... });
return response.data;
```

#### 패턴 2: 2단계 결제 (비동기식)
```typescript
// 1. 결제 시작
const initResponse = await fetch(endpoint + '/init', { ... });

// 2. 상태 폴링
const pollInterval = setInterval(async () => {
  const status = await checkPaymentStatus(transactionId);
  if (status.success) {
    clearInterval(pollInterval);
    return status;
  }
}, 2000); // 2초마다 확인
```

#### 패턴 3: 웹훅 (비동기 콜백)
```typescript
// 1. 결제 시작 + 콜백 URL 전달
await fetch(endpoint, {
  body: JSON.stringify({
    ...paymentData,
    callbackUrl: 'https://your-server.com/nayax/callback'
  })
});

// 2. 서버에서 웹훅 수신
// 별도 백엔드 서버 필요
```

---

## 테스트 방법

### 1. 테스트 모드에서 테스트

1. 관리자 페이지에서 테스트 모드 **켜기**
2. 포토부스 플로우 진행:
   - 모드 선택
   - 템플릿 선택
   - (스페셜만) 테마 선택
   - 인화 매수 선택
   - 결제 선택
3. 카드 또는 현금 결제 선택
4. 약 2초 후 자동으로 승인됨 (95% 확률)
5. 촬영 단계로 진행

### 2. 실제 모드에서 테스트

⚠️ **주의**: 실제 결제가 처리됩니다!

1. 관리자 페이지에서 테스트 모드 **끄기**
2. Nayax 설정 확인 (엔드포인트, API 키, 디바이스 ID)
3. "연결 테스트" 버튼으로 API 연결 확인
4. 작은 금액(예: 1,000원)으로 테스트 결제 진행
5. Nayax 기기에서 실제 결제 처리 확인
6. 승인 후 촬영 단계로 진행 확인

### 3. 로그 확인

브라우저 개발자 도구(F12) → Console 탭에서 로그 확인:

```
[Nayax] Processing payment: { amount: 10000, method: 'card' }
[Nayax] Payment response: { success: true, transactionId: '...' }
```

---

## 문제 해결

### Q1. "Nayax API endpoint not configured" 오류

**원인**: API 엔드포인트가 설정되지 않았거나 기본값으로 남아있습니다.

**해결**:
1. 관리자 페이지 → Nayax 결제
2. API 엔드포인트에 실제 Nayax API URL 입력
3. "설정 저장" 클릭

### Q2. 결제가 항상 승인됨 (실제 금액 확인 안됨)

**원인**: 테스트 모드가 켜져 있습니다.

**해결**:
1. 관리자 페이지 → Nayax 결제
2. "테스트 모드" 스위치를 **끄기**
3. "설정 저장" 클릭

### Q3. "HTTP error! status: 401" 오류

**원인**: API 키가 잘못되었거나 만료되었습니다.

**해결**:
1. Nayax 담당자에게 연락하여 API 키 확인
2. 새 API 키를 관리자 페이지에 입력
3. "설정 저장" 클릭

### Q4. "HTTP error! status: 404" 오류

**원인**: API 엔드포인트 URL이 잘못되었습니다.

**해결**:
1. Nayax API 문서에서 정확한 엔드포인트 확인
2. 관리자 페이지에서 URL 수정
3. "연결 테스트"로 확인

### Q5. 결제 처리가 너무 느림

**원인**: 네트워크 지연 또는 Nayax 기기 응답 지연

**해결**:
1. 네트워크 연결 확인
2. Nayax 기기 상태 확인
3. 필요시 타임아웃 설정 조정 (`/utils/nayaxPayment.ts`)

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초

const response = await fetch(endpoint, {
  ...options,
  signal: controller.signal
});
```

### Q6. 결제 금액이 다르게 전송됨

**원인**: 통화 단위 변환 문제

**해결**:
Nayax API가 요구하는 금액 단위 확인:
- 원화(KRW): 보통 정수로 전송 (10,000 → 10000)
- 일부 시스템: 센트 단위 (10,000원 → 1000000센트)

```typescript
// /utils/nayaxPayment.ts에서 금액 변환
body: JSON.stringify({
  amount: request.amount, // 원화 그대로
  // 또는
  // amount: request.amount * 100, // 센트 단위로 변환
})
```

---

## 고급 설정

### 로깅 강화

더 상세한 로그를 위해 `/utils/nayaxPayment.ts`에 로깅 추가:

```typescript
console.log('[Nayax] Request:', {
  endpoint: NAYAX_CONFIG.apiEndpoint,
  amount: request.amount,
  method: request.method,
  timestamp: new Date().toISOString()
});

console.log('[Nayax] Response:', {
  status: response.status,
  data: await response.clone().json(),
  timestamp: new Date().toISOString()
});
```

### 재시도 로직

네트워크 오류 시 자동 재시도:

```typescript
const maxRetries = 3;
let lastError;

for (let i = 0; i < maxRetries; i++) {
  try {
    const response = await fetch(endpoint, options);
    return await response.json();
  } catch (error) {
    lastError = error;
    console.log(`[Nayax] Retry ${i + 1}/${maxRetries}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
  }
}

throw lastError;
```

### 결제 로그 저장

결제 내역을 localStorage에 저장:

```typescript
const logPayment = (request: PaymentRequest, response: PaymentResponse) => {
  const logs = JSON.parse(localStorage.getItem('payment_logs') || '[]');
  logs.push({
    timestamp: Date.now(),
    request,
    response,
  });
  localStorage.setItem('payment_logs', JSON.stringify(logs.slice(-100))); // 최근 100건만 보관
};
```

---

## 지원

Nayax 통합 관련 기술 지원:
1. **Nayax 고객 지원**: Nayax 담당자에게 연락
2. **API 문서**: Nayax에서 제공한 API 문서 참조
3. **로그 확인**: 브라우저 개발자 도구 Console 탭

---

## 체크리스트

운영 배포 전 확인사항:

- [ ] Nayax API 엔드포인트 설정 완료
- [ ] API 키 설정 완료
- [ ] 디바이스 ID 설정 완료
- [ ] 테스트 모드 **비활성화**
- [ ] 실제 결제 테스트 완료 (소액)
- [ ] 결제 승인 확인
- [ ] 결제 실패 시나리오 테스트
- [ ] 네트워크 오류 시나리오 테스트
- [ ] 로그 정상 작동 확인

---

마지막 업데이트: 2025-10-30
