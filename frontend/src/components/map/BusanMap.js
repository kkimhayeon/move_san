'use client';

// 부산 구·군별 월세 중앙값 지도 (F-03) + 동네 정보
// 월세·순위는 Flask GET /api/v1/housing/* 응답을 사용한다. SVG path는 GU 상수 유지.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchHousingDistricts, fetchHousingRankings } from '@/api/housing';
import { GU, MAP_HEIGHT, SPOTS, SPOT_TYPES } from '@/constants/busan';
import { ROUTES } from '@/constants/routes';
import { useComparisonInputs, useNumbers } from '@/stores/comparison';
import { signed } from '@/utils/formatMoney';
import styles from './BusanMap.module.css';

const BINS = [
  { max: 36, color: '#DCEAFE' },
  { max: 40, color: '#B4D2FD' },
  { max: 45, color: '#7DB0F7' },
  { max: 50, color: '#4A88EC' },
  { max: Infinity, color: '#2160D9' },
];
const SELECTED = '#0F2F73';
const NEUTRAL = '#E8EEF5';
const MISSING = '#CBD5E1';

function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** 화면 표시용. 원본 숫자는 유지하고 소수 최대 둘째 자리. */
function formatRentDisplay(value) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const rounded = Math.round(Number(value) * 100) / 100;
  return rounded.toLocaleString('ko-KR', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
}

function formatCount(value) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  return `${Number(value).toLocaleString('ko-KR')}건`;
}

function formatPeriodMonth(iso) {
  if (!iso || typeof iso !== 'string' || iso.length < 7) return null;
  return iso.slice(0, 7).replace('-', '.');
}

function metadataLines(metadata) {
  if (!metadata) return [];
  const lines = [];
  if (metadata.target_deposit != null && Number.isFinite(Number(metadata.target_deposit))) {
    lines.push(`보증금 ${Number(metadata.target_deposit).toLocaleString('ko-KR')}만 원 기준 환산 월세`);
  }
  const start = formatPeriodMonth(metadata.period_start);
  const end = formatPeriodMonth(metadata.period_end);
  if (start && end) lines.push(`${start}~${end} 실거래`);
  if (metadata.max_area_m2 != null && Number.isFinite(Number(metadata.max_area_m2))) {
    lines.push(`전용면적 ${metadata.max_area_m2}㎡ 이하`);
  }
  if (Array.isArray(metadata.property_types) && metadata.property_types.length) {
    lines.push(metadata.property_types.join('·'));
  }
  if (metadata.source_name) lines.push(String(metadata.source_name));
  if (metadata.updated_at) lines.push(`갱신 ${metadata.updated_at}`);
  return lines;
}

function binOf(rent) {
  if (rent == null || !Number.isFinite(rent)) return -1;
  return BINS.findIndex((b) => rent <= b.max);
}

function rentLabel(rent) {
  const text = formatRentDisplay(rent);
  return text == null ? '자료 없음' : `${text}만원`;
}

export default function BusanMap() {
  const router = useRouter();
  const { setField } = useComparisonInputs();
  const { values } = useNumbers();
  const [picked, setPicked] = useState('해운대구');
  const [flip, setFlip] = useState('');

  const [districts, setDistricts] = useState({
    loading: true,
    error: null,
    items: [],
    metadata: null,
  });
  const [rankings, setRankings] = useState({
    loading: true,
    error: null,
    items: [],
  });
  const [districtRetry, setDistrictRetry] = useState(0);
  const [rankingRetry, setRankingRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setDistricts((prev) => ({ ...prev, loading: true, error: null }));

    fetchHousingDistricts()
      .then(({ items, metadata }) => {
        if (cancelled) return;
        setDistricts({ loading: false, error: null, items, metadata });
      })
      .catch((err) => {
        if (cancelled) return;
        setDistricts({
          loading: false,
          error: err instanceof Error ? err.message : '구군 데이터를 불러오지 못했어요.',
          items: [],
          metadata: null,
        });
      });

    return () => { cancelled = true; };
  }, [districtRetry]);

  useEffect(() => {
    let cancelled = false;
    setRankings((prev) => ({ ...prev, loading: true, error: null }));

    fetchHousingRankings(5)
      .then(({ items }) => {
        if (cancelled) return;
        setRankings({ loading: false, error: null, items });
      })
      .catch((err) => {
        if (cancelled) return;
        setRankings({
          loading: false,
          error: err instanceof Error ? err.message : '순위 데이터를 불러오지 못했어요.',
          items: [],
        });
      });

    return () => { cancelled = true; };
  }, [rankingRetry]);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('gu');
    if (fromUrl && GU.some((g) => g.name === fromUrl)) setPicked(fromUrl);
    const onPick = (e) => {
      if (GU.some((g) => g.name === e.detail)) {
        setPicked(e.detail);
        setFlip('');
      }
    };
    window.addEventListener('movesan:pick-gu', onPick);
    return () => window.removeEventListener('movesan:pick-gu', onPick);
  }, []);

  const byCode = useMemo(() => {
    const map = new Map();
    districts.items.forEach((item) => map.set(String(item.region_code), item));
    return map;
  }, [districts.items]);

  const dataOf = useCallback((gu) => {
    if (!gu?.region_code) return null;
    return byCode.get(String(gu.region_code)) ?? null;
  }, [byCode]);

  const rentOf = useCallback((gu) => {
    const item = typeof gu === 'string' ? dataOf(GU.find((g) => g.name === gu)) : dataOf(gu);
    if (!item || item.median_rent == null) return null;
    return item.median_rent;
  }, [dataOf]);

  const pick = useCallback((name) => {
    setPicked(name);
    setFlip('');
  }, []);

  const sel = GU.find((g) => g.name === picked) || GU[0];
  const selData = dataOf(sel);
  const selRent = selData?.median_rent ?? null;
  const selCount = selData?.sample_count ?? null;
  const availableRents = GU.map((g) => rentOf(g)).filter((v) => v != null);
  const allMedian = median(availableRents);
  const vsAll = selRent != null && allMedian != null ? selRent - allMedian : null;
  const seoulRent = values.seoulRent;
  const save = selRent != null && seoulRent != null && !Number.isNaN(seoulRent) ? seoulRent - selRent : null;
  const top5Max = Math.max(0, ...rankings.items.map((item) => (item.median_rent == null ? 0 : item.median_rent)));
  const criteria = metadataLines(districts.metadata);

  const fillOf = (g) => {
    if (g.name === sel.name) return SELECTED;
    if (districts.loading || districts.error) return NEUTRAL;
    const rent = rentOf(g);
    if (rent == null) return MISSING;
    const idx = binOf(rent);
    return idx >= 0 ? BINS[idx].color : MISSING;
  };

  const apply = () => {
    if (selRent == null || !Number.isFinite(selRent)) return;
    setField('busanRent', String(selRent));
    router.push(ROUTES.home);
  };

  return (
    <div className="page">
      <div className={`${styles.layout} lift`}>
        <section className="card">
          <div className={styles.toolbar}>
            <h2>구·군별 월세 중앙값</h2>
          </div>
          <div className={styles.wrap}>
            <svg viewBox={`0 0 1000 ${MAP_HEIGHT}`} role="img" aria-label="부산 구·군별 월세 지도">
              <g strokeLinejoin="round">
                {GU.map((g) => (
                  <path
                    key={g.name}
                    d={g.path}
                    fill={fillOf(g)}
                    stroke="#fff"
                    strokeWidth={2}
                    onClick={() => pick(g.name)}
                  />
                ))}
                <path d={sel.path} fill="none" stroke="#0A1F4D" strokeWidth={6} pointerEvents="none" />
              </g>
            </svg>
            {GU.map((g) => {
              const rent = rentOf(g);
              const on = g.name === sel.name;
              const dark = !on && binOf(rent) >= 3;
              return (
                <button
                  key={g.name}
                  type="button"
                  className={`${styles.label}${on ? ` ${styles.picked}` : dark ? ` ${styles.dark}` : ''}`}
                  style={{ left: `${g.label[0]}%`, top: `${g.label[1]}%` }}
                  onClick={() => pick(g.name)}
                >
                  {g.name}<b>{rentLabel(rent)}</b>
                </button>
              );
            })}
            <span className={styles.sea}>남해 바다</span>
          </div>
          <div className={styles.legend}>
            {BINS.map((b, i) => {
              const up = Math.floor(b.max);
              const low = i === 0 ? null : Math.floor(BINS[i - 1].max) + 1;
              const text = low == null ? `~${up}만원` : b.max === Infinity ? `${low}만원~` : `${low}~${up}만원`;
              return <span key={b.color}><i style={{ background: b.color }} />{text}</span>;
            })}
          </div>

          {districts.loading && (
            <p className="small muted" style={{ margin: '10px 0 0' }}>월세 중앙값 데이터를 불러오는 중…</p>
          )}
          {!districts.loading && districts.error && (
            <div style={{ marginTop: 10 }}>
              <p className="small bad" style={{ margin: 0 }} role="alert">{districts.error}</p>
              <button type="button" className="btn-ghost" style={{ marginTop: 6 }} onClick={() => setDistrictRetry((n) => n + 1)}>
                ↻ 지도 데이터 다시 시도
              </button>
            </div>
          )}
          {!districts.loading && !districts.error && criteria.length > 0 && (
            <ul className="small muted" style={{ margin: '10px 0 0', paddingLeft: 18, lineHeight: 1.55 }}>
              {criteria.map((line) => <li key={line}>{line}</li>)}
            </ul>
          )}
        </section>

        <aside className="stack" style={{ gap: 20 }}>
          <section className="card stack">
            <label className="stack" style={{ gap: 6 }}>
              <span className="small" style={{ fontWeight: 700 }}>동네 선택</span>
              <select className={styles.select} value={sel.name} onChange={(e) => pick(e.target.value)}>
                {GU.map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
              </select>
            </label>
            <span className="tag" style={{ alignSelf: 'flex-start' }}>선택한 동네</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>부산 {sel.name}</div>
              <div className="small muted">월세 중앙값 (소수 첫째 자리에서 반올림한 값입니다)</div>
              {districts.loading ? (
                <div className="small muted" style={{ marginTop: 8 }}>불러오는 중…</div>
              ) : districts.error ? (
                <div className="small bad" style={{ marginTop: 8 }}>데이터를 불러오지 못했어요.</div>
              ) : selRent == null ? (
                <div className={styles.panelBig} style={{ fontSize: 28 }}>자료 없음</div>
              ) : (
                <div className={styles.panelBig}>{Math.round(selRent).toLocaleString('ko-KR')}<small>만원</small></div>
              )}
              {!districts.loading && !districts.error && selCount != null && (
                <div className="small muted">거래 {formatCount(selCount)} 기준</div>
              )}
            </div>
            <div className={styles.statGrid}>
              <div className={styles.stat}>
                <span className="small muted">부산 전체 중앙값</span>
                <b>{allMedian == null ? '자료 없음' : `${formatRentDisplay(allMedian)}만원`}</b>
              </div>
              <div className={styles.stat}>
                <span className="small muted">부산 중앙값 대비</span>
                <b className={vsAll == null ? undefined : vsAll > 0 ? 'bad' : 'good'}>
                  {vsAll == null ? '자료 없음' : `${signed(vsAll)}만원`}
                </b>
              </div>
            </div>
            {save != null ? (
              <div className={styles.save}>
                내 서울 월세 <b>{formatRentDisplay(seoulRent)}만원</b>과 비교하면<br />
                {save >= 0
                  ? <>월 <b>{formatRentDisplay(save)}만원</b> · 1년 <b>{formatRentDisplay(save * 12)}만원</b> 절약</>
                  : <>월 <b className="bad">{formatRentDisplay(-save)}만원</b> 더 비싸요</>}
              </div>
            ) : (
              <div className={styles.save}>계산기에 서울 월세를 넣으면 얼마나 아낄 수 있는지 보여드려요.</div>
            )}
            <button
              type="button"
              className="btn btn-grad"
              style={{ minHeight: 52, fontSize: 16 }}
              onClick={apply}
              disabled={selRent == null || !Number.isFinite(selRent)}
            >
              이 동네 월세로 계산하기 →
            </button>
          </section>

          <section className={`card ${styles.top5}`}>
            <h2 style={{ fontSize: 18, marginBottom: 10 }}>월세 낮은 동네 TOP 5</h2>
            {rankings.loading && <p className="small muted" style={{ margin: 0 }}>순위 데이터를 불러오는 중…</p>}
            {!rankings.loading && rankings.error && (
              <div>
                <p className="small bad" style={{ margin: 0 }} role="alert">{rankings.error}</p>
                <button type="button" className="btn-ghost" style={{ marginTop: 6 }} onClick={() => setRankingRetry((n) => n + 1)}>
                  ↻ 순위 다시 시도
                </button>
              </div>
            )}
            {!rankings.loading && !rankings.error && rankings.items.length === 0 && (
              <p className="small muted" style={{ margin: 0 }}>순위 자료가 없어요.</p>
            )}
            {!rankings.loading && !rankings.error && rankings.items.length > 0 && (
              <ol>
                {rankings.items.map((item, i) => {
                  const rent = item.median_rent;
                  const width = rent == null || top5Max <= 0 ? 0 : (rent / top5Max) * 100;
                  return (
                    <li key={item.region_code || item.name} onClick={() => pick(item.name)}>
                      <span className={styles.rank}>{i + 1}</span>
                      <strong style={{ width: 68 }}>{item.name}</strong>
                      <span className={styles.bar}><span style={{ width: `${width}%` }} /></span>
                      <strong style={{ width: 72, textAlign: 'right' }}>{rentLabel(rent)}</strong>
                    </li>
                  );
                })}
              </ol>
            )}
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
                <button type="button" className={styles.spotBtn} aria-pressed={open} onClick={() => setFlip(open ? '' : key)}>
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
