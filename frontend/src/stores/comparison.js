'use client';

// 계산기, 결과, 동네 지도가 공유하는 입력값·API 결과.
// 입력값만 sessionStorage에 두고, API result는 새로고침 시 사라진다 (결과 페이지는 재계산 안내).
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
/** 부산 월급 스테퍼 단위 (화면 단위: 만원) */
export const BUSAN_PAY_STEP = 10;

function asText(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function moneyText(value) {
  if (!Number.isFinite(value)) return '';
  return Number.isInteger(value) ? String(value) : String(value);
}

function readSaved() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (!saved || typeof saved !== 'object') {
      return { inputs: { ...EMPTY }, payLinked: true };
    }
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

    let payLinked = typeof saved.payLinked === 'boolean'
      ? saved.payLinked
      : (!inputs.busanPay || inputs.busanPay === inputs.seoulPay);

    // 연동 중이면 서울 월급을 부산에도 맞춰 둔다.
    if (payLinked && inputs.seoulPay) {
      inputs.busanPay = inputs.seoulPay;
    }

    return { inputs, payLinked };
  } catch {
    return { inputs: { ...EMPTY }, payLinked: true };
  }
}

function clearResultSlice() {
  return { result: null, status: 'idle', error: null };
}

export const useComparisonStore = create((set) => ({
  inputs: { ...EMPTY },
  /** 서울 월급 변경 시 부산 월급도 같이 맞출지 */
  payLinked: true,
  result: null,
  /** idle | loading | ready | error */
  status: 'idle',
  error: null,
  loaded: false,
  setField: (key, value) => set((state) => {
    if (key === 'seoulPay') {
      const inputs = { ...state.inputs, seoulPay: value };
      if (state.payLinked) inputs.busanPay = value;
      return { inputs, ...clearResultSlice() };
    }
    if (key === 'busanPay') {
      return {
        inputs: { ...state.inputs, busanPay: value },
        payLinked: false,
        ...clearResultSlice(),
      };
    }
    return {
      inputs: { ...state.inputs, [key]: value },
      ...clearResultSlice(),
    };
  }),
  setInputs: (inputs) => set({ inputs, ...clearResultSlice() }),
  linkBusanPayToSeoul: () => set((state) => ({
    inputs: { ...state.inputs, busanPay: state.inputs.seoulPay },
    payLinked: true,
    ...clearResultSlice(),
  })),
  nudgeBusanPay: (delta) => set((state) => {
    const current = parseMoney(state.inputs.busanPay)
      ?? parseMoney(state.inputs.seoulPay)
      ?? 0;
    const next = Math.max(0, current + delta);
    return {
      inputs: { ...state.inputs, busanPay: moneyText(next) },
      payLinked: false,
      ...clearResultSlice(),
    };
  }),
  beginCompare: () => set({ result: null, status: 'loading', error: null }),
  setResult: (result) => set({ result, status: 'ready', error: null }),
  setCompareError: (error) => set({ result: null, status: 'error', error }),
  clearResult: () => set({ result: null, status: 'idle', error: null }),
  reset: () => set({
    inputs: { ...EMPTY },
    payLinked: true,
    result: null,
    status: 'idle',
    error: null,
  }),
  hydrate: () => {
    const saved = readSaved();
    set({ inputs: saved.inputs, payLinked: saved.payLinked, loaded: true });
  },
}));

useComparisonStore.subscribe((state, prev) => {
  if (!state.loaded) return;
  if (
    prev?.loaded
    && state.inputs === prev.inputs
    && state.payLinked === prev.payLinked
  ) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({
      ...state.inputs,
      payLinked: state.payLinked,
    }));
  } catch {}
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
    payLinked: state.payLinked,
    setField: state.setField,
    setInputs: state.setInputs,
    linkBusanPayToSeoul: state.linkBusanPayToSeoul,
    nudgeBusanPay: state.nudgeBusanPay,
    beginCompare: state.beginCompare,
    setResult: state.setResult,
    setCompareError: state.setCompareError,
    clearResult: state.clearResult,
    reset: state.reset,
  })));
}

export function useComparisonResult() {
  return useComparisonStore((state) => state.result);
}

export function useComparisonStatus() {
  return useComparisonStore(useShallow((state) => ({
    status: state.status,
    error: state.error,
  })));
}

export function useNumbers() {
  const inputs = useComparisonStore((state) => state.inputs);
  const values = Object.fromEntries(Object.keys(EMPTY).map((key) => [key, parseMoney(inputs[key])]));
  const missing = REQUIRED.filter((key) => values[key] === null);
  return { values, missing, complete: missing.length === 0 };
}
