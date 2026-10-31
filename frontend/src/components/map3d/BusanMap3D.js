'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchHousingDistricts, fetchHousingRankings } from '@/api/housing';
import { GU, SPOTS, SPOT_TYPES } from '@/constants/busan';
import {
  CHIP_ORDER,
  idFromGuName,
  MAP3D_BY_ID,
  MAP3D_BY_NAME,
  MAP3D_REGIONS,
  nameFromId,
} from '@/constants/map3d';
import { ROUTES } from '@/constants/routes';
import { DISTRICTS, MISSING_FILL, RENT_FILL } from '@/data/map3d/districts';
import { useComparisonInputs } from '@/stores/comparison';
import { getUserErrorMessage, isAbortError } from '@/utils/errors';
import Map3DCanvas from './Map3DCanvas';
import styles from './BusanMap3D.module.css';

const BINS = [
  { max: 36, color: RENT_FILL[0] },
  { max: 40, color: RENT_FILL[1] },
  { max: 45, color: RENT_FILL[2] },
  { max: 50, color: RENT_FILL[3] },
  { max: Infinity, color: RENT_FILL[4] },
];

function formatRentDisplay(value) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const rounded = Math.round(Number(value) * 100) / 100;
  return rounded.toLocaleString('ko-KR', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
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

function rentLabel(rent) {
  const text = formatRentDisplay(rent);
  return text == null ? '자료 없음' : `${text}만원`;
}

export default function BusanMap3D() {
  const router = useRouter();
  const { setField } = useComparisonInputs();

  /** 영문 ID. null = 전체 보기 */
  const [selectedId, setSelectedId] = useState(null);
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
        if (cancelled || isAbortError(err)) return;
        setDistricts({
          loading: false,
          error: getUserErrorMessage(err, '월세 정보를 불러오지 못했어요.'),
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
        if (cancelled || isAbortError(err)) return;
        setRankings({
          loading: false,
          error: getUserErrorMessage(err, '월세 낮은 동네 순위를 불러오지 못했어요.'),
          items: [],
        });
      });

    return () => { cancelled = true; };
  }, [rankingRetry]);

  const pickByName = useCallback((name) => {
    if (!name) {
      setSelectedId(null);
      setFlip('');
      return;
    }
    const id = idFromGuName(name);
    if (!id) return;
    setSelectedId(id);
    setFlip('');
  }, []);

  const pickById = useCallback((id) => {
    setSelectedId(id);
    setFlip('');
  }, []);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('gu');
    if (fromUrl && MAP3D_BY_NAME[fromUrl]) pickByName(fromUrl);

    const onPick = (e) => {
      if (e.detail && MAP3D_BY_NAME[e.detail]) pickByName(e.detail);
    };
    window.addEventListener('movesan:pick-gu', onPick);
    return () => window.removeEventListener('movesan:pick-gu', onPick);
  }, [pickByName]);

  const byCode = useMemo(() => {
    const map = new Map();
    districts.items.forEach((item) => map.set(String(item.region_code), item));
    return map;
  }, [districts.items]);

  const dataOfName = useCallback((name) => {
    const region = MAP3D_BY_NAME[name];
    if (!region?.region_code) return null;
    return byCode.get(String(region.region_code)) ?? null;
  }, [byCode]);

  const rentsById = useMemo(() => {
    const out = {};
    MAP3D_REGIONS.forEach((r) => {
      const item = byCode.get(String(r.region_code));
      out[r.id] = item?.median_rent ?? null;
    });
    return out;
  }, [byCode]);

  const selectedName = nameFromId(selectedId);
  const selGu = selectedName ? GU.find((g) => g.name === selectedName) : null;
  const selData = selectedName ? dataOfName(selectedName) : null;
  const selRent = selData?.median_rent ?? null;
  const selCount = selData?.sample_count ?? null;
  const districtInfo = selectedId ? DISTRICTS[selectedId] : null;
  const top5Max = Math.max(0, ...rankings.items.map((item) => (item.median_rent == null ? 0 : item.median_rent)));
  const criteria = metadataLines(districts.metadata);

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
            <h2>어디로 가볼까?</h2>
          </div>

          <div className={styles.stage}>
            <Map3DCanvas
              rentsById={rentsById}
              rentLoading={districts.loading}
              selectedId={selectedId}
              onSelectId={pickById}
            />
            <div className={styles.ui}>
              {selectedId && (
                <button type="button" className={styles.ghost} onClick={() => pickById(null)}>
                  전체 지도 보기
                </button>
              )}
            </div>
            <div className={styles.stageFooter}>
              <div className={styles.legend}>
                원룸 월세
                {BINS.map((b, i) => {
                  const up = Math.floor(b.max);
                  const low = i === 0 ? null : Math.floor(BINS[i - 1].max) + 1;
                  const text = low == null ? `~${up}` : b.max === Infinity ? `${low}~` : `${low}~${up}`;
                  return (
                    <span key={b.color}>
                      <i style={{ background: b.color }} />
                      {text}
                    </span>
                  );
                })}
                <span>
                  <i style={{ background: MISSING_FILL }} />
                  없음
                </span>
              </div>
              <p className={styles.hint}>드래그로 회전 · 휠로 확대 · 바다 클릭 시 전체 보기</p>
            </div>
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
              <select
                className={styles.select}
                value={selectedName || ''}
                onChange={(e) => pickByName(e.target.value || null)}
              >
                <option value="">전체 지도 보기</option>
                {MAP3D_REGIONS.map((r) => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </label>

            {!selectedId ? (
              <>
                <span className="tag" style={{ alignSelf: 'flex-start' }}>전체 보기</span>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>부산 16개 구·군</div>
                  <p className={styles.guide} style={{ marginTop: 10 }}>
                    지도에서 구·군을 누르면 그 동네를 대표하는 랜드마크가 나타나요.
                    아래에서 바로가기로도 골라 볼 수 있어요.
                  </p>
                </div>
                <div className={styles.chips}>
                  {CHIP_ORDER.map((id) => (
                    <button key={id} type="button" onClick={() => pickById(id)}>
                      {MAP3D_BY_ID[id].name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <span className="tag" style={{ alignSelf: 'flex-start' }}>부산 {selectedName}</span>

                {districtInfo ? (
                  <div className={styles.lmBlock}>
                    <span className={styles.lmEyebrow}>이 동네 랜드마크</span>
                    <strong className={styles.lmName}>{districtInfo.lm}</strong>
                    <p>{districtInfo.desc}</p>
                  </div>
                ) : (
                  <div style={{ fontSize: 22, fontWeight: 800 }}>부산 {selectedName}</div>
                )}

                <div className={styles.rentCompact}>
                  {districts.loading ? (
                    <span className="small muted">불러오는 중…</span>
                  ) : districts.error ? (
                    <span className="small bad">불러오기 실패</span>
                  ) : selRent == null ? (
                    <b className={styles.rentValue}>자료 없음</b>
                  ) : (
                    <b className={styles.rentValue}>
                      {Math.round(selRent).toLocaleString('ko-KR')}
                      <small>만원</small>
                    </b>
                  )}
                  <span className={styles.rentHint}>
                    {selCount != null && Number.isFinite(Number(selCount))
                      ? `${Number(selCount).toLocaleString('ko-KR')}건중 중앙값`
                      : '중앙값'}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ minHeight: 48, fontSize: 15 }}
                  onClick={apply}
                  disabled={selRent == null || !Number.isFinite(selRent)}
                >
                  이 동네 월세로 계산하기 →
                </button>
              </>
            )}
          </section>

          <section className={`card ${styles.top5}`}>
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>다른 동네 둘러보기</h2>
            <p className="small muted" style={{ margin: '0 0 10px' }}>월세가 낮은 순 · 누르면 그 동네로 이동해요</p>
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
                    <li key={item.region_code || item.name} onClick={() => pickByName(item.name)}>
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

      {selGu ? (
        <section className="card section stack">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <h2>{selGu.name}엔 이런 게 있어요</h2>
            <span className="small muted">카드를 누르면 한 줄 정보와 링크가 나와요</span>
          </div>
          <div className="chips" style={{ gap: 6, padding: '10px 12px', background: 'var(--bg)', borderRadius: 12 }}>
            <span className="small" style={{ fontWeight: 700 }}>동네 {selGu.dongs.length}곳</span>
            {selGu.dongs.map((d) => <span key={d} className={styles.dong}>{d}</span>)}
          </div>
          <div className={styles.spots}>
            {(SPOTS[selGu.name] || []).map(([name, type, fact], i) => {
              const key = selGu.name + i;
              const open = flip === key;
              const t = SPOT_TYPES[type];
              const q = encodeURIComponent(`부산 ${name}`);
              return (
                <div
                  key={key}
                  className={styles.spot}
                  style={{ background: open ? 'var(--ink)' : t.bg, color: open ? '#fff' : 'var(--ink)' }}
                >
                  <button
                    type="button"
                    className={styles.spotBtn}
                    aria-pressed={open}
                    onClick={() => setFlip(open ? '' : key)}
                  >
                    <span className={styles.spotIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F1E33" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={t.icon} />
                      </svg>
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
      ) : (
        <section className="card section">
          <p className="small muted" style={{ margin: 0 }}>
            지역을 선택하면 행정동 목록과 명소 카드가 여기에 표시돼요.
          </p>
        </section>
      )}
    </div>
  );
}
