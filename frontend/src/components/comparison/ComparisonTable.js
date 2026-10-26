'use client';

import { fmtInt, signedInt } from '@/utils/formatMoney';
import { formatSigned } from './viewModel';
import styles from './ComparisonResult.module.css';

function rowClass(row, chart) {
  return [
    styles.row,
    row.chart ? styles.clickable : '',
    row.chart && row.key === chart ? styles.selected : '',
  ].filter(Boolean).join(' ');
}

function diffClass(favorable) {
  if (favorable == null) return 'muted';
  return favorable ? 'good' : 'bad';
}

export default function ComparisonTable({ view, chart, livingOpen, onRow }) {
  const activate = (row) => {
    if (row.chart) onRow(row);
  };

  return (
    <section className={`card ${styles.cmpCard}`}>
      <div className={`${styles.row} ${styles.head}`}><span>항목 (1년, 만원)</span><span className={styles.num}>서울</span><span className={styles.num}>부산</span><span className={styles.num}>차이</span></div>
      {view.rows.map((row) => (
        <div key={row.key}>
          <div
            className={rowClass(row, chart)}
            onClick={() => activate(row)}
            onKeyDown={(event) => {
              if (!row.chart || (event.key !== 'Enter' && event.key !== ' ')) return;
              event.preventDefault();
              activate(row);
            }}
            role={row.chart ? 'button' : undefined}
            tabIndex={row.chart ? 0 : undefined}
            aria-expanded={row.key === 'living' ? livingOpen : undefined}
          >
            <span>
              <strong>{row.label}{row.chart ? ' ›' : ''}</strong>
              {row.hint && <small>{row.hint}</small>}
            </span>
            <span className={styles.num}>{fmtInt(row.seoulYear)}</span>
            <span className={styles.num}>{fmtInt(row.busanYear)}</span>
            <span className={`${styles.num} ${styles.diff} ${diffClass(row.favorable)}`}>{formatSigned(row.cityDelta)}</span>
          </div>
          {row.key === 'living' && livingOpen && (
            <div className={styles.subWrap}>
              {view.livingRows.map((item) => (
                <div key={item.label} className={`${styles.row} ${styles.sub}`}>
                  <span><strong>{item.label}</strong><small>{item.example}</small></span>
                  <span className={styles.num}>{fmtInt(item.seoulYear)}</span>
                  <span className={styles.num}>{fmtInt(item.busanYear)}</span>
                  <span className={`${styles.num} ${styles.diff} good`}>{item.samePrice ? '같음' : `−${item.savingPercent}%`}</span>
                </div>
              ))}
              <small className="muted">비중: 통계청 가계동향(39세 이하 근로자가구) · 가격: 행안부 지방물가 12개월 평균</small>
            </div>
          )}
        </div>
      ))}
      <div className={`${styles.row} ${styles.total}`}>
        <span><strong>1년에 남는 돈</strong><small>월급 − 월세 − 생활비</small></span>
        <span className={styles.num}>{fmtInt(view.seoulLeftYear)}</span>
        <span className={styles.num}>{fmtInt(view.busanLeftYear)}</span>
        <span className={`${styles.num} ${styles.diff} ${view.gain ? 'good' : 'bad'}`}>{signedInt(view.result.yearlyDiff)}</span>
      </div>
      <p className={`small muted ${styles.tableNote}`}>› 표시가 있는 줄을 누르면 오른쪽 그래프가 바뀌어요. 생활비를 누르면 세부 항목이 펼쳐져요.</p>
    </section>
  );
}
