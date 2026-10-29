'use client';

import { useSyncExternalStore } from 'react';

/** @type {Record<string, { x: number, y: number, name: string, sub: string, on: boolean, dim: boolean, z: number }>} */
let labels = {};
/** @type {Record<string, { x: number, y: number, name: string, sub: string, on: boolean, dim: boolean, z: number }|null>} */
let pending = {};
let scheduled = false;
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l());
}

function flush() {
  scheduled = false;
  let changed = false;
  const next = { ...labels };
  for (const [id, data] of Object.entries(pending)) {
    if (data == null) {
      if (id in next) {
        delete next[id];
        changed = true;
      }
      continue;
    }
    const prev = next[id];
    if (
      prev
      && prev.x === data.x
      && prev.y === data.y
      && prev.sub === data.sub
      && prev.on === data.on
      && prev.dim === data.dim
      && prev.z === data.z
      && prev.name === data.name
    ) {
      continue;
    }
    next[id] = data;
    changed = true;
  }
  pending = {};
  if (!changed) return;
  labels = next;
  emit();
}

export function setDistrictLabel(id, data) {
  pending[id] = data
    ? {
        ...data,
        x: Math.round(data.x),
        y: Math.round(data.y),
      }
    : null;
  if (!scheduled) {
    scheduled = true;
    queueMicrotask(flush);
  }
}

export function clearDistrictLabels() {
  pending = {};
  labels = {};
  emit();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return labels;
}

export function useDistrictLabels() {
  return useSyncExternalStore(subscribe, getSnapshot, () => ({}));
}
