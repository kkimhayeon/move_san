'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createComment,
  deleteComment,
  deletePost,
  fetchComments,
  fetchPost,
  fetchPostCategories,
} from '@/api/community';
import { useAuth } from '@/components/layout/AuthProvider';
import { BOARD_LABELS, POST_LIMITS } from '@/constants/community';
import { ROUTES } from '@/constants/routes';
import { formatCommunityDate } from '@/utils/communityFormat';
import styles from './CommunityPost.module.css';

export default function CommunityPost({ postId }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [categoryNames, setCategoryNames] = useState({ ...BOARD_LABELS });
  const [post, setPost] = useState(null);
  const [postState, setPostState] = useState({ loading: true, error: null });
  const [comments, setComments] = useState([]);
  const [commentMeta, setCommentMeta] = useState({ page: 1, page_size: POST_LIMITS.commentPageSize, total: 0 });
  const [commentPage, setCommentPage] = useState(1);
  const [commentState, setCommentState] = useState({ loading: true, error: null });
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [formError, setFormError] = useState('');
  const [reloadComments, setReloadComments] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchPostCategories()
      .then((data) => {
        if (cancelled) return;
        const map = { ...BOARD_LABELS };
        (data?.result?.items || []).forEach((item) => {
          map[item.code] = item.name;
        });
        setCategoryNames(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPostState({ loading: true, error: null });
    fetchPost(postId)
      .then((data) => {
        if (cancelled) return;
        setPost(data?.result || null);
        setPostState({ loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setPost(null);
        setPostState({
          loading: false,
          error: err instanceof Error ? err.message : '글을 불러오지 못했어요.',
        });
      });
    return () => { cancelled = true; };
  }, [postId]);

  useEffect(() => {
    let cancelled = false;
    setCommentState({ loading: true, error: null });
    fetchComments(postId, { page: commentPage, page_size: POST_LIMITS.commentPageSize })
      .then((data) => {
        if (cancelled) return;
        const result = data?.result || {};
        setComments(Array.isArray(result.items) ? result.items : []);
        setCommentMeta({
          page: Number(result.page) || commentPage,
          page_size: Number(result.page_size) || POST_LIMITS.commentPageSize,
          total: Number(result.total) || 0,
        });
        setCommentState({ loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setComments([]);
        setCommentState({
          loading: false,
          error: err instanceof Error ? err.message : '댓글을 불러오지 못했어요.',
        });
      });
    return () => { cancelled = true; };
  }, [postId, commentPage, reloadComments]);

  const commentPages = useMemo(
    () => Math.max(1, Math.ceil((commentMeta.total || 0) / (commentMeta.page_size || POST_LIMITS.commentPageSize))),
    [commentMeta.total, commentMeta.page_size],
  );

  const onDeletePost = async () => {
    if (!post?.is_author || deletingPost) return;
    if (!window.confirm('이 글을 삭제할까요? 삭제하면 목록에서 사라져요.')) return;
    setDeletingPost(true);
    try {
      await deletePost(postId);
      router.replace(ROUTES.community);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '글을 삭제하지 못했어요.');
      setDeletingPost(false);
    }
  };

  const onSubmitComment = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!user) {
      router.push(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.communityPost(postId))}`);
      return;
    }
    const content = draft.trim();
    if (!content) {
      setFormError('댓글 내용을 입력해 주세요.');
      return;
    }
    if (content.length > POST_LIMITS.commentMax) {
      setFormError(`댓글은 ${POST_LIMITS.commentMax}자 이하여야 해요.`);
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await createComment(postId, { content });
      setDraft('');
      setCommentPage(1);
      setReloadComments((n) => n + 1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '댓글을 등록하지 못했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteComment = useCallback(async (commentId) => {
    if (deletingCommentId) return;
    if (!window.confirm('이 댓글을 삭제할까요?')) return;
    setDeletingCommentId(commentId);
    setFormError('');
    try {
      await deleteComment(commentId);
      setReloadComments((n) => n + 1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '댓글을 삭제하지 못했어요.');
    } finally {
      setDeletingCommentId(null);
    }
  }, [deletingCommentId]);

  if (postState.loading) {
    return <div className={`card ${styles.status} muted`}>글을 불러오는 중…</div>;
  }

  if (postState.error || !post) {
    return (
      <div className={`card stack ${styles.status}`}>
        <p className="bad" role="alert" style={{ margin: 0 }}>{postState.error || '글을 찾을 수 없어요.'}</p>
        <Link href={ROUTES.community} className="btn">목록으로</Link>
      </div>
    );
  }

  const boardName = categoryNames[post.category_code] || BOARD_LABELS[post.category_code] || post.category_code;

  return (
    <>
      <Link href={ROUTES.community} className={styles.back}>← 목록으로</Link>

      <article className={`card ${styles.article}`}>
        <header className={styles.head}>
          <span className="tag">{boardName}</span>
          <h1 className={styles.title}>{post.title}</h1>
          <div className={styles.meta}>
            <span>{post.author?.nickname || '사용자'}</span>
            <span>{formatCommunityDate(post.created_at)}</span>
          </div>
          {post.is_author && (
            <div className={styles.actions}>
              <button type="button" className="btn-ghost" onClick={onDeletePost} disabled={deletingPost}>
                {deletingPost ? '삭제 중…' : '글 삭제'}
              </button>
            </div>
          )}
        </header>

        <p className={styles.content}>{post.content}</p>

        {Array.isArray(post.images) && post.images.length > 0 && (
          <div className={styles.images}>
            {post.images.map((image) => (
              <img key={image.id} src={image.url} alt="" />
            ))}
          </div>
        )}
      </article>

      <section className={`card ${styles.comments}`} aria-labelledby="comments-title">
        <div className="section-head" style={{ marginBottom: 8 }}>
          <h2 id="comments-title" style={{ fontSize: 20 }}>댓글 {commentMeta.total}</h2>
        </div>

        {commentState.loading && <p className="muted small">댓글을 불러오는 중…</p>}
        {!commentState.loading && commentState.error && (
          <div className="stack">
            <p className="bad small" role="alert">{commentState.error}</p>
            <button type="button" className="btn-ghost" onClick={() => setReloadComments((n) => n + 1)}>↻ 댓글 다시 시도</button>
          </div>
        )}

        {!commentState.loading && !commentState.error && comments.length === 0 && (
          <p className="muted small">아직 댓글이 없어요.</p>
        )}

        {!commentState.loading && !commentState.error && comments.length > 0 && (
          <div className={styles.commentList}>
            {comments.map((comment) => (
              <div key={comment.id} className={styles.comment}>
                <div className={styles.commentHead}>
                  <strong>{comment.author?.nickname || '사용자'}</strong>
                  <span className="muted">{formatCommunityDate(comment.created_at)}</span>
                  {comment.is_author && (
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ minHeight: 28, padding: '0 10px' }}
                      onClick={() => onDeleteComment(comment.id)}
                      disabled={deletingCommentId === comment.id}
                    >
                      {deletingCommentId === comment.id ? '삭제 중…' : '삭제'}
                    </button>
                  )}
                </div>
                <p className={styles.commentBody}>{comment.content}</p>
              </div>
            ))}
          </div>
        )}

        {!commentState.loading && !commentState.error && commentMeta.total > commentMeta.page_size && (
          <div className={styles.pager}>
            <button type="button" className="btn-ghost" disabled={commentPage <= 1} onClick={() => setCommentPage((p) => Math.max(1, p - 1))}>이전</button>
            <span className="small muted">{commentPage} / {commentPages}</span>
            <button type="button" className="btn-ghost" disabled={commentPage >= commentPages} onClick={() => setCommentPage((p) => Math.min(commentPages, p + 1))}>다음</button>
          </div>
        )}

        <form className={styles.composer} onSubmit={onSubmitComment}>
          <label className="stack" style={{ gap: 6 }} htmlFor="comment-input">
            <span className="small" style={{ fontWeight: 700 }}>댓글 작성</span>
            <textarea
              id="comment-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, POST_LIMITS.commentMax))}
              maxLength={POST_LIMITS.commentMax}
              placeholder={user ? '댓글을 입력해 주세요' : '로그인 후 댓글을 작성할 수 있어요'}
              disabled={submitting || authLoading}
            />
          </label>
          <div className={styles.composerRow}>
            <span className="small muted">{draft.length}/{POST_LIMITS.commentMax}</span>
            {user ? (
              <button type="submit" className="btn btn-sm" disabled={submitting || !draft.trim()}>
                {submitting ? '등록 중…' : '댓글 등록'}
              </button>
            ) : (
              <Link
                className="btn btn-sm"
                href={`${ROUTES.login}?next=${encodeURIComponent(ROUTES.communityPost(postId))}`}
              >
                로그인하고 댓글 쓰기
              </Link>
            )}
          </div>
          {formError && <p className="bad small" role="alert" style={{ margin: 0 }}>{formError}</p>}
        </form>
      </section>
    </>
  );
}
