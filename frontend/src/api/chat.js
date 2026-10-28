// POST {API_BASE}/api/chat — AI 챗봇
import { API_BASE } from './client';
import {
  apiErrorFromCatch,
  apiErrorFromResponse,
  createApiError,
  isAbortError,
  isApiError,
  logApiError,
} from '@/utils/errors';

const TIMEOUT_MS = 15000;

export async function sendChat(messages, context, userConditions) {
  if (!API_BASE) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res;
    try {
      res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, context, userConditions }),
        signal: controller.signal,
      });
    } catch (cause) {
      if (isAbortError(cause)) {
        throw createApiError({ kind: 'timeout' });
      }
      throw apiErrorFromCatch(cause);
    }

    let data = null;
    try {
      data = await res.json();
    } catch {
      throw createApiError({
        kind: res.ok ? 'parse' : 'http',
        status: res.status,
      });
    }

    if (!res.ok) {
      throw apiErrorFromResponse(res, data);
    }

    const reply = data?.reply ?? data?.data?.reply;
    if (typeof reply !== 'string' || !reply.trim()) {
      throw createApiError({ kind: 'parse', status: res.status });
    }
    return reply;
  } catch (err) {
    const apiErr = isApiError(err) ? err : apiErrorFromCatch(err);
    if (!isAbortError(apiErr)) logApiError('sendChat', apiErr);
    throw apiErr;
  } finally {
    clearTimeout(timer);
  }
}
