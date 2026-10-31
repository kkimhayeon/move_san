# 지도(R3F 이식) 검토용 요약

원본 프로젝트: `busan-sallim` / 프론트엔드 `frontend/`  
작성 기준: 코드 확인 시점의 파일 내용 (추측한 항목은 「확인 필요」)

---

## Next.js · React 버전

| 항목 | package.json | package-lock 실제 resolve |
|------|--------------|---------------------------|
| Next.js | `^15.3.0` | `15.5.28` |
| React | `^19.1.0` | `19.3.1` |
| React DOM | `^19.1.0` | `19.3.1` |
| Zustand | `^5.0.16` | `5.0.16` |

Lock 파일: `frontend/package-lock.json` (npm). `yarn.lock` / `pnpm-lock.yaml` 없음.

---

## Three.js · React Three Fiber · Drei

| 패키지 | 설치 여부 |
|--------|-----------|
| `three` | **미설치** (`package.json` / lock에 없음) |
| `@react-three/fiber` | **미설치** |
| `@react-three/drei` | **미설치** |

현재 지도는 **SVG path 기반 2D 지도** (`BusanMap.js`).

---

## 지도 페이지 → 하위 연결 구조

```
app/map/page.js
  ├─ Hero (components/common/Hero)  … 페이지 상단 소개
  └─ BusanMap (components/map/BusanMap.js)  … 지도·사이드·명소 전부 단일 컴포넌트
       ├─ BusanMap.module.css
       ├─ constants/busan.js          … GU / SPOTS / SPOT_TYPES / MAP_HEIGHT
       ├─ api/housing.js              … districts · rankings
       │    └─ api/client.js          … API_BASE (= NEXT_PUBLIC_API_URL)
       ├─ stores/comparison.js        … 서울 월세 비교·「이 동네 월세로 계산하기」만 사용
       ├─ constants/routes.js
       └─ utils/errors.js, formatMoney.js

참고(지도 폴더 형제, /map 미사용):
  components/map/RentTestPanel.js → app/rent-test/page.js → api/rent.js
```

- `/map` 전용 `layout.js` **없음** (루트 `app/layout.js`만 사용).
- 지도용 **전용 하위 React 컴포넌트 파일은 없음**. SVG·라벨·사이드 패널·TOP5·명소 카드가 `BusanMap.js` 한 파일에 있음.
- 지도 전용 **data hook 파일 없음**. `useEffect` + `useState`로 `BusanMap` 내부에서 직접 fetch.

---

## 지역 선택 상태 관리

| 상태 | 위치 | 비고 |
|------|------|------|
| 선택 구·군 `picked` | `BusanMap` 로컬 `useState` | 기본값 `'해운대구'` |
| 명소 카드 flip `flip` | 동일 컴포넌트 로컬 state | |
| housing districts / rankings | 동일 컴포넌트 로컬 state | store 아님 |
| 계산기 입력 `busanRent` 등 | Zustand `stores/comparison.js` | 선택 구 자체는 저장하지 않음. 「이 동네 월세로 계산하기」 시 `setField('busanRent', …)`만 |

외부에서 선택 주입:
- URL `?gu=` (구 이름, `GU`에 있을 때만)
- `window` 커스텀 이벤트 `movesan:pick-gu` (`e.detail` = 구 이름)

전용 「지도 선택 store」는 **없음**.

---

## 지역 식별자 필드·형식

`constants/busan.js`의 `GU` 항목:

| 필드 | 형식·용도 |
|------|-----------|
| `name` | 한글 구·군명 (예: `"해운대구"`). UI 선택·라벨·URL `gu`·이벤트 detail에 사용 |
| `region_code` | 문자열 행정구역 코드 (예: `"26350"`). housing API `items`와 조인 키 |
| `path` | SVG path `d` |
| `label` / `center` | 퍼센트 좌표 `[x, y]` |
| `dongs` | 행정동 이름 배열 |
| `landmark` | 선택적 `{ imageUrl }` (현재 부산진구만) |
| `rent` / `count` | 주석상 **예전 목업**. 지도 화면은 API `median_rent`·`sample_count`만 사용, fallback 안 함 |

조인: `String(item.region_code)` ↔ `String(gu.region_code)`.

---

## Housing API 경로·응답 구조 (프론트 코드 기준)

Base: `process.env.NEXT_PUBLIC_API_URL` (`api/client.js`의 `API_BASE`).  
요청은 `housing.js`에서 `fetch(`${API_BASE}${path}`)` — **인증 헤더 없음** (`apiFetch`와 다름).

| 함수 | 경로 |
|------|------|
| `fetchHousingDistricts()` | `GET /api/v1/housing/districts` |
| `fetchHousingRankings(limit)` | `GET /api/v1/housing/rankings?limit={limit}` (지도는 `5`) |

프론트가 기대하는 JSON 형태 (`housing.js`):

```text
{
  result: {
    items: [
      {
        region_code: string|number → String,
        name: string,
        median_rent: number|null,
        sample_count: number|null
      },
      ...
    ],
    metadata?: {                // districts에서 사용
      target_deposit?,
      period_start?, period_end?,  // ISO 문자열로 가정, 앞 7자로 월 표시
      max_area_m2?,
      property_types?: string[],
      source_name?,
      updated_at?
    }
  }
}
```

백엔드 실제 스키마·에러 바디: **확인 필요** (이 export는 프론트만 포함).

---

## 월세 · 거래건수 · TOP 5 화면 연결

1. **월세 중앙값 (지도 색·라벨)**  
   - `fetchHousingDistricts` → `districts.items`  
   - `region_code`로 `GU`와 매핑 → `median_rent`  
   - `BINS` 구간별 fill 색, 라벨에 `rentLabel(median_rent)`  
   - 사이드: 선택 구 `Math.round(selRent)` 만원 표시  

2. **거래건수**  
   - 동일 item의 `sample_count` → `거래 {N}건 기준`  

3. **TOP 5**  
   - `fetchHousingRankings(5)` → `rankings.items`  
   - 리스트 클릭 시 `pick(item.name)`으로 구 선택  
   - 막대 너비: `median_rent / top5Max * 100`  

4. **부산 전체 중앙값 / 대비**  
   - 클라이언트에서 가용 `median_rent` 배열의 median 계산 (API 필드 아님).  

5. **서울 비교**  
   - `useNumbers()`의 `seoulRent` (계산기 Zustand).  

---

## PNG / GLB 랜드마크

| 종류 | 현황 |
|------|------|
| PNG | **있음**. `부산진구`만 `landmark.imageUrl: "/landmarks/jeonpo.png"`. 선택 시 `BusanMap`이 `<img>`로 왼쪽 상단 오버레이 |
| GLB / 3D 모델 | **코드·public에 없음** |

원본 자산 (바이너리는 export에 **미포함**):

- 경로: `frontend/public/landmarks/jeonpo.png`
- 용량: **665,946 bytes (~650 KB)**

---

## 확대 · 이동 · 선택 해제

| 동작 | 구현 |
|------|------|
| 확대(zoom) | **없음**. SVG `viewBox="0 0 1000 959"` 고정 |
| 이동(pan) | **없음** |
| 구 선택 | path / 라벨 / select / TOP5 클릭 → `pick(name)` |
| 선택 해제 | **없음**. 항상 하나의 구가 선택됨 (초기·폴백 `해운대구` / `GU[0]`) |
| 명소 카드만 닫기 | `setFlip('')` (구 선택 해제와 무관) |

---

## Next.js 설정 · 레이아웃이 지도에 미치는 영향

| 파일 | 내용 |
|------|------|
| `next.config.mjs` | `reactStrictMode: true`만. 3D/transpile 관련 설정 **없음** |
| `jsconfig.json` | `@/*` → `./src/*` |
| `app/layout.js` | Header/Footer/AiChat + `ComparisonHydration` (지도의 서울 월세 비교에 필요). Pretendard CDN |
| `app/globals.css` | `.page`, `.card`, `.btn` 등 공통 유틸 클래스 (`BusanMap`이 사용) |
| `/map` 전용 layout | 없음 |

R3F 이식 시 `next.config`의 transpilePackages / webpack 등: **현재 설정 없음 → 추가 필요 여부 확인 필요**.

---

## 관련 원본 경로 목록

### 핵심 (요청 항목)

1. `frontend/package.json`
2. `frontend/package-lock.json`
3. `frontend/src/app/map/page.js`
4. `frontend/src/components/map/BusanMap.js`
5. `frontend/src/components/map/BusanMap.module.css`
6. `frontend/src/constants/busan.js`
7. `frontend/src/api/housing.js`
8. `frontend/src/stores/comparison.js` (선택 구 store 아님 · 계산기 연동)
9. `frontend/next.config.mjs`
10. `frontend/src/app/layout.js`
11. `frontend/jsconfig.json`

### import로 따라간 의존·형제

12. `frontend/src/api/client.js`
13. `frontend/src/utils/errors.js`
14. `frontend/src/utils/formatMoney.js`
15. `frontend/src/utils/moneyInput.js`
16. `frontend/src/utils/seo.js`
17. `frontend/src/constants/routes.js`
18. `frontend/src/constants/seo.js`
19. `frontend/src/components/common/Hero.js`
20. `frontend/src/components/common/Hero.module.css`
21. `frontend/src/app/globals.css`
22. `frontend/src/components/map/RentTestPanel.js` (연동 테스트용)
23. `frontend/src/api/rent.js`
24. `frontend/src/app/rent-test/page.js`

### 자산 (경로만 · 바이너리 미복사)

25. `frontend/public/landmarks/jeonpo.png` (~650 KB)

### 코드에만 언급·간접 연결 (이번 export 미포함)

- `frontend/src/constants/culture.js` — `ROUTES.map?gu=` 링크 헬퍼
- 챗봇 등 `GU`/`SPOTS` import — 지도 화면 본체와 무관

### 확인 필요

- 백엔드 Flask housing 라우트·실제 응답 샘플
- R3F 프로토타입 쪽 의존성·식별자 체계와의 정합
- `NEXT_PUBLIC_API_URL` 배포 환경값 (`.env`는 export 제외)

---

## 이 폴더 / ZIP에 포함한 파일

`map-review-export/` 아래 원본과 동일한 상대 경로로 복사됨.  
제외: `.env*`, 비밀키, `node_modules`, `.next`, `.git`, `jeonpo.png` 바이너리.
