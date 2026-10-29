'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Hero from '@/components/common/Hero';
import {
  COVER_SLIDES,
  CULTURE_DEFAULT_TAB,
  CULTURE_TABS,
  PROMO_BANNER,
} from '@/constants/culture';
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

  useEffect(() => {
    if (COVER_SLIDES.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setSlide((prev) => (prev + 1) % COVER_SLIDES.length);
    }, 5600);
    return () => window.clearInterval(timer);
  }, []);

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

  const currentSlide = COVER_SLIDES[slide] || COVER_SLIDES[0];

  return (
    <>
      <Hero
        compact
        eyebrow="CULTURE LIFE"
        title={<>Live Local,<br /><em>Feel Busan</em></>}
        subtitle="축제와 공연, 동네 공간과 사람들의 이야기로 부산의 일상을 소개해요."
      />

      <div className="page">
        <div className={`lift stack ${styles.shell}`}>
          <section
            className={styles.cover}
            style={{ '--cover-accent': currentSlide.accent }}
            aria-roledescription="carousel"
            aria-label="컬처라이프 커버"
          >
            <div className={styles.coverInner} key={currentSlide.id}>
              <span className={styles.coverEyebrow}>{currentSlide.eyebrow}</span>
              <h2 className={styles.coverTitle}>{currentSlide.title}</h2>
              <p className={styles.coverBody}>{currentSlide.body}</p>
            </div>
            {COVER_SLIDES.length > 1 ? (
              <div className={styles.coverDots} role="tablist" aria-label="커버 슬라이드">
                {COVER_SLIDES.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={slide === index}
                    aria-label={`${index + 1}번째 슬라이드`}
                    className={slide === index ? styles.coverDotOn : styles.coverDot}
                    onClick={() => setSlide(index)}
                  />
                ))}
              </div>
            ) : null}
          </section>

          {PROMO_BANNER.enabled ? (
            <aside className={styles.promo} aria-label="홍보 배너">
              <strong>{PROMO_BANNER.title}</strong>
              <p>{PROMO_BANNER.body}</p>
            </aside>
          ) : null}

          <div className={styles.tabShell}>
            <div
              className={styles.tabList}
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
                    className={selected ? `${styles.tab} ${styles.tabOn}` : styles.tab}
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
                  className={styles.tabPanel}
                >
                  {item.id === 'open' ? <OpenTab /> : null}
                  {item.id === 'stay' ? <StayTab /> : null}
                  {item.id === 'meet' ? <MeetTab /> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
