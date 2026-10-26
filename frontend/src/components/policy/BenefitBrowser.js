'use client';

// 청년 혜택 목록: 카테고리 칩 + 정책 이름·요약 키워드 검색
import { useEffect, useState } from 'react';
import { BENEFITS, CATEGORIES, CAT_ICON } from '@/constants/benefits';
import styles from './BenefitBrowser.module.css';

const FAVORITES_KEY = 'benefit-browser-favorites';

function readFavoriteIds() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function Thumb({ cat, size = 120 }) {
  return (
    <span className={styles.thumb} style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={CAT_ICON[cat] || CAT_ICON['생활 지원']} /></svg>
    </span>
  );
}

export default function BenefitBrowser() {
  const [cat, setCat] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState('');
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [favoritesReady, setFavoritesReady] = useState(false);

  useEffect(() => {
    setFavoriteIds(readFavoriteIds());
    setFavoritesReady(true);
  }, []);

  useEffect(() => {
    if (!favoritesReady) return;
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds, favoritesReady]);

  const toggleFavorite = (id) => {
    setFavoriteIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev]));
  };

  const q = keyword.trim().toLowerCase();
  const list = BENEFITS.filter((b) => {
    if (cat !== '전체' && b.cat !== cat) return false;
    if (!q) return true;
    return b.title.toLowerCase().includes(q) || b.desc.toLowerCase().includes(q);
  }).sort((a, b) => Number(favoriteIds.includes(b.id)) - Number(favoriteIds.includes(a.id)));

  return (
    <>
      <label className={styles.search}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="정책 이름 또는 요약에 포함된 단어"
          aria-label="정책 이름 또는 요약으로 검색"
        />
      </label>

      <div className={`chips filter-chips ${styles.cats}`}>
        {['전체', ...CATEGORIES].map((c) => (
          <button key={c} className={cat === c ? 'chip big on' : 'chip big'} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="stack" style={{ gap: 14 }}>
        <span className="small muted">총 {list.length}개의 지원사업이 있어요.</span>
        {list.length === 0 && <div className="card muted">검색어나 카테고리에 맞는 지원사업이 없어요.</div>}
        <div className={styles.grid}>
          {list.map((b) => {
            const isOpen = open === b.id;
            return (
              <article key={b.id} className={isOpen ? `${styles.card} ${styles.open}` : styles.card}>
                <div className={styles.top}>
                  <Thumb cat={b.cat} size={52} />
                  <span className="tag">{b.cat}</span>
                </div>
                <div className={styles.body}>
                  <div className={styles.titleRow}>
                    <h3>{b.title}</h3>
                    <button
                      type="button"
                      className={styles.heart}
                      aria-pressed={favoriteIds.includes(b.id)}
                      aria-label={favoriteIds.includes(b.id) ? `${b.title} 즐겨찾기 해제` : `${b.title} 즐겨찾기`}
                      onClick={() => toggleFavorite(b.id)}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill={favoriteIds.includes(b.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M19.5 12.572 12 20l-7.5-7.428a5 5 0 1 1 7.5-6.566 5 5 0 1 1 7.5 6.572" />
                      </svg>
                    </button>
                  </div>
                  <p className={styles.desc}>{b.desc}</p>
                  <p className={styles.info}>{b.info}</p>
                  {isOpen && (
                    <div className={`${styles.detail} small`}>
                      <div><b>대상</b> {b.ages.join(', ')} · {b.housing.join(', ')}</div>
                      <div><b>소득</b> {b.income.join(', ')}</div>
                      <div><b>주관</b> {b.org}</div>
                      <div><b>신청</b> [신청 방법·링크 입력 필요]</div>
                      <a href="https://www.youthcenter.go.kr/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)', fontWeight: 700 }}>온통청년에서 찾아보기 ↗</a>
                    </div>
                  )}
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => setOpen(isOpen ? '' : b.id)}>
                  {isOpen ? '접기 ▲' : '자세히 보기 →'}
                </button>
              </article>
            );
          })}
        </div>
        <p className="small warn" style={{ margin: 0 }}>지원사업 카드는 화면 확인용 예시예요. 실제 조건은 혜택 담당이 정리한 데이터로 바뀌어요.</p>
      </div>
    </>
  );
}
