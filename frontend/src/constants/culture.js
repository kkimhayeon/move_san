import { GU } from './busan';
import { ROUTES } from './routes';

export const CULTURE_TABS = [
  { id: 'open', label: '열린다', panelId: 'culture-panel-open', tabId: 'culture-tab-open' },
  { id: 'stay', label: '머문다', panelId: 'culture-panel-stay', tabId: 'culture-tab-stay' },
  { id: 'meet', label: '만난다', panelId: 'culture-panel-meet', tabId: 'culture-tab-meet' },
];

export const CULTURE_DEFAULT_TAB = 'open';

/** 열린다 카테고리. 전체는 category 파라미터 생략 */
export const OPEN_CATEGORIES = [
  { id: 'all', label: '전체', value: undefined },
  { id: 'ART', label: 'Art', value: 'ART' },
  { id: 'MUSIC', label: 'Music', value: 'MUSIC' },
  { id: 'POP_UP', label: 'Pop-up', value: 'POP_UP' },
  { id: 'WELLNESS', label: 'Wellness', value: 'WELLNESS' },
];

/** 열린다: 한 줄 4개 × 최대 2줄 */
export const OPEN_PAGE_SIZE = 8;
/** 이미지 필터 후 프론트 페이지네이션용. API page_size 상한은 50 */
export const OPEN_FETCH_SIZE = 50;

export const PLACE_KIND_LABELS = {
  bookstore: '책방',
  bathhouse: '온천·목욕',
  cinema: '극장',
};

export const STAY_PAGE_SIZE = 50;
export const MEET_PAGE_SIZE = 50;

/** 머문다 프로그램 중 목욕탕 섹션으로 보낼 program_section */
export const STAY_BATH_PROGRAM_SECTION = 'stay_bathhouse';

/** 목욕탕 따라 걷기(스탬프투어 등) 여부 */
export function isStayBathProgram(event) {
  if (!event || typeof event !== 'object') return false;
  if (event.program_section === STAY_BATH_PROGRAM_SECTION) return true;
  if (event.category === 'stamp_tour') return true;
  const title = typeof event.title === 'string' ? event.title : '';
  return title.includes('스탬프투어') || title.includes('동래온천');
}

/**
 * 커버 슬라이드 — 프론트 정적 데이터.
 * 이미지는 public/culture/covers 에 존재하는 파일만 사용.
 */
export const COVER_SLIDES = [
  {
    id: 'cover-open-art',
    cat: '열린다 · ART',
    title: '그러나 우리는 아직도 이 바다 높은 물결 위에 있다: 1945–1953',
    sub: '피란수도 부산의 시간을 예술로 돌아보는 재개관 특별전 · ~ 2027.02.14 부산시립미술관',
    credit: '포스터 · 부산시립미술관',
    img: '/culture/covers/cover-open.jpg',
    bg: '#3F3F46',
    url: 'https://art.busan.go.kr/tblTsite07Display/viewNowClient.nm?id=20260913112010274',
  },
  {
    id: 'cover-stay-indie',
    cat: '머문다 · INDIE',
    title: '영업정지 풀린 오방가르드, 다시 무대에 불이 켜진다',
    sub: '로컬 라이브 클럽이 다시 문을 연 밤 · 부산 남구',
    credit: '사진 · 로컬 현장',
    img: '/culture/covers/cover-stay.jpg',
    bg: '#1E40AF',
    url: null,
  },
  {
    id: 'cover-meet-radio',
    cat: '만난다 · RADIO',
    title: '전포동에 작은 라디오 방송국이 생겼다',
    sub: '음악이 천천히 흐르는 방, 라디오 레볼루션 리딩룸',
    credit: '사진 · 라디오 레볼루션 리딩룸',
    img: '/culture/covers/cover-meet.jpg',
    bg: '#0F172A',
    url: 'https://mixmag.asia/read/radio-revolutions-reading-room-launches-in-busan-community-radio-south-korea-local',
  },
];

/**
 * 홍보 배너 — 공식 운영 여부 확인 전까지 비활성.
 */
export const PROMO_BANNER = {
  enabled: false,
  title: '',
  body: '',
  href: null,
};

/** 지도 페이지가 인식하는 구·군 이름일 때만 /map?gu= 연결 */
export function cultureDistrictMapHref(district) {
  if (!district || typeof district !== 'string') return null;
  const name = district.trim();
  if (!name || !GU.some((g) => g.name === name)) return null;
  return `${ROUTES.map}?gu=${encodeURIComponent(name)}`;
}

export function categoryLabel(code) {
  if (!code) return null;
  const found = OPEN_CATEGORIES.find((c) => c.value === code);
  if (found) return found.label;
  return String(code).replace(/_/g, ' ');
}
