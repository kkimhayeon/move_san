// GET {API_BASE}/api/culture/events · /places · /articles (공개 조회, /api/v1 아님)
import { API_BASE } from './client';
import {
  apiErrorFromCatch,
  apiErrorFromResponse,
  createApiError,
  isAbortError,
  isApiError,
  logApiError,
} from '@/utils/errors';
import { nullableText, safeHttpUrl } from '@/utils/culture';

function buildQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    q.set(key, String(value));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

/**
 * @param {string} path
 * @param {{ signal?: AbortSignal }} [options]
 */
async function fetchCultureApi(path, options = {}) {
  if (!API_BASE) {
    const err = createApiError({ kind: 'config' });
    logApiError(`fetchCultureApi ${path}`, err);
    throw err;
  }

  try {
    let res;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        cache: 'no-store',
        signal: options.signal,
      });
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

    return data;
  } catch (err) {
    // Strict Mode 언마운트·탭 전환 등으로 취소된 요청은 실패로 취급하지 않는다.
    if (options.signal?.aborted || isAbortError(err)) {
      throw createApiError({ kind: 'abort' });
    }
    const apiErr = isApiError(err) ? err : apiErrorFromCatch(err);
    if (!isAbortError(apiErr)) logApiError(`fetchCultureApi ${path}`, apiErr);
    throw apiErr;
  }
}

/**
 * @param {unknown} raw
 * @returns {{ items: unknown[], page: number, page_size: number, total: number }}
 */
function normalizePageResult(raw) {
  const result = raw?.result;
  if (!result || typeof result !== 'object' || !Array.isArray(result.items)) {
    throw createApiError({ kind: 'parse' });
  }
  const page = Number(result.page);
  const page_size = Number(result.page_size);
  const total = Number(result.total);
  return {
    items: result.items,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    page_size: Number.isFinite(page_size) && page_size > 0 ? page_size : result.items.length || 1,
    total: Number.isFinite(total) && total >= 0 ? total : result.items.length,
  };
}

/**
 * @param {unknown} raw
 */
function normalizeEvent(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = nullableText(raw.id);
  const title = nullableText(raw.title);
  if (!id || !title) return null;

  return {
    id,
    title,
    summary: nullableText(raw.summary),
    category: nullableText(raw.category),
    section: nullableText(raw.section),
    district: nullableText(raw.district),
    place_name: nullableText(raw.place_name),
    start_date: nullableText(raw.start_date),
    end_date: nullableText(raw.end_date),
    schedule_status: nullableText(raw.schedule_status) || 'unknown',
    schedule_note: nullableText(raw.schedule_note),
    badge_override: nullableText(raw.badge_override),
    image_path: nullableText(raw.image_path),
    image_credit: nullableText(raw.image_credit),
    link_url: safeHttpUrl(raw.link_url),
    program_section: nullableText(raw.program_section),
  };
}

/**
 * @param {unknown} raw
 */
function normalizePlace(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = nullableText(raw.id);
  const name = nullableText(raw.name);
  if (!id || !name) return null;

  const mapX = raw.map_x == null || raw.map_x === '' ? null : Number(raw.map_x);
  const mapY = raw.map_y == null || raw.map_y === '' ? null : Number(raw.map_y);
  const lat = raw.lat == null || raw.lat === '' ? null : Number(raw.lat);
  const lng = raw.lng == null || raw.lng === '' ? null : Number(raw.lng);
  const since = raw.since_year == null || raw.since_year === '' ? null : Number(raw.since_year);

  return {
    id,
    name,
    kind: nullableText(raw.kind),
    district: nullableText(raw.district),
    one_liner: nullableText(raw.one_liner),
    experience: nullableText(raw.experience),
    since_year: Number.isFinite(since) ? since : null,
    icon_key: nullableText(raw.icon_key),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    map_x: Number.isFinite(mapX) ? mapX : null,
    map_y: Number.isFinite(mapY) ? mapY : null,
    naver_map_url: safeHttpUrl(raw.naver_map_url),
    instagram_url: safeHttpUrl(raw.instagram_url),
  };
}

/**
 * @param {unknown} raw
 */
function normalizeArticle(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = nullableText(raw.id);
  const title = nullableText(raw.title);
  if (!id || !title) return null;

  const links = Array.isArray(raw.links)
    ? raw.links
      .map((link) => {
        if (!link || typeof link !== 'object') return null;
        const url = safeHttpUrl(link.url);
        if (!url) return null;
        return {
          label: nullableText(link.label) || '바로가기',
          url,
        };
      })
      .filter(Boolean)
    : [];

  return {
    id,
    article_type: nullableText(raw.article_type),
    label: nullableText(raw.label),
    title,
    body: nullableText(raw.body) || '',
    meta: nullableText(raw.meta),
    badge: nullableText(raw.badge),
    badge_color: nullableText(raw.badge_color),
    image_path: nullableText(raw.image_path),
    image_credit: nullableText(raw.image_credit),
    image_badge: nullableText(raw.image_badge),
    links,
  };
}

/**
 * @param {{
 *   section: 'open' | 'stay',
 *   category?: string,
 *   page?: number,
 *   page_size?: number,
 *   signal?: AbortSignal,
 * }} params
 */
export async function fetchCultureEvents(params) {
  const query = buildQuery({
    section: params.section,
    category: params.category,
    page: params.page ?? 1,
    page_size: params.page_size ?? 8,
  });
  const data = await fetchCultureApi(`/api/culture/events${query}`, { signal: params.signal });
  const page = normalizePageResult(data);
  return {
    ...page,
    items: page.items.map(normalizeEvent).filter(Boolean),
  };
}

/**
 * @param {{ kind?: string, page?: number, page_size?: number, signal?: AbortSignal }} [params]
 */
export async function fetchCulturePlaces(params = {}) {
  const query = buildQuery({
    kind: params.kind,
    page: params.page ?? 1,
    page_size: params.page_size ?? 50,
  });
  const data = await fetchCultureApi(`/api/culture/places${query}`, { signal: params.signal });
  const page = normalizePageResult(data);
  return {
    ...page,
    items: page.items.map(normalizePlace).filter(Boolean),
  };
}

/**
 * @param {{
 *   article_type: 'news' | 'story',
 *   page?: number,
 *   page_size?: number,
 *   signal?: AbortSignal,
 * }} params
 */
export async function fetchCultureArticles(params) {
  const query = buildQuery({
    article_type: params.article_type,
    page: params.page ?? 1,
    page_size: params.page_size ?? 50,
  });
  const data = await fetchCultureApi(`/api/culture/articles${query}`, { signal: params.signal });
  const page = normalizePageResult(data);
  return {
    ...page,
    items: page.items.map(normalizeArticle).filter(Boolean),
  };
}
