// GET {API_BASE}/api/v1/housing/districts · /api/v1/housing/rankings
// 인증 불필요. 응답: { status, message, result: { metadata, items } }
import { API_BASE } from './client';

function normalizeItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const region_code = raw.region_code != null ? String(raw.region_code) : '';
  const name = raw.name != null ? String(raw.name) : '';
  if (!region_code || !name) return null;

  const rentRaw = raw.median_rent;
  const median_rent = rentRaw == null || rentRaw === ''
    ? null
    : Number(rentRaw);
  const sampleRaw = raw.sample_count;
  const sample_count = sampleRaw == null || sampleRaw === ''
    ? null
    : Number(sampleRaw);

  return {
    region_code,
    name,
    median_rent: median_rent != null && Number.isFinite(median_rent) ? median_rent : null,
    sample_count: sample_count != null && Number.isFinite(sample_count) ? sample_count : null,
  };
}

async function fetchHousing(path) {
  if (!API_BASE) {
    throw new Error('API 주소가 설정되지 않았어요. NEXT_PUBLIC_API_URL을 확인해 주세요.');
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });

    let data = null;
    try {
      data = await res.json();
    } catch {
      throw new Error(`서버 응답을 읽을 수 없어요 (HTTP ${res.status}).`);
    }

    if (!res.ok) {
      throw new Error(data?.message || `서버 응답 오류 (HTTP ${res.status})`);
    }

    const result = data?.result;
    if (!result || typeof result !== 'object' || !Array.isArray(result.items)) {
      throw new Error(data?.message || '응답 형식이 달라요 (result.items 배열이 없어요).');
    }

    const items = result.items.map(normalizeItem).filter(Boolean);
    return {
      metadata: result.metadata && typeof result.metadata === 'object' ? result.metadata : null,
      items,
    };
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('서버에 연결할 수 없어요. Flask 서버가 켜져 있는지, CORS 설정을 확인해 주세요.');
    }
    throw err instanceof Error ? err : new Error('알 수 없는 오류가 발생했어요.');
  }
}

/** 구·군별 월세 중앙값 전체 목록 */
export function fetchHousingDistricts() {
  return fetchHousing('/api/v1/housing/districts');
}

/** 월세 낮은 구·군 순위 (API 반환 순서 유지) */
export function fetchHousingRankings(limit = 5) {
  return fetchHousing(`/api/v1/housing/rankings?limit=${encodeURIComponent(limit)}`);
}
