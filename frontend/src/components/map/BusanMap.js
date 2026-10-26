'use client';

// 부산 구·군별 월세 중앙값 지도 (F-03) + 동네 정보
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchRent } from '@/api/rent';
import { GU, MAP_HEIGHT, SPOTS, SPOT_TYPES } from '@/constants/busan';
import { ROUTES } from '@/constants/routes';
import { useComparisonInputs, useNumbers } from '@/stores/comparison';
import { fmt, signed } from '@/utils/formatMoney';
import styles from './BusanMap.module.css';

// 5단계 파란색 (원룸 기준 구간, 투룸은 같은 비율로 늘림)
const BINS = [
  { max: 36, color: '#DCEAFE', },
  { max: 40, color: '#B4D2FD', },
  { max: 45, color: '#7DB0F7', },
  { max: 50, color: '#4A88EC', },
  { max: Infinity, color: '#2160D9', },
];
const SELECTED = '#0F2F73';
const TWO_ROOM = 1.5; // ⚠️ 투룸 = 원룸 × 1.5 (예시) → 주거 담당 데이터로 교체

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export default function BusanMap() {
  const router = useRouter();
  const { setField } = useComparisonInputs();
  const { values, missing } = useNumbers();
  const [base, setBase] = useState(() => Object.fromEntries(GU.map((g) => [g.name, { rent: g.rent, count: g.count }])));
  const [room, setRoom] = useState('one');
  const [picked, setPicked] = useState('해운대구');
  const [flip, setFlip] = useState('');

  // Flask GET /api/rent 값이 있으면 그 구만 DB 값으로 덮어씀 (나머지 구는 예시 값 유지)
  const [api, setApi] = useState({ loading: true, source: '', error: null, names: [] });
  useEffect(() => {
    fetchRent().then(({ rows, source, error }) => {
      if (source === 'api' && !error) {
        setBase((prev) => {
          const next = { ...prev };
          rows.forEach((r) => { if (next[r.region_name]) next[r.region_name] = { ...next[r.region_name], rent: r.median_rent, fromDb: true }; });
          return next;
        });
      }
      setApi({ loading: false, source, error, names: rows.map((r) => r.region_name) });
    });
  }, []);

  // 주소에 ?gu=해운대구 가 있거나 AI 채팅에서 구를 고르면 그 구를 선택
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('gu');
    if (fromUrl && GU.some((g) => g.name === fromUrl)) setPicked(fromUrl);
    const onPick = (e) => { if (GU.some((g) => g.name === e.detail)) { setPicked(e.detail); setFlip(''); } };
    window.addEventListener('movesan:pick-gu', onPick);
    return () => window.removeEventListener('movesan:pick-gu', onPick);
  }, []);

  const factor = room === 'two' ? TWO_ROOM : 1;
  const rentOf = (name) => Math.round(base[name].rent * factor);
  const binOf = (rent) => BINS.findIndex((b) => rent <= b.max * factor);
  const allMedian = median(GU.map((g) => rentOf(g.name)));

  const sel = GU.find((g) => g.name === picked) || GU[0];
  const selRent = rentOf(sel.name);
  const vsAll = selRent - allMedian;
  const seoulRent = values.seoulRent;
  const save = seoulRent != null && !Number.isNaN(seoulRent) ? seoulRent - selRent : null;
  const top5 = [...GU].sort((a, b) => rentOf(a.name) - rentOf(b.name)).slice(0, 5);
  const top5Max = Math.max(...GU.map((g) => rentOf(g.name)));

  const pick = (name) => { setPicked(name); setFlip(''); };
  const apply = () => {
    setField('busanRent', String(selRent));
    const rest = missing.filter((k) => k !== 'busanRent');
    router.push(rest.length === 0 ? ROUTES.result : ROUTES.home);
  };

  return (
      <div className="page">
        <div className={`${styles.layout} lift`}>
          <section className="card">
            <div className={styles.toolbar}>
              <h2>구·군별 월세 중앙값</h2>
              <div className={styles.seg} role="group" aria-label="방 종류">
                <button className={room === 'one' ? styles.on : ''} onClick={() => setRoom('one')}>원룸</button>
                <button className={room === 'two' ? styles.on : ''} onClick={() => setRoom('two')}>투룸</button>
              </div>
            </div>
            <div className={styles.wrap}>
              <svg viewBox={`0 0 1000 ${MAP_HEIGHT}`} role="img" aria-label="부산 구·군별 월세 지도">
                <g strokeLinejoin="round">
                  {GU.map((g) => (
                    <path
                      key={g.name}
                      d={g.path}
                      fill={g.name === sel.name ? SELECTED : BINS[binOf(rentOf(g.name))].color}
                      stroke="#fff"
                      strokeWidth={2}
                      onClick={() => pick(g.name)}
                    />
                  ))}
                  <path d={sel.path} fill="none" stroke="#0A1F4D" strokeWidth={6} pointerEvents="none" />
                </g>
              </svg>
              {GU.map((g) => {
                const rent = rentOf(g.name);
                const on = g.name === sel.name;
                const dark = binOf(rent) >= 3;
                return (
                  <button
                    key={g.name}
                    className={`${styles.label}${on ? ` ${styles.picked}` : dark ? ` ${styles.dark}` : ''}`}
                    style={{ left: `${g.label[0]}%`, top: `${g.label[1]}%` }}
                    onClick={() => pick(g.name)}
                  >
                    {g.name}<b>{rent}만원</b>
                  </button>
                );
              })}
              <span className={styles.sea}>남해 바다</span>
            </div>
            <div className={styles.legend}>
              {BINS.map((b, i) => {
                const up = Math.floor(b.max * factor);
                const low = i === 0 ? null : Math.floor(BINS[i - 1].max * factor) + 1;
                const text = low == null ? `~${up}만원` : b.max === Infinity ? `${low}만원~` : `${low}~${up}만원`;
                return <span key={b.color}><i style={{ background: b.color }} />{text}</span>;
              })}
            </div>
            <p className="small" style={{ margin: '10px 0 0', color: api.error ? 'var(--bad)' : 'var(--sub)' }}>
              {api.loading ? '월세 데이터를 불러오는 중…'
                : api.error ? `DB 연결 실패: ${api.error} · 예시 값으로 보여드려요`
                : api.source === 'api' ? `DB 연결됨 · ${api.names.join(', ')} 값은 DB에서 가져왔어요`
                : 'Flask 주소가 설정되지 않아 예시 값으로 보여드려요'}
            </p>
            <p className="small warn" style={{ margin: '4px 0 0' }}>※ 예시 데이터입니다. 실제 서비스에서는 국토교통부 실거래가 등 공공데이터로 바뀝니다.</p>
          </section>

          <aside className="stack" style={{ gap: 20 }}>
            <section className="card stack">
              <label className="stack" style={{ gap: 6 }}>
                <span className="small" style={{ fontWeight: 700 }}>동네 선택</span>
                <select className={styles.select} value={sel.name} onChange={(e) => pick(e.target.value)}>
                  {GU.map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
                </select>
              </label>
              <span className="tag" style={{ alignSelf: 'flex-start' }}>선택한 동네 · {room === 'one' ? '원룸' : '투룸'}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>부산 {sel.name}</div>
                <div className="small muted">월세 중앙값</div>
                <div className={styles.panelBig}>{selRent}<small>만원</small></div>
                <div className="small muted">{base[sel.name].fromDb ? 'DB(Flask)에서 가져온 값' : `거래 ${base[sel.name].count}건 기준 (예시)${base[sel.name].count <= 30 ? ' · 거래가 적어 집계 기간을 늘린 값' : ''}`}</div>
              </div>
              <div className={styles.statGrid}>
                <div className={styles.stat}><span className="small muted">부산 전체 중앙값</span><b>{fmt(allMedian)}만원</b></div>
                <div className={styles.stat}><span className="small muted">부산 중앙값 대비</span><b className={vsAll > 0 ? 'bad' : 'good'}>{signed(vsAll)}만원</b></div>
              </div>
              {save != null ? (
                <div className={styles.save}>
                  내 서울 월세 <b>{fmt(seoulRent)}만원</b>과 비교하면<br />
                  {save >= 0
                    ? <>월 <b>{fmt(save)}만원</b> · 1년 <b>{fmt(save * 12)}만원</b> 절약</>
                    : <>월 <b className="bad">{fmt(-save)}만원</b> 더 비싸요</>}
                </div>
              ) : (
                <div className={styles.save}>계산기에 서울 월세를 넣으면 얼마나 아낄 수 있는지 보여드려요.</div>
              )}
              <button className="btn btn-grad" style={{ minHeight: 52, fontSize: 16 }} onClick={apply}>이 동네 월세로 계산하기 →</button>
            </section>

            <section className={`card ${styles.top5}`}>
              <h2 style={{ fontSize: 18, marginBottom: 10 }}>월세 낮은 동네 TOP 5</h2>
              <ol>
                {top5.map((g, i) => (
                  <li key={g.name} onClick={() => pick(g.name)}>
                    <span className={styles.rank}>{i + 1}</span>
                    <strong style={{ width: 68 }}>{g.name}</strong>
                    <span className={styles.bar}><span style={{ width: `${(rentOf(g.name) / top5Max) * 100}%` }} /></span>
                    <strong style={{ width: 56, textAlign: 'right' }}>{rentOf(g.name)}만원</strong>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>

        <section className="card section stack">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <h2>{sel.name}엔 이런 게 있어요</h2>
            <span className="small muted">카드를 누르면 한 줄 정보와 링크가 나와요</span>
          </div>
          <div className="chips" style={{ gap: 6, padding: '10px 12px', background: 'var(--bg)', borderRadius: 12 }}>
            <span className="small" style={{ fontWeight: 700 }}>동네 {sel.dongs.length}곳</span>
            {sel.dongs.map((d) => <span key={d} className={styles.dong}>{d}</span>)}
          </div>
          <div className={styles.spots}>
            {(SPOTS[sel.name] || []).map(([name, type, fact], i) => {
              const key = sel.name + i;
              const open = flip === key;
              const t = SPOT_TYPES[type];
              const q = encodeURIComponent(`부산 ${name}`);
              return (
                <div key={key} className={styles.spot} style={{ background: open ? 'var(--ink)' : t.bg, color: open ? '#fff' : 'var(--ink)' }}>
                  <button className={styles.spotBtn} aria-pressed={open} onClick={() => setFlip(open ? '' : key)}>
                    <span className={styles.spotIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F1E33" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={t.icon} /></svg>
                    </span>
                    <strong style={{ fontSize: open ? 13 : 15 }}>{name}</strong>
                    <span style={{ fontSize: open ? 13 : 12, opacity: open ? 1 : 0.75 }}>{open ? fact : type}</span>
                  </button>
                  {open && (
                    <div className={styles.spotLinks}>
                      <a href={`https://search.naver.com/search.naver?query=${q}`} target="_blank" rel="noopener noreferrer">더 알아보기 ↗</a>
                      <a href={`https://map.kakao.com/?q=${q}`} target="_blank" rel="noopener noreferrer">지도 보기 ↗</a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
  );
}
