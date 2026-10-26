// POST {API_BASE}/api/compare — 계산 API (아직 팀 규격 미정, 없으면 프론트 계산식 사용)
// 결과 화면은 지금 compareDetailed를 직접 쓴다. 이 함수로 바꾸면 계산 결과가 달라질 수 있다.
import { API_BASE } from './client';
import { compare } from '@/utils/calc';

export async function fetchCompare(input) {
  if (!API_BASE) return compare(input);
  try {
    const res = await fetch(`${API_BASE}/api/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    return compare(input);
  }
}
