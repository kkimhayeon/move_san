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

export const OPEN_PAGE_SIZE = 8;

/** 머문다 공간 종류. 전체는 kind 생략 */
export const PLACE_KINDS = [
  { id: 'all', label: '전체', value: undefined },
  { id: 'bookstore', label: '책방', value: 'bookstore' },
  { id: 'bathhouse', label: '온천·목욕', value: 'bathhouse' },
  { id: 'cinema', label: '극장', value: 'cinema' },
];

export const PLACE_KIND_LABELS = {
  bookstore: '책방',
  bathhouse: '온천·목욕',
  cinema: '극장',
};

export const STAY_PAGE_SIZE = 50;
export const MEET_PAGE_SIZE = 50;

/**
 * 커버 슬라이드 — 프론트 정적 데이터.
 * 지난 일정을 진행 중처럼 표시하지 않는다.
 */
export const COVER_SLIDES = [
  {
    id: 'cover-local-rhythm',
    eyebrow: 'CULTURE COVER',
    title: '부산의 일상을 여는 장면',
    body: '전시·공연·팝업부터 동네 책방까지, 로컬에서 이어지는 문화 리듬을 모았어요.',
    accent: '#2563eb',
  },
  {
    id: 'cover-stay-spaces',
    eyebrow: 'STAY A WHILE',
    title: '잠시 머무르는 공간',
    body: '책방, 온천, 작은 극장처럼 반복해서 찾고 싶어지는 자리를 소개해요.',
    accent: '#0f766e',
  },
  {
    id: 'cover-meet-stories',
    eyebrow: 'LOCAL STORIES',
    title: '사람과 취향이 만나는 이야기',
    body: '먼저 자리를 만든 사람들의 이야기와 연결되는 링크를 모았습니다.',
    accent: '#b45309',
  },
];

/**
 * 홍보 배너 — 공식 운영 여부 확인 전까지 비활성.
 * enabled가 false면 UI에서 렌더하지 않는다.
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
