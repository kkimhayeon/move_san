import styles from './RouteLoading.module.css';

export default function RouteLoading({ label = '페이지를 불러오는 중…' }) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite" aria-busy="true">
      <div className={styles.bar} aria-hidden="true" />
      <div className={styles.card}>
        <div className={styles.pulse} />
        <div className={styles.lineWide} />
        <div className={styles.line} />
        <p className={styles.label}>{label}</p>
      </div>
    </div>
  );
}
