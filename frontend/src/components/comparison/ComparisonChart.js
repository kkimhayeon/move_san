'use client';

import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { fmtInt } from '@/utils/formatMoney';
import { groupsForChart, isSameAmount } from './viewModel';
import styles from './ComparisonResult.module.css';

const TABS = [
  ['all', '전체'],
  ['rent', '월세'],
  ['living', '생활비'],
  ['waterfall', '한눈에 (워터폴)'],
];

const TITLES = {
  all: '서울 vs 부산 1년 비교',
  rent: '1년 월세 비교',
  living: '생활비 세부 항목 (1년)',
  waterfall: '서울에서 부산으로, 남는 돈이 이렇게 바뀌어요',
};

function barHeight(value, max) {
  return `${Math.max(1, (Math.max(0, value) / max) * 100)}%`;
}

function Bars({ groups }) {
  const max = Math.max(1, ...groups.flatMap((group) => [group.seoul, group.busan]));
  const label = groups.map((group) => `${group.label} 서울 ${fmtInt(group.seoul)}만원 부산 ${fmtInt(group.busan)}만원`).join(', ');
  return (
    <div className={styles.vbars} role="img" aria-label={label}>
      {groups.map((group) => (
        <div key={group.label} className={styles.vbarGroup}>
          <div className={styles.vbarPair}>
            <div className={styles.vbarCol}>
              <span className={`${styles.vbarVal} muted`}>{fmtInt(group.seoul)}</span>
              <span className={`${styles.vbar} ${styles.seoul}`} style={{ height: barHeight(group.seoul, max) }} />
            </div>
            <div className={styles.vbarCol}>
              <span className={`${styles.vbarVal} good`}>{fmtInt(group.busan)}</span>
              <span className={`${styles.vbar} ${styles.busan}`} style={{ height: barHeight(group.busan, max) }} />
            </div>
          </div>
          <span className={styles.vbarLabel}>{group.label}</span>
        </div>
      ))}
    </div>
  );
}

function waterfallColumns(start, steps, end) {
  let running = start;
  const columns = [{ label: '서울', from: 0, to: start, kind: 'seoul', text: fmtInt(start) }];
  steps.forEach((step) => {
    const next = running + step.impact;
    const same = isSameAmount(step.impact);
    columns.push({
      label: step.label,
      from: Math.min(running, next),
      to: Math.max(running, next),
      kind: same ? 'zero' : step.impact > 0 ? 'up' : 'down',
      text: same ? '0' : `${step.impact > 0 ? '+' : '−'}${fmtInt(Math.abs(step.impact))}`,
    });
    running = next;
  });
  columns.push({ label: '부산', from: 0, to: end, kind: 'busan', text: fmtInt(end) });
  return columns;
}

function Waterfall({ start, steps, end }) {
  const columns = waterfallColumns(start, steps, end);
  const max = Math.max(1, ...columns.map((column) => column.to));
  return (
    <div className={`${styles.vbars} ${styles.wf}`} role="img" aria-label="서울 남는 돈에서 부산 남는 돈까지 항목별 변화">
      {columns.map((column) => (
        <div key={column.label} className={styles.vbarGroup}>
          <div className={styles.wfArea}>
            <span className={`${styles.wfBar} ${styles[column.kind]}`} style={{ bottom: `${(Math.max(0, column.from) / max) * 100}%`, height: `${Math.max(0.8, ((column.to - column.from) / max) * 100)}%` }}>
              <span className={styles.wfVal}>{column.text}</span>
            </span>
          </div>
          <span className={styles.vbarLabel}>{column.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ComparisonChart({ view, chart, onChart }) {
  const steps = view.rows.map((row) => ({ label: row.waterfallLabel, impact: row.leftoverImpact }));
  return (
    <section className={`card ${styles.cmpCard} stack`}>
      <div className="chips">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" className={chart === id ? 'chip on' : 'chip'} onClick={() => onChart(id)}>{label}</button>
        ))}
      </div>
      <strong className={styles.chartTitle}>{TITLES[chart]}</strong>
      {chart === 'waterfall'
        ? <Waterfall start={view.seoulLeftYear} end={view.busanLeftYear} steps={steps} />
        : <Bars groups={groupsForChart(chart, view)} />}
      <div className={`${styles.legend} small muted`}>
        {chart === 'waterfall'
          ? <><i className={`${styles.lg} ${styles.seoul}`} />서울 남는 돈 <i className={`${styles.lg} ${styles.up}`} />늘어남 <i className={`${styles.lg} ${styles.down}`} />줄어듦 <i className={`${styles.lg} ${styles.busan}`} />부산 남는 돈 · 단위: 만원/년</>
          : <><i className={`${styles.lg} ${styles.seoul}`} />서울 <i className={`${styles.lg} ${styles.busan}`} />부산 · 단위: 만원/년</>}
      </div>
      <Link href={ROUTES.map} className={styles.mapCta}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg>
        어느 동네에 살지 고민되나요? 부산 동네별 월세 보기 →
      </Link>
    </section>
  );
}
