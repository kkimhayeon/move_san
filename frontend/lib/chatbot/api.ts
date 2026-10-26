// 챗봇 답변 받아오기
// - .env.local에 NEXT_PUBLIC_CHAT_API_URL이 있으면 백엔드로 질문을 보냄
// - 없으면 예시(Mock) 답변 사용
// - API 키는 절대 여기(프론트엔드)에 넣지 않음 → 키는 백엔드에서만 사용
//
// 백엔드와 협의할 요청/응답 형식 (안)
//   POST {NEXT_PUBLIC_CHAT_API_URL}
//   요청: { "messages": [{ "role": "user" | "assistant", "content": "..." }], "userConditions": { ...UserConditions } }
//   응답: { "reply": "..." }  또는  { "status": "success", "data": { "reply": "..." } }

import type { ChatMessage, ChatReply } from "@/types/chat";
import type { UserConditions } from "@/types/userConditions";
import { getMockReply } from "./mockReply";

const API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL ?? "";
const TIMEOUT_MS = 15000;

/** 실제 백엔드 API가 연결되어 있는지 */
export const isChatApiConnected = API_URL.length > 0;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function sendChatMessage(messages: ChatMessage[], userConditions: UserConditions): Promise<ChatReply> {
  const last = messages[messages.length - 1];

  if (!isChatApiConnected) {
    await wait(700); // 로딩 표시를 확인할 수 있도록 잠깐 기다림
    // 오류 화면 테스트용: "/error" 를 보내면 일부러 실패
    if (last?.content.trim() === "/error") throw new Error("테스트용 오류예요.");
    return { content: getMockReply(last?.content ?? "", userConditions), isMock: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.map(({ role, content }) => ({ role, content })),
        userConditions,
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`서버 응답 오류 (${res.status})`);
    const json = await res.json();
    const reply: unknown = json?.reply ?? json?.data?.reply;
    if (typeof reply !== "string" || reply.trim() === "") throw new Error("답변 형식이 올바르지 않아요.");
    return { content: reply, isMock: false };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw new Error("응답 시간이 초과됐어요.");
    throw err instanceof Error ? err : new Error("알 수 없는 오류가 발생했어요.");
  } finally {
    clearTimeout(timer);
  }
}
