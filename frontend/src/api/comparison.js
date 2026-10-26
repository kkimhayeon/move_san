// POST {API_BASE}/api/compare
// 성공하면 서버 JSON을 그대로 반환한다. 서버가 없거나 실패하면 compareDetailed와 같은 모양으로 계산한다.
// 결과 화면은 새로고침 없이 바로 그리려고 이 함수 대신 compareDetailed를 직접 호출한다.
import { API_BASE } from './client';
import { compareDetailed } from '@/utils/calc';

export async function fetchCompare(input) {
  if (!API_BASE) return compareDetailed(input);
  try {
    const res = await fetch(`${API_BASE}/api/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    return compareDetailed(input);
  }
}
