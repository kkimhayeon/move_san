'use client';

// 사용자 조건 저장소 (챗봇 '내 조건' 탭에서 입력·수정)
// - 이 브라우저의 localStorage에만 저장하고, 서버로는 보내지 않는다.
// - 다른 페이지에서는 useUserConditions()로 읽는다.
// - 계산기 입력값(stores/comparison.js)은 읽기만 한다. 내 조건에 값이 없으면 계산기 값을 대신 보여준다.
// - 금액 단위는 계산기와 같은 '만원 / 월'. 값이 없으면 null.
import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { useComparisonStore } from '@/stores/comparison';

export const EMPTY_CONDITIONS = {
  version: 1,
  age: null, // 만 나이
  employmentStatus: null, // 'employed' | 'jobOffer' | 'jobSeeking' | 'student' | 'other'
  seoulMonthlySalary: null, // 서울 세후 월급 (계산기 seoulPay와 같은 의미)
  busanMonthlySalary: null, // 부산 세후 월급 (계산기 busanPay)
  seoulMonthlyRent: null, // 서울 월세 (계산기 seoulRent)
  busanMonthlyRent: null, // 부산 월세 (계산기 busanRent)
  seoulMonthlyLiving: null, // 서울 생활비 (계산기 living)
  housingType: null, // 'monthlyRent' | 'jeonse' | 'withFamily' | 'own' | 'other'
  incomeBand: null, // 'under2000' | '2000to4000' | 'over4000' (연소득, 만원)
  busanWorkDistrict: null, // 부산 근무 예정 구·군 (예: '해운대구')
  updatedAt: null, // 마지막 저장 시각 (ISO 문자열)
};

export const EMPLOYMENT_LABELS = {
  employed: '재직 중',
  jobOffer: '부산 오퍼 받음',
  jobSeeking: '구직 중',
  student: '학생',
  other: '기타',
};

export const HOUSING_LABELS = {
  monthlyRent: '월세',
  jeonse: '전세',
  withFamily: '가족과 거주',
  own: '자가',
  other: '기타',
};

export const INCOME_LABELS = {
  under2000: '2천만원 이하',
  '2000to4000': '2천~4천만원',
  over4000: '4천만원 초과',
};

// 계산기 입력칸 ↔ 내 조건 필드 (계산기 값은 읽기만 함)
const FROM_CALCULATOR = {
  seoulMonthlySalary: 'seoulPay',
  busanMonthlySalary: 'busanPay',
  seoulMonthlyRent: 'seoulRent',
  busanMonthlyRent: 'busanRent',
  seoulMonthlyLiving: 'living',
  age: 'age',
};

const KEY = 'movesan-user-conditions';

export const useUserConditionsStore = create((set, get) => ({
  conditions: { ...EMPTY_CONDITIONS },
  loaded: false,
  hydrate: () => {
    if (get().loaded) return;
    let conditions = { ...EMPTY_CONDITIONS };
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved && saved.version === 1) conditions = { ...EMPTY_CONDITIONS, ...saved };
    } catch {}
    set({ conditions, loaded: true });
  },
  save: (patch) => {
    const conditions = { ...get().conditions, ...patch, version: 1, updatedAt: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(conditions)); } catch {}
    set({ conditions });
  },
  clear: () => {
    try { localStorage.removeItem(KEY); } catch {}
    set({ conditions: { ...EMPTY_CONDITIONS } });
  },
}));

const toNum = (v) => (v === null || v === undefined || String(v).trim() === '' || Number.isNaN(Number(v)) ? null : Number(v));

// 다른 페이지에서 쓰는 hook — 내 조건 + (비어 있는 칸은) 계산기 입력값
// 반환: { ...조건 필드, fromCalculator: ['seoulMonthlyRent', ...] (계산기 값으로 채운 필드) }
export function useUserConditions() {
  const conditions = useUserConditionsStore((s) => s.conditions);
  const hydrate = useUserConditionsStore((s) => s.hydrate);
  const calcInputs = useComparisonStore((s) => s.inputs);

  useEffect(() => { hydrate(); }, [hydrate]);

  return useMemo(() => {
    const merged = { ...conditions, fromCalculator: [] };
    for (const [field, calcKey] of Object.entries(FROM_CALCULATOR)) {
      if (merged[field] === null) {
        const v = toNum(calcInputs?.[calcKey]);
        if (v !== null) {
          merged[field] = v;
          merged.fromCalculator.push(field);
        }
      }
    }
    return merged;
  }, [conditions, calcInputs]);
}

// 조건을 하나라도 입력했는지 (계산기 값 포함)
export function hasAnyCondition(c) {
  return Object.entries(c).some(([k, v]) => !['version', 'updatedAt', 'fromCalculator'].includes(k) && v !== null);
}
