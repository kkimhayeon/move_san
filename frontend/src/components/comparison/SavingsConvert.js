'use client';

import styles from './ComparisonResult.module.css';

const COFFEE_UNIT = 4700;

export default function SavingsConvert({ yearlyManwon }) {
  const won = Math.max(0, yearlyManwon) * 10000;
  const count = Math.floor(won / COFFEE_UNIT).toLocaleString('ko-KR');

  return (
    <div className={styles.convert}>
      <div className={styles.convertCopy}>
        <span className={`small ${styles.convertLead}`}>1년에 더 남는 돈이면</span>
        <strong className={styles.convertAmount}>스타벅스 아메리카노(톨) {count}잔 더 마실 수 있어요</strong>
      </div>
    </div>
  );
}
