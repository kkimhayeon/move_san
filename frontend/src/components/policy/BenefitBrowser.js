'use client';

// 청년 혜택 목록: /api/policies · /api/policies/categories 연동
import { useEffect, useState } from 'react';
import { fetchPolicies, fetchPolicyCategories, safeOfficialUrl } from '@/api/policies';
import { CAT_ICON } from '@/constants/benefits';
import { getUserErrorMessage, isAbortError } from '@/utils/errors';
import styles from './BenefitBrowser.module.css';

const ALL_TAB = '전체';

export function Thumb({ cat, size = 120 }) {
  return (
    <span className={styles.thumb} style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d={CAT_ICON[cat] || CAT_ICON[ALL_TAB]} />
      </svg>
    </span>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className={styles.field}>
      <b>{label}</b>
      <span>{value}</span>
    </div>
  );
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

    const category = cat === ALL_TAB ? undefined : cat;
    const q = appliedQ.trim() || undefined;

    fetchPolicies({ category, q, signal: controller.signal })
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
  }, [cat, appliedQ, reloadToken]);

  const onSearch = (event) => {
    event.preventDefault();
    setAppliedQ(draftQ.trim());
  };

  const clearSearch = () => {
    setDraftQ('');
    setAppliedQ('');
  };

  const showInitialLoading = listState.loading && !initialLoadDone;
  const showRefreshing = listState.loading && initialLoadDone;
  const hasFilter = Boolean(appliedQ) || cat !== ALL_TAB;
  const emptyMessage = hasFilter
    ? '검색어나 카테고리에 맞는 지원사업이 없어요.'
    : '등록된 지원사업이 없어요.';

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
            placeholder="혜택 이름으로 검색"
            aria-label="혜택 이름으로 검색"
          />
        </label>
        <button type="submit" className="btn btn-outline" style={{ minHeight: 48 }}>검색</button>
        {appliedQ ? (
          <button type="button" className="btn-ghost" onClick={clearSearch}>초기화</button>
        ) : null}
      </form>

      {categoriesError ? (
        <div className={`card ${styles.statusBox} stack`}>
          <p className="bad" role="alert" style={{ margin: 0 }}>{categoriesError}</p>
          <button type="button" className="btn-ghost" onClick={() => setCategoriesReload((n) => n + 1)}>↻ 카테고리 다시 시도</button>
        </div>
      ) : (
        <div className={`chips filter-chips ${styles.cats}`} role="tablist" aria-label="혜택 카테고리">
          <button
            type="button"
            role="tab"
            aria-selected={cat === ALL_TAB}
            className={cat === ALL_TAB ? 'chip big on' : 'chip big'}
            onClick={() => setCat(ALL_TAB)}
          >
            {ALL_TAB}
          </button>
          {categoriesLoading && categories.length === 0 ? (
            <span className="small muted">카테고리 불러오는 중…</span>
          ) : null}
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={cat === c}
              className={cat === c ? 'chip big on' : 'chip big'}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="stack" style={{ gap: 14 }}>
        {showInitialLoading && (
          <div className={`card ${styles.statusBox} muted`}>혜택을 불러오는 중…</div>
        )}

        {showRefreshing && (
          <div className={`card ${styles.statusBox} muted`}>혜택을 불러오는 중…</div>
        )}

        {!listState.loading && listState.error && (
          <div className={`card ${styles.statusBox} stack`}>
            <p className="bad" role="alert" style={{ margin: 0 }}>{listState.error}</p>
            <button type="button" className="btn-ghost" onClick={() => setReloadToken((n) => n + 1)}>↻ 다시 시도</button>
          </div>
        )}

        {!listState.loading && !listState.error && (
          <>
            <span className="small muted">총 {listState.total}개의 지원사업이 있어요.</span>
            {listState.items.length === 0 ? (
              <div className={`card ${styles.statusBox} muted`}>{emptyMessage}</div>
            ) : (
              <div className={styles.grid}>
                {listState.items.map((b) => {
                  const officialUrl = safeOfficialUrl(b.official_url);
                  const hasFields = Boolean(
                    b.benefit_description
                    || b.period_description
                    || b.eligibility_description
                    || b.interest_rate_description,
                  );
                  return (
                    <article key={b.policy_id} className={styles.card}>
                      <div className={styles.top}>
                        <Thumb cat={b.category} size={52} />
                        <span className="tag">{b.category}</span>
                      </div>
                      <div className={styles.body}>
                        <h3>{b.policy_name}</h3>
                        {b.description ? <p className={styles.desc}>{b.description}</p> : null}
                        {hasFields ? (
                          <div className={styles.fields}>
                            <Field label="지원 내용" value={b.benefit_description} />
                            <Field label="지원 기간" value={b.period_description} />
                            <Field label="지원 대상" value={b.eligibility_description} />
                            <Field label="금리" value={b.interest_rate_description} />
                          </div>
                        ) : null}
                      </div>
                      {officialUrl ? (
                        <a
                          className="btn btn-outline btn-sm"
                          href={officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          공식 사이트 이동 ↗
                        </a>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
