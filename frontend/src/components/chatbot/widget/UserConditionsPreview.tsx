"use client";

// 저장된 사용자 조건을 그대로 보여주는 확인용 박스 (/chatbot 테스트 페이지 전용)
// 다른 페이지에서는 이렇게 읽으면 돼요:
//   import { useUserConditions } from "@/lib/userConditions";
//   const conditions = useUserConditions();

import { useUserConditions } from "@/lib/userConditions";

export default function UserConditionsPreview() {
  const conditions = useUserConditions();
  return (
    <pre className="overflow-x-auto rounded-2xl bg-slate-900 p-4 text-xs leading-relaxed text-sky-100">
      {JSON.stringify(conditions, null, 2)}
    </pre>
  );
}
