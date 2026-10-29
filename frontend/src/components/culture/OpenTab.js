'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchCultureEvents } from '@/api/culture';
import { OPEN_CATEGORIES, OPEN_PAGE_SIZE } from '@/constants/culture';
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
    total: 0,
    page: 1,
    page_size: OPEN_PAGE_SIZE,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const selected = OPEN_CATEGORIES.find((c) => c.id === category);
    fetchCultureEvents({
      section: 'open',
      category: selected?.value,
      page,
      page_size: OPEN_PAGE_SIZE,
      signal: controller.signal,
    })
      .then((result) => {
        setState({
          loading: false,
          error: null,
          items: result.items,
          total: result.total,
          page: result.page,
          page_size: result.page_size,
        });
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: getUserErrorMessage(err, ERROR_MESSAGE) || ERROR_MESSAGE,
          items: [],
          total: 0,
        }));
      });

    return () => controller.abort();
  }, [category, page, reloadToken]);

  const totalPages = useMemo(() => {
    const size = state.page_size || OPEN_PAGE_SIZE;
    return Math.max(1, Math.ceil((state.total || 0) / size));
  }, [state.total, state.page_size]);

  const selectCategory = (id) => {
    setCategory(id);
    setPage(1);
  };

  return (
    <div className={styles.panelInner}>
      <div className={styles.sectionIntro}>
        <h2>열린다</h2>
        <p className="muted">부산에서 열리는 전시·공연·팝업·웰니스 일정을 살펴보세요.</p>
      </div>

      <div className={`chips filter-chips ${styles.filterRow}`} role="group" aria-label="행사 카테고리">
        {OPEN_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={category === item.id}
            className={category === item.id ? 'chip big on' : 'chip big'}
            onClick={() => selectCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {state.loading ? <CultureLoading label="행사를 불러오는 중…" skeletonCount={4} /> : null}

      {!state.loading && state.error ? (
        <CultureError onRetry={() => setReloadToken((n) => n + 1)} />
      ) : null}

      {!state.loading && !state.error && state.items.length === 0 ? (
        <CultureEmpty />
      ) : null}

      {!state.loading && !state.error && state.items.length > 0 ? (
        <>
          <p className={`small muted ${styles.countLine}`}>
            총 {state.total.toLocaleString('ko-KR')}개의 행사
            {totalPages > 1 ? ` · ${state.page}/${totalPages}페이지` : null}
          </p>
          <div className={styles.eventGrid}>
            {state.items.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          {totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="행사 페이지">
              <button
                type="button"
                className="btn-ghost"
                disabled={state.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                이전
              </button>
              <span className="small muted" aria-current="page">
                {state.page} / {totalPages}
              </span>
              <button
                type="button"
                className="btn-ghost"
                disabled={state.page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                다음
              </button>
            </nav>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
