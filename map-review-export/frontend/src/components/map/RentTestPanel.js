'use client';

// 연동 테스트 화면: Flask GET /api/rent 결과를 지역명·월세로 그대로 보여준다
// 4단계 검증: Supabase에서 월세 하나 수정 → 이 화면에서 [다시 불러오기] → 바뀐 값이 보이면 연결 성공
import { useEffect, useState } from 'react';
import { fetchRent } from '@/api/rent';
import { API_BASE } from '@/api/client';

export default function RentTestPanel() {
  const [state, setState] = useState({ loading: true, rows: [], source: '', error: null, at: '' });

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const r = await fetchRent();
    setState({ loading: false, ...r, at: new Date().toLocaleTimeString('ko-KR') });
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="page" style={{ paddingTop: 40 }}>
      <section className="card stack" style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24 }}>지역별 월세 연동 테스트</h1>
        <div className="small muted">
          호출 주소: <code>{API_BASE ? `${API_BASE}/api/rent` : '(없음) → 가상 JSON 사용'}</code>
        </div>
        <div className="chips" style={{ alignItems: 'center' }}>
          <span className="tag" style={state.error ? { background: '#FDECEC', color: 'var(--bad)' } : undefined}>
            {state.loading ? '불러오는 중…' : state.error ? '오류' : state.source === 'api' ? 'Flask(DB) 데이터' : '가상 JSON 데이터'}
          </span>
          {state.at && !state.loading && <span className="small muted">{state.at} 기준</span>}
          <button className="btn-ghost" onClick={load} disabled={state.loading} style={{ marginLeft: 'auto' }}>↻ 다시 불러오기</button>
        </div>

        {state.loading && <p className="muted">데이터를 불러오는 중이에요…</p>}
        {!state.loading && state.error && (
          <p className="bad" style={{ margin: 0 }}>{state.error}</p>
        )}
        {!state.loading && !state.error && state.rows.length === 0 && <p className="muted">받은 데이터가 없어요 (빈 배열).</p>}
        {!state.loading && !state.error && state.rows.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--sub)', fontSize: 13 }}>
                <th style={{ padding: '8px 0' }}>지역 코드</th><th>지역명</th><th style={{ textAlign: 'right' }}>월세 중앙값</th>
              </tr>
            </thead>
            <tbody>
              {state.rows.map((r) => (
                <tr key={r.region_code + r.region_name} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 0' }} className="muted">{r.region_code}</td>
                  <td><strong>{r.region_name}</strong></td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--brand)' }}>{r.median_rent}만원</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="small warn" style={{ margin: 0 }}>모든 월세 수치는 연동 확인을 위한 가상 데이터예요.</p>
      </section>
    </div>
  );
}
