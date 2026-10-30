// GET {API_BASE}/api/policies · /api/policies/categories (인증 불필요, /api/v1 아님)
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

/** 공개 혜택 데이터 — 필터 전환·재방문 완화 (3분) */
const POLICIES_TTL_MS = 3 * 60 * 1000;

/**
 * @typedef {{
 *   policy_id: number,
 *   policy_name: string,
 *   category: string,
 *   description: string,
 *   benefit_description: string | null,
 *   period_description: string | null,
 *   eligibility_description: string | null,
 *   interest_rate_description: string | null,
 *   official_url: string | null,
 * }} PolicyItem
 *
 * @typedef {{ items: PolicyItem[], total: number }} PolicyListResult
 * @typedef {{ categories: string[] }} PolicyCategoriesResult
 */

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
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
function nullableText(value) {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text || text === 'null' || text === 'undefined') return null;
  return text;
}

/**
 * @param {unknown} raw
 * @returns {PolicyItem | null}
 */
function normalizePolicy(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const policy_id = Number(raw.policy_id);
  if (!Number.isFinite(policy_id)) return null;

  const policy_name = nullableText(raw.policy_name);
  const category = nullableText(raw.category);
  const description = nullableText(raw.description);
  if (!policy_name || !category) return null;

  return {
    policy_id,
    policy_name,
    category,
    description: description || '',
    benefit_description: nullableText(raw.benefit_description),
    period_description: nullableText(raw.period_description),
    eligibility_description: nullableText(raw.eligibility_description),
    interest_rate_description: nullableText(raw.interest_rate_description),
    official_url: nullableText(raw.official_url),
  };
}

/**
 * @param {string} path
 * @param {{ signal?: AbortSignal }} [options]
 */
async function fetchPoliciesApi(path, options = {}) {
  if (!API_BASE) {
    const err = createApiError({ kind: 'config' });
    logApiError(`fetchPoliciesApi ${path}`, err);
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
    const apiErr = isApiError(err) ? err : apiErrorFromCatch(err);
    if (!isAbortError(apiErr)) logApiError(`fetchPoliciesApi ${path}`, apiErr);
    throw apiErr;
  }
}

/**
 * 혜택 목록. 전체 탭이면 category를 보내지 않는다.
 * @param {{ category?: string, q?: string, signal?: AbortSignal }} [params]
 * @returns {Promise<PolicyListResult>}
 */
export async function fetchPolicies(params = {}) {
  const query = buildQuery({
    category: params.category,
    q: params.q,
  });
  const cacheKey = `policies:list${query}`;
  return withPublicCache(
    cacheKey,
    POLICIES_TTL_MS,
    async () => {
      const data = await fetchPoliciesApi(`/api/policies${query}`);
      const result = data?.result;
      if (!result || typeof result !== 'object' || !Array.isArray(result.items)) {
        throw createApiError({ kind: 'parse' });
      }

      const items = result.items.map(normalizePolicy).filter(Boolean);
      const total = Number(result.total);
      return {
        items,
        total: Number.isFinite(total) ? total : items.length,
      };
    },
    params.signal,
  );
}

/**
 * 카테고리 목록 (API 순서 유지).
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<string[]>}
 */
export async function fetchPolicyCategories(options = {}) {
  return withPublicCache(
    'policies:categories',
    POLICIES_TTL_MS,
    async () => {
      const data = await fetchPoliciesApi('/api/policies/categories');
      const categories = data?.result?.categories;
      if (!Array.isArray(categories)) {
        throw createApiError({ kind: 'parse' });
      }
      return categories
        .map((item) => nullableText(item))
        .filter(Boolean);
    },
    options.signal,
  );
}

/**
 * http/https URL만 허용. 그 외·빈 값은 null.
 * @param {string | null | undefined} url
 * @returns {string | null}
 */
export function safeOfficialUrl(url) {
  const text = nullableText(url);
  if (!text) return null;
  try {
    const parsed = new URL(text);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.href;
  } catch {
    return null;
  }
}
