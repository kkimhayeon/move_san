'use client';

import { useState } from 'react';
import Link from 'next/link';
import Hero from '@/components/common/Hero';
import RouteLoading from '@/components/common/RouteLoading';
import { BENEFITS } from '@/constants/benefits';
import { ROUTES } from '@/constants/routes';
import {
  useComparisonResult,
  useComparisonStatus,
} from '@/stores/comparison';
import { fmt, fmtInt, signedInt } from '@/utils/formatMoney';
import ComparisonChart from './ComparisonChart';
import ComparisonTable from './ComparisonTable';
import SavingsConvert from './SavingsConvert';
import { buildComparisonView } from './viewModel';
import hero from '@/components/common/Hero.module.css';
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
  const apiResult = useComparisonResult();
  const { status, error } = useComparisonStatus();
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
  const openRow = (row) => {
    if (row.key === 'rent') {
      setChart((current) => (current === 'rent' ? 'all' : 'rent'));
      return;
    }
    if (row.key !== 'living') return;
    setChart(livingOpen ? 'all' : 'living');
    setLivingOpen((open) => !open);
  };

  return (
    <>
      <Hero
        compact
        top={<div className="chips"><Link href={ROUTES.home} className={hero.backLink}>← 다시 계산하기</Link><Link href={ROUTES.map} className={hero.backLink}>🏠 부산 동네별 월세 보기 →</Link></div>}
        eyebrow="RESULT"
        title="계산 결과"
        subtitle={view.gain
          ? <>부산으로 이사하면 <strong>1년에 {fmtInt(view.result.yearlyDiff)}만원</strong>을 더 모을 수 있어요!</>
          : <>부산으로 이사하면 1년에 {fmtInt(Math.abs(view.result.yearlyDiff))}만원이 덜 남아요. 월세나 월급 조건을 바꿔 보세요.</>}
      />
      <div className="page">
        <div className={`${styles.sumGrid} lift`}>
          <section className={`card ${styles.summaryCard}`}>
            <span className={`tag ${styles.tagStart}`}>1년 기준 · 부산 이주 시</span>
            <span className={`muted ${styles.spaced}`}>{view.gain ? '매년 더 남는 돈' : '매년 줄어드는 돈'}</span>
            <div className={view.gain ? styles.bigNum : `${styles.bigNum} ${styles.loss}`}>{signedInt(view.result.yearlyDiff)}<small>만원</small></div>
            <span className="small muted">한 달로 보면 매월 {fmt(Math.abs(view.result.monthlyDiff))}만원의 {view.gain ? '여유가 생겨요.' : '부족분이 생겨요.'}</span>
          </section>
          <section className={`card ${styles.vsCard}`}>
            <div>
              <div className={styles.vsLabel}>서울 연 잔여금</div>
              <div className={styles.vsValue}>{fmtInt(view.seoulLeftYear)}만원</div>
              <div className="small muted">월 {fmt(view.result.seoul.left)}만원</div>
            </div>
            <span className={styles.vsArrow} aria-hidden="true">→</span>
            <div>
              <div className={styles.vsLabel}>부산 연 잔여금</div>
              <div className={`${styles.vsValue} ${styles.vsBusan}`}>{fmtInt(view.busanLeftYear)}만원</div>
              <div className="small muted">월 {fmt(view.result.busan.left)}만원</div>
            </div>
          </section>
        </div>

        {view.top && (
          <p className={`${styles.summary} section`}>
            {view.gain
              ? <>가장 큰 차이는 <strong>{view.top.label}</strong>예요. 1년에 <strong className="good">{fmtInt(view.top.leftoverImpact)}만원</strong> {view.top.word}.</>
              : <>가장 크게 손해 보는 항목은 <strong>{view.top.label}</strong>예요. 1년에 <strong className="bad">{fmtInt(Math.abs(view.top.leftoverImpact))}만원</strong> {view.top.word}.</>}
          </p>
        )}

        <div className={styles.grid}>
          <ComparisonTable view={view} chart={chart} livingOpen={livingOpen} onRow={openRow} />
          <ComparisonChart view={view} chart={chart} onChart={setChart} />
        </div>

        {view.gain && view.result.yearlyDiff > 0 && <SavingsConvert yearlyManwon={view.result.yearlyDiff} />}

        <section className="section">
          <div className="section-head">
            <h2>⭐ 부산에서 이용할 수 있는 금융상품</h2>
            <Link href={ROUTES.benefits} className={`small ${styles.moreLink}`}>전체보기 →</Link>
          </div>
          <div className={styles.products}>
            {BENEFITS.filter((item) => item.featured).map((item) => (
              <div key={item.id} className={styles.product}>
                <span className={`tag ${styles.tagStart}`}>{item.cat}</span>
                <h3>{item.title}</h3>
                <span className="small muted">{item.desc}</span>
                <span className={`small ${styles.productInfo}`}>{item.info}</span>
                <Link href={ROUTES.benefits} className={`btn btn-outline btn-sm ${styles.productAction}`}>자세히 보기 →</Link>
              </div>
            ))}
          </div>
          <p className={`small warn ${styles.disclaimer}`}>상품 카드는 화면 확인용 예시예요. 금융상품은 계산에 포함하지 않아요.</p>
        </section>
      </div>
    </>
  );
}
