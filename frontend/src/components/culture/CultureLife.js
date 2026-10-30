'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  COVER_SLIDES,
  CULTURE_DEFAULT_TAB,
  CULTURE_TABS,
  PROMO_BANNER,
} from '@/constants/culture';
import Hero from '@/components/common/Hero';
import { safeHttpUrl } from '@/utils/culture';
import MeetTab from './MeetTab';
import OpenTab from './OpenTab';
import StayTab from './StayTab';
import styles from './CultureLife.module.css';

export default function CultureLife() {
  const [tab, setTab] = useState(CULTURE_DEFAULT_TAB);
  const [visited, setVisited] = useState(() => ({ [CULTURE_DEFAULT_TAB]: true }));
  const [slide, setSlide] = useState(0);
  const tabRefs = useRef([]);

  useEffect(() => {
    setVisited((prev) => (prev[tab] ? prev : { ...prev, [tab]: true }));
  }, [tab]);

  const focusTab = useCallback((index) => {
    const next = CULTURE_TABS[index];
    if (!next) return;
    setTab(next.id);
    tabRefs.current[index]?.focus();
  }, []);

  const onTabKeyDown = (event, index) => {
    const last = CULTURE_TABS.length - 1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      focusTab(index === last ? 0 : index + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusTab(index === 0 ? last : index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusTab(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusTab(last);
    }
  };

  const current = COVER_SLIDES[slide] || COVER_SLIDES[0];
  const coverHref = safeHttpUrl(current?.url);

  return (
    <>
      <Hero
        compact
        eyebrow="MOVESAN · CULTURE"
        title={<>LIVE LOCAL,<br /><em>FEEL BUSAN</em></>}
        subtitle={<>이사를 결정하기 전에, <strong>부산에서의 하루</strong>를 먼저 살아보세요.</>}
      />
      <div className={styles.pageRoot}>
      <div className={`${styles.main} lift`}>
        <section className={styles.cover} aria-label="커버 스토리">
          {coverHref ? (
            <a
              href={coverHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.coverHero} ${styles.msCard}`}
              style={{ background: current.bg }}
            >
              <CoverVisual slide={current} />
            </a>
          ) : (
            <div className={styles.coverHero} style={{ background: current.bg }}>
              <CoverVisual slide={current} />
            </div>
          )}

          <aside className={styles.coverAside}>
            <div className={styles.coverThumbs}>
              <span className={styles.coverAsideTitle}>이번 호 커버</span>
              {COVER_SLIDES.map((item, index) => {
                const on = index === slide;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.coverThumbBtn}
                    onClick={() => setSlide(index)}
                    aria-current={on ? 'true' : undefined}
                  >
                    <span className={on ? styles.coverNumOn : styles.coverNum}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={styles.coverThumbText}>
                      <span className={styles.coverThumbCat}>{item.cat}</span>
                      <span className={on ? styles.coverThumbTitleOn : styles.coverThumbTitle}>
                        {item.title}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className={styles.coverNav}>
              <button
                type="button"
                aria-label="이전 커버"
                className={styles.circleBtn}
                onClick={() => setSlide((prev) => (prev + COVER_SLIDES.length - 1) % COVER_SLIDES.length)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              <span className={styles.coverCounter}>{slide + 1} / {COVER_SLIDES.length}</span>
              <button
                type="button"
                aria-label="다음 커버"
                className={styles.circleBtn}
                onClick={() => setSlide((prev) => (prev + 1) % COVER_SLIDES.length)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </div>
          </aside>
        </section>

        {PROMO_BANNER.enabled ? (
          <aside className={styles.promo} aria-label="홍보 배너">
            <strong>{PROMO_BANNER.title}</strong>
            <p>{PROMO_BANNER.body}</p>
          </aside>
        ) : null}

        <div
          className={styles.bigTabs}
          role="tablist"
          aria-label="컬처라이프 섹션"
        >
          {CULTURE_TABS.map((item, index) => {
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                ref={(el) => { tabRefs.current[index] = el; }}
                type="button"
                role="tab"
                id={item.tabId}
                aria-selected={selected}
                aria-controls={item.panelId}
                tabIndex={selected ? 0 : -1}
                className={selected ? `${styles.bigTab} ${styles.bigTabOn}` : styles.bigTab}
                onClick={() => setTab(item.id)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {CULTURE_TABS.map((item) => {
          const selected = tab === item.id;
          if (!visited[item.id]) return null;
          return (
            <div
              key={item.id}
              role="tabpanel"
              id={item.panelId}
              aria-labelledby={item.tabId}
              hidden={!selected}
              className={styles.sectionCard}
            >
              {item.id === 'open' ? <OpenTab /> : null}
              {item.id === 'stay' ? <StayTab /> : null}
              {item.id === 'meet' ? <MeetTab /> : null}
            </div>
          );
        })}
      </div>
      </div>
    </>
  );
}

function CoverVisual({ slide }) {
  return (
    <>
      <div className={styles.coverImgLayer}>
        {slide.img ? (
          <img src={slide.img} alt="" className={styles.coverImg} />
        ) : null}
      </div>
      <div className={styles.coverGrad} />
      <span className={styles.coverCat}>{slide.cat}</span>
      {slide.credit ? <span className={styles.coverCredit}>{slide.credit}</span> : null}
      <div className={styles.coverCaption}>
        <span className={styles.coverTitle}>{slide.title}</span>
        <span className={styles.coverSub}>{slide.sub}</span>
      </div>
    </>
  );
}
