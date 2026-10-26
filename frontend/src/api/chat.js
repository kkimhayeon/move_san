// POST {API_BASE}/api/chat — AI 챗봇 (Flask에서 LLM API 호출)
// body: { messages: [{ role: 'user' | 'assistant', content }], context: { 계산기 입력값 }, userConditions: { 내 조건 } }
//   → { reply: '답변 텍스트' }  (또는 { status: 'success', data: { reply } })
// - API 주소가 없으면 null → 화면에서 예시(Mock) 답변(utils/chatbot.js)을 쓰고 '예시 답변'으로 표시한다.
// - API 주소가 있는데 실패하면 오류를 던진다 → 화면에서 오류 메시지와 '다시 시도'를 보여준다.
// - API 키는 프론트엔드에 넣지 않는다 (Flask 서버에서만 사용).
import { API_BASE } from './client';

const TIMEOUT_MS = 15000;

export async function sendChat(messages, context, userConditions) {
  if (!API_BASE) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context, userConditions }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`서버 응답 오류 (${res.status})`);
    const data = await res.json();
    const reply = data?.reply ?? data?.data?.reply;
    if (typeof reply !== 'string' || !reply.trim()) throw new Error('답변 형식이 올바르지 않아요.');
    return reply;
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error('응답 시간이 초과됐어요.');
    if (err instanceof TypeError) throw new Error('서버에 연결할 수 없어요.'); // 네트워크 오류 (Failed to fetch)
    throw err instanceof Error ? err : new Error('알 수 없는 오류가 발생했어요.');
  } finally {
    clearTimeout(timer);
  }
}
