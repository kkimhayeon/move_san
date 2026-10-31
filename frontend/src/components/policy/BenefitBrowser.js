'use client';

// 청년 혜택 목록: /api/v1/policies · /api/v1/policies/categories 연동
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchPolicies, fetchPolicyCategories, safeOfficialUrl } from '@/api/policies';
import { ELIGIBILITY_EMPTY_MESSAGE, parseEligibility } from '@/utils/eligibility';
import { getUserErrorMessage, isAbortError } from '@/utils/errors';
import styles from './BenefitBrowser.module.css';

const ALL_TAB = '전체';
const FAVORITES_KEY = 'movesan-benefit-favorites';

function readFavorites() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
  } catch {
    return [];
  }
}

function EligibilityBlocks({ blocks }) {
  if (!blocks || blocks.length === 0) return null;
  return blocks.map((block, index) => {
    if (block.type === 'list') {
      return (
        <ul key={`list-${index}`} className={styles.eligList}>
          {block.items.map((item, itemIndex) => (
            <li key={`item-${itemIndex}`}>
              {item.text ? <span>{item.text}</span> : null}
              {item.notes.map((note, noteIndex) => (
                <span key={`note-${noteIndex}`} className={styles.eligNote}>{note}</span>
              ))}
            </li>
          ))}
        </ul>
      );
    }
    if (block.type === 'notice') {
      return <p key={`notice-${index}`} className={styles.eligNotice}>{block.text}</p>;
    }
    return (
      <p key={`text-${index}`} className={styles.eligText}>
        {block.lines.map((line, lineIndex) => (
          <span key={`line-${lineIndex}`}>
            {lineIndex > 0 ? <br /> : null}
            {line}
          </span>
        ))}
      </p>
    );
  });
}

function EligibilityBody({ value }) {
  const parsed = parseEligibility(value);
  if (parsed.kind === 'empty') {
    return <p className={styles.eligFallback}>{ELIGIBILITY_EMPTY_MESSAGE}</p>;
  }
  if (parsed.kind === 'plain') {
    return <EligibilityBlocks blocks={parsed.blocks} />;
  }
  return (
    <div className={styles.eligSections}>
      <EligibilityBlocks blocks={parsed.preamble} />
      {parsed.sections.map((section, index) => (
        <section key={`${section.title}-${index}`} className={styles.eligSection}>
          <h4 className={styles.eligHeading}>{section.title}</h4>
          <EligibilityBlocks blocks={section.blocks} />
        </section>
      ))}
    </div>
  );
}

function focusableIn(root) {
  if (!root) return [];
  return [...root.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])')];
}

function BenefitDetailModal({ item, onClose }) {
  const dialogRef = useRef(null);
  const officialUrl = safeOfficialUrl(item.official_url);

  useEffect(() => {
    const restore = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const dialog = dialogRef.current;
    dialog?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const items = focusableIn(dialog);
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onFocusIn(event) {
      if (!dialog || dialog.contains(event.target)) return;
      const items = focusableIn(dialog);
      (items[0] || dialog).focus();
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
      if (restore?.isConnected) restore.focus();
    };
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="benefit-summary-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalBody}>
          <span className={styles.badge}>{item.category}</span>
          <h2 id="benefit-summary-title" className={styles.modalTitle}>{item.policy_name}</h2>
          {item.description ? <p className={styles.modalDesc}>{item.description}</p> : null}

          {item.benefit_description ? (
            <section className={styles.modalSection}>
              <h3 className={styles.modalLabel}>지원 혜택</h3>
              <p className={styles.benefitValue}>{item.benefit_description}</p>
            </section>
          ) : null}

          {item.period_description ? (
            <section className={styles.modalSection}>
              <h3 className={styles.modalLabel}>지원 기간</h3>
              <p className={styles.eligText}>{item.period_description}</p>
            </section>
          ) : null}

          {item.interest_rate_description ? (
            <section className={styles.modalSection}>
              <h3 className={styles.modalLabel}>금리</h3>
              <p className={styles.eligText}>{item.interest_rate_description}</p>
            </section>
          ) : null}

          <section className={styles.modalSection}>
            <h3 className={styles.modalLabel}>자격 요건</h3>
            <EligibilityBody value={item.eligibility_description} />
          </section>
        </div>

        <div className={styles.modalActions}>
          {officialUrl ? (
            <a className="btn" href={officialUrl} target="_blank" rel="noopener noreferrer">
              홈페이지로 이동
            </a>
          ) : null}
          <button type="button" className="btn btn-outline" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function matchesQuery(item, q) {
  if (!q) return true;
  const hay = [
    item.policy_name,
    item.description,
    item.benefit_description,
    item.period_description,
    item.eligibility_description,
    item.interest_rate_description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

export default function BenefitBrowser() {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const [categoriesReload, setCategoriesReload] = useState(0);

  const [cat, setCat] = useState(ALL_TAB);
  const [draftQ, setDraftQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [listState, setListState] = useState({
    loading: true,
    error: null,
    items: [],
    total: 0,
  });
  const [summaryItem, setSummaryItem] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    setFavorites(readFavorites());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setCategoriesLoading(true);
    setCategoriesError(null);

    fetchPolicyCategories({ signal: controller.signal })
      .then((items) => {
        setCategories(items);
        setCategoriesLoading(false);
        setCategoriesError(null);
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setCategories([]);
        setCategoriesLoading(false);
        setCategoriesError(getUserErrorMessage(err, '카테고리를 불러오지 못했어요.'));
      });

    return () => controller.abort();
  }, [categoriesReload]);

  useEffect(() => {
    const controller = new AbortController();
    setListState((prev) => ({ ...prev, loading: true, error: null }));

    // 전체 목록을 받아 카테고리·검색은 클라이언트에서 필터 (사이드바 건수 표시용)
    fetchPolicies({ signal: controller.signal })
      .then((result) => {
        setListState({
          loading: false,
          error: null,
          items: result.items,
          total: result.total,
        });
        setInitialLoadDone(true);
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setListState({
          loading: false,
          error: getUserErrorMessage(err, '혜택 목록을 불러오지 못했어요.'),
          items: [],
          total: 0,
        });
        setInitialLoadDone(true);
      });

    return () => controller.abort();
  }, [reloadToken]);

  const closeSummary = useCallback(() => setSummaryItem(null), []);

  const onSearch = (event) => {
    event.preventDefault();
    setAppliedQ(draftQ.trim());
  };

  const clearSearch = () => {
    setDraftQ('');
    setAppliedQ('');
  };

  const toggleFavorite = useCallback((policyId) => {
    setFavorites((prev) => {
      const next = prev.includes(policyId)
        ? prev.filter((id) => id !== policyId)
        : [...prev, policyId];
      try {
        window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {
        // ignore quota / private mode
      }
      return next;
    });
  }, []);

  const searchedItems = useMemo(() => {
    const q = appliedQ.trim().toLowerCase();
    if (!q) return listState.items;
    return listState.items.filter((item) => matchesQuery(item, q));
  }, [listState.items, appliedQ]);

  const visibleItems = useMemo(() => {
    if (cat === ALL_TAB) return searchedItems;
    return searchedItems.filter((item) => item.category === cat);
  }, [searchedItems, cat]);

  const categoryCounts = useMemo(() => {
    const counts = { [ALL_TAB]: searchedItems.length };
    categories.forEach((name) => {
      counts[name] = searchedItems.filter((item) => item.category === name).length;
    });
    return counts;
  }, [searchedItems, categories]);

  const showInitialLoading = listState.loading && !initialLoadDone;
  const showRefreshing = listState.loading && initialLoadDone;
  const hasFilter = Boolean(appliedQ) || cat !== ALL_TAB;
  const emptyMessage = hasFilter
    ? '검색어나 카테고리에 맞는 지원사업이 없어요.'
    : '등록된 지원사업이 없어요.';

  const filterItems = [
    { code: ALL_TAB, name: '전체 혜택' },
    ...categories.map((name) => ({ code: name, name })),
  ];

  return (
    <>
      <form className={styles.searchRow} onSubmit={onSearch}>
        <label className={styles.search}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder="혜택 이름이나 지원 내용으로 검색"
            aria-label="혜택 이름이나 지원 내용으로 검색"
          />
        </label>
        <button type="submit" className={`btn btn-outline ${styles.searchBtn}`}>검색</button>
        {appliedQ ? (
          <button type="button" className="btn-ghost" onClick={clearSearch}>초기화</button>
        ) : null}
      </form>

      {categoriesError ? (
        <div className={`card ${styles.statusBox} stack`}>
          <p className="bad" role="alert" style={{ margin: 0 }}>{categoriesError}</p>
          <button type="button" className="btn-ghost" onClick={() => setCategoriesReload((n) => n + 1)}>↻ 카테고리 다시 시도</button>
        </div>
      ) : null}

      <section className={styles.section} aria-label="청년 혜택 목록">
        <div className={styles.board}>
          <aside className={styles.sidebar} aria-label="분야별 혜택">
            <h3 className={styles.sidebarTitle}>분야별 혜택</h3>
            {categoriesLoading && categories.length === 0 ? (
              <p className="small muted">카테고리 불러오는 중…</p>
            ) : (
              <div className={styles.filterList}>
                {filterItems.map((item) => {
                  const selected = cat === item.code;
                  const count = categoryCounts[item.code] ?? 0;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      className={`${styles.filterBtn}${selected ? ` ${styles.filterOn}` : ''}`}
                      aria-pressed={selected}
                      onClick={() => setCat(item.code)}
                    >
                      <span className={styles.filterLabel}>{item.name}</span>
                      <span className={styles.filterCount}>{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <div className={styles.mainCol}>
            {showInitialLoading || showRefreshing ? (
              <div className={`card ${styles.statusBox} muted`}>혜택을 불러오는 중…</div>
            ) : null}

            {!listState.loading && listState.error ? (
              <div className={`card ${styles.statusBox} stack`}>
                <p className="bad" role="alert" style={{ margin: 0 }}>{listState.error}</p>
                <button type="button" className="btn-ghost" onClick={() => setReloadToken((n) => n + 1)}>↻ 다시 시도</button>
              </div>
            ) : null}

            {!listState.loading && !listState.error && visibleItems.length === 0 ? (
              <div className={`card ${styles.statusBox} muted`}>{emptyMessage}</div>
            ) : null}

            {!listState.loading && !listState.error && visibleItems.length > 0 ? (
              <div className={styles.grid}>
                {visibleItems.map((b) => {
                  const officialUrl = safeOfficialUrl(b.official_url);
                  const favorited = favorites.includes(b.policy_id);
                  return (
                    <article key={b.policy_id} className={styles.card}>
                      <div className={styles.cardTop}>
                        <span className={styles.badge}>{b.category}</span>
                        <button
                          type="button"
                          className={`${styles.heartBtn}${favorited ? ` ${styles.heartOn}` : ''}`}
                          aria-label={favorited ? '관심 혜택 해제' : '관심 혜택 저장'}
                          aria-pressed={favorited}
                          onClick={() => toggleFavorite(b.policy_id)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20.8 5.6a4.6 4.6 0 0 0-6.5 0L12 7.9l-2.3-2.3a4.6 4.6 0 0 0-6.5 6.5l2.3 2.3L12 21l6.5-6.6 2.3-2.3a4.6 4.6 0 0 0 0-6.5z" />
                          </svg>
                        </button>
                      </div>

                      <div className={styles.cardBody}>
                        <h3 className={styles.cardTitle}>{b.policy_name}</h3>
                        {b.description ? <p className={styles.desc}>{b.description}</p> : null}
                        {b.benefit_description ? (
                          <p className={styles.amount}>{b.benefit_description}</p>
                        ) : null}
                      </div>

                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className={styles.summaryBtn}
                          onClick={() => setSummaryItem(b)}
                        >
                          자세히 보기
                        </button>
                        {officialUrl ? (
                          <a
                            className={styles.sourceBtn}
                            href={officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="공식 안내"
                          >
                            ↗
                          </a>
                        ) : (
                          <span className={styles.sourceDisabled}>원문 없음</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}

            <p className={styles.listHint}>
              지원 조건은 기관 공고 기준으로 달라질 수 있어요. 신청 전 원문을 확인해 주세요.
            </p>
          </div>
        </div>
      </section>

      {summaryItem ? (
        <BenefitDetailModal item={summaryItem} onClose={closeSummary} />
      ) : null}
    </>
  );
}
