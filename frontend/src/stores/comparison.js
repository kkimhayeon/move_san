'use client';

// 계산기, 결과, 동네 지도가 공유하는 입력값.
// 새로고침해도 남도록 sessionStorage에만 두고, 서버로는 보내지 않는다.
import { useEffect } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { parseMoney } from '@/utils/moneyInput';

export const EMPTY = {
  seoulPay: '',
  seoulRent: '',
  seoulLiving: '',
  busanPay: '',
  busanRent: '',
};

export const REQUIRED = ['seoulPay', 'seoulRent', 'seoulLiving', 'busanPay', 'busanRent'];

export const LABELS = {
  seoulPay: '서울 세후 월급',
  seoulRent: '서울 월세',
  seoulLiving: '서울 생활비',
  busanPay: '부산 세후 월급',
  busanRent: '부산 월세',
};

export function missingPrompt(keys) {
  return `${keys.map((key) => LABELS[key]).join(', ')}을(를) 입력해 주세요.`;
}

const KEY = 'busansallim-inputs';

function asText(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function readSavedInputs() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (!saved || typeof saved !== 'object') return { ...EMPTY };
    const inputs = { ...EMPTY };
    for (const key of Object.keys(EMPTY)) {
      const text = asText(saved[key]);
      if (text != null) inputs[key] = text;
    }
    // 예전 저장값은 서울 생활비 키가 living이었다.
    if (!inputs.seoulLiving) {
      const legacy = asText(saved.living);
      if (legacy) inputs.seoulLiving = legacy;
    }
    return inputs;
  } catch {
    return { ...EMPTY };
  }
}

export const useComparisonStore = create((set) => ({
  inputs: { ...EMPTY },
  loaded: false,
  setField: (key, value) => set((state) => ({ inputs: { ...state.inputs, [key]: value } })),
  setInputs: (inputs) => set({ inputs }),
  reset: () => set({ inputs: { ...EMPTY } }),
  hydrate: () => set({ inputs: readSavedInputs(), loaded: true }),
}));

useComparisonStore.subscribe((state, prev) => {
  if (!state.loaded) return;
  if (prev?.loaded && state.inputs === prev.inputs) return;
  try { sessionStorage.setItem(KEY, JSON.stringify(state.inputs)); } catch {}
});

export function ComparisonHydration() {
  useEffect(() => {
    useComparisonStore.getState().hydrate();
  }, []);
  return null;
}

export function useComparisonInputs() {
  return useComparisonStore(useShallow((state) => ({
    inputs: state.inputs,
    setField: state.setField,
    setInputs: state.setInputs,
    reset: state.reset,
  })));
}

export function useNumbers() {
  const inputs = useComparisonStore((state) => state.inputs);
  const values = Object.fromEntries(Object.keys(EMPTY).map((key) => [key, parseMoney(inputs[key])]));
  const missing = REQUIRED.filter((key) => values[key] === null);
  return { values, missing, complete: missing.length === 0 };
}
