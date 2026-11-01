// 3D 지도 영문 ID ↔ 한글 구·군명 ↔ region_code 매핑
// region_code는 constants/busan.js GU와 동일 (임의 생성하지 않음)

export const MAP3D_REGIONS = [
  { id: 'jung', name: '중구', region_code: '26110' },
  { id: 'seo', name: '서구', region_code: '26140' },
  { id: 'dong', name: '동구', region_code: '26170' },
  { id: 'yeongdo', name: '영도구', region_code: '26200' },
  { id: 'busanjin', name: '부산진구', region_code: '26230' },
  { id: 'dongnae', name: '동래구', region_code: '26260' },
  { id: 'nam', name: '남구', region_code: '26290' },
  { id: 'buk', name: '북구', region_code: '26320' },
  { id: 'haeundae', name: '해운대구', region_code: '26350' },
  { id: 'saha', name: '사하구', region_code: '26380' },
  { id: 'geumjeong', name: '금정구', region_code: '26410' },
  { id: 'gangseo', name: '강서구', region_code: '26440' },
  { id: 'yeonje', name: '연제구', region_code: '26470' },
  { id: 'suyeong', name: '수영구', region_code: '26500' },
  { id: 'sasang', name: '사상구', region_code: '26530' },
  { id: 'gijang', name: '기장군', region_code: '26710' },
];

export const MAP3D_BY_ID = Object.fromEntries(MAP3D_REGIONS.map((r) => [r.id, r]));
export const MAP3D_BY_NAME = Object.fromEntries(MAP3D_REGIONS.map((r) => [r.name, r]));
export const MAP3D_BY_CODE = Object.fromEntries(MAP3D_REGIONS.map((r) => [r.region_code, r]));

/** UI·이벤트용 구 이름 → 영문 ID. 없으면 null */
export function idFromGuName(name) {
  if (!name) return null;
  return MAP3D_BY_NAME[name]?.id ?? null;
}

/** 영문 ID → 구 이름. 없으면 null */
export function nameFromId(id) {
  if (!id) return null;
  return MAP3D_BY_ID[id]?.name ?? null;
}

export const CHIP_ORDER = [
  'haeundae', 'suyeong', 'nam', 'yeongdo', 'jung', 'dong', 'seo', 'saha',
  'busanjin', 'dongnae', 'yeonje', 'geumjeong', 'buk', 'sasang', 'gangseo', 'gijang',
];
