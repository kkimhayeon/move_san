'use client';

// 생활비 비교 계산기 (F-01 입력) — 서울(지금) vs 부산(이사할 곳)
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { useApp, useNumbers, LABELS } from '@/stores/comparison';
import { 물가비율 } from '@/utils/calc';
import { fmt } from '@/utils/formatMoney';
import styles from './ComparisonForm.module.css';

export const ICONS = {
  pay: 'M3 7h18v12H3z M3 7l3-3h12l3 3 M16 13h2',
  rent: 'M3 11l9-7 9 7 M5 10v10h14V10 M10 20v-6h4v6',
  living: 'M4 8h16l-1.5 11h-13z M8 8V6a4 4 0 0 1 8 0v2',
  transport: 'M6 4h12a2 2 0 0 1 2 2v10H4V6a2 2 0 0 1 2-2z M4 11h16 M7 19v-3 M17 19v-3 M7.5 14h.01 M16.5 14h.01',
};

export function Icon({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const SEOUL = [
  { key: 'seoulPay', icon: 'pay', label: '세후 월급', ph: '예) 380' },
  { key: 'seoulRent', icon: 'rent', label: '월세 (주거비)', ph: '예) 90' },
  { key: 'living', icon: 'living', label: '생활비 (식비, 통신비 등)', ph: '예) 120' },
  { key: 'seoulTransport', icon: 'transport', label: '교통비', ph: '예) 12', optional: true },
];
const BUSAN = [
  { key: 'busanPay', icon: 'pay', label: '세후 월급', ph: '예) 420' },
  { key: 'busanRent', icon: 'rent', label: '월세 (주거비)', ph: '예) 55' },
  { key: 'busanLiving', icon: 'living', label: '생활비 (식비, 통신비 등)', optional: true },
  { key: 'busanTransport', icon: 'transport', label: '교통비', ph: '예) 8', optional: true },
];

export default function ComparisonForm() {
  const router = useRouter();
  const { inputs, setField, reset } = useApp();
  const { values, missing, complete } = useNumbers();
  const [tried, setTried] = useState(false);

  const autoLiving = values.living != null && !Number.isNaN(values.living) ? values.living * 물가비율 : null;

  const placeholder = (f) => {
    if (f.key === 'busanLiving') return autoLiving != null ? `${fmt(autoLiving)} (자동)` : '서울 생활비 입력 시 자동';
    if (f.key === 'busanPay' && inputs.seoulPay) return `예) ${inputs.seoulPay}`;
    return f.ph;
  };

  const renderField = (f) => {
    const err = tried && missing.includes(f.key);
    return (
      <label key={f.key} className={styles.field}>
        <span className={styles.label}>
          <span className={styles.icon}><Icon d={ICONS[f.icon]} /></span>
          {f.label}
          {f.optional && <span className={styles.opt}>선택</span>}
        </span>
        <span className={styles.money}>
          <input
            inputMode="decimal"
            value={inputs[f.key]}
            placeholder={placeholder(f)}
            className={err ? styles.err : ''}
            aria-invalid={err}
            onChange={(e) => setField(f.key, e.target.value.replace(/[^0-9.]/g, ''))}
          />
          <span>만원</span>
        </span>
        {f.key === 'busanLiving' && (
          <span className={styles.hint}>비워두면 서울 생활비 × <b>{물가비율}</b> (부산 물가가 4.8% 낮음)로 계산해요</span>
        )}
        {f.key === 'busanRent' && (
          <span className={styles.hint}>부산 월세를 모르겠다면 <a href={ROUTES.map} style={{ color: 'var(--brand)', fontWeight: 700 }}>동네 지도</a>에서 골라보세요</span>
        )}
      </label>
    );
  };

  const submit = () => {
    setTried(true);
    if (complete) router.push(ROUTES.result);
  };

  return (
    <section className="card lift">
      <div className={styles.head}>
        <h2>생활비 비교 계산기</h2>
        <button className="btn-ghost" onClick={() => { reset(); setTried(false); }}>
          ↺ 초기화
        </button>
      </div>
      <div className={styles.cols}>
        <div className={styles.col}>
          <h3><span className={styles.dot} />서울 <small>지금 살고 있는 곳</small></h3>
          {SEOUL.map(renderField)}
        </div>
        <div className={styles.arrow} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14 M13 6l6 6-6 6" /></svg>
        </div>
        <div className={`${styles.col} ${styles.busan}`}>
          <h3><span className={styles.dot} />부산 <small>이사하려는 곳</small></h3>
          {BUSAN.map(renderField)}
        </div>
      </div>
      <div className={styles.foot}>
        {tried && !complete && (
          <span className="small bad">{missing.map((k) => LABELS[k]).join(', ')}을(를) 입력해 주세요.</span>
        )}
        <button className="btn btn-grad" onClick={submit}>결과 보기 →</button>
        <span className="small muted">금액은 모두 월 기준, 만원 단위로 입력해 주세요.</span>
      </div>
    </section>
  );
}
