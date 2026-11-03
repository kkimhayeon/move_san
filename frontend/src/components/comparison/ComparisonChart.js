'use client';

import { fmtInt } from '@/utils/formatMoney';
import { groupsForChart } from './viewModel';
import styles from './ComparisonResult.module.css';

const TABS = [
  ['all', '전체'],
  ['rent', '월세'],
  ['living', '생활비'],
];

const TITLES = {
  all: '서울 vs 부산 1년 비교',
  rent: '1년 월세 비교',
  living: '생활비 세부 항목 (1년)',
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

export default function ComparisonChart({ view, chart, onChart }) {
  return (
    <section className={`card ${styles.cmpCard} stack`}>
      <div className="chips">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={chart === id ? 'chip on' : 'chip'}
            onClick={() => onChart(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.chartHead}>
        <strong className={styles.chartTitle}>{TITLES[chart]}</strong>
        <div className={`${styles.legend} small muted`}>
          <i className={`${styles.lg} ${styles.seoul}`} />서울
          <i className={`${styles.lg} ${styles.busan}`} />부산 · 단위: 만원/년
        </div>
      </div>
      <Bars groups={groupsForChart(chart, view)} />
    </section>
  );
}
