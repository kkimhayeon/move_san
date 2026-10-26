import type { ChatMessage as ChatMessageType } from "@/types/chat";

// **굵게** 와 줄바꿈만 간단히 표시
function renderText(text: string) {
  return text.split("\n").map((line, i) => (
    <span key={i} className="block">
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={j} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        ),
      )}
    </span>
  ));
}

export default function ChatMessage({ message }: { message: ChatMessageType }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
          {renderText(message.content)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <BotAvatar />
      <div className="max-w-[80%]">
        <div className="rounded-2xl rounded-tl-md border border-blue-100 bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-700 shadow-sm">
          {renderText(message.content)}
        </div>
        {message.isMock && (
          <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            예시 답변 · AI 연결 전
          </span>
        )}
      </div>
    </div>
  );
}

export function BotAvatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-blue-200 text-base" aria-hidden="true">
      🌊
    </span>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2" role="status" aria-label="답변을 준비하고 있어요">
      <BotAvatar />
      <div className="flex gap-1 rounded-2xl rounded-tl-md border border-blue-100 bg-white px-4 py-3.5 shadow-sm">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
