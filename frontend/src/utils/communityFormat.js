/** UTC RFC3339 → 화면용 로컬 시각 */
export function formatCommunityDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 로그인 후 복귀할 상대 경로만 허용 */
export function safeNextPath(value, fallback = '/') {
  if (typeof value !== 'string') return fallback;
  const path = value.trim();
  if (!path.startsWith('/') || path.startsWith('//')) return fallback;
  return path;
}
