import { createClient } from '@/lib/supabase/client';
import {
  apiErrorFromCatch,
  apiErrorFromResponse,
  createApiError,
  isAbortError,
  logApiError,
} from '@/utils/errors';

// Flask 서버 주소. 경로에 /api/v1을 붙이지 않는다 (요청 함수에서 붙인다).
export const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch(path, options = {}) {
  if (!API_BASE) {
    const err = createApiError({ kind: 'config' });
    logApiError(`apiFetch ${path}`, err);
    throw err;
  }

  const supabase = createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    const err = createApiError({ kind: 'unknown' });
    logApiError(`apiFetch session ${path}`, err);
    throw err;
  }

  const headers = new Headers(options.headers);

  if (session?.access_token) {
    headers.set(
      'Authorization',
      `Bearer ${session.access_token}`
    );
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (cause) {
    const err = apiErrorFromCatch(cause);
    if (!isAbortError(err)) logApiError(`apiFetch network ${path}`, err);
    throw err;
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    const err = response.ok
      ? createApiError({ kind: 'parse', status: response.status })
      : createApiError({ kind: 'http', status: response.status });
    logApiError(`apiFetch parse ${path}`, err);
    throw err;
  }

  if (!response.ok) {
    const err = apiErrorFromResponse(response, data);
    logApiError(`apiFetch ${path}`, err);
    throw err;
  }

  return data;
}
