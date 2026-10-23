// GET {API_BASE}/api/rent → { status: 'success', data: [{ region_code, region_name, median_rent(만원) }, ...] }
// 반환: { rows, source: 'api' | 'sample', error }
import { API_BASE } from './client';

// 팀 합의 규격 테스트용 응답 예시 (가상 데이터). 주소가 없으면 이 값을 사용한다.
export const SAMPLE_RENT = [
  { region_code: '26230', region_name: '부산진구', median_rent: 48 },
  { region_code: '26350', region_name: '해운대구', median_rent: 62 },
  { region_code: '26410', region_name: '금정구', median_rent: 39 },
];

export async function fetchRent() {
  if (!API_BASE) return { rows: SAMPLE_RENT, source: 'sample', error: null };
  try {
    const res = await fetch(`${API_BASE}/api/rent`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`서버 응답 오류 (HTTP ${res.status})`);
    const body = await res.json();
    // 백엔드 응답 형식: { status: 'success', data: [...] } (배열만 오는 경우도 허용)
    if (body && body.status === 'error') throw new Error(body.message || '백엔드에서 오류를 보냈어요');
    const data = Array.isArray(body) ? body : body && Array.isArray(body.data) ? body.data : null;
    if (!data) throw new Error('응답 형식이 달라요 (data 배열이 없어요)');
    const rows = data
      .filter((r) => r && r.region_name != null && r.median_rent != null)
      .map((r) => ({ region_code: String(r.region_code ?? ''), region_name: String(r.region_name), median_rent: Number(r.median_rent) }));
    return { rows, source: 'api', error: null };
  } catch (e) {
    const msg = e instanceof TypeError ? 'Flask 서버에 연결할 수 없어요 (서버가 꺼져 있거나 CORS 설정 문제)' : e.message;
    return { rows: [], source: 'api', error: msg };
  }
}
