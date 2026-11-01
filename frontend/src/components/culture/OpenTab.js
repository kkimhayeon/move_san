'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchCultureEvents } from '@/api/culture';
import { OPEN_CATEGORIES, OPEN_FETCH_SIZE, OPEN_PAGE_SIZE } from '@/constants/culture';
import { filterCultureItemsWithImage } from '@/utils/culture';
import { getUserErrorMessage, isAbortError } from '@/utils/errors';
import EventCard from './EventCard';
import { CultureEmpty, CultureError, CultureLoading, ERROR_MESSAGE } from './CultureStatus';
import styles from './CultureLife.module.css';

export default function OpenTab() {
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({
    loading: true,
    error: null,
    items: [],
  });

  // 카테고리별 전체(또는 충분히 큰 묶음)를 받은 뒤, 이미지 있는 항목만 프론트에서 8개씩 자른다.
  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const selected = OPEN_CATEGORIES.find((c) => c.id === category);
    fetchCultureEvents({
      section: 'open',
      category: selected?.value,
      page: 1,
      page_size: OPEN_FETCH_SIZE,
      signal: controller.signal,
    })
      .then((result) => {
        setState({
          loading: false,
          error: null,
          items: result.items,
        });
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setState({
          loading: false,
          error: getUserErrorMessage(err, ERROR_MESSAGE) || ERROR_MESSAGE,
          items: [],
        });
      });

    return () => controller.abort();
  }, [category, reloadToken]);

  const visibleAll = useMemo(
    () => filterCultureItemsWithImage(state.items),
    [state.items],
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(visibleAll.length / OPEN_PAGE_SIZE)),
    [visibleAll.length],
  );

  // 필터 후 페이지 수가 줄면 현재 페이지를 맞춤
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * OPEN_PAGE_SIZE;
    return visibleAll.slice(start, start + OPEN_PAGE_SIZE);
  }, [visibleAll, page]);

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  );

  const selectCategory = (id) => {
    setCategory(id);
    setPage(1);
  };

  return (
    <div className={styles.panelInner}>
      <div className={styles.openHead}>
        <div className={styles.sectionIntro}>
          <span className={styles.sectionPill}>열린다</span>
          <h2>부산에 살면, 이번 주말엔 여기</h2>
          <p>부산에서 직접 가볼 수 있는 전시·공연·팝업·웰니스만 골랐어요.</p>
        </div>
        <div className={styles.filterRow} role="group" aria-label="행사 카테고리">
          {OPEN_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={category === item.id}
              className={category === item.id ? styles.filterOn : styles.filterOff}
              onClick={() => selectCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {state.loading ? <CultureLoading label="행사를 불러오는 중…" skeletonCount={4} /> : null}
      {!state.loading && state.error ? (
        <CultureError onRetry={() => setReloadToken((n) => n + 1)} />
      ) : null}
      {!state.loading && !state.error && visibleAll.length === 0 ? (
        <CultureEmpty />
      ) : null}

      {!state.loading && !state.error && pageItems.length > 0 ? (
        <>
          <div className={styles.eventGrid}>
            {pageItems.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          {totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="행사 페이지">
              <button
                type="button"
                aria-label="이전 페이지"
                className={styles.circleBtn}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-current={n === page ? 'page' : undefined}
                  className={n === page ? styles.pageOn : styles.pageOff}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                aria-label="다음 페이지"
                className={styles.circleBtn}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </nav>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
