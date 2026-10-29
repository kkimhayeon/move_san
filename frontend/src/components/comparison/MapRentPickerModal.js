'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchHousingDistricts, fetchHousingRankings } from '@/api/housing';
import {
  idFromGuName,
  MAP3D_BY_NAME,
  MAP3D_REGIONS,
  nameFromId,
} from '@/constants/map3d';
import Map3DCanvas from '@/components/map3d/Map3DCanvas';
import { useNumbers } from '@/stores/comparison';
import { getUserErrorMessage, isAbortError } from '@/utils/errors';
import styles from './MapRentPickerModal.module.css';

function formatRentDisplay(value) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const rounded = Math.round(Number(value) * 100) / 100;
  return rounded.toLocaleString('ko-KR', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
}

function formatCount(value) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  return `${Number(value).toLocaleString('ko-KR')}건`;
}

function rentLabel(rent) {
  const text = formatRentDisplay(rent);
  return text == null ? '자료 없음' : `${text}만원`;
}

export default function MapRentPickerModal({ open, onClose, onApply }) {
  const { values } = useNumbers();
  const [selectedId, setSelectedId] = useState(null);
  const [districts, setDistricts] = useState({
    loading: true,
    error: null,
    items: [],
  });
  const [rankings, setRankings] = useState({
    loading: true,
    error: null,
    items: [],
  });
  const [districtRetry, setDistrictRetry] = useState(0);
  const [rankingRetry, setRankingRetry] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setDistricts((prev) => ({ ...prev, loading: true, error: null }));
    fetchHousingDistricts()
      .then(({ items }) => {
        if (!cancelled) setDistricts({ loading: false, error: null, items });
      })
      .catch((err) => {
        if (cancelled || isAbortError(err)) return;
        setDistricts({
          loading: false,
          error: getUserErrorMessage(err, '월세 정보를 불러오지 못했어요.'),
          items: [],
        });
      });
    return () => { cancelled = true; };
  }, [open, districtRetry]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setRankings((prev) => ({ ...prev, loading: true, error: null }));
    fetchHousingRankings(5)
      .then(({ items }) => {
        if (!cancelled) setRankings({ loading: false, error: null, items });
      })
      .catch((err) => {
        if (cancelled || isAbortError(err)) return;
        setRankings({
          loading: false,
          error: getUserErrorMessage(err, '순위 정보를 불러오지 못했어요.'),
          items: [],
        });
      });
    return () => { cancelled = true; };
  }, [open, rankingRetry]);

  const byCode = useMemo(() => {
    const map = new Map();
    districts.items.forEach((item) => map.set(String(item.region_code), item));
    return map;
  }, [districts.items]);

  const rentsById = useMemo(() => {
    const out = {};
    MAP3D_REGIONS.forEach((r) => {
      out[r.id] = byCode.get(String(r.region_code))?.median_rent ?? null;
    });
    return out;
  }, [byCode]);

  const pickById = useCallback((id) => setSelectedId(id), []);
  const pickByName = useCallback((name) => {
    if (!name) {
      setSelectedId(null);
      return;
    }
    const id = idFromGuName(name);
    if (id) setSelectedId(id);
  }, []);

  const selectedName = nameFromId(selectedId);
  const region = selectedName ? MAP3D_BY_NAME[selectedName] : null;
  const selData = region ? byCode.get(String(region.region_code)) ?? null : null;
  const selRent = selData?.median_rent ?? null;
  const selCount = selData?.sample_count ?? null;
  const seoulRent = values.seoulRent;
  const save = selRent != null && seoulRent != null && !Number.isNaN(seoulRent)
    ? seoulRent - selRent
    : null;
  const top5Max = Math.max(0, ...rankings.items.map((item) => (item.median_rent == null ? 0 : item.median_rent)));

  const apply = () => {
    if (selRent == null || !Number.isFinite(selRent)) return;
    onApply(String(selRent));
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-rent-picker-title"
      >
        <div className={styles.head}>
          <div>
            <h2 id="map-rent-picker-title">부산 동네 월세 고르기</h2>
            <p>구·군을 누르면 월세가 보여요. 고른 금액을 계산기에 바로 넣을 수 있어요.</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.stageWrap}>
            <div className={styles.stage}>
              <Map3DCanvas
                rentsById={rentsById}
                rentLoading={districts.loading}
                selectedId={selectedId}
                onSelectId={pickById}
              />
            </div>
          </div>

          <aside className={styles.panel}>
            <label className="stack" style={{ gap: 6 }}>
              <span className="small" style={{ fontWeight: 700 }}>동네 선택</span>
              <select
                className={styles.select}
                value={selectedName || ''}
                onChange={(e) => pickByName(e.target.value || null)}
              >
                <option value="">전체 보기</option>
                {MAP3D_REGIONS.map((r) => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </label>

            {!selectedId ? (
              <p className={styles.guide}>
                지도에서 동네를 고르면 월세 중앙값이 크게 표시돼요. 아래에서 월세가 낮은 동네도 바로 고를 수 있어요.
              </p>
            ) : (
              <div className={styles.rentBlock}>
                <div className={styles.label}>부산 {selectedName} · 월세 중앙값</div>
                {districts.loading ? (
                  <div className="small muted" style={{ marginTop: 8 }}>불러오는 중…</div>
                ) : districts.error ? (
                  <div className="small bad" style={{ marginTop: 8 }}>
                    {districts.error}
                    <button type="button" className="btn-ghost" style={{ marginTop: 6 }} onClick={() => setDistrictRetry((n) => n + 1)}>
                      ↻ 다시 시도
                    </button>
                  </div>
                ) : selRent == null ? (
                  <div className={styles.rentBig} style={{ fontSize: 28 }}>자료 없음</div>
                ) : (
                  <div className={styles.rentBig}>
                    {Math.round(selRent).toLocaleString('ko-KR')}
                    <small>만원</small>
                  </div>
                )}
                {!districts.loading && !districts.error && selCount != null && (
                  <div className={styles.meta}>거래 {formatCount(selCount)} 기준</div>
                )}
              </div>
            )}

            {selectedId && save != null && (
              <div className={styles.compare}>
                서울 월세 <b>{formatRentDisplay(seoulRent)}만원</b> 대비{' '}
                {save >= 0
                  ? <>월 <b>{formatRentDisplay(save)}만원</b> 절약</>
                  : <>월 <b className="bad">{formatRentDisplay(-save)}만원</b> 더 비쌈</>}
              </div>
            )}
            {selectedId && save == null && (
              <div className={styles.compare}>
                계산기에 서울 월세를 넣으면 절약 금액도 같이 보여드려요.
              </div>
            )}

            <div className={styles.top5}>
              <h3>월세 낮은 동네 TOP 5</h3>
              {rankings.loading && <p className="small muted" style={{ margin: 0 }}>불러오는 중…</p>}
              {!rankings.loading && rankings.error && (
                <div>
                  <p className="small bad" style={{ margin: 0 }}>{rankings.error}</p>
                  <button type="button" className="btn-ghost" style={{ marginTop: 4 }} onClick={() => setRankingRetry((n) => n + 1)}>
                    ↻ 다시 시도
                  </button>
                </div>
              )}
              {!rankings.loading && !rankings.error && rankings.items.length > 0 && (
                <ol>
                  {rankings.items.map((item, i) => {
                    const rent = item.median_rent;
                    const width = rent == null || top5Max <= 0 ? 0 : (rent / top5Max) * 100;
                    return (
                      <li key={item.region_code || item.name} onClick={() => pickByName(item.name)}>
                        <span className={styles.rank}>{i + 1}</span>
                        <strong style={{ width: 64 }}>{item.name}</strong>
                        <span className={styles.bar}><span style={{ width: `${width}%` }} /></span>
                        <strong style={{ width: 64, textAlign: 'right' }}>{rentLabel(rent)}</strong>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            <button
              type="button"
              className={`btn btn-grad ${styles.apply}`}
              disabled={selRent == null || !Number.isFinite(selRent)}
              onClick={apply}
            >
              {selectedId ? '이 월세로 계산기에 넣기' : '동네를 먼저 골라 주세요'}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
