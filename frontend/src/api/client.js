import { createClient } from '@/lib/supabase/client';

// Flask 서버 주소. 경로에 /api/v1을 붙이지 않는다 (요청 함수에서 붙인다).
export const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch(path, options = {}) {
  const supabase = createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
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

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API 요청에 실패했습니다.');
  }

  return data;
}
