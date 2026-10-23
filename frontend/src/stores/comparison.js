'use client';

// 계산기 → 결과 → 동네 지도가 공유하는 입력값.
// 새로고침해도 남도록 sessionStorage에만 두고, 서버로는 보내지 않는다.
import { useEffect } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

export const EMPTY = {
  seoulPay: '', seoulRent: '', living: '', seoulTransport: '',
  busanPay: '', busanRent: '', busanLiving: '', busanTransport: '',
  age: '',
};
// 꼭 필요한 값 (교통비·부산 생활비·나이는 선택)
export const REQUIRED = ['seoulPay', 'seoulRent', 'living', 'busanPay', 'busanRent'];
export const LABELS = {
  seoulPay: '서울 세후 월급', seoulRent: '서울 월세', living: '서울 생활비', seoulTransport: '서울 교통비',
  busanPay: '부산 세후 월급', busanRent: '부산 월세', busanLiving: '부산 생활비', busanTransport: '부산 교통비', age: '나이',
};

const KEY = 'busansallim-inputs';

export const useComparisonStore = create((set) => ({
  inputs: { ...EMPTY },
  loaded: false,
  setField: (key, value) => set((state) => ({ inputs: { ...state.inputs, [key]: value } })),
  setInputs: (inputs) => set({ inputs }),
  reset: () => set({ inputs: { ...EMPTY } }),
  hydrate: () => {
    let inputs = { ...EMPTY };
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (saved && typeof saved === 'object') inputs = { ...EMPTY, ...saved };
    } catch {}
    set({ inputs, loaded: true });
  },
}));

// 저장된 값을 읽기 전에는 빈 값을 덮어쓰지 않는다.
useComparisonStore.subscribe((state, prev) => {
  if (!state.loaded) return;
  if (prev?.loaded && state.inputs === prev.inputs) return;
  try { sessionStorage.setItem(KEY, JSON.stringify(state.inputs)); } catch {}
});

// 레이아웃에 한 번만 둔다. 첫 화면은 빈 값이고, 마운트 후에 저장값을 채운다.
export function ComparisonHydration() {
  useEffect(() => {
    useComparisonStore.getState().hydrate();
  }, []);
  return null;
}

export function useApp() {
  return useComparisonStore(useShallow((state) => ({
    inputs: state.inputs,
    setField: state.setField,
    setInputs: state.setInputs,
    reset: state.reset,
  })));
}

// 숫자로 바꾼 입력값 (빈 칸은 null)과 빠진 필수 항목
export function useNumbers() {
  const inputs = useComparisonStore((state) => state.inputs);
  const num = (v) => (String(v ?? '').trim() === '' ? null : Number(v));
  const values = Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, num(v)]));
  const missing = REQUIRED.filter((k) => values[k] === null || Number.isNaN(values[k]));
  return { values, missing, complete: missing.length === 0 };
}
