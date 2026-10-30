// GET {API_BASE}/api/v1/housing/districts · /api/v1/housing/rankings
import { API_BASE } from './client';
import { withPublicCache } from '@/lib/publicCache';
import {
  apiErrorFromCatch,
  apiErrorFromResponse,
  createApiError,
  isAbortError,
  isApiError,
  logApiError,
} from '@/utils/errors';

/** 공개 월세 데이터 — 재방문·지도/모달 중복 호출 완화 (5분) */
const HOUSING_TTL_MS = 5 * 60 * 1000;

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
    const err = createApiError({ kind: 'config' });
    logApiError(`fetchHousing ${path}`, err);
    throw err;
  }

  try {
    let res;
    try {
      res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
    } catch (cause) {
      throw apiErrorFromCatch(cause);
    }

    let data = null;
    try {
      data = await res.json();
    } catch {
      throw createApiError({
        kind: res.ok ? 'parse' : 'http',
        status: res.status,
      });
    }

    if (!res.ok) {
      throw apiErrorFromResponse(res, data);
    }

    const result = data?.result;
    if (!result || typeof result !== 'object' || !Array.isArray(result.items)) {
      throw createApiError({ kind: 'parse', status: res.status });
    }

    const items = result.items.map(normalizeItem).filter(Boolean);
    return {
      metadata: result.metadata && typeof result.metadata === 'object' ? result.metadata : null,
      items,
    };
  } catch (err) {
    const apiErr = isApiError(err) ? err : apiErrorFromCatch(err);
    if (!isAbortError(apiErr)) logApiError(`fetchHousing ${path}`, apiErr);
    throw apiErr;
  }
}

/** 구·군별 월세 중앙값 전체 목록 */
export function fetchHousingDistricts() {
  return withPublicCache(
    'housing:districts',
    HOUSING_TTL_MS,
    () => fetchHousing('/api/v1/housing/districts'),
  );
}

/** 월세 낮은 구·군 순위 (API 반환 순서 유지) */
export function fetchHousingRankings(limit = 5) {
  const path = `/api/v1/housing/rankings?limit=${encodeURIComponent(limit)}`;
  return withPublicCache(
    `housing:rankings:${limit}`,
    HOUSING_TTL_MS,
    () => fetchHousing(path),
  );
}
