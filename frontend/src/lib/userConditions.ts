// 사용자 조건 저장소 (클라이언트 컴포넌트에서 사용)
// - 브라우저 localStorage에 저장 → 새로고침해도 유지, 서버로는 보내지 않음
// - 어느 페이지에서든 useUserConditions()로 읽고, saveUserConditions()로 고치면 모든 화면이 함께 바뀜
// - layout.tsx에 Provider를 넣지 않아도 동작하도록 외부 저장소(useSyncExternalStore) 방식 사용

import { useSyncExternalStore } from "react";
import { DEFAULT_USER_CONDITIONS, type UserConditions } from "@/types/userConditions";

const STORAGE_KEY = "movesan:userConditions";
const CHANGE_EVENT = "movesan:userConditions-change";

let cache: UserConditions | null = null;

function read(): UserConditions {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<UserConditions>) : null;
    cache = parsed && parsed.version === 1 ? { ...DEFAULT_USER_CONDITIONS, ...parsed } : DEFAULT_USER_CONDITIONS;
  } catch {
    cache = DEFAULT_USER_CONDITIONS;
  }
  return cache;
}

function write(next: UserConditions) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 저장이 막힌 환경(시크릿 모드 등)에서는 화면 안에서만 유지
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** 현재 조건 (컴포넌트 밖에서 읽을 때) */
export function getUserConditions(): UserConditions {
  if (typeof window === "undefined") return DEFAULT_USER_CONDITIONS;
  return read();
}

/** 일부 필드만 바꿔서 저장 */
export function saveUserConditions(patch: Partial<Omit<UserConditions, "version" | "updatedAt">>) {
  write({ ...read(), ...patch, version: 1, updatedAt: new Date().toISOString() });
}

/** 모두 지우기 */
export function clearUserConditions() {
  write(DEFAULT_USER_CONDITIONS);
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null; // 다른 탭에서 바뀐 경우 다시 읽기
      onChange();
    }
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** React 컴포넌트에서 사용자 조건 읽기 (바뀌면 자동으로 다시 그려짐) */
export function useUserConditions(): UserConditions {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_USER_CONDITIONS);
}

/** 조건을 하나라도 입력했는지 */
export function hasAnyCondition(c: UserConditions): boolean {
  return Object.entries(c).some(([k, v]) => k !== "version" && k !== "updatedAt" && v !== null);
}
