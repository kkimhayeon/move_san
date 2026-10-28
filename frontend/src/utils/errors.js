/**
 * API·화면 공통 오류 처리.
 * - 사용자 UI에는 BE raw message / 환경변수 / HTTP 원문을 넣지 않는다.
 * - 로그에는 토큰·키·개인정보·요청 본문을 넣지 않는다.
 */

/** @typedef {'http' | 'network' | 'abort' | 'timeout' | 'parse' | 'config' | 'unknown'} ApiErrorKind */

export class ApiError extends Error {
  /**
   * @param {{
   *   kind: ApiErrorKind,
   *   status?: number | null,
   *   code?: string | null,
   *   rawMessage?: string | null,
   * }} fields
   */
  constructor({ kind, status = null, code = null, rawMessage = null }) {
    super(kind);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.rawMessage = rawMessage;
  }
}

/**
 * @param {{
 *   kind: ApiErrorKind,
 *   status?: number | null,
 *   code?: string | null,
 *   rawMessage?: string | null,
 * }} fields
 */
export function createApiError(fields) {
  return new ApiError(fields);
}

export function isApiError(err) {
  return err instanceof ApiError || (err && err.name === 'ApiError');
}

/** 의도적 취소(언마운트 등). 화면 실패 메시지로 쓰지 않는다. */
export function isAbortError(err) {
  if (!err) return false;
  if (isApiError(err) && err.kind === 'abort') return true;
  return err.name === 'AbortError' || err.code === 20;
}

/**
 * HTTP 응답 실패·파싱 결과를 ApiError로 만든다.
 * BE에 별도 error code 필드가 있을 때만 code를 담는다(임의 생성 금지).
 */
export function apiErrorFromResponse(response, data) {
  const rawMessage = typeof data?.message === 'string' ? data.message : null;
  const code = typeof data?.code === 'string' && data.code.trim()
    ? data.code.trim()
    : null;
  return createApiError({
    kind: 'http',
    status: response?.status ?? (typeof data?.status === 'number' ? data.status : null),
    code,
    rawMessage,
  });
}

export function apiErrorFromCatch(err) {
  if (isApiError(err)) return err;
  if (isAbortError(err)) return createApiError({ kind: 'abort' });
  if (err instanceof TypeError) return createApiError({ kind: 'network' });
  return createApiError({ kind: 'unknown', rawMessage: err instanceof Error ? err.message : null });
}

/**
 * 사용자에게 보여줄 문구.
 * @param {unknown} err
 * @param {string} fallback 동작별 기본 문구 (예: '글 목록을 불러오지 못했어요.')
 * @returns {string | null} abort면 null (표시하지 않음)
 */
export function getUserErrorMessage(err, fallback = '잠시 후 다시 시도해 주세요.') {
  if (isAbortError(err)) return null;

  const apiErr = isApiError(err) ? err : null;
  const kind = apiErr?.kind;
  const status = apiErr?.status;

  if (kind === 'network') {
    return '연결에 실패했어요. 잠시 후 다시 시도해 주세요.';
  }
  if (kind === 'timeout') {
    return '응답 시간이 초과됐어요. 잠시 후 다시 시도해 주세요.';
  }
  if (kind === 'config' || kind === 'parse') {
    return fallback;
  }

  if (status === 401) {
    return '로그인이 필요해요. 로그인 후 다시 시도해 주세요.';
  }
  if (status === 403) {
    return '이 작업을 할 권한이 없어요.';
  }
  if (status === 404) {
    return fallback;
  }
  if (status === 413) {
    return '파일이 너무 커요. 더 작은 파일로 다시 시도해 주세요.';
  }
  if (status === 415) {
    return '지원하지 않는 파일 형식이에요.';
  }
  if (status === 429) {
    return '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.';
  }
  // 400 포함: BE raw message 미노출 → 동작별 fallback
  if (typeof status === 'number' && status >= 400) {
    return fallback;
  }

  return fallback;
}

export function isAuthRequiredError(err) {
  return isApiError(err) && err.status === 401;
}

export function isNotFoundError(err) {
  return isApiError(err) && err.status === 404;
}

/** 안전한 개발용 로그. 토큰·키·본문·개인정보를 넣지 않는다. */
export function logApiError(context, err) {
  try {
    const payload = {
      context: String(context || ''),
      kind: isApiError(err) ? err.kind : 'unknown',
      status: isApiError(err) ? err.status : null,
      // code는 BE가 준 경우에만 (임의 생성 아님)
      code: isApiError(err) && err.code ? err.code : null,
    };
    console.error('[api]', payload);
  } catch {
    // ignore
  }
}
