'use client';

import { useState } from 'react';
import styles from './ComparisonResult.module.css';

const OPTIONS = {
  coffee: { label: '아메리카노', unit: 4700, text: (count) => `스타벅스 아메리카노(톨) ${count}잔`, per: (won) => `하루 ${(won / 365 / 4700).toFixed(1)}잔`, src: '톨 4,700원 기준' },
  jjajang: { label: '짜장면', unit: 6982, text: (count) => `부산 짜장면 ${count}그릇`, per: (won) => `매주 ${(won / 52 / 6982).toFixed(1)}그릇`, src: '부산 6,982원 · 행안부 지방물가 12개월 평균' },
  movie: { label: '영화 관람', unit: 15000, text: (count) => `영화 ${count}편`, per: (won) => `매주 ${(won / 52 / 15000).toFixed(1)}편`, src: '영화관 주말 일반 2D 약 15,000원 (2026.7 기준)' },
};

export default function SavingsConvert({ yearlyManwon }) {
  const [key, setKey] = useState('coffee');
  const option = OPTIONS[key];
  const won = yearlyManwon * 10000;
  const count = Math.floor(won / option.unit).toLocaleString('ko-KR');

  return (
    <div className={`${styles.convert} section`}>
      <span className={`small ${styles.convertLead}`}>1년에 더 남는 돈이면</span>
      <strong className={styles.convertAmount}>{option.text(count)}</strong>
      <span className="small muted">({option.per(won)}) · {option.src}</span>
      <span className={`chips ${styles.convertChips}`}>
        {Object.entries(OPTIONS).map(([id, item]) => (
          <button key={id} type="button" className={key === id ? 'chip on' : 'chip'} onClick={() => setKey(id)}>{item.label}</button>
        ))}
      </span>
    </div>
  );
}
