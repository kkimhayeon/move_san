'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  fetchCultureArticles,
  fetchCultureEvents,
  fetchCulturePlaces,
} from '@/api/culture';
import {
  STAY_PAGE_SIZE,
  cultureDistrictMapHref,
  isStayBathProgram,
} from '@/constants/culture';
import {
  filterCultureItemsWithImage,
  formatCultureShortEnd,
  safeHttpUrl,
} from '@/utils/culture';
import { getUserErrorMessage, isAbortError } from '@/utils/errors';
import CultureMedia from './CultureMedia';
import { CultureEmpty, CultureError, CultureLoading, ERROR_MESSAGE } from './CultureStatus';
import styles from './CultureLife.module.css';

function emptyResource() {
  return { loading: true, error: null, items: [], total: 0 };
}

export default function StayTab() {
  const [selectedId, setSelectedId] = useState(null);
  const [openNewsId, setOpenNewsId] = useState(null);
  const [placesRetry, setPlacesRetry] = useState(0);
  const [programsRetry, setProgramsRetry] = useState(0);
  const [newsRetry, setNewsRetry] = useState(0);
  const [places, setPlaces] = useState(emptyResource);
  const [programs, setPrograms] = useState(emptyResource);
  const [news, setNews] = useState(emptyResource);

  useEffect(() => {
    const controller = new AbortController();
    setPlaces((prev) => ({ ...prev, loading: true, error: null }));
    fetchCulturePlaces({ page: 1, page_size: STAY_PAGE_SIZE, signal: controller.signal })
      .then((result) => {
        setPlaces({ loading: false, error: null, items: result.items, total: result.total });
        setSelectedId((prev) => {
          if (prev && result.items.some((item) => item.id === prev)) return prev;
          const books = result.items.filter((p) => p.kind === 'bookstore');
          return books[0]?.id ?? result.items[0]?.id ?? null;
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
  }, [placesRetry]);

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
        setPrograms({ loading: false, error: null, items: result.items, total: result.total });
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
        setNews({ loading: false, error: null, items: result.items, total: result.total });
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

  const bookstores = useMemo(
    () => places.items.filter((p) => p.kind === 'bookstore'),
    [places.items],
  );
  const bathhouses = useMemo(
    () => places.items.filter((p) => p.kind === 'bathhouse'),
    [places.items],
  );
  const cinemas = useMemo(
    () => places.items.filter((p) => p.kind === 'cinema'),
    [places.items],
  );
  const spacePrograms = useMemo(
    () => filterCultureItemsWithImage(
      programs.items.filter((event) => !isStayBathProgram(event)),
    ),
    [programs.items],
  );
  const bathPrograms = useMemo(
    () => filterCultureItemsWithImage(
      programs.items.filter((event) => isStayBathProgram(event)),
    ),
    [programs.items],
  );
  const newsWithImage = useMemo(
    () => filterCultureItemsWithImage(news.items),
    [news.items],
  );

  useEffect(() => {
    if (newsWithImage.length === 0) {
      setOpenNewsId(null);
      return;
    }
    setOpenNewsId((prev) => {
      if (prev && newsWithImage.some((item) => item.id === prev)) return prev;
      return newsWithImage[0].id;
    });
  }, [newsWithImage]);

  const selectedBook = bookstores.find((p) => p.id === selectedId)
    || places.items.find((p) => p.id === selectedId)
    || bookstores[0]
    || null;

  const pinnedBooks = bookstores.filter((p) => p.map_x != null && p.map_y != null);
  const rentHref = selectedBook ? cultureDistrictMapHref(selectedBook.district) : null;

  return (
    <div className={styles.stayStack}>
      {/* 독립서점 */}
      <section className={styles.stayBlock} aria-labelledby="stay-bookstore-heading">
        <div className={styles.stayHead}>
          <div className={styles.sectionIntro}>
            <span className={styles.sectionPill}>머문다 · 독립서점</span>
            <h2 id="stay-bookstore-heading">이사 오면, 단골이 될 서점</h2>
          </div>
        </div>

        {places.loading ? <CultureLoading label="공간을 불러오는 중…" skeletonCount={2} /> : null}
        {!places.loading && places.error ? (
          <CultureError onRetry={() => setPlacesRetry((n) => n + 1)} />
        ) : null}
        {!places.loading && !places.error && bookstores.length === 0 ? (
          <CultureEmpty />
        ) : null}

        {!places.loading && !places.error && bookstores.length > 0 ? (
          <div className={styles.bookLayout}>
            <div className={styles.bookMap} aria-label="독립서점 위치 일러스트">
              <BookstoreMapSvg />
              <div className={styles.bookMapBadge}>
                <span className={styles.bookSearchIcon} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
                </span>
                <span className={styles.bookCountPill}>독립서점 {bookstores.length}곳</span>
              </div>
              {pinnedBooks.map((place, index) => {
                const on = place.id === selectedId;
                const n = index + 1;
                return (
                  <button
                    key={place.id}
                    type="button"
                    className={on ? `${styles.bookPin} ${styles.bookPinOn}` : styles.bookPin}
                    style={{ left: `${place.map_x}%`, top: `${place.map_y}%` }}
                    aria-pressed={on}
                    aria-label={place.name}
                    onClick={() => setSelectedId(place.id)}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
                      <path d="M4 21V5" />
                    </svg>
                    <span className={on ? styles.bookPinBadgeOn : styles.bookPinBadge}>{n}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.bookListWrap}>
              <ol className={styles.bookList} aria-label="독립서점 목록">
                {bookstores.map((place, index) => {
                  const on = place.id === (selectedBook?.id);
                  const n = index + 1;
                  return (
                    <li key={place.id}>
                      <button
                        type="button"
                        className={on ? `${styles.bookRow} ${styles.bookRowOn}` : styles.bookRow}
                        aria-pressed={on}
                        onClick={() => setSelectedId(place.id)}
                      >
                        <span className={on ? styles.bookNumOn : styles.bookNum}>{n}</span>
                        <span className={styles.bookRowText}>
                          <span className={styles.bookName}>{place.name}</span>
                          <span className={styles.bookSub}>{place.one_liner}</span>
                        </span>
                        <span className={styles.bookGu}>{place.district}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              {rentHref && selectedBook ? (
                <Link href={rentHref} className={styles.bookCta}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  {selectedBook.name} 근처, {selectedBook.district} 원룸 월세 보기 →
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      {/* 프로그램 / 영화관 하이라이트 */}
      <section className={styles.stayBlock} aria-labelledby="stay-programs-heading">
        <div className={styles.sectionIntro}>
          <span className={styles.sectionPill}>머문다 · 프로그램</span>
          <h2 id="stay-programs-heading">공간에서 이어지는 프로그램</h2>
        </div>
        {programs.loading ? <CultureLoading label="프로그램을 불러오는 중…" skeletonCount={2} /> : null}
        {!programs.loading && programs.error ? (
          <CultureError onRetry={() => setProgramsRetry((n) => n + 1)} />
        ) : null}
        {!programs.loading && !programs.error && spacePrograms.length === 0 && cinemas.length === 0 ? (
          <CultureEmpty />
        ) : null}
        <div className={styles.featureStack}>
          {!programs.loading && !programs.error
            ? spacePrograms.map((event) => {
              const href = safeHttpUrl(event.link_url);
              const end = formatCultureShortEnd(event.start_date, event.end_date);
              const Inner = (
                <>
                  <CultureMedia
                    imagePath={event.image_path}
                    alt={event.title || ''}
                    ratio="thumb"
                    fit="cover"
                  />
                  <span className={styles.featureBody}>
                    <span className={styles.featureTags}>
                      {end ? <span className={styles.featureBadge}>{end}</span> : null}
                      {event.place_name ? <span className={styles.featurePlace}>{event.place_name}</span> : null}
                    </span>
                    <span className={styles.featureTitle}>{event.title}</span>
                    {event.summary ? <span className={styles.featureDesc}>{event.summary}</span> : null}
                  </span>
                  {href ? <span className={styles.featureLink}>자세히 보기 →</span> : null}
                </>
              );
              return href ? (
                <a key={event.id} href={href} target="_blank" rel="noopener noreferrer" className={styles.featureCard}>
                  {Inner}
                </a>
              ) : (
                <div key={event.id} className={styles.featureCard}>{Inner}</div>
              );
            })
            : null}

          {!places.loading && cinemas.map((place) => {
            const href = safeHttpUrl(place.instagram_url) || safeHttpUrl(place.naver_map_url);
            const Inner = (
              <>
                <span className={styles.cinemaThumb} aria-hidden="true">
                  <span className={styles.cinemaScreen} />
                  <span className={styles.cinemaSeats} />
                </span>
                <span className={styles.featureBody}>
                  <span className={styles.featureTags}>
                    <span className={styles.featureBadgeBrand}>독립영화관도 있어요</span>
                    <span className={styles.featurePlace}>
                      {place.name}
                      {place.district ? ` · ${place.district}` : ''}
                    </span>
                  </span>
                  <span className={styles.featureTitle}>{place.name}</span>
                  {place.one_liner ? <span className={styles.featureDesc}>{place.one_liner}</span> : null}
                  {place.experience ? <span className={styles.featureMeta}>{place.experience}</span> : null}
                </span>
                {href ? <span className={styles.featureLink}>상영시간표 확인하기 →</span> : null}
              </>
            );
            return href ? (
              <a key={place.id} href={href} target="_blank" rel="noopener noreferrer" className={styles.featureCard}>
                {Inner}
              </a>
            ) : (
              <div key={place.id} className={styles.featureCard}>{Inner}</div>
            );
          })}
        </div>
      </section>

      {/* 목욕탕 */}
      <section className={styles.stayBlock} aria-labelledby="stay-bath-heading">
        <div className={styles.stayHead}>
          <div className={styles.sectionIntro}>
            <span className={styles.sectionPill}>머문다 · 동네 목욕탕</span>
            <h2 id="stay-bath-heading" className={styles.bathHeading}>몸을 담그면, 부산이 지나온 시간이 보여요</h2>
            <p>지금도 문이 열려 있는, 들어가 볼 수 있는 부산의 역사</p>
          </div>
          <a
            href="https://heypop.kr/n/137127/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.bathReadMore}
          >
            목욕탕으로 부산 읽기 →
          </a>
        </div>
        {!places.loading && !places.error && bathhouses.length === 0 ? (
          <CultureEmpty message="등록된 목욕탕이 없어요." />
        ) : null}
        {!places.loading && !places.error && bathhouses.length > 0 ? (
          <ol className={styles.bathGrid}>
            {bathhouses.map((place, index) => {
              const mapUrl = safeHttpUrl(place.naver_map_url);
              const n = String(index + 1).padStart(2, '0');
              const content = (
                <>
                  <span className={styles.bathIcon} aria-hidden="true">♨</span>
                  <span className={styles.bathText}>
                    <span className={styles.bathTop}>
                      <span className={styles.bathNum}>{n}</span>
                      <span className={styles.bathName}>{place.name}</span>
                      <span className={styles.bathMeta}>
                        {[place.district, place.since_year ? `since ${place.since_year}` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                    {place.one_liner ? <span className={styles.bathLine}>{place.one_liner}</span> : null}
                    {place.experience ? <span className={styles.bathExp}>♨ {place.experience}</span> : null}
                  </span>
                  {mapUrl ? <span className={styles.bathMapBtn}>지도 ↗</span> : null}
                </>
              );
              return (
                <li key={place.id}>
                  {mapUrl ? (
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={styles.bathCard}>
                      {content}
                    </a>
                  ) : (
                    <div className={styles.bathCard}>{content}</div>
                  )}
                </li>
              );
            })}
          </ol>
        ) : null}

        {!programs.loading && !programs.error && bathPrograms.length > 0 ? (
          <div className={styles.bathWalk}>
            <span className={styles.bathWalkLabel}>♨ 목욕탕 따라 걷기</span>
            <div className={styles.bathWalkList}>
              {bathPrograms.map((event) => {
                const href = safeHttpUrl(event.link_url);
                const end = formatCultureShortEnd(event.start_date, event.end_date);
                const Inner = (
                  <>
                    <CultureMedia
                      imagePath={event.image_path}
                      alt={event.title || ''}
                      ratio="thumb"
                      fit="cover"
                      className={styles.bathWalkThumb}
                    />
                    <span className={styles.bathWalkBody}>
                      <span className={styles.featureTags}>
                        {end ? <span className={styles.featureBadgeBrand}>{end}</span> : null}
                        {event.district ? (
                          <span className={styles.bathWalkPlace}>{event.district}</span>
                        ) : null}
                      </span>
                      <span className={styles.bathWalkTitle}>{event.title}</span>
                      {event.summary ? <span className={styles.featureDesc}>{event.summary}</span> : null}
                      {event.place_name ? (
                        <span className={styles.featureMeta}>{event.place_name}</span>
                      ) : null}
                    </span>
                  </>
                );
                return href ? (
                  <a
                    key={event.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.bathWalkCard}
                  >
                    {Inner}
                  </a>
                ) : (
                  <div key={event.id} className={styles.bathWalkCard}>{Inner}</div>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      {/* 로컬 소식 */}
      <section className={styles.newsBlock} aria-label="머문다 · 로컬 소식">
        <div className={styles.newsHead}>
          <span className={styles.sectionPill}>머문다 · 로컬 소식</span>
          <span className={styles.newsHeadSub}>요즘 부산 동네에서 들려오는 소식</span>
        </div>
        {news.loading ? <CultureLoading label="소식을 불러오는 중…" skeletonCount={2} /> : null}
        {!news.loading && news.error ? (
          <CultureError onRetry={() => setNewsRetry((n) => n + 1)} />
        ) : null}
        {!news.loading && !news.error && newsWithImage.length === 0 ? (
          <CultureEmpty />
        ) : null}
        {!news.loading && !news.error && newsWithImage.length > 0 ? (
          <ul className={styles.newsList}>
            {newsWithImage.map((item) => {
              const open = openNewsId === item.id;
              const firstLink = item.links?.[0];
              return (
                <li key={item.id} className={styles.newsItem}>
                  <button
                    type="button"
                    className={styles.newsTrigger}
                    aria-expanded={open}
                    onClick={() => setOpenNewsId(open ? null : item.id)}
                  >
                    {item.badge ? (
                      <span
                        className={styles.newsBadge}
                        style={item.badge_color ? { background: item.badge_color } : undefined}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                    <span className={styles.newsTitle}>{item.title}</span>
                    {item.meta ? <span className={styles.newsMeta}>{item.meta}</span> : null}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className={open ? styles.newsChevronOpen : styles.newsChevron}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {open ? (
                    <div className={styles.newsPanel}>
                      <CultureMedia
                        imagePath={item.image_path}
                        alt=""
                        credit={item.image_credit}
                        ratio="wide"
                        fit="cover"
                      />
                      <div className={styles.newsPanelText}>
                        {item.body ? <p className={styles.newsBody}>{item.body}</p> : null}
                        {firstLink ? (
                          <a
                            href={firstLink.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.newsLink}
                          >
                            소식 읽기 →
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function BookstoreMapSvg() {
  return (
    <svg aria-hidden="true" viewBox="0 0 1072 652" preserveAspectRatio="xMidYMid slice" className={styles.bookMapSvg}>
      <rect width="1072" height="652" fill="#F4F3EF" />
      <path d="M700 652 C 720 560, 790 520, 820 470 C 850 420, 900 400, 960 380 C 1010 365, 1072 360, 1072 360 L1072 652 Z" fill="#CFE2F6" />
      <path d="M560 652 C 575 610, 600 590, 640 585 C 670 580, 690 600, 700 652 Z" fill="#CFE2F6" />
      <ellipse cx="420" cy="420" rx="90" ry="70" fill="#DDEBD3" />
      <ellipse cx="200" cy="140" rx="110" ry="60" fill="#DDEBD3" />
      <ellipse cx="880" cy="110" rx="140" ry="70" fill="#DDEBD3" />
      <path d="M0 260 C 200 250, 380 230, 560 240 S 900 260, 1072 230" stroke="#F6D89A" strokeWidth="16" fill="none" />
      <path d="M0 260 C 200 250, 380 230, 560 240 S 900 260, 1072 230" stroke="#FBE7BC" strokeWidth="10" fill="none" />
      <path d="M330 0 C 340 160, 300 330, 330 652" stroke="#F6D89A" strokeWidth="14" fill="none" />
      <path d="M330 0 C 340 160, 300 330, 330 652" stroke="#FBE7BC" strokeWidth="8" fill="none" />
      <path d="M660 0 C 640 150, 690 320, 640 470 S 600 600, 610 652" stroke="#FFFFFF" strokeWidth="12" fill="none" />
      <path d="M0 470 C 180 450, 300 480, 450 470 S 640 430, 760 470" stroke="#FFFFFF" strokeWidth="10" fill="none" />
      <path d="M100 0 L 160 652 M 480 0 L 520 652 M 0 380 L 640 360 M 0 120 L 1072 150 M 780 0 L 820 420" stroke="#FFFFFF" strokeWidth="6" fill="none" />
      <path d="M60 600 C 240 520, 420 330, 560 300 S 820 230, 1000 120" stroke="#7FA7E0" strokeWidth="3" strokeDasharray="10 6" fill="none" />
      <g fill="#94A3B8" fontFamily="Pretendard, Noto Sans KR, sans-serif" fontSize="15" fontWeight="700">
        <text x="430" y="150">동래구</text>
        <text x="200" y="330">부산진구</text>
        <text x="560" y="330">연제구</text>
        <text x="720" y="420">수영구</text>
        <text x="470" y="560">남구</text>
        <text x="160" y="560">동구</text>
        <text x="880" y="300">해운대구</text>
        <text x="880" y="520" fill="#7FA7E0">수영만</text>
      </g>
    </svg>
  );
}
