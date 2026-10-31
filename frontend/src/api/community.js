// 커뮤니티 API — GET/POST/DELETE /api/v1/posts*, /api/v1/uploads/images, /api/v1/comments*
import { apiFetch } from './client';
import { BOARD_CODES } from '@/constants/community';
import { withPublicCache } from '@/lib/publicCache';

/** 게시판 카테고리(공개 목록) — is_author 등 사용자별 필드 없음 */
const CATEGORIES_TTL_MS = 5 * 60 * 1000;

/**
 * @typedef {{ nickname: string }} CommunityAuthor
 * @typedef {{ id: string, url: string }} CommunityImage
 * @typedef {{
 *   id: string,
 *   title: string,
 *   author: CommunityAuthor,
 *   created_at: string,
 *   category_code: string,
 *   is_author: boolean,
 *   thumbnail_url?: string | null,
 * }} PostSummary
 * @typedef {{
 *   id: string,
 *   title: string,
 *   content: string,
 *   author: CommunityAuthor,
 *   created_at: string,
 *   updated_at: string,
 *   category_code: string,
 *   images: CommunityImage[],
 *   is_author: boolean,
 * }} PostDetail
 * @typedef {{
 *   id: string,
 *   content: string,
 *   author: CommunityAuthor,
 *   created_at: string,
 *   is_author: boolean,
 * }} Comment
 * @typedef {{ code: string, name: string }} PostCategory
 */

function buildQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    q.set(key, String(value));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** 카테고리 목록. FE 노출용으로 BOARD_CODES만 남긴다. */
export async function fetchPostCategories() {
  return withPublicCache('posts:categories', CATEGORIES_TTL_MS, async () => {
    const data = await apiFetch('/api/v1/posts/categories');
    const items = Array.isArray(data?.result?.items) ? data.result.items : [];
    const filtered = items
      .filter((item) => item && BOARD_CODES.includes(String(item.code)))
      .map((item) => ({ code: String(item.code), name: String(item.name || item.code) }));
    return { ...data, result: { items: filtered } };
  });
}

/**
 * 공개 목록 검색.
 * @param {{ page?: number, page_size?: number, q?: string, category_code?: string }} params
 */
export async function fetchPosts(params = {}) {
  const query = buildQuery({
    page: params.page ?? 1,
    page_size: params.page_size ?? 20,
    q: params.q,
    category_code: params.category_code,
  });
  return apiFetch(`/api/v1/posts${query}`);
}

/** @param {string} id */
export async function fetchPost(id) {
  return apiFetch(`/api/v1/posts/${encodeURIComponent(id)}`);
}

/**
 * @param {{ title: string, content: string, category_code: string, image_ids?: string[] }} body
 */
export async function createPost(body) {
  return apiFetch('/api/v1/posts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** @param {string} id */
export async function deletePost(id) {
  return apiFetch(`/api/v1/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/**
 * @param {string} postId
 * @param {{ page?: number, page_size?: number }} params
 */
export async function fetchComments(postId, params = {}) {
  const query = buildQuery({
    page: params.page ?? 1,
    page_size: params.page_size ?? 20,
  });
  return apiFetch(`/api/v1/posts/${encodeURIComponent(postId)}/comments${query}`);
}

/**
 * @param {string} postId
 * @param {{ content: string }} body
 */
export async function createComment(postId, body) {
  return apiFetch(`/api/v1/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** @param {string} commentId */
export async function deleteComment(commentId) {
  return apiFetch(`/api/v1/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE' });
}

/**
 * 사진 1장 업로드 (multipart field: file). FormData에는 JSON Content-Type을 붙이지 않는다.
 * @param {File} file
 */
export async function uploadImage(file) {
  const form = new FormData();
  form.append('file', file);
  return apiFetch('/api/v1/uploads/images', {
    method: 'POST',
    body: form,
  });
}
