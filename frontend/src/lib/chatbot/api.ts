// 챗봇 답변 받아오기
import type { ChatMessage, ChatReply } from "@/types/chat";
import type { UserConditions } from "@/types/userConditions";
import { getMockReply } from "./mockReply";
import {
  apiErrorFromCatch,
  apiErrorFromResponse,
  createApiError,
  isAbortError,
  isApiError,
  logApiError,
} from "@/utils/errors";

const API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL ?? "";
const TIMEOUT_MS = 15000;

/** 실제 백엔드 API가 연결되어 있는지 */
export const isChatApiConnected = API_URL.length > 0;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function sendChatMessage(messages: ChatMessage[], userConditions: UserConditions): Promise<ChatReply> {
  const last = messages[messages.length - 1];

  if (!isChatApiConnected) {
    await wait(700);
    if (last?.content.trim() === "/error") {
      throw createApiError({ kind: "unknown" });
    }
    return { content: getMockReply(last?.content ?? "", userConditions), isMock: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res: Response;
    try {
      res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map(({ role, content }) => ({ role, content })),
          userConditions,
        }),
        signal: controller.signal,
      });
    } catch (cause) {
      if (isAbortError(cause)) {
        throw createApiError({ kind: "timeout" });
      }
      throw apiErrorFromCatch(cause);
    }

    let json: Record<string, unknown> | null = null;
    try {
      json = await res.json();
    } catch {
      throw createApiError({
        kind: res.ok ? "parse" : "http",
        status: res.status,
      });
    }

    if (!res.ok) {
      throw apiErrorFromResponse(res, json);
    }

    const reply: unknown = json?.reply ?? (json?.data as { reply?: unknown } | undefined)?.reply;
    if (typeof reply !== "string" || reply.trim() === "") {
      throw createApiError({ kind: "parse", status: res.status });
    }
    return { content: reply, isMock: false };
  } catch (err) {
    const apiErr = isApiError(err) ? err : apiErrorFromCatch(err);
    if (!isAbortError(apiErr)) logApiError("sendChatMessage", apiErr);
    throw apiErr;
  } finally {
    clearTimeout(timer);
  }
}
