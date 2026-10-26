'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { missingPrompt, useComparisonInputs, useNumbers } from '@/stores/comparison';
import { 물가비율, 부산물가절감률 } from '@/utils/calc';
import { sanitizeMoney } from '@/utils/moneyInput';
import { BUSAN_FIELDS, FieldIcon, SEOUL_FIELDS } from './fields';
import styles from './ComparisonForm.module.css';

function placeholderFor(field, inputs) {
  if (field.mirror && inputs[field.mirror]) return `예) ${inputs[field.mirror]}`;
  return field.placeholder;
}

function FieldHint({ hint }) {
  if (hint === 'livingRatio') {
    return <span className={styles.hint}>부산 생활비는 이 금액 × <b>{물가비율}</b> (부산 물가가 {부산물가절감률}% 낮음)로 계산해서 결과에 보여줘요</span>;
  }
  if (hint === 'map') {
    return (
      <span className={styles.hint}>
        부산 월세를 모르겠다면 <Link href={ROUTES.map} className={styles.mapLink}>동네 지도</Link>에서 골라보세요
      </span>
    );
  }
  return null;
}

function MoneyField({ field, inputs, invalid, onChange }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>
        <span className={styles.icon}><FieldIcon name={field.icon} /></span>
        {field.label}
      </span>
      <span className={styles.money}>
        <input
          inputMode="decimal"
          value={inputs[field.key] ?? ''}
          placeholder={placeholderFor(field, inputs)}
          className={invalid ? styles.err : ''}
          aria-invalid={invalid}
          onChange={(event) => onChange(field.key, sanitizeMoney(event.target.value))}
        />
        <span>만원</span>
      </span>
      <FieldHint hint={field.hint} />
    </label>
  );
}

function CityColumn({ title, place, fields, busan, ...fieldProps }) {
  return (
    <div className={busan ? `${styles.col} ${styles.busan}` : styles.col}>
      <h3><span className={styles.dot} />{title} <small>{place}</small></h3>
      {fields.map((field) => (
        <MoneyField key={field.key} field={field} invalid={fieldProps.tried && fieldProps.missing.includes(field.key)} {...fieldProps} />
      ))}
    </div>
  );
}

export default function ComparisonForm() {
  const router = useRouter();
  const { inputs, setField, reset } = useComparisonInputs();
  const { missing, complete } = useNumbers();
  const [tried, setTried] = useState(false);
  const fieldProps = { inputs, tried, missing, onChange: setField };

  const submit = () => {
    setTried(true);
    if (complete) router.push(ROUTES.result);
  };

  return (
    <section className="card lift">
      <div className={styles.head}>
        <h2>생활비 비교 계산기</h2>
        <button type="button" className="btn-ghost" onClick={() => { reset(); setTried(false); }}>↺ 초기화</button>
      </div>
      <div className={styles.cols}>
        <CityColumn title="서울" place="지금 살고 있는 곳" fields={SEOUL_FIELDS} {...fieldProps} />
        <div className={styles.arrow} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14 M13 6l6 6-6 6" /></svg>
        </div>
        <CityColumn title="부산" place="이사하려는 곳" fields={BUSAN_FIELDS} busan {...fieldProps} />
      </div>
      <div className={styles.foot}>
        {tried && !complete && <span className="small bad">{missingPrompt(missing)}</span>}
        <button type="button" className="btn btn-grad" onClick={submit}>결과 보기 →</button>
        <span className="small muted">금액은 모두 월 기준, 만원 단위로 입력해 주세요.</span>
      </div>
    </section>
  );
}
