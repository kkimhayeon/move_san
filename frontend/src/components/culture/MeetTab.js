'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchCultureArticles } from '@/api/culture';
import { MEET_PAGE_SIZE } from '@/constants/culture';
import { filterCultureItemsWithImage } from '@/utils/culture';
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

  const visibleItems = useMemo(
    () => filterCultureItemsWithImage(state.items),
    [state.items],
  );

  return (
    <div className={styles.panelInner}>
      <div className={styles.sectionIntro}>
        <span className={styles.sectionPill}>만난다</span>
        <h2>부산에 오면, 이런 사람들을 만나요</h2>
        <p className={styles.meetLead}>
          도시에 정을 붙이게 하는 건 결국 사람이에요. 부산에서 음악과 공간을 함께 만들어가는 커뮤니티를 소개합니다.
        </p>
      </div>

      {state.loading ? <CultureLoading label="스토리를 불러오는 중…" skeletonCount={2} /> : null}
      {!state.loading && state.error ? (
        <CultureError onRetry={() => setReloadToken((n) => n + 1)} />
      ) : null}
      {!state.loading && !state.error && visibleItems.length === 0 ? (
        <CultureEmpty />
      ) : null}

      {!state.loading && !state.error && visibleItems.length > 0 ? (
        <div className={styles.storyGrid}>
          {visibleItems.map((item) => (
            <article key={item.id} className={styles.storyCard}>
              <CultureMedia
                imagePath={item.image_path}
                alt={item.title || ''}
                credit={item.image_badge ? null : item.image_credit}
                badge={item.image_badge || item.image_credit}
                badgeTone={item.image_badge ? 'brand' : 'dark'}
                ratio="story"
                fit="cover"
              />
              {item.label ? <span className={styles.storyLabel}>{item.label}</span> : null}
              <h3 className={styles.storyTitle}>{item.title}</h3>
              {item.body ? <p className={styles.storyBody}>{item.body}</p> : null}
              {item.links?.length ? (
                <div className={styles.storyLinks}>
                  {item.links.map((link) => (
                    <a
                      key={`${item.id}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label} →
                    </a>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
