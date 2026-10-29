'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  fetchCultureArticles,
  fetchCultureEvents,
  fetchCulturePlaces,
} from '@/api/culture';
import {
  PLACE_KINDS,
  PLACE_KIND_LABELS,
  STAY_PAGE_SIZE,
  cultureDistrictMapHref,
} from '@/constants/culture';
import { getUserErrorMessage, isAbortError } from '@/utils/errors';
import EventCard from './EventCard';
import { CultureEmpty, CultureError, CultureLoading, ERROR_MESSAGE } from './CultureStatus';
import styles from './CultureLife.module.css';

function emptyResource() {
  return { loading: true, error: null, items: [], total: 0 };
}

export default function StayTab() {
  const [kind, setKind] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [placesRetry, setPlacesRetry] = useState(0);
  const [programsRetry, setProgramsRetry] = useState(0);
  const [newsRetry, setNewsRetry] = useState(0);
  const [places, setPlaces] = useState(emptyResource);
  const [programs, setPrograms] = useState(emptyResource);
  const [news, setNews] = useState(emptyResource);
  const [openNewsId, setOpenNewsId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setPlaces((prev) => ({ ...prev, loading: true, error: null }));

    const selected = PLACE_KINDS.find((k) => k.id === kind);
    fetchCulturePlaces({
      kind: selected?.value,
      page: 1,
      page_size: STAY_PAGE_SIZE,
      signal: controller.signal,
    })
      .then((result) => {
        setPlaces({
          loading: false,
          error: null,
          items: result.items,
          total: result.total,
        });
        setSelectedId((prev) => {
          if (prev && result.items.some((item) => item.id === prev)) return prev;
          return result.items[0]?.id ?? null;
        });
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setPlaces({
          loading: false,
          error: getUserErrorMessage(err, ERROR_MESSAGE) || ERROR_MESSAGE,
          items: [],
          total: 0,
        });
        setSelectedId(null);
      });

    return () => controller.abort();
  }, [kind, placesRetry]);

  useEffect(() => {
    const controller = new AbortController();
    setPrograms((prev) => ({ ...prev, loading: true, error: null }));

    fetchCultureEvents({
      section: 'stay',
      page: 1,
      page_size: STAY_PAGE_SIZE,
      signal: controller.signal,
    })
      .then((result) => {
        setPrograms({
          loading: false,
          error: null,
          items: result.items,
          total: result.total,
        });
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setPrograms({
          loading: false,
          error: getUserErrorMessage(err, ERROR_MESSAGE) || ERROR_MESSAGE,
          items: [],
          total: 0,
        });
      });

    return () => controller.abort();
  }, [programsRetry]);

  useEffect(() => {
    const controller = new AbortController();
    setNews((prev) => ({ ...prev, loading: true, error: null }));

    fetchCultureArticles({
      article_type: 'news',
      page: 1,
      page_size: STAY_PAGE_SIZE,
      signal: controller.signal,
    })
      .then((result) => {
        setNews({
          loading: false,
          error: null,
          items: result.items,
          total: result.total,
        });
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setNews({
          loading: false,
          error: getUserErrorMessage(err, ERROR_MESSAGE) || ERROR_MESSAGE,
          items: [],
          total: 0,
        });
      });

    return () => controller.abort();
  }, [newsRetry]);

  // 프로그램·소식은 마운트 시 병렬 요청 (위 두 effect가 동시에 시작)
  const pinnedPlaces = useMemo(
    () => places.items.filter((p) => p.map_x != null && p.map_y != null),
    [places.items],
  );

  return (
    <div className={styles.panelInner}>
      <div className={styles.sectionIntro}>
        <h2>머문다</h2>
        <p className="muted">책방·온천·극장처럼 다시 찾고 싶은 공간과 프로그램을 모았어요.</p>
      </div>

      <div className={`chips filter-chips ${styles.filterRow}`} role="group" aria-label="공간 종류">
        {PLACE_KINDS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={kind === item.id}
            className={kind === item.id ? 'chip big on' : 'chip big'}
            onClick={() => setKind(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className={styles.staySection} aria-labelledby="stay-places-heading">
        <div className="section-head">
          <h3 id="stay-places-heading">공간</h3>
          {!places.loading && !places.error ? (
            <span className="small muted">{places.total.toLocaleString('ko-KR')}곳</span>
          ) : null}
        </div>

        {places.loading ? <CultureLoading label="공간을 불러오는 중…" skeletonCount={2} /> : null}
        {!places.loading && places.error ? (
          <CultureError onRetry={() => setPlacesRetry((n) => n + 1)} />
        ) : null}
        {!places.loading && !places.error && places.items.length === 0 ? (
          <CultureEmpty />
        ) : null}

        {!places.loading && !places.error && places.items.length > 0 ? (
          <div className={styles.placeLayout}>
            <div className={styles.placeMap} aria-label="공간 위치 일러스트">
              <div className={styles.placeMapCanvas}>
                {pinnedPlaces.map((place) => {
                  const on = place.id === selectedId;
                  return (
                    <button
                      key={place.id}
                      type="button"
                      className={`${styles.placePin}${on ? ` ${styles.placePinOn}` : ''}`}
                      style={{ left: `${place.map_x}%`, top: `${place.map_y}%` }}
                      aria-pressed={on}
                      aria-label={place.name}
                      onClick={() => setSelectedId(place.id)}
                    >
                      <span />
                    </button>
                  );
                })}
              </div>
              <p className="small muted">
                좌표가 있는 공간만 지도에 표시돼요. 목록에서는 모든 공간을 볼 수 있어요.
              </p>
            </div>

            <ul className={styles.placeList}>
              {places.items.map((place) => {
                const on = place.id === selectedId;
                const kindLabel = place.kind ? (PLACE_KIND_LABELS[place.kind] || place.kind) : null;
                const mapHref = cultureDistrictMapHref(place.district);
                return (
                  <li key={place.id}>
                    <button
                      type="button"
                      className={`${styles.placeItem}${on ? ` ${styles.placeItemOn}` : ''}`}
                      aria-pressed={on}
                      onClick={() => setSelectedId(place.id)}
                    >
                      <div className={styles.placeItemTop}>
                        <strong>{place.name}</strong>
                        {kindLabel ? <span className="tag">{kindLabel}</span> : null}
                      </div>
                      {place.one_liner ? <p>{place.one_liner}</p> : null}
                      <div className={styles.placeItemMeta}>
                        {place.district ? <span>{place.district}</span> : null}
                        {place.since_year ? <span>since {place.since_year}</span> : null}
                      </div>
                    </button>
                    {on ? (
                      <div className={styles.placeDetail}>
                        {place.experience ? <p className="small muted">{place.experience}</p> : null}
                        <div className={styles.placeLinks}>
                          {place.naver_map_url ? (
                            <a href={place.naver_map_url} target="_blank" rel="noopener noreferrer">네이버 지도 ↗</a>
                          ) : null}
                          {place.instagram_url ? (
                            <a href={place.instagram_url} target="_blank" rel="noopener noreferrer">Instagram ↗</a>
                          ) : null}
                          {mapHref ? (
                            <Link href={mapHref}>이 동네 월세 보기 →</Link>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </section>

      <section className={styles.staySection} aria-labelledby="stay-programs-heading">
        <div className="section-head">
          <h3 id="stay-programs-heading">공간 프로그램</h3>
        </div>
        {programs.loading ? <CultureLoading label="프로그램을 불러오는 중…" skeletonCount={2} /> : null}
        {!programs.loading && programs.error ? (
          <CultureError onRetry={() => setProgramsRetry((n) => n + 1)} />
        ) : null}
        {!programs.loading && !programs.error && programs.items.length === 0 ? (
          <CultureEmpty />
        ) : null}
        {!programs.loading && !programs.error && programs.items.length > 0 ? (
          <div className={styles.eventGrid}>
            {programs.items.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : null}
        {!programs.loading && !programs.error && programs.total > programs.items.length ? (
          <p className="small muted">
            서버에 더 많은 프로그램이 있어요. 현재 {programs.items.length}개를 표시합니다.
          </p>
        ) : null}
      </section>

      <section className={styles.staySection} aria-labelledby="stay-news-heading">
        <div className="section-head">
          <h3 id="stay-news-heading">로컬 소식</h3>
        </div>
        {news.loading ? <CultureLoading label="소식을 불러오는 중…" skeletonCount={2} /> : null}
        {!news.loading && news.error ? (
          <CultureError onRetry={() => setNewsRetry((n) => n + 1)} />
        ) : null}
        {!news.loading && !news.error && news.items.length === 0 ? (
          <CultureEmpty />
        ) : null}
        {!news.loading && !news.error && news.items.length > 0 ? (
          <div className={styles.accordion}>
            {news.items.map((item) => {
              const open = openNewsId === item.id;
              return (
                <div key={item.id} className={styles.accordionItem}>
                  <button
                    type="button"
                    className={styles.accordionTrigger}
                    aria-expanded={open}
                    onClick={() => setOpenNewsId(open ? null : item.id)}
                  >
                    <span className={styles.accordionTitleBlock}>
                      {item.badge ? (
                        <span
                          className={styles.newsBadge}
                          style={item.badge_color ? { background: item.badge_color } : undefined}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                      <strong>{item.title}</strong>
                      {item.meta ? <span className="small muted">{item.meta}</span> : null}
                    </span>
                    <span aria-hidden="true">{open ? '−' : '+'}</span>
                  </button>
                  {open ? (
                    <div className={styles.accordionPanel}>
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
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}
