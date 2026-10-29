'use client';

import { useEffect, useState } from 'react';
import { fetchCultureArticles } from '@/api/culture';
import { MEET_PAGE_SIZE } from '@/constants/culture';
import { getUserErrorMessage, isAbortError } from '@/utils/errors';
import CultureMedia from './CultureMedia';
import { CultureEmpty, CultureError, CultureLoading, ERROR_MESSAGE } from './CultureStatus';
import styles from './CultureLife.module.css';

export default function MeetTab() {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({
    loading: true,
    error: null,
    items: [],
    total: 0,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetchCultureArticles({
      article_type: 'story',
      page: 1,
      page_size: MEET_PAGE_SIZE,
      signal: controller.signal,
    })
      .then((result) => {
        setState({
          loading: false,
          error: null,
          items: result.items,
          total: result.total,
        });
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setState({
          loading: false,
          error: getUserErrorMessage(err, ERROR_MESSAGE) || ERROR_MESSAGE,
          items: [],
          total: 0,
        });
      });

    return () => controller.abort();
  }, [reloadToken]);

  return (
    <div className={styles.panelInner}>
      <div className={styles.sectionIntro}>
        <h2>만난다</h2>
        <p className="muted">사람을 모으고 취향을 잇는 로컬 스토리를 읽어보세요.</p>
      </div>

      {state.loading ? <CultureLoading label="스토리를 불러오는 중…" skeletonCount={2} /> : null}
      {!state.loading && state.error ? (
        <CultureError onRetry={() => setReloadToken((n) => n + 1)} />
      ) : null}
      {!state.loading && !state.error && state.items.length === 0 ? (
        <CultureEmpty />
      ) : null}

      {!state.loading && !state.error && state.items.length > 0 ? (
        <div className={styles.storyGrid}>
          {state.items.map((item) => (
            <article key={item.id} className={styles.storyCard}>
              <CultureMedia
                imagePath={item.image_path}
                alt=""
                credit={item.image_credit}
                badge={item.image_badge}
              />
              <div className={styles.storyBodyWrap}>
                {item.label ? <span className={styles.storyLabel}>{item.label}</span> : null}
                <h3>{item.title}</h3>
                {item.body ? <p className={styles.storyBody}>{item.body}</p> : null}
                {item.links?.length ? (
                  <div className={styles.placeLinks}>
                    {item.links.map((link) => (
                      <a
                        key={`${item.id}-${link.url}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label} ↗
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {!state.loading && !state.error && state.total > state.items.length ? (
        <p className="small muted">
          더 많은 스토리가 있어요. 현재 {state.items.length}개를 표시합니다.
        </p>
      ) : null}
    </div>
  );
}
