/** 컬처라이프 공통 유틸 — URL·날짜·이미지 경로 */

/**
 * @param {unknown} value
 * @returns {string | null}
 */
export function nullableText(value) {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text || text === 'null' || text === 'undefined') return null;
  return text;
}

/**
 * http/https URL만 허용.
 * @param {unknown} url
 * @returns {string | null}
 */
export function safeHttpUrl(url) {
  const text = nullableText(url);
  if (!text) return null;
  try {
    const parsed = new URL(text);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * YYYY-MM-DD를 로컬 달력 날짜로 파싱 (시간대 밀림 방지).
 * @param {string | null | undefined} value
 * @returns {{ y: number, m: number, d: number } | null}
 */
export function parseYmd(value) {
  const text = nullableText(value);
  if (!text) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

/**
 * @param {{ y: number, m: number, d: number }} parts
 */
function formatYmdParts(parts) {
  return `${parts.y}.${String(parts.m).padStart(2, '0')}.${String(parts.d).padStart(2, '0')}`;
}

/**
 * @param {string | null | undefined} start
 * @param {string | null | undefined} end
 */
export function formatCultureDateRange(start, end) {
  const s = parseYmd(start);
  const e = parseYmd(end);
  if (s && e) {
    if (s.y === e.y && s.m === e.m && s.d === e.d) return formatYmdParts(s);
    return `${formatYmdParts(s)} – ${formatYmdParts(e)}`;
  }
  if (s) return formatYmdParts(s);
  if (e) return formatYmdParts(e);
  return null;
}

const SCHEDULE_LABELS = {
  upcoming: '예정',
  ongoing: '진행 중',
  ended: '종료',
  unknown: '일정 확인',
};

/**
 * @param {string | null | undefined} status
 */
export function scheduleStatusLabel(status) {
  const key = nullableText(status) || 'unknown';
  return SCHEDULE_LABELS[key] || SCHEDULE_LABELS.unknown;
}

/**
 * image_path → 표시용 src.
 * API가 준 값만 사용한다. Storage 버킷명·경로를 프론트에서 조립하지 않는다.
 * - http/https 절대 URL → 그대로 사용
 * - 사이트 내 `/...` 경로 → 그대로 사용
 * - 그 외(빈 값·상대 추정·알 수 없는 형식) → null (placeholder)
 * @param {string | null | undefined} imagePath
 * @returns {string | null}
 */
export function resolveCultureImageSrc(imagePath) {
  const path = nullableText(imagePath);
  if (!path) return null;

  // API가 공개 Storage URL 등을 절대 경로로 내려주는 경우
  const absolute = safeHttpUrl(path);
  if (absolute) return absolute;

  // 사이트 내 정적 경로
  if (path.startsWith('/') && !path.startsWith('//') && !path.includes('://')) {
    return path;
  }

  return null;
}
