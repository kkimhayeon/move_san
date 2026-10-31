// POST {API_BASE}/api/v1/comparisons — 생활비 비교 계산 (인증 불필요, DB 저장 없음)
import { API_BASE } from './client';
import {
  apiErrorFromCatch,
  apiErrorFromResponse,
  createApiError,
  isAbortError,
  isApiError,
  logApiError,
} from '@/utils/errors';

/** Zustand/폼 숫자값을 API 요청 필드로 매핑한다. 빈 값은 넣지 않는다. */
export function toComparisonBody(values) {
  return {
    seoul_pay: values.seoulPay,
    busan_pay: values.busanPay,
    seoul_rent: values.seoulRent,
    busan_rent: values.busanRent,
    living: values.seoulLiving,
  };
}

export async function fetchComparison(body) {
  if (!API_BASE) {
    const err = createApiError({ kind: 'config' });
    logApiError('fetchComparison', err);
    throw err;
  }

  try {
    let res;
    try {
      res = await fetch(`${API_BASE}/api/v1/comparisons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

    if (!data?.result || typeof data.result !== 'object') {
      throw createApiError({ kind: 'parse', status: res.status });
    }

    return data;
  } catch (err) {
    const apiErr = isApiError(err) ? err : apiErrorFromCatch(err);
    if (!isAbortError(apiErr)) logApiError('fetchComparison', apiErr);
    throw apiErr;
  }
}
