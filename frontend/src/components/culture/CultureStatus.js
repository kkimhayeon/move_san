'use client';

import styles from './CultureLife.module.css';

const ERROR_MESSAGE = '콘텐츠를 불러오지 못했어요. 다시 시도해 주세요.';
const EMPTY_MESSAGE = '조건에 맞는 콘텐츠가 없어요.';

export function CultureLoading({ label = '콘텐츠를 불러오는 중…', skeletonCount = 3 }) {
  return (
    <div className={styles.statusStack} aria-busy="true" aria-live="polite">
      <p className={`small muted ${styles.statusText}`}>{label}</p>
      <div className={styles.skeletonGrid}>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
    </div>
  );
}

export function CultureError({ onRetry, message = ERROR_MESSAGE }) {
  return (
    <div className={`card ${styles.statusBox} stack`}>
      <p className="bad" role="alert" style={{ margin: 0 }}>{message}</p>
      {onRetry ? (
        <button type="button" className="btn-ghost" onClick={onRetry}>↻ 다시 시도</button>
      ) : null}
    </div>
  );
}

export function CultureEmpty({ message = EMPTY_MESSAGE }) {
  return <div className={`card ${styles.statusBox} muted`}>{message}</div>;
}

export { ERROR_MESSAGE, EMPTY_MESSAGE };
