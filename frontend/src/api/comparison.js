// POST {API_BASE}/api/v1/comparisons — 생활비 비교 계산 (인증 불필요, DB 저장 없음)
// body: { seoul_pay, busan_pay, seoul_rent, busan_rent, living } (만원, JSON number)
// → { status, message, result }
import { API_BASE } from './client';

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
    throw new Error('API 주소가 설정되지 않았어요. NEXT_PUBLIC_API_URL을 확인해 주세요.');
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/comparisons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      throw new Error(`서버 응답을 읽을 수 없어요 (HTTP ${res.status}).`);
    }

    if (!res.ok) {
      throw new Error(data?.message || `서버 응답 오류 (HTTP ${res.status})`);
    }

    if (!data?.result || typeof data.result !== 'object') {
      throw new Error(data?.message || '계산 결과가 없어요.');
    }

    return data;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('서버에 연결할 수 없어요. Flask 서버가 켜져 있는지, CORS 설정을 확인해 주세요.');
    }
    throw err instanceof Error ? err : new Error('알 수 없는 오류가 발생했어요.');
  }
}
