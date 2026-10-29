'use client';

import { useEffect, useState } from 'react';
import { resolveCultureImageSrc } from '@/utils/culture';
import styles from './CultureLife.module.css';

/**
 * 고정 비율 이미지 영역. NULL·빈 경로·로드 실패 시 placeholder.
 * @param {{
 *   imagePath?: string | null,
 *   alt?: string,
 *   credit?: string | null,
 *   badge?: string | null,
 *   className?: string,
 * }} props
 */
export default function CultureMedia({
  imagePath,
  alt = '',
  credit = null,
  badge = null,
  className = '',
}) {
  const src = resolveCultureImageSrc(imagePath);
  const [failed, setFailed] = useState(false);

  // URL이 바뀌면 이전 로드 실패 상태를 이어가지 않는다.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !failed;

  return (
    <figure className={`${styles.media} ${className}`.trim()}>
      <div className={styles.mediaFrame}>
        {showImage ? (
          <img
            src={src}
            alt={alt}
            className={styles.mediaImg}
            onError={() => setFailed(true)}
          />
        ) : (
          <div className={styles.mediaPlaceholder} aria-hidden={alt ? undefined : true} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="10" r="1.5" />
              <path d="m21 15-5-5L5 19" />
            </svg>
            <span>이미지 준비 중</span>
          </div>
        )}
        {badge ? <span className={styles.mediaBadge}>{badge}</span> : null}
      </div>
      {credit ? <figcaption className={styles.mediaCredit}>{credit}</figcaption> : null}
    </figure>
  );
}
