'use client';

// '내 조건' 입력·수정 폼 (챗봇 패널 안에서 사용)
// - 저장하면 stores/userConditions.js에만 들어가고, 계산기 입력값은 바꾸지 않는다.
// - 계산기에 이미 입력한 값이 있으면 빈 칸에 미리 채워 보여준다.
import { useState } from 'react';
import { GU } from '@/constants/busan';
import {
  EMPLOYMENT_LABELS,
  HOUSING_LABELS,
  INCOME_LABELS,
  useUserConditions,
  useUserConditionsStore,
} from '@/stores/userConditions';
import styles from './UserConditionsForm.module.css';

const MONEY_FIELDS = [
  { key: 'seoulMonthlySalary', label: '서울 세후 월급', ph: '예) 300' },
  { key: 'busanMonthlySalary', label: '부산 세후 월급', ph: '예) 300' },
  { key: 'seoulMonthlyRent', label: '서울 월세', ph: '예) 70' },
  { key: 'busanMonthlyRent', label: '부산 월세', ph: '예) 45' },
  { key: 'seoulMonthlyLiving', label: '서울 생활비', ph: '예) 120' },
];

const SELECT_FIELDS = [
  { key: 'employmentStatus', label: '현재 상태', options: EMPLOYMENT_LABELS },
  { key: 'housingType', label: '주거 형태', options: HOUSING_LABELS },
  { key: 'incomeBand', label: '연소득 구간', options: INCOME_LABELS },
  { key: 'busanWorkDistrict', label: '부산 근무 예정지', options: Object.fromEntries(GU.map((g) => [g.name, g.name])) },
];

const NUMBER_KEYS = ['age', ...MONEY_FIELDS.map((f) => f.key)];
const toDraft = (c) => Object.fromEntries([...NUMBER_KEYS, ...SELECT_FIELDS.map((f) => f.key)].map((k) => [k, c[k] == null ? '' : String(c[k])]));
const toValue = (v) => (v.trim() === '' ? null : Number(v));

export default function UserConditionsForm({ onSaved }) {
  const conditions = useUserConditions();
  // 저장값이 바뀌면 폼을 새로 그려 최신값으로 맞춘다
  return <FormInner key={conditions.updatedAt || 'empty'} initial={conditions} onSaved={onSaved} />;
}

function FormInner({ initial, onSaved }) {
  const save = useUserConditionsStore((s) => s.save);
  const clear = useUserConditionsStore((s) => s.clear);
  const [draft, setDraft] = useState(() => toDraft(initial));
  const fromCalc = initial.fromCalculator || [];

  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = (e) => {
    e.preventDefault();
    const patch = {};
    NUMBER_KEYS.forEach((k) => { patch[k] = toValue(draft[k]); });
    SELECT_FIELDS.forEach(({ key }) => { patch[key] = draft[key] || null; });
    save(patch);
    onSaved?.();
  };

  const reset = () => {
    clear();
    setDraft(toDraft({}));
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <p className={styles.note}>
        입력한 조건은 이 브라우저에만 저장되고 챗봇 답변에 쓰여요. 금액은 <b>만원 / 월</b> 기준이에요.
        {fromCalc.length > 0 && <><br />계산기에 입력한 값은 미리 채워 두었어요.</>}
      </p>

      <div className={styles.grid}>
        {MONEY_FIELDS.map((f) => (
          <label key={f.key} className={styles.field}>
            <span>{f.label}{fromCalc.includes(f.key) && <em className={styles.calc}>계산기</em>}</span>
            <span className={styles.money}>
              <input inputMode="decimal" placeholder={f.ph} value={draft[f.key]} onChange={(e) => set(f.key, e.target.value.replace(/[^0-9.]/g, ''))} />
              <i>만원</i>
            </span>
          </label>
        ))}

        <label className={styles.field}>
          <span>만 나이</span>
          <input inputMode="numeric" placeholder="예) 27" value={draft.age} onChange={(e) => set('age', e.target.value.replace(/[^0-9]/g, ''))} />
        </label>

        {SELECT_FIELDS.map((f) => (
          <label key={f.key} className={styles.field}>
            <span>{f.label}</span>
            <select value={draft[f.key]} onChange={(e) => set(f.key, e.target.value)}>
              <option value="">선택 안 함</option>
              {Object.entries(f.options).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        ))}
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.save}>조건 저장</button>
        <button type="button" className={styles.clear} onClick={reset}>모두 지우기</button>
      </div>
      {initial.updatedAt && <p className={styles.saved}>마지막 저장: {new Date(initial.updatedAt).toLocaleString('ko-KR')}</p>}
    </form>
  );
}
