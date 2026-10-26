'use client';

// 청년 혜택 목록: 카테고리 칩 + 조건으로 찾기(연령대·소득·거주 형태)
import { useState } from 'react';
import { BENEFITS, CATEGORIES, FILTERS, CAT_ICON } from '@/constants/benefits';
import styles from './BenefitBrowser.module.css';

const EMPTY = { ages: [], income: [], housing: [] };

export function Thumb({ cat, size = 120 }) {
  return (
    <span className={styles.thumb} style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={CAT_ICON[cat] || CAT_ICON['생활 지원']} /></svg>
    </span>
  );
}

export default function BenefitBrowser() {
  const [cat, setCat] = useState('전체');
  const [draft, setDraft] = useState(EMPTY);
  const [applied, setApplied] = useState(EMPTY);
  const [open, setOpen] = useState('');

  const toggle = (group, opt) =>
    setDraft((d) => ({ ...d, [group]: d[group].includes(opt) ? d[group].filter((x) => x !== opt) : [...d[group], opt] }));

  // 체크한 조건이 하나라도 맞으면 통과 (그룹마다), 아무것도 체크 안 한 그룹은 조건 없음
  const list = BENEFITS.filter((b) =>
    (cat === '전체' || b.cat === cat) &&
    Object.keys(FILTERS).every((g) => applied[g].length === 0 || applied[g].some((o) => b[g].includes(o)))
  );
  const dirty = JSON.stringify(draft) !== JSON.stringify(applied);

  return (
    <>
      <div className="chips filter-chips">
        {['전체', ...CATEGORIES].map((c) => (
          <button key={c} className={cat === c ? 'chip big on' : 'chip big'} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className={styles.layout}>
        <aside className={`card ${styles.filter}`}>
          <h2 style={{ fontSize: 18 }}>조건으로 찾기</h2>
          {Object.entries(FILTERS).map(([g, f]) => (
            <fieldset key={g}>
              <legend>{f.label}</legend>
              {f.options.map((o) => (
                <label key={o} className={styles.check}>
                  <input type="checkbox" checked={draft[g].includes(o)} onChange={() => toggle(g, o)} />
                  {o}
                </label>
              ))}
            </fieldset>
          ))}
          <button className="btn" style={{ width: '100%' }} onClick={() => setApplied(draft)}>
            검색하기{dirty ? ' ·' : ''}
          </button>
          {(applied.ages.length + applied.income.length + applied.housing.length > 0) && (
            <button className="btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => { setDraft(EMPTY); setApplied(EMPTY); }}>조건 초기화</button>
          )}
        </aside>

        <div className="stack" style={{ gap: 14 }}>
          <span className="small muted">총 {list.length}개의 지원사업이 있어요.</span>
          {list.length === 0 && <div className="card muted">조건에 맞는 지원사업이 없어요. 조건을 줄여 보세요.</div>}
          {list.map((b) => (
            <article key={b.id} className={styles.card}>
              <Thumb cat={b.cat} />
              <div className="stack" style={{ gap: 6, minWidth: 0 }}>
                <span className="tag" style={{ alignSelf: 'flex-start' }}>{b.cat}</span>
                <h3>{b.title}</h3>
                <span className="small muted">{b.desc}</span>
                <span className="small" style={{ fontWeight: 600 }}>{b.info}</span>
                {open === b.id && (
                  <div className={`${styles.detail} small`}>
                    <div><b>대상</b> {b.ages.join(', ')} · {b.housing.join(', ')}</div>
                    <div><b>소득</b> {b.income.join(', ')}</div>
                    <div><b>주관</b> {b.org}</div>
                    <div><b>신청</b> [신청 방법·링크 입력 필요]</div>
                    <a href="https://www.youthcenter.go.kr/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)', fontWeight: 700 }}>온통청년에서 찾아보기 ↗</a>
                  </div>
                )}
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setOpen(open === b.id ? '' : b.id)}>
                {open === b.id ? '접기 ▲' : '자세히 보기 →'}
              </button>
            </article>
          ))}
          <p className="small warn" style={{ margin: 0 }}>지원사업 카드는 화면 확인용 예시예요. 실제 금액과 조건은 혜택 담당이 정리한 데이터로 바뀌어요. 정책·금융상품은 금액 계산에 포함하지 않아요.</p>
        </div>
      </div>
    </>
  );
}
