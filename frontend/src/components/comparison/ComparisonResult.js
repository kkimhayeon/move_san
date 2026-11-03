'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Hero from '@/components/common/Hero';
import RouteLoading from '@/components/common/RouteLoading';
import { ROUTES } from '@/constants/routes';
import {
  useComparisonInputs,
  useComparisonResult,
  useComparisonStatus,
} from '@/stores/comparison';
import { fmt, fmtInt } from '@/utils/formatMoney';
import ComparisonChart from './ComparisonChart';
import ComparisonTable from './ComparisonTable';
import SavingsConvert from './SavingsConvert';
import { buildComparisonView } from './viewModel';
import styles from './ComparisonResult.module.css';

function IncompleteResult() {
  return (
    <>
      <Hero compact eyebrow="RESULT" title="계산 결과" subtitle="아직 계산 결과가 없어요." />
      <div className="page">
        <div className={`card stack ${styles.emptyCard}`}>
          <h2>먼저 생활비를 계산해 주세요</h2>
          <p className={`muted ${styles.flush}`}>계산기에서 금액을 입력하고 결과 보기를 누르면 비교 결과를 볼 수 있어요. 새로고침하면 이전 결과는 사라져요.</p>
          <Link href={ROUTES.home} className={`btn ${styles.emptyAction}`}>계산기로 가기 →</Link>
        </div>
      </div>
    </>
  );
}

function CompareError({ message }) {
  return (
    <>
      <Hero compact eyebrow="RESULT" title="계산 결과" subtitle="결과를 불러오지 못했어요." />
      <div className="page">
        <div className={`card stack ${styles.emptyCard}`}>
          <h2>계산에 실패했어요</h2>
          <p className={`muted ${styles.flush}`} role="alert">{message}</p>
          <Link href={ROUTES.home} className={`btn ${styles.emptyAction}`}>계산기로 돌아가기 →</Link>
        </div>
      </div>
    </>
  );
}

export default function ComparisonResult() {
  const router = useRouter();
  const apiResult = useComparisonResult();
  const { status, error } = useComparisonStatus();
  const { resetInputs } = useComparisonInputs();
  const [period, setPeriod] = useState('year');
  const [chart, setChart] = useState('all');
  const [livingOpen, setLivingOpen] = useState(false);

  if (status === 'loading') {
    return (
      <>
        <Hero compact eyebrow="RESULT" title="계산 결과" subtitle="생활비를 비교하고 있어요." />
        <RouteLoading label="계산 결과를 불러오는 중…" />
      </>
    );
  }

  if (status === 'error') {
    return <CompareError message={error || '생활비 계산에 실패했어요. 잠시 후 다시 시도해 주세요.'} />;
  }

  if (!apiResult) return <IncompleteResult />;

  const view = buildComparisonView(apiResult);
  const yearly = period === 'year';
  const amount = yearly ? view.result.yearlyDiff : view.result.monthlyDiff;
  const absAmount = Math.abs(amount);
  const otherAmount = yearly ? view.result.monthlyDiff : view.result.yearlyDiff;

  const openRow = (row) => {
    if (row.key === 'rent') {
      setChart((current) => (current === 'rent' ? 'all' : 'rent'));
      return;
    }
    if (row.key !== 'living') return;
    setChart(livingOpen ? 'all' : 'living');
    setLivingOpen((open) => !open);
  };

  const onChart = (id) => {
    setChart(id);
    setLivingOpen(id === 'living');
  };

  return (
    <>
      <Hero
        compact
        eyebrow="RESULT"
        title="계산 결과"
      />
      <div className="page">
        <section className={`card lift ${styles.heroSummary}`}>
          <div className={styles.heroHead}>
            <p className={styles.heroEyebrow}>서울 대신 부산에 살면</p>
            <div className={styles.periodToggle} role="group" aria-label="기간 선택">
              <button
                type="button"
                className={yearly ? styles.periodOn : undefined}
                aria-pressed={yearly}
                onClick={() => setPeriod('year')}
              >
                1년
              </button>
              <button
                type="button"
                className={!yearly ? styles.periodOn : undefined}
                aria-pressed={!yearly}
                onClick={() => setPeriod('month')}
              >
                한 달
              </button>
            </div>
          </div>

          <h2 className={styles.heroTitle}>
            {yearly ? '1년에' : '한 달에'}{' '}
            <em className={view.gain ? undefined : styles.lossText}>{fmtInt(absAmount)}만원</em>
            {view.gain ? ' 더 남아요' : ' 덜 남아요'}
          </h2>
          <div className={styles.heroActions}>
            <p className={`small muted ${styles.heroCaption}`}>
              {yearly
                ? <>한 달로 치면 매달 {fmt(Math.abs(otherAmount))}만원이 {view.gain ? '더 남는' : '덜 남는'} 셈이에요</>
                : <>1년으로 치면 {fmtInt(Math.abs(otherAmount))}만원이 {view.gain ? '더 남는' : '덜 남는'} 셈이에요</>}
            </p>
            <button
              type="button"
              className={`btn btn-outline ${styles.recalcBtn}`}
              onClick={() => {
                // result를 먼저 지우면 빈 결과 안내 카드가 잠깐 떠서, 입력만 비우고 이동한다.
                resetInputs();
                router.push(ROUTES.home);
              }}
            >
              다시 계산하기
            </button>
          </div>
        </section>

        {view.gain && view.result.yearlyDiff > 0 ? (
          <SavingsConvert yearlyManwon={view.result.yearlyDiff} />
        ) : null}

        <div className={styles.grid}>
          <ComparisonTable view={view} chart={chart} livingOpen={livingOpen} onRow={openRow} />
          <ComparisonChart view={view} chart={chart} onChart={onChart} />
        </div>

        <Link href={ROUTES.map} className={styles.mapCta}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg>
          어느 동네에 살지 고민되나요? 부산 동네별 월세 보기 →
        </Link>
      </div>
    </>
  );
}
