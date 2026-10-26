// 챗봇 · 사용자 조건 테스트 페이지 (localhost:3000/chatbot)
// layout.tsx에 챗봇이 통합되기 전까지 여기서 확인해요.

import ChatbotWidget from "@/components/chatbot/ChatbotWidget";
import UserConditionsForm from "@/components/chatbot/UserConditionsForm";
import UserConditionsPreview from "@/components/chatbot/UserConditionsPreview";

export default function ChatbotTestPage() {
  return (
    <main className="flex-1 bg-[#f4f7fc] px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-semibold text-blue-600">MOVESAN · 개발 확인용</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">AI 챗봇 · 사용자 조건</h1>
          <p className="mt-2 text-sm text-slate-500">
            오른쪽 아래 버튼으로 챗봇을 열어 보세요. 지금은 AI 연결 전이라 예시 답변이 나와요.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800">내 조건 입력</h2>
            <UserConditionsForm />
          </section>
          <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-slate-800">저장된 데이터</h2>
            <p className="mb-4 text-xs text-slate-500">다른 페이지가 읽게 될 사용자 조건 형식이에요.</p>
            <UserConditionsPreview />
          </section>
        </div>
      </div>

      <ChatbotWidget />
    </main>
  );
}
