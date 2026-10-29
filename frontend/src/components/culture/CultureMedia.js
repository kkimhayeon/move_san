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
 *   badgeTone?: 'light' | 'dark' | 'brand',
 *   fit?: 'cover' | 'contain',
 *   ratio?: 'poster' | 'wide' | 'story' | 'thumb',
 *   className?: string,
 * }} props
 */
export default function CultureMedia({
  imagePath,
  alt = '',
  credit = null,
  badge = null,
  badgeTone = 'light',
  fit = 'cover',
  ratio = 'poster',
  className = '',
}) {
  const src = resolveCultureImageSrc(imagePath);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !failed;
  const frameClass = [
    styles.mediaFrame,
    ratio === 'wide' ? styles.mediaWide : null,
    ratio === 'story' ? styles.mediaStory : null,
    ratio === 'thumb' ? styles.mediaThumb : null,
    ratio === 'poster' ? styles.mediaPoster : null,
    className,
  ].filter(Boolean).join(' ');

  return (
    <figure className={styles.media}>
      <div className={frameClass}>
        {showImage ? (
          fit === 'contain' ? (
            <div className={styles.mediaContainWrap}>
              <img
                src={src}
                alt=""
                aria-hidden="true"
                className={styles.mediaBlur}
                onError={() => setFailed(true)}
              />
              <img
                src={src}
                alt={alt}
                className={styles.mediaContain}
                onError={() => setFailed(true)}
              />
            </div>
          ) : (
            <img
              src={src}
              alt={alt}
              className={styles.mediaCover}
              onError={() => setFailed(true)}
            />
          )
        ) : (
          <div
            className={styles.mediaPlaceholder}
            aria-hidden={alt ? undefined : true}
            role={alt ? 'img' : undefined}
            aria-label={alt || undefined}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#A9C3EA" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="2" />
              <path d="M21 17l-5-5-9 8" />
            </svg>
          </div>
        )}
        {badge ? (
          <span
            className={
              badgeTone === 'brand'
                ? styles.mediaBadgeBrand
                : badgeTone === 'dark'
                  ? styles.mediaBadgeDark
                  : styles.mediaBadgeLight
            }
          >
            {badge}
          </span>
        ) : null}
        {credit && showImage ? (
          <span className={styles.mediaCreditOnImg}>{credit}</span>
        ) : null}
      </div>
    </figure>
  );
}
