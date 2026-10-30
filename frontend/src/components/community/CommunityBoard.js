'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchPostCategories, fetchPosts } from '@/api/community';
import LoginRequiredModal from '@/components/auth/LoginRequiredModal';
import { BOARD_CODES, BOARD_LABELS, POST_LIMITS } from '@/constants/community';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/components/layout/AuthProvider';
import { formatCommunityDate } from '@/utils/communityFormat';
import { getUserErrorMessage, isAbortError } from '@/utils/errors';
import styles from './CommunityBoard.module.css';

function categoryName(code, categories) {
  const found = categories.find((item) => item.code === code);
  return found?.name || BOARD_LABELS[code] || code;
}

/** 목록 API의 thumbnail_url(정렬 첫 이미지). images[]가 오면 첫 URL만 사용. */
function resolveListThumbnail(post) {
  if (post?.thumbnail_url) return String(post.thumbnail_url);
  const images = post?.images;
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  return first?.url || first?.public_url || null;
}

function PostRow({ post, categories }) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const thumbSrc = resolveListThumbnail(post);
  const showThumb = Boolean(thumbSrc) && !thumbFailed;

  return (
    <Link href={ROUTES.communityPost(post.id)} className={styles.row}>
      {showThumb ? (
        <img
          className={styles.thumb}
          src={thumbSrc}
          alt=""
          onError={() => setThumbFailed(true)}
        />
      ) : null}
      <div className={styles.rowBody}>
        <span className={`tag ${styles.badge}`}>{categoryName(post.category_code, categories)}</span>
        <h3 className={styles.title}>{post.title}</h3>
        <div className={styles.meta}>
          <span>{post.author?.nickname || '사용자'}</span>
          <span aria-hidden="true">·</span>
          <span>{formatCommunityDate(post.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}

export default function CommunityBoard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState(
    BOARD_CODES.map((code) => ({ code, name: BOARD_LABELS[code] })),
  );
  const [category, setCategory] = useState('');
  const [draftQ, setDraftQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [state, setState] = useState({
    loading: true,
    error: null,
    items: [],
    total: 0,
    page: 1,
    page_size: POST_LIMITS.pageSize,
  });

  const loginHref = `${ROUTES.login}?next=${encodeURIComponent(ROUTES.communityWrite)}`;
  const closeLoginModal = useCallback(() => setLoginModalOpen(false), []);

  useEffect(() => {
    let cancelled = false;
    fetchPostCategories()
      .then((data) => {
        if (cancelled) return;
        const items = data?.result?.items;
        if (Array.isArray(items) && items.length) setCategories(items);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetchPosts({
      page,
      page_size: POST_LIMITS.pageSize,
      q: appliedQ || undefined,
      category_code: category || undefined,
    })
      .then((data) => {
        if (cancelled) return;
        const result = data?.result || {};
        setState({
          loading: false,
          error: null,
          items: Array.isArray(result.items) ? result.items : [],
          total: Number(result.total) || 0,
          page: Number(result.page) || page,
          page_size: Number(result.page_size) || POST_LIMITS.pageSize,
        });
      })
      .catch((err) => {
        if (cancelled || isAbortError(err)) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: getUserErrorMessage(err, '글 목록을 불러오지 못했어요.'),
          items: [],
          total: 0,
        }));
      });

    return () => { cancelled = true; };
  }, [page, appliedQ, category, reloadToken]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((state.total || 0) / (state.page_size || POST_LIMITS.pageSize))),
    [state.total, state.page_size],
  );

  const selectCategory = useCallback((code) => {
    setCategory(code);
    setPage(1);
  }, []);

  const onSearch = (event) => {
    event.preventDefault();
    const next = draftQ.trim().slice(0, POST_LIMITS.searchMax);
    setDraftQ(next);
    setAppliedQ(next);
    setPage(1);
  };

  const goWrite = () => {
    if (authLoading) return;
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    router.push(ROUTES.communityWrite);
  };

  const filterItems = [
    { code: '', name: '전체' },
    ...categories,
  ];

  return (
    <>
      <form className={styles.searchRow} onSubmit={onSearch}>
        <label className={styles.searchBox}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value.slice(0, POST_LIMITS.searchMax))}
            placeholder="관심있는 글을 검색해 보세요."
            aria-label="글 검색"
            maxLength={POST_LIMITS.searchMax}
          />
        </label>
        <button type="submit" className="btn btn-outline" style={{ minHeight: 52 }}>검색</button>
        <button type="button" className={`btn ${styles.writeBtn}`} onClick={goWrite}>글쓰기</button>
      </form>

      <div className={styles.board}>
        <aside className={styles.filters} aria-label="게시판 카테고리">
          {filterItems.map((item) => {
            const selected = category === item.code;
            return (
              <button
                key={item.code || 'all'}
                type="button"
                className={`${styles.filterBtn}${selected ? ` ${styles.filterOn}` : ''}`}
                aria-pressed={selected}
                onClick={() => selectCategory(item.code)}
              >
                {item.name}
              </button>
            );
          })}
        </aside>

        <div className={styles.mainCol}>
          {state.loading && <div className={`card ${styles.statusBox} muted`}>글을 불러오는 중…</div>}

          {!state.loading && state.error && (
            <div className={`card ${styles.statusBox} stack`}>
              <p className="bad" role="alert" style={{ margin: 0 }}>{state.error}</p>
              <button type="button" className="btn-ghost" onClick={() => setReloadToken((n) => n + 1)}>↻ 다시 시도</button>
            </div>
          )}

          {!state.loading && !state.error && state.items.length === 0 && (
            <div className={`card ${styles.statusBox} muted`}>
              {appliedQ ? `'${appliedQ}'에 맞는 글이 없어요.` : '아직 글이 없어요.'}
            </div>
          )}

          {!state.loading && !state.error && state.items.length > 0 && (
            <div className={styles.list}>
              {state.items.map((post) => (
                <PostRow key={post.id} post={post} categories={categories} />
              ))}
            </div>
          )}

          {!state.loading && !state.error && state.total > state.page_size && (
            <div className={styles.pager}>
              <button type="button" className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>이전</button>
              <span className={styles.pagerInfo}>{page} / {totalPages}</span>
              <button type="button" className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>다음</button>
            </div>
          )}
        </div>
      </div>

      <LoginRequiredModal
        isOpen={loginModalOpen}
        onClose={closeLoginModal}
        loginHref={loginHref}
        title="회원만 접근 가능합니다"
        description="글쓰기는 로그인 후 이용할 수 있어요."
      />
    </>
  );
}
