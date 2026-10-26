# 무브산 (movesan-web)

서울 → 부산 이주를 고민하는 청년을 위한 "한 달에 남는 돈" 비교 서비스의 프론트엔드 (Next.js · React)

## 처음 실행하기

1. [Node.js](https://nodejs.org) LTS 설치 (한 번만)
2. VS Code에서 이 폴더 열기 → 위 메뉴 **터미널 → 새 터미널**
3. 아래 두 줄을 차례로 붙여 넣기

```
npm install
npm run dev
```

4. 브라우저에서 http://localhost:3000 열기

`npm install`은 처음 한 번만 하면 되고, 다음부터는 `npm run dev`만 하면 돼요.

## 화면

| 주소 | 화면 | PRD |
|---|---|---|
| `/` | 생활비 비교 계산기 (서울 vs 부산 입력). 검색 노출 | F-01 |
| `/result` | 계산 결과 (1년 기준, 항목별 비교, 금융상품). noindex | F-02 |
| `/map` | 동네 지도 (구·군별 월세 중앙값, 원룸/투룸). 검색 노출 | F-03 |
| `/benefits` | 청년 혜택 (카테고리·조건 필터). 검색 노출 | — |
| `/culture` | 컬처라이프 (준비 중 화면). 검색 노출 | — |
| `/community` | 커뮤니티 (예시 글). 검색 노출 | P2 |
| `/login` | 로그인·회원가입 자리 (Supabase Auth 검토 중). noindex | — |
| `/rent-test` | Flask `GET /api/rent` 연동 테스트. noindex | — |

`/start`는 예전 주소라 `/`로 이동시켜요.

## 로고

`public/logo.png`(가로형), `public/logo-mark.png`(아이콘), `src/app/icon.png`(브라우저 탭 아이콘). 디자인 원본 파일이 있으면 같은 이름으로 덮어쓰면 됨.

## 코드를 두는 위치

언어는 JavaScript입니다. 경로 별칭 `@/`는 `frontend/src/`를 가리킵니다 (`jsconfig.json`). 아래 경로도 `frontend/` 기준입니다.

화면을 추가하거나 고칠 때 아래 역할 그대로 파일을 둡니다.

| 폴더 | 역할 |
|---|---|
| `src/app/` | 주소와 검색용 정보. 페이지는 레이아웃과 `metadata`만 두고, 입력·클릭은 컴포넌트로 넘깁니다. |
| `src/components/` | 화면 UI. 기능별로 `common`, `layout`, `comparison`, `policy`, `community`, `map`. |
| `src/api/` | Flask 요청. 주소는 `client.js` 한곳, 기능마다 파일 하나 (`rent.js`, `comparison.js`, `chat.js`). |
| `src/stores/` | 화면을 넘어 공유하는 상태. 지금은 계산기 입력만 `comparison.js` (Zustand, `sessionStorage` 키 `busansallim-inputs`). |
| `src/constants/` | 경로, SEO 기본값, 나중에 실제 데이터로 바꿀 예시 목록. |
| `src/utils/` | 계산식, 금액 표시, API가 없을 때의 챗봇 답변, 메타데이터 도우미. |

계산식은 `src/utils/calc.js`의 `물가비율 = 0.952`입니다. 지수가 바뀌면 이 값만 바꿉니다. 입력 항목, 단위(만원), API 필드 이름은 이 세팅의 계약이라 화면을 나누면서 바꾸지 않습니다.

한 화면 안에서만 쓰는 값(혜택 필터, 커뮤니티 글쓰기)은 컴포넌트 안에 둡니다. Zustand로 올리지 않습니다.

## 스타일을 나누는 방식

색, 글꼴, 여러 화면이 같이 쓰는 틀과 버튼은 `src/app/globals.css`에 둡니다. 그 파일은 `src/app/layout.js`에서 한 번만 불러옵니다.

한 화면에서만 쓰는 모양은 그 컴포넌트 옆 `*.module.css`에 둡니다. 클래스 이름은 camelCase이고, JS에서는 `styles.이름`으로 붙입니다. 파일이 해시된 클래스 이름을 만들기 때문에, 모듈에 둔 규칙을 `globals.css`에 남겨 두면 화면에 적용되지 않습니다. 화면이 좁아질 때의 배치(`@media`)도 그 화면 파일에 같이 넣습니다.

| 파일 | 담는 것 |
|---|---|
| `src/app/globals.css` | 색 변수, 기본 글꼴, `.page` `.card` `.lift` `.section` `.stack`, 버튼(`.btn*`), 칩(`.chip` `.chip.big` `.filter-chips`), `.tag`, `.muted` `.small` `.good` `.bad` `.warn` |
| `src/components/layout/Header.module.css` | 상단 바, 메뉴, 로그인·회원가입 |
| `src/components/layout/AiChat.module.css` | 오른쪽 아래 AI 채팅 |
| `src/components/common/Hero.module.css` | 페이지 상단 배경. 결과 화면의 "다시 계산하기"도 이 파일의 `backLink`를 가져다 씁니다. |
| `src/components/common/ComingSoon.module.css` | 준비 중 목록 |
| `src/app/home.module.css` | 홈 하단 기능 카드 |
| `src/app/login/auth.module.css` | 로그인 칸 너비와 입력창 |
| `src/components/comparison/ComparisonForm.module.css` | 생활비 계산기 |
| `src/components/comparison/ComparisonResult.module.css` | 결과 표, 막대그래프, 금융상품 카드 |
| `src/components/map/BusanMap.module.css` | 동네 지도, 구 선택, 스팟 카드 |
| `src/components/policy/BenefitBrowser.module.css` | 혜택 필터와 카드 |
| `src/components/community/CommunityBoard.module.css` | 검색, 글쓰기, 글 카드 |

같이 쓰는 클래스는 문자열 그대로 두고, 그 화면 전용 클래스만 모듈에서 가져옵니다.

```jsx
import styles from './ComparisonResult.module.css';

<section className={`card ${styles.cmpCard}`}>
  <button className="btn btn-grad">결과 보기</button>
  <button className={tab === 'all' ? 'chip on' : 'chip'}>전체</button>
</section>
```

새 화면을 넣을 때는 이렇게 합니다.

1. 주소는 `src/app/<경로>/page.js`, 본문은 `src/components/<기능>/`에 만듭니다.
2. 그 컴포넌트 옆에 `컴포넌트이름.module.css`를 만들고 `import styles from './컴포넌트이름.module.css'`로 연결합니다.
3. 카드·버튼·칩·글자색은 `globals.css`에 있는 클래스를 재사용합니다. 그 화면에서만 쓰는 배치만 모듈에 추가합니다.
4. 두 화면 이상이 같은 모양을 쓰기 시작하면, 그때 `globals.css`로 올립니다. 미리 공통 파일에 넣지 않습니다.

## 백엔드(Flask) 연결

프로젝트 폴더에 `.env.local` 파일을 만들고 아래처럼 적으면 Flask API를 사용해요. 없으면 프론트의 예시 데이터와 계산식을 사용해요.

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

- `GET /api/rent` (팀 합의 규격) → `[{ "region_code": "26350", "region_name": "해운대구", "median_rent": 62 }, ...]` (월세 단위: 만원)
  - 연동 테스트 화면: `http://localhost:3001/rent-test` (로딩·오류·성공 상태 표시, [다시 불러오기] 버튼)
  - 동네 지도(`/map`)도 같은 API를 써서, 받은 구만 DB 값으로 바꿔 보여줌
- Flask CORS 허용 주소: `http://localhost:3001` (3000 포트가 사용 중이면 Next.js가 3001로 뜸 — 둘 다 허용 추천)
- `POST /api/chat` — AI 챗봇. body: `{ messages: [{ role, content }], context: { 계산기 입력값 } }` → `{ reply: "답변" }`. Flask에서 LLM API(OpenAI·Claude 등)를 호출해 답하면 됨. 없으면 `src/utils/chatbot.js`의 규칙 기반 데모 답변 사용
- `POST /api/compare` — 계산 API (규격 미정, 없으면 프론트 계산식 사용)

## 교체해야 할 예시 값

- `src/constants/busan.js`의 `rent`, `count` → 주거 담당의 구·군별 원룸 월세 중앙값 (housing_area_mart)
- `src/constants/benefits.js` (청년 혜택 목록 + 결과 화면 금융상품 카드 `featured`) → 혜택 담당의 정책·금융상품 데이터
- `src/components/map/BusanMap.js`의 `TWO_ROOM` (투룸 = 원룸 × 1.5 예시) → 주거 담당의 투룸 중앙값
- `src/components/community/CommunityBoard.js`의 예시 글 → 게시판 기능 (P2, 지금은 글쓰기가 화면에만 저장됨)
