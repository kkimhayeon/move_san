// POST {API_BASE}/api/chat — AI 챗봇 (Flask에서 LLM API 호출)
// body: { messages: [{ role: 'user' | 'assistant', content }], context: { 계산기 입력값 } } → { reply: '답변 텍스트' }
// 주소가 없거나 실패하면 null → 화면에서 규칙 기반 답변(utils/chatbot.js)으로 대신함
import { API_BASE } from './client';

export async function sendChat(messages, context) {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    return typeof data.reply === 'string' && data.reply.trim() ? data.reply : null;
  } catch {
    return null;
  }
}
