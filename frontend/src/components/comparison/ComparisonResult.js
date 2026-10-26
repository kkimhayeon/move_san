'use client';

// 서울 vs 부산 비교 결과 (F-02) — 1년 기준
import { useState } from 'react';
import Link from 'next/link';
import Hero from '@/components/common/Hero';
import { ROUTES } from '@/constants/routes';
import { BENEFITS } from '@/constants/benefits';
import { useNumbers, LABELS } from '@/stores/comparison';
import { compareDetailed, livingDetail } from '@/utils/calc';
import { fmt } from '@/utils/formatMoney';
import hero from '@/components/common/Hero.module.css';
import styles from './ComparisonResult.module.css';

const won = (n) => Math.round(n).toLocaleString('ko-KR'); // 1년 금액은 만원 단위 정수로
const wonSigned = (n) => (Math.round(n) > 0 ? '+' : Math.round(n) < 0 ? '−' : '') + won(Math.abs(n));

// "이 돈이면" 환산 기준: per = 1년 금액(원)을 하루·매주 단위로 바꿔 보여줌
const CONVERT = {
  coffee: { label: '아메리카노', unit: 4700, text: (n) => `스타벅스 아메리카노(톨) ${n}잔`, per: (w) => `하루 ${(w / 365 / 4700).toFixed(1)}잔`, src: '톨 4,700원 기준' },
  jjajang: { label: '짜장면', unit: 6982, text: (n) => `부산 짜장면 ${n}그릇`, per: (w) => `매주 ${(w / 52 / 6982).toFixed(1)}그릇`, src: '부산 6,982원 · 행안부 지방물가 12개월 평균' },
  movie: { label: '영화 관람', unit: 15000, text: (n) => `영화 ${n}편`, per: (w) => `매주 ${(w / 52 / 15000).toFixed(1)}편`, src: '영화관 주말 일반 2D 약 15,000원 (2026.7 기준)' },
};

// 남는 돈에 주는 영향을 쉬운 말로
function wordOf(x) {
  if (Math.abs(x.impact) < 0.5) return '같아요';
  if (x.cost) return x.impact > 0 ? '아껴요' : '더 써요';
  return x.impact > 0 ? '더 벌어요' : '덜 벌어요';
}

// 막대그래프: groups = [{ label, s, b }] (만원/년). 서울 회색 · 부산 파랑, 막대 위에 금액
function Bars({ groups }) {
  const max = Math.max(1, ...groups.flatMap((g) => [g.s, g.b]));
  return (
    <div className={styles.vbars} role="img" aria-label={groups.map((g) => `${g.label} 서울 ${won(g.s)}만원 부산 ${won(g.b)}만원`).join(', ')}>
      {groups.map((g) => (
        <div key={g.label} className={styles.vbarGroup}>
          <div className={styles.vbarPair}>
            <div className={styles.vbarCol}><span className={`${styles.vbarVal} muted`}>{won(g.s)}</span><span className={`${styles.vbar} ${styles.seoul}`} style={{ height: `${Math.max(1, (Math.max(0, g.s) / max) * 100)}%` }} /></div>
            <div className={styles.vbarCol}><span className={`${styles.vbarVal} good`}>{won(g.b)}</span><span className={`${styles.vbar} ${styles.busan}`} style={{ height: `${Math.max(1, (Math.max(0, g.b) / max) * 100)}%` }} /></div>
          </div>
          <span className={styles.vbarLabel}>{g.label}</span>
        </div>
      ))}
    </div>
  );
}

// 워터폴: 서울 남는 돈에서 시작 → 항목별로 늘고 줄어서 → 부산 남는 돈
function Waterfall({ start, steps, end }) {
  let run = start;
  const cols = [{ label: '서울', from: 0, to: start, kind: 'seoul', text: won(start) }];
  steps.forEach((st) => {
    const next = run + st.impact;
    cols.push({ label: st.label, from: Math.min(run, next), to: Math.max(run, next), kind: Math.abs(st.impact) < 0.5 ? 'zero' : st.impact > 0 ? 'up' : 'down', text: Math.abs(st.impact) < 0.5 ? '0' : `${st.impact > 0 ? '+' : '−'}${won(Math.abs(st.impact))}` });
    run = next;
  });
  cols.push({ label: '부산', from: 0, to: end, kind: 'busan', text: won(end) });
  const max = Math.max(1, ...cols.map((c) => c.to));
  return (
    <div className={`${styles.vbars} ${styles.wf}`} role="img" aria-label="서울 남는 돈에서 부산 남는 돈까지 항목별 변화">
      {cols.map((c) => (
        <div key={c.label} className={styles.vbarGroup}>
          <div className={styles.wfArea}>
            <span className={`${styles.wfBar} ${styles[c.kind]}`} style={{ bottom: `${(Math.max(0, c.from) / max) * 100}%`, height: `${Math.max(0.8, ((c.to - c.from) / max) * 100)}%` }}>
              <span className={styles.wfVal}>{c.text}</span>
            </span>
          </div>
          <span className={styles.vbarLabel}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ComparisonResult() {
  const { values: v, complete, missing } = useNumbers();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('all');
  const [conv, setConv] = useState('coffee');

  if (!complete) {
    return (
      <>
        <Hero compact eyebrow="RESULT" title="계산 결과" subtitle="아직 입력하지 않은 항목이 있어요." />
        <div className="page">
          <div className="card lift stack" style={{ maxWidth: 560, margin: '-84px auto 0', textAlign: 'center' }}>
            <h2>{missing.map((k) => LABELS[k]).join(', ')}을(를) 입력해 주세요</h2>
            <p className="muted" style={{ margin: 0 }}>필수 항목을 입력하면 1년 기준 비교 결과를 볼 수 있어요.</p>
            <Link href={ROUTES.home} className="btn" style={{ alignSelf: 'center' }}>계산기로 가기 →</Link>
          </div>
        </div>
      </>
    );
  }

  // 계산 (Flask 연결 시 api/comparison.js의 fetchCompare로 바꿀 수 있음. 지금은 compareDetailed를 유지)
  const r = compareDetailed({
    seoulPay: v.seoulPay, seoulRent: v.seoulRent, seoulLiving: v.living, seoulTransport: v.seoulTransport,
    busanPay: v.busanPay, busanRent: v.busanRent, busanLiving: v.busanLiving, busanTransport: v.busanTransport,
  });
  const gain = r.yearlyDiff >= 0;
  const Y = 12;

  // 각 항목이 "1년에 남는 돈"을 얼마나 늘리는지(+) 줄이는지(−): 월급은 부산−서울, 지출은 서울−부산
  const rows = [
    { key: 'pay', label: '세후 월급', s: r.seoul.pay, b: r.busan.pay },
    { key: 'rent', label: '월세', s: r.seoul.rent, b: r.busan.rent, cost: true },
    { key: 'living', label: '생활비', s: r.seoul.living, b: r.busan.living, cost: true },
    { key: 'transport', label: '교통비', s: r.seoul.transport, b: r.busan.transport, cost: true },
  ].map((x) => {
    const impact = (x.cost ? x.s - x.b : x.b - x.s) * Y;
    const row = { ...x, impact };
    return { ...row, word: wordOf(row) };
  });
  const top = [...rows].sort((a, b) => (gain ? b.impact - a.impact : a.impact - b.impact))[0];

  const c = CONVERT[conv];
  const convN = Math.floor((r.yearlyDiff * 10000) / c.unit).toLocaleString('ko-KR');
  const featured = BENEFITS.filter((b) => b.featured);

  return (
    <>
      <Hero
        compact
        top={<div className="chips"><Link href={ROUTES.home} className={hero.backLink}>← 다시 계산하기</Link><Link href={ROUTES.map} className={hero.backLink}>🏠 부산 동네별 월세 보기 →</Link></div>}
        eyebrow="RESULT"
        title="계산 결과"
        subtitle={gain
          ? <>부산으로 이사하면 <strong>1년에 {won(r.yearlyDiff)}만원</strong>을 더 모을 수 있어요!</>
          : <>부산으로 이사하면 1년에 {won(Math.abs(r.yearlyDiff))}만원이 덜 남아요. 월세나 월급 조건을 바꿔 보세요.</>}
      />
      <div className="page">
        <div className={`${styles.sumGrid} lift`}>
          <section className="card stack" style={{ gap: 6 }}>
            <span className="tag" style={{ alignSelf: 'flex-start' }}>1년 기준 · 부산 이주 시</span>
            <span className="muted" style={{ marginTop: 8 }}>{gain ? '매년 더 남는 돈' : '매년 줄어드는 돈'}</span>
            <div className={styles.bigNum} style={{ color: gain ? 'var(--brand)' : 'var(--bad)' }}>{wonSigned(r.yearlyDiff)}<small>만원</small></div>
            <span className="small muted">한 달로 보면 매월 {fmt(Math.abs(r.monthlyDiff))}만원의 {gain ? '여유가 생겨요.' : '부족분이 생겨요.'}</span>
          </section>
          <section className={`card ${styles.vsCard}`}>
            <div>
              <div className={styles.vsLabel}>서울 연 잔여금</div>
              <div className={styles.vsValue}>{won(r.seoul.left * Y)}만원</div>
              <div className="small muted">월 {fmt(r.seoul.left)}만원</div>
            </div>
            <span className={styles.vsArrow} aria-hidden="true">→</span>
            <div>
              <div className={styles.vsLabel}>부산 연 잔여금</div>
              <div className={styles.vsValue} style={{ color: 'var(--brand)' }}>{won(r.busan.left * Y)}만원</div>
              <div className="small muted">월 {fmt(r.busan.left)}만원</div>
            </div>
          </section>
        </div>

        {top && Math.abs(top.impact) >= 0.5 && (
          <p className={`${styles.summary} section`}>
            {gain ? <>가장 큰 차이는 <strong>{top.label}</strong>예요. 1년에 <strong className="good">{won(top.impact)}만원</strong> {top.word}.</>
              : <>가장 크게 손해 보는 항목은 <strong>{top.label}</strong>예요. 1년에 <strong className="bad">{won(Math.abs(top.impact))}만원</strong> {top.word}.</>}
          </p>
        )}

        <div className={styles.grid}>
          <section className={`card ${styles.cmpCard}`}>
            <div className={`${styles.row} ${styles.head}`}><span>항목 (1년, 만원)</span><span className={styles.num}>서울</span><span className={styles.num}>부산</span><span className={styles.num}>차이</span></div>
            {rows.map((x) => {
              const d = (x.b - x.s) * Y;
              const zero = Math.abs(d) < 0.5;
              const good = x.cost ? d < 0 : d > 0;
              const click = x.key === 'rent' ? () => setTab(tab === 'rent' ? 'all' : 'rent')
                : x.key === 'living' ? () => { setOpen(!open); setTab(open ? 'all' : 'living'); } : null;
              const sub = x.key === 'rent' ? '누르면 월세 그래프' : x.key === 'living' ? (r.busanLivingAuto ? '누르면 세부 항목 · 지수 95.2' : '누르면 세부 항목') : null;
              return (
                <div key={x.key}>
                  <div className={`${styles.row}${click ? ` ${styles.clickable}` : ''}${(x.key === tab) ? ` ${styles.selected}` : ''}`} onClick={click || undefined} role={click ? 'button' : undefined} aria-expanded={x.key === 'living' ? open : undefined}>
                    <span><strong>{x.label}{click ? ' ›' : ''}</strong>{sub && <small>{sub}</small>}</span>
                    <span className={styles.num}>{won(x.s * Y)}</span>
                    <span className={styles.num}>{won(x.b * Y)}</span>
                    <span className={`${styles.num} ${styles.diff} ${zero ? 'muted' : good ? 'good' : 'bad'}`}>{zero ? '0' : `${d > 0 ? '+' : '−'}${won(Math.abs(d))}`}</span>
                  </div>
                  {x.key === 'living' && open && (
                    <div className={styles.subWrap}>
                      {livingDetail(r.seoul.living).map((dt) => (
                        <div key={dt.label} className={`${styles.row} ${styles.sub}`}>
                          <span><strong>{dt.label}</strong><small>{dt.example}</small></span>
                          <span className={styles.num}>{won(dt.seoul * Y)}</span>
                          <span className={styles.num}>{won(dt.busan * Y)}</span>
                          <span className={`${styles.num} ${styles.diff} good`}>{dt.ratio === 1 ? '같음' : `−${Math.round((1 - dt.ratio) * 100)}%`}</span>
                        </div>
                      ))}
                      <small className="muted">비중: 통계청 가계동향(39세 이하 근로자가구) · 가격: 행안부 지방물가 12개월 평균{r.busanLivingAuto ? '' : ' · 부산 생활비를 직접 입력해서 참고용'}</small>
                    </div>
                  )}
                </div>
              );
            })}
            <div className={`${styles.row} ${styles.total}`}>
              <span><strong>1년에 남는 돈</strong><small>월급 − 월세 − 생활비 − 교통비</small></span>
              <span className={styles.num}>{won(r.seoul.left * Y)}</span>
              <span className={styles.num}>{won(r.busan.left * Y)}</span>
              <span className={`${styles.num} ${styles.diff} ${gain ? 'good' : 'bad'}`}>{wonSigned(r.yearlyDiff)}</span>
            </div>
            <p className="small muted" style={{ margin: '12px 0 0' }}>› 표시가 있는 줄을 누르면 오른쪽 그래프가 바뀌어요. 생활비를 누르면 세부 항목이 펼쳐져요.</p>
          </section>

          <section className={`card ${styles.cmpCard} stack`}>
            <div className="chips">
              {[['all', '전체'], ['rent', '월세'], ['living', '생활비'], ['waterfall', '한눈에 (워터폴)']].map(([k, label]) => (
                <button key={k} className={tab === k ? 'chip on' : 'chip'} onClick={() => setTab(k)}>{label}</button>
              ))}
            </div>
            <strong style={{ fontSize: 16 }}>
              {tab === 'waterfall' ? '서울에서 부산으로, 남는 돈이 이렇게 바뀌어요' : tab === 'rent' ? '1년 월세 비교' : tab === 'living' ? '생활비 세부 항목 (1년)' : '서울 vs 부산 1년 비교'}
            </strong>
            {tab === 'waterfall' ? (
              <Waterfall start={r.seoul.left * Y} end={r.busan.left * Y} steps={rows.map((x) => ({ label: x.key === 'pay' ? '월급' : x.label, impact: x.impact }))} />
            ) : (
              <Bars groups={
                tab === 'rent' ? [{ label: '월세', s: r.seoul.rent * Y, b: r.busan.rent * Y }]
                  : tab === 'living' ? livingDetail(r.seoul.living).map((dt) => ({ label: dt.label.replace(/\s*\(.*\)/, '').split('·')[0], s: dt.seoul * Y, b: dt.busan * Y }))
                  : [
                    { label: '월세', s: r.seoul.rent * Y, b: r.busan.rent * Y },
                    { label: '생활비', s: r.seoul.living * Y, b: r.busan.living * Y },
                    { label: '교통비', s: r.seoul.transport * Y, b: r.busan.transport * Y },
                    { label: '남는 돈', s: Math.max(0, r.seoul.left * Y), b: Math.max(0, r.busan.left * Y) },
                  ]
              } />
            )}
            <div className={`${styles.legend} small muted`}>
              {tab === 'waterfall'
                ? <><i className={`${styles.lg} ${styles.seoul}`} />서울 남는 돈 <i className={`${styles.lg} ${styles.up}`} />늘어남 <i className={`${styles.lg} ${styles.down}`} />줄어듦 <i className={`${styles.lg} ${styles.busan}`} />부산 남는 돈 · 단위: 만원/년</>
                : <><i className={`${styles.lg} ${styles.seoul}`} />서울 <i className={`${styles.lg} ${styles.busan}`} />부산 · 단위: 만원/년</>}
            </div>
            <Link href={ROUTES.map} className={styles.mapCta}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg>
              어느 동네에 살지 고민되나요? 부산 동네별 월세 보기 →
            </Link>
          </section>
        </div>

        {gain && r.yearlyDiff > 0 && (
          <div className={`${styles.convert} section`}>
            <span className="small" style={{ fontWeight: 700 }}>1년에 더 남는 돈이면</span>
            <strong style={{ fontSize: 18 }}>{c.text(convN)}</strong>
            <span className="small muted">({c.per(r.yearlyDiff * 10000)}) · {c.src}</span>
            <span className="chips" style={{ marginLeft: 'auto' }}>
              {Object.entries(CONVERT).map(([k, x]) => (
                <button key={k} className={conv === k ? 'chip on' : 'chip'} onClick={() => setConv(k)}>{x.label}</button>
              ))}
            </span>
          </div>
        )}

        <section className="section">
          <div className="section-head">
            <h2>⭐ 부산에서 이용할 수 있는 금융상품</h2>
            <Link href={ROUTES.benefits} className="small" style={{ fontWeight: 700, color: 'var(--brand)' }}>전체보기 →</Link>
          </div>
          <div className={styles.products}>
            {featured.map((p) => (
              <div key={p.id} className={styles.product}>
                <span className="tag" style={{ alignSelf: 'flex-start' }}>{p.cat}</span>
                <h3>{p.title}</h3>
                <span className="small muted">{p.desc}</span>
                <span className="small" style={{ fontWeight: 600 }}>{p.info}</span>
                <Link href={ROUTES.benefits} className="btn btn-outline btn-sm" style={{ marginTop: 'auto' }}>자세히 보기 →</Link>
              </div>
            ))}
          </div>
          <p className="small warn" style={{ margin: '10px 0 0' }}>상품 카드는 화면 확인용 예시예요. 금융상품은 계산에 포함하지 않아요.</p>
        </section>
      </div>
    </>
  );
}
