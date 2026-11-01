"use client";

// 사용자 조건 입력·수정 폼
// - 챗봇 패널의 '내 조건' 탭과 /chatbot 테스트 페이지에서 함께 사용
// - 저장하면 localStorage에 들어가고, useUserConditions()를 쓰는 모든 화면에 바로 반영

import { useState, type FormEvent } from "react";
import { clearUserConditions, saveUserConditions, useUserConditions } from "@/lib/userConditions";
import {
  BUSAN_DISTRICTS,
  DEFAULT_USER_CONDITIONS,
  EMPLOYMENT_LABELS,
  HOUSING_LABELS,
  INCOME_LABELS,
  type EmploymentStatus,
  type HousingType,
  type IncomeBand,
  type UserConditions,
} from "@/types/userConditions";

type Draft = Record<
  | "age"
  | "seoulMonthlySalary"
  | "busanMonthlySalary"
  | "seoulMonthlyRent"
  | "busanMonthlyRent"
  | "seoulMonthlyLiving"
  | "employmentStatus"
  | "housingType"
  | "incomeBand"
  | "busanWorkDistrict",
  string
>;

const toDraft = (c: UserConditions): Draft => ({
  age: c.age?.toString() ?? "",
  seoulMonthlySalary: c.seoulMonthlySalary?.toString() ?? "",
  busanMonthlySalary: c.busanMonthlySalary?.toString() ?? "",
  seoulMonthlyRent: c.seoulMonthlyRent?.toString() ?? "",
  busanMonthlyRent: c.busanMonthlyRent?.toString() ?? "",
  seoulMonthlyLiving: c.seoulMonthlyLiving?.toString() ?? "",
  employmentStatus: c.employmentStatus ?? "",
  housingType: c.housingType ?? "",
  incomeBand: c.incomeBand ?? "",
  busanWorkDistrict: c.busanWorkDistrict ?? "",
});

const num = (v: string) => (v.trim() === "" ? null : Number(v));

const MONEY_FIELDS = [
  { key: "seoulMonthlySalary", label: "서울 세후 월급", ph: "예) 300" },
  { key: "busanMonthlySalary", label: "부산 세후 월급", ph: "예) 300" },
  { key: "seoulMonthlyRent", label: "서울 월세", ph: "예) 70" },
  { key: "busanMonthlyRent", label: "부산 월세", ph: "예) 45" },
  { key: "seoulMonthlyLiving", label: "서울 생활비", ph: "예) 120" },
] as const;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

interface Props {
  /** 챗봇 패널 안처럼 좁은 곳이면 true */
  compact?: boolean;
  onSaved?: () => void;
}

export default function UserConditionsForm(props: Props) {
  const conditions = useUserConditions();
  // 저장값이 바뀌면(다른 탭/화면에서 수정) 폼을 새로 그려서 최신값으로 맞춤
  return <FormInner key={conditions.updatedAt ?? "empty"} initial={conditions} {...props} />;
}

function FormInner({ initial, compact = false, onSaved }: Props & { initial: UserConditions }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));

  const set = (key: keyof Draft, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };
  const onlyNumber = (v: string) => v.replace(/[^0-9.]/g, "");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    saveUserConditions({
      age: num(draft.age),
      seoulMonthlySalary: num(draft.seoulMonthlySalary),
      busanMonthlySalary: num(draft.busanMonthlySalary),
      seoulMonthlyRent: num(draft.seoulMonthlyRent),
      busanMonthlyRent: num(draft.busanMonthlyRent),
      seoulMonthlyLiving: num(draft.seoulMonthlyLiving),
      employmentStatus: (draft.employmentStatus || null) as EmploymentStatus | null,
      housingType: (draft.housingType || null) as HousingType | null,
      incomeBand: (draft.incomeBand || null) as IncomeBand | null,
      busanWorkDistrict: draft.busanWorkDistrict || null,
    });
    onSaved?.();
  };

  const reset = () => {
    clearUserConditions();
    setDraft(toDraft(DEFAULT_USER_CONDITIONS));
  };

  const grid = compact ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-4 sm:grid-cols-2";

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-xs leading-relaxed text-slate-500">
        입력한 조건은 이 브라우저에만 저장되고, 챗봇 답변에 활용돼요. 금액은 <b>만원 / 월</b> 기준이에요.
      </p>

      <div className={grid}>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">만 나이</span>
          <input inputMode="numeric" className={inputClass} placeholder="예) 27" value={draft.age} onChange={(e) => set("age", e.target.value.replace(/[^0-9]/g, ""))} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">현재 상태</span>
          <select className={inputClass} value={draft.employmentStatus} onChange={(e) => set("employmentStatus", e.target.value)}>
            <option value="">선택 안 함</option>
            {Object.entries(EMPLOYMENT_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>

        {MONEY_FIELDS.map((f) => (
          <label key={f.key} className="space-y-1">
            <span className="text-xs font-semibold text-slate-600">{f.label}</span>
            <span className="relative block">
              <input inputMode="decimal" className={`${inputClass} pr-12`} placeholder={f.ph} value={draft[f.key]} onChange={(e) => set(f.key, onlyNumber(e.target.value))} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">만원</span>
            </span>
          </label>
        ))}

        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">주거 형태</span>
          <select className={inputClass} value={draft.housingType} onChange={(e) => set("housingType", e.target.value)}>
            <option value="">선택 안 함</option>
            {Object.entries(HOUSING_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">연소득 구간</span>
          <select className={inputClass} value={draft.incomeBand} onChange={(e) => set("incomeBand", e.target.value)}>
            <option value="">선택 안 함</option>
            {Object.entries(INCOME_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">부산 근무 예정지</span>
          <select className={inputClass} value={draft.busanWorkDistrict} onChange={(e) => set("busanWorkDistrict", e.target.value)}>
            <option value="">선택 안 함</option>
            {BUSAN_DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
          조건 저장
        </button>
        <button type="button" onClick={reset} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50">
          모두 지우기
        </button>
      </div>
      {initial.updatedAt && (
        <p className="text-[11px] text-slate-400">마지막 저장: {new Date(initial.updatedAt).toLocaleString("ko-KR")}</p>
      )}
    </form>
  );
}
