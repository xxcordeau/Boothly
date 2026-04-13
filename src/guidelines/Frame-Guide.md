# 포토부스 커스텀 프레임 추가 가이드

## 프레임 이미지 규격

### 크기
- **세로 4컷/3컷 템플릿**: 800 x 1200px
- **가로 4컷 템플릿**: 1600 x 600px

### 파일 형식
- **PNG** 파일 (투명도 지원 필수)
- 사진이 보일 부분은 **투명**하게 처리
- 꾸미고 싶은 부분(테두리, 장식 등)만 그리기

## 프레임 추가 방법

### 1. 프레임 이미지 준비
예시로 `/public/frames/` 폴더에 프레임 이미지를 저장합니다:
```
/public/frames/
  ├── vertical-4-frame.png    (800x1200px)
  ├── vertical-3-frame.png    (800x1200px)
  └── horizontal-4-frame.png  (1600x600px)
```

### 2. 템플릿 설정 업데이트
`/config/templates.ts` 파일에서 원하는 템플릿에 `frameImageUrl` 추가:

```typescript
'vertical-4': {
  id: 'vertical-4',
  name: '네컷 (세로)',
  cuts: 4,
  layout: 'vertical',
  canvasWidth: 800,
  canvasHeight: 1200,
  cutPositions: [
    { x: 50, y: 50, width: 700, height: 250 },
    { x: 50, y: 330, width: 700, height: 250 },
    { x: 50, y: 610, width: 700, height: 250 },
    { x: 50, y: 890, width: 700, height: 250 },
  ],
  backgroundColor: '#ffffff',
  borderColor: '#000000',
  borderWidth: 4,
  frameImageUrl: '/frames/vertical-4-frame.png', // ✅ 프레임 추가!
},
```

### 3. 합성 순서
프레임이 추가되면 다음 순서로 합성됩니다:
1. 배경색 채우기 (`backgroundColor`)
2. 각 사진 그리기 (`cutPositions` 위치에)
3. 사진 테두리 그리기 (`borderColor`, `borderWidth`)
4. **프레임 이미지 오버레이** (최상단)
5. 커스텀 텍스트 (있는 경우)

## 프레임 디자인 팁

### 투명도 활용
```
┌─────────────────┐
│  ╔═══════════╗  │  ← 이 부분은 불투명 (테두리)
│  ║           ║  │
│  ║  [사진]   ║  │  ← 이 부분은 투명 (사진이 보임)
│  ║           ║  │
│  ╚═══════════╝  │  ← 이 부분은 불투명 (테두리)
└─────────────────┘
```

### 레이어 구조
- **Layer 1**: 배경색 (#ffffff 등)
- **Layer 2**: 촬영한 사진들
- **Layer 3**: 기본 테두리 (borderColor/borderWidth) - 프레임 없으면 표시
- **Layer 4**: 🎨 **커스텀 프레임 PNG** (투명도 있는 PNG)

### 주의사항
- `cutPositions`의 위치를 고려해서 프레임 디자인
- 사진이 보일 영역은 반드시 투명하게 처리
- 프레임이 있으면 `borderColor`/`borderWidth`는 사진 개별 테두리로만 사용됨
- 프레임 로드 실패 시 자동으로 기본 테두리로 fallback

## 예시: 귀여운 스티커 프레임
```
프레임에 추가할 수 있는 요소:
- 모서리 장식 (스티커, 별, 하트 등)
- 상단/하단 텍스트 영역
- 빈티지 필름 효과
- 계절/이벤트 테마 (크리스마스, 할로윈 등)
- 로고나 워터마크
```

## 외부 URL 사용
프레임 이미지를 외부 URL로 호스팅할 수도 있습니다:
```typescript
frameImageUrl: 'https://your-domain.com/frames/custom-frame.png'
```
