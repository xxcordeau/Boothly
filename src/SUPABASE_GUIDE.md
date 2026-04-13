# 📘 Supabase 연동 가이드

포토부스 앱이 Supabase 백엔드와 완전히 연동되었습니다. 이 문서는 백엔드 기능과 사용 방법을 설명합니다.

## 🚀 연동 완료 기능

### 1. **세션 관리 (Session Management)**
각 포토부스 촬영 세션을 추적하고 관리합니다.

**기능:**
- ✅ 세션 생성 (모드, 템플릿, 인화 매수 기록)
- ✅ 세션 상태 업데이트 (active, completed, cancelled)
- ✅ 세션 조회

**API 엔드포인트:**
```
POST   /make-server-356393ac/sessions           # 세션 생성
GET    /make-server-356393ac/sessions/:id       # 세션 조회
PUT    /make-server-356393ac/sessions/:id/status # 세션 상태 업데이트
```

### 2. **결제 관리 (Payment Management)**
Nayax 결제 시스템과 연동하여 결제 내역을 기록합니다.

**기능:**
- ✅ 결제 기록 저장 (카드/현금)
- ✅ 결제 내역 조회
- ✅ 인화 매수별 결제 추적

**API 엔드포인트:**
```
POST   /make-server-356393ac/payments          # 결제 기록
GET    /make-server-356393ac/payments/:id      # 결제 조회
```

### 3. **통계 및 분석 (Statistics & Analytics)**
실시간 사용 통계와 분석 데이터를 제공합니다.

**기능:**
- ✅ 일일 통계 (오늘 촬영 수, 매출, 결제 방식 등)
- ✅ 전체 통계 (누적 데이터, 평균 등)
- ✅ 인화 매수별 통계
- ✅ 결제 방식별 분석

**API 엔드포인트:**
```
GET    /make-server-356393ac/stats/daily        # 일일 통계
GET    /make-server-356393ac/stats/all-time     # 전체 통계
POST   /make-server-356393ac/stats/update       # 통계 업데이트
```

### 4. **시스템 설정 (System Settings)**
포토부스 시스템 설정을 관리합니다.

**기능:**
- ✅ 언어, 통화, 기본 가격 설정
- ✅ 타임존 설정
- ✅ 유지보수 모드 토글

**API 엔드포인트:**
```
GET    /make-server-356393ac/settings           # 설정 조회
PUT    /make-server-356393ac/settings           # 설정 업데이트
```

## 📂 파일 구조

```
/supabase/functions/server/
├── index.tsx           # 메인 서버 (Hono 웹 서버)
└── kv_store.tsx        # Key-Value 데이터베이스 유틸리티 (보호됨)

/utils/
└── api.ts              # 프론트엔드 API 클라이언트

/components/admin/
└── StatsDashboard.tsx  # 통계 대시보드 컴포넌트
```

## 💻 사용 방법

### 프론트엔드에서 API 호출

```typescript
import { sessionAPI, paymentAPI, statsAPI, settingsAPI } from '../utils/api';

// 세션 생성
const { sessionId, session } = await sessionAPI.create({
  mode: 'basic',
  template: 'vertical-4',
  printCount: 4,
});

// 결제 기록
const { paymentId, payment } = await paymentAPI.record({
  sessionId: 'session_123',
  amount: 20000,
  method: 'card',
  printCount: 4,
});

// 통계 조회
const { stats } = await statsAPI.getDaily();
const { stats: allTimeStats } = await statsAPI.getAllTime();

// 설정 업데이트
await settingsAPI.update({
  language: 'en',
  basePrice: 6000,
});
```

## 📊 관리자 대시보드

통계 대시보드는 `/admin` 페이지에서 확인할 수 있습니다.

**표시 정보:**
- 📈 오늘의 통계 (세션 수, 매출, 촬영 사진 수, 결제 방식)
- 📊 전체 통계 (누적 데이터, 일평균)
- 💳 결제 방식 분석 (카드/현금 비율)
- 🖼️ 인화 매수별 통계

**화면:**
1. 메인 화면에서 우측 상단 **"관리자"** 버튼 클릭
2. **"통계"** 메뉴 선택
3. 실시간 통계 확인
4. **"새로고침"** 버튼으로 최신 데이터 갱신

## 🔐 보안

- ✅ CORS 설정 완료 (모든 출처 허용)
- ✅ Authorization 헤더 사용 (Supabase Anon Key)
- ✅ 환경 변수로 API 키 관리
- ⚠️ **중요:** 프로덕션 환경에서는 CORS를 특정 도메인만 허용하도록 수정하세요.

## 🗄️ 데이터베이스

Supabase의 Key-Value Store를 사용합니다:

**데이터 키 구조:**
```
session:{sessionId}           # 세션 데이터
payment:{paymentId}           # 결제 데이터
stats:daily:{YYYY-MM-DD}      # 일일 통계
system:settings               # 시스템 설정
```

**제한사항:**
- ❌ 추가 테이블 생성 불가 (migration 파일 지원 안 함)
- ✅ KV Store는 프로토타이핑에 충분히 유연함
- ✅ 별도 설정 없이 바로 사용 가능

## 🔄 통계 자동 업데이트

세션이나 결제가 발생하면 통계가 자동으로 업데이트됩니다:

```typescript
// 세션 완료 시 통계 업데이트
await statsAPI.update('session', {
  status: 'completed'
});

// 결제 완료 시 통계 업데이트
await statsAPI.update('payment', {
  amount: 20000,
  method: 'card',
  printCount: 4
});

// 사진 촬영 시 통계 업데이트
await statsAPI.update('photos', {
  count: 10
});
```

## 🧪 테스트

헬스 체크 엔드포인트로 서버 상태 확인:

```typescript
import { healthAPI } from '../utils/api';

const response = await healthAPI.check();
console.log(response); // { status: "ok" }
```

## 📝 로그

서버는 모든 요청과 에러를 자동으로 로깅합니다:

```
📡 API Request: POST /make-server-356393ac/sessions
✅ Session created: session_1234567890_abc123
✅ API Response: { success: true, sessionId: "..." }
```

## 🚀 다음 단계

1. **실제 촬영 플로우와 연동**
   - 촬영 시작 시 세션 생성
   - 결제 완료 시 결제 기록
   - 촬영 완료 시 세션 상태 업데이트

2. **통계 활용**
   - 인기 템플릿 분석
   - 매출 추이 분석
   - 시간대별 사용 패턴 분석

3. **확장 기능**
   - 사진 파일 저장 (Supabase Storage)
   - 사용자 인증 (Supabase Auth)
   - 실시간 알림 (Supabase Realtime)

## ⚠️ 주의사항

- **개인정보 보호**: 이 시스템은 프로토타이핑용입니다. 실제 개인 식별 정보(PII)는 저장하지 마세요.
- **데이터 보안**: 민감한 데이터는 암호화하여 저장하세요.
- **백업**: 중요한 데이터는 정기적으로 백업하세요.

## 🆘 문제 해결

**문제: API 호출이 실패합니다**
- Supabase 프로젝트 ID와 Anon Key가 올바른지 확인하세요
- 네트워크 연결을 확인하세요
- 브라우저 콘솔에서 에러 메시지를 확인하세요

**문제: 통계가 업데이트되지 않습니다**
- statsAPI.update()를 호출했는지 확인하세요
- 서버 로그를 확인하세요

**문제: CORS 에러가 발생합니다**
- 서버 코드에서 CORS 설정이 올바른지 확인하세요
- origin: "*"로 모든 출처를 허용했는지 확인하세요

## 📧 지원

문제가 발생하면 서버 로그와 브라우저 콘솔을 확인하고, 에러 메시지를 포함하여 문의하세요.

---

**마지막 업데이트:** 2024-11-02
**버전:** 1.0.0
