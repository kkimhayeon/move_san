"use client";

// 무브산 챗봇 위젯
// - 오른쪽 아래 떠 있는 버튼 → 누르면 채팅창 열기/닫기
// - 탭: 대화 / 내 조건
// - API가 없으면 예시(Mock) 답변을 쓰고, 화면에 "예시 답변 모드"라고 표시

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import ChatMessage, { BotAvatar, TypingIndicator } from "./ChatMessage";
import SuggestedQuestions from "./SuggestedQuestions";
import UserConditionsForm from "./UserConditionsForm";
import { isChatApiConnected, sendChatMessage } from "@/lib/chatbot/api";
import { hasAnyCondition, useUserConditions } from "@/lib/userConditions";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

type Tab = "chat" | "conditions";

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conditions = useUserConditions();

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 새 메시지가 오면 맨 아래로 스크롤
  useEffect(() => {
    const el = listRef.current;
    if (el && messages.length > 0) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading, error]);

  // 열리면 입력창에 커서, Esc로 닫기
  useEffect(() => {
    if (!open) return;
    if (tab === "chat") inputRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, tab]);

  const requestReply = async (history: ChatMessageType[]) => {
    setLoading(true);
    setError(null);
    try {
      const reply = await sendChatMessage(history, conditions);
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "assistant", content: reply.content, isMock: reply.isMock, createdAt: Date.now() },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "답변을 받지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  const send = (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const next: ChatMessageType[] = [...messages, { id: newId(), role: "user", content, createdAt: Date.now() }];
    setMessages(next);
    setInput("");
    void requestReply(next);
  };

  const retry = () => {
    if (!loading && messages.length > 0) void requestReply(messages);
  };

  const resetChat = () => {
    setMessages([]);
    setInput("");
    setError(null);
    setLoading(false);
    setTab("chat");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  // Enter = 전송, Shift+Enter = 줄바꿈 (한글 조합 중에는 전송하지 않음)
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  const filled = hasAnyCondition(conditions);

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-label="무브산 챗봇"
          className="fixed inset-x-3 bottom-24 z-50 flex h-[min(620px,calc(100dvh-8rem))] flex-col overflow-hidden rounded-3xl border border-blue-100 bg-[#f7faff] shadow-2xl shadow-blue-900/15 sm:inset-x-auto sm:right-6 sm:w-[390px]"
        >
          {/* 헤더 */}
          <header className="flex items-center gap-3 border-b border-blue-100 bg-gradient-to-r from-[#edf5ff] to-[#dcebff] px-4 py-3">
            <BotAvatar />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800">무브산 챗봇</p>
              <p className="text-[11px] text-slate-500">
                {isChatApiConnected ? "AI 답변 모드" : "예시 답변 모드 · AI 연결 전"}
              </p>
            </div>
            <button
              type="button"
              onClick={resetChat}
              className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-white/70 hover:text-blue-700"
              title="대화 초기화"
            >
              ↺ 초기화
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-lg leading-none text-slate-500 transition hover:bg-white/70"
              aria-label="챗봇 닫기"
            >
              ×
            </button>
          </header>

          {/* 탭 */}
          <nav className="flex gap-1 border-b border-blue-100 bg-white px-3 pt-2 text-sm">
            {(
              [
                ["chat", "대화"],
                ["conditions", "내 조건"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`-mb-px border-b-2 px-3 pb-2 font-medium transition ${
                  tab === key ? "border-blue-600 text-blue-700" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {label}
                {key === "conditions" && filled && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-500 align-middle" />}
              </button>
            ))}
          </nav>

          {tab === "conditions" ? (
            <div className="flex-1 overflow-y-auto p-4">
              <UserConditionsForm compact onSaved={() => setTab("chat")} />
            </div>
          ) : (
            <>
              {/* 메시지 목록 */}
              <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                {messages.length === 0 && (
                  <>
                    <div className="flex items-start gap-2">
                      <BotAvatar />
                      <div className="rounded-2xl rounded-tl-md border border-blue-100 bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-700 shadow-sm">
                        안녕하세요! 서울에서 부산으로 이사·이직을 고민 중이라면 무엇이든 물어보세요.
                        {!isChatApiConnected && (
                          <span className="mt-1 block text-xs text-amber-700">지금은 AI가 연결되기 전이라 정해진 예시 답변을 보여드려요.</span>
                        )}
                      </div>
                    </div>
                    <SuggestedQuestions onSelect={send} disabled={loading} />
                  </>
                )}

                {messages.map((m) => (
                  <ChatMessage key={m.id} message={m} />
                ))}

                {loading && <TypingIndicator />}

                {error && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                    <p>답변을 받지 못했어요. {error}</p>
                    <button type="button" onClick={retry} className="mt-2 rounded-lg bg-white px-3 py-1 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-100">
                      다시 시도
                    </button>
                  </div>
                )}
              </div>

              {/* 내 조건 안내 */}
              <button
                type="button"
                onClick={() => setTab("conditions")}
                className="mx-4 mb-2 rounded-xl bg-blue-50 px-3 py-2 text-left text-xs text-blue-700 transition hover:bg-blue-100"
              >
                {filled ? "✓ 내 조건이 답변에 반영돼요 · 수정하기" : "＋ 내 조건(월급·월세 등)을 넣으면 더 정확히 계산해요"}
              </button>

              {/* 입력창 */}
              <form onSubmit={onSubmit} className="border-t border-blue-100 bg-white p-3">
                <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="메시지를 입력하세요"
                    aria-label="메시지 입력"
                    className="max-h-28 flex-1 resize-none bg-transparent py-1 text-base sm:text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    aria-label="보내기"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                  </button>
                </div>
                <p className="mt-2 text-center text-[11px] text-slate-400">답변은 참고용이에요. 중요한 정보는 공식 자료로 꼭 확인해 주세요.</p>
              </form>
            </>
          )}
        </section>
      )}

      {/* 떠 있는 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "챗봇 닫기" : "챗봇 열기"}
        aria-expanded={open}
        className={`fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition hover:scale-105 sm:bottom-6 sm:right-6 ${
          open ? "border border-blue-200 bg-blue-50 text-blue-700" : "bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-blue-500/30"
        }`}
      >
        {open ? (
          <span className="text-2xl leading-none">×</span>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
            <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
          </svg>
        )}
      </button>
    </>
  );
}
