'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { welcomePack } from '@/data/welcomePack';
import WelcomePackModal from './WelcomePackModal';
import styles from './WelcomePackBanner.module.css';

const HIDDEN_KEY = 'movesan-welcome-pack-hidden';

function readHidden() {
  try {
    return window.localStorage.getItem(HIDDEN_KEY) === '1';
  } catch {
    return false;
  }
}

function writeHidden(hidden) {
  try {
    if (hidden) window.localStorage.setItem(HIDDEN_KEY, '1');
    else window.localStorage.removeItem(HIDDEN_KEY);
  } catch {
    // 저장이 막혀 있어도 이번 화면의 켜기·끄기는 동작한다.
  }
}

function BannerSwitch({ pressed, onToggle, buttonRef }) {
  return (
    <button
      ref={buttonRef}
      type="button"
      role="switch"
      aria-checked={pressed}
      aria-label={welcomePack.toggleLabel}
      className={pressed ? `${styles.switch} ${styles.switchOn}` : styles.switch}
      onClick={onToggle}
    >
      <span className={styles.knob} aria-hidden="true" />
    </button>
  );
}

export default function WelcomePackBanner() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);
  const switchRef = useRef(null);
  const pendingFocus = useRef(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setHidden(readHidden());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !pendingFocus.current) return;
    pendingFocus.current = false;
    switchRef.current?.focus();
  }, [hidden, ready]);

  const toggle = useCallback(() => {
    const nextHidden = !hidden;
    writeHidden(nextHidden);
    pendingFocus.current = true;
    if (nextHidden) setOpen(false);
    setHidden(nextHidden);
  }, [hidden]);

  if (!ready) return null;

  if (hidden) {
    return (
      <aside className={styles.collapsed} aria-label={welcomePack.name}>
        <p className={styles.collapsedTitle}>{welcomePack.name}</p>
        <BannerSwitch pressed={false} onToggle={toggle} buttonRef={switchRef} />
      </aside>
    );
  }

  return (
    <>
      <aside className={styles.banner} aria-label={welcomePack.name}>
        <div className={styles.head}>
          <span className={styles.badge}>{welcomePack.badge}</span>
          <BannerSwitch pressed onToggle={toggle} buttonRef={switchRef} />
        </div>
        <div className={styles.copy}>
          <h2 className={styles.title}>{welcomePack.name}</h2>
          <p className={styles.summary}>{welcomePack.summary}</p>
          <ul className={styles.highlights}>
            {welcomePack.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <button type="button" className={`btn ${styles.open}`} onClick={() => setOpen(true)}>
          {welcomePack.openLabel}
        </button>
        <p className={styles.note}>{welcomePack.bannerNote}</p>
      </aside>
      {open ? <WelcomePackModal onClose={close} /> : null}
    </>
  );
}
