// 챗봇 메시지 형식

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  /** AI가 아닌 예시(Mock) 답변인지 — 화면에 "예시 답변" 표시 */
  isMock?: boolean;
}

/** 백엔드(또는 Mock)에서 돌려받는 답변 */
export interface ChatReply {
  content: string;
  isMock: boolean;
}
