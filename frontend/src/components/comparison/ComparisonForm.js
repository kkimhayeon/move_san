'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { fetchComparison, toComparisonBody } from '@/api/comparison';
import { ROUTES } from '@/constants/routes';
import {
  missingPrompt,
  useComparisonInputs,
  useNumbers,
} from '@/stores/comparison';
import { 물가비율, 부산물가절감률 } from '@/utils/calc';
import { getUserErrorMessage, isAbortError } from '@/utils/errors';
import { sanitizeMoney } from '@/utils/moneyInput';
import { BUSAN_FIELDS, FieldIcon, SEOUL_FIELDS } from './fields';
import styles from './ComparisonForm.module.css';

const MapRentPickerModal = dynamic(() => import('./MapRentPickerModal'), {
  ssr: false,
});

function placeholderFor(field, inputs) {
  if (field.mirror && inputs[field.mirror]) {
    return `예) ${inputs[field.mirror]}`;
  }

  return field.placeholder;
}

function FieldHint({ hint, onOpenMap }) {
  if (hint === 'livingRatio') {
    return (
      <span className={styles.hint}>
        부산 생활비는 이 금액 × <b>{물가비율}</b> (부산 물가가{' '}
        {부산물가절감률}% 낮음)로 계산해서 결과에 보여줘요
      </span>
    );
  }

  if (hint === 'map') {
    return (
      <span className={styles.hint}>
        부산 월세를 모르겠다면{' '}
        <button type="button" className={styles.mapLink} onClick={onOpenMap}>
          동네 지도
        </button>
        에서 골라보세요
      </span>
    );
  }

  return null;
}

function MoneyField({ field, inputs, invalid, onChange, onOpenMap }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>
        <span className={styles.icon}>
          <FieldIcon name={field.icon} />
        </span>
        {field.label}
      </span>

      <span className={styles.money}>
        <input
          inputMode="decimal"
          value={inputs[field.key] ?? ''}
          placeholder={placeholderFor(field, inputs)}
          className={invalid ? styles.err : ''}
          aria-invalid={invalid}
          onChange={(event) =>
            onChange(field.key, sanitizeMoney(event.target.value))
          }
        />
        <span>만원</span>
      </span>

      <FieldHint hint={field.hint} onOpenMap={onOpenMap} />
    </label>
  );
}

function CityColumn({ title, description, fields, busan, ...fieldProps }) {
  return (
    <div className={busan ? `${styles.col} ${styles.busan}` : styles.col}>
      <h3>
        <span className={styles.dot} />
        {title}
      </h3>

      <p className={styles.description}>{description}</p>

      {fields.map((field) => (
        <MoneyField
          key={field.key}
          field={field}
          invalid={
            fieldProps.tried && fieldProps.missing.includes(field.key)
          }
          {...fieldProps}
        />
      ))}
    </div>
  );
}

export default function ComparisonForm() {
  const router = useRouter();
  const {
    inputs,
    setField,
    beginCompare,
    setResult,
    setCompareError,
    reset,
  } = useComparisonInputs();
  const { values, missing, complete } = useNumbers();

  const [tried, setTried] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);

  const fieldProps = {
    inputs,
    tried,
    missing,
    onOpenMap: () => setMapOpen(true),
    onChange: (key, value) => {
      setError(null);
      setField(key, value);
    },
  };

  const submit = async (event) => {
    event.preventDefault();
    setTried(true);
    setError(null);

    if (!complete || loading) return;

    // 화면은 즉시 전환하고, API는 결과 페이지에서 스켈레톤으로 대기
    beginCompare();
    setLoading(true);
    router.push(ROUTES.result);

    try {
      const data = await fetchComparison(toComparisonBody(values));
      setResult(data.result);
    } catch (err) {
      if (!isAbortError(err)) {
        const message = getUserErrorMessage(
          err,
          '생활비 계산에 실패했어요. 잠시 후 다시 시도해 주세요.',
        );
        setCompareError(message);
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="card lift">
        <form onSubmit={submit}>
          <div className={styles.head}>
            <h2>생활비 비교 계산기</h2>

            <button
              type="button"
              className="btn-ghost"
              disabled={loading}
              onClick={() => {
                reset();
                setTried(false);
                setError(null);
              }}
            >
              ↺ 초기화
            </button>
          </div>

          <div className={styles.cols}>
            <CityColumn
              title="서울"
              description="현재 살고 있는 곳의 정보를 기준으로 입력해주세요."
              fields={SEOUL_FIELDS}
              {...fieldProps}
            />

            <div className={styles.arrow} aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14 M13 6l6 6-6 6" />
              </svg>
            </div>

            <CityColumn
              title="부산"
              description="이사하려는 곳의 정보를 기준으로 입력해주세요."
              fields={BUSAN_FIELDS}
              busan
              {...fieldProps}
            />
          </div>

          <div className={styles.foot}>
            {tried && !complete && (
              <span className="small bad">{missingPrompt(missing)}</span>
            )}

            {error && (
              <span className="small bad" role="alert">
                {error}
              </span>
            )}

            <button
              type="submit"
              className="btn btn-grad"
              disabled={loading}
            >
              {loading ? '계산 중…' : '결과 보기 →'}
            </button>
          </div>
        </form>
      </section>

      {mapOpen ? (
        <MapRentPickerModal
          open
          onClose={() => setMapOpen(false)}
          onApply={(rent) => {
            setError(null);
            setField('busanRent', rent);
          }}
        />
      ) : null}
    </>
  );
}