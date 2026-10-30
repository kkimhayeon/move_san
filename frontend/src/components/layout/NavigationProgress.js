'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './NavigationProgress.module.css';

function isInternalHref(href) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }
  try {
    if (href.startsWith('http://') || href.startsWith('https://')) {
      const url = new URL(href);
      return url.origin === window.location.origin;
    }
  } catch {
    return false;
  }
  return href.startsWith('/');
}

/** 내부 Link 클릭 직후 상단 진행 표시 — 화면 전환 피드백 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setActive(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    const onClick = (event) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = event.target.closest?.('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      if (!isInternalHref(anchor.getAttribute('href'))) return;

      const nextPath = (() => {
        try {
          return new URL(anchor.href).pathname;
        } catch {
          return null;
        }
      })();
      if (!nextPath || nextPath === window.location.pathname) return;

      setActive(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setActive(false), 8000);
    };

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!active) return null;

  return (
    <div className={styles.track} role="progressbar" aria-label="페이지 이동 중" aria-valuemin={0} aria-valuemax={100}>
      <div className={styles.bar} />
    </div>
  );
}
