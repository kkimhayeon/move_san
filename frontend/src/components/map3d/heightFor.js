// 월세 → 블록 높이. 지도·랜드마크·카메라가 동일 함수를 사용한다.
// 양수 최소·최댓값으로 제한해 뒤집힘·과도한 높이 가림을 막는다.
export const HEIGHT_MIN = 0.22;
export const HEIGHT_MAX = 1.55;
/** 월세 자료가 없을 때 쓰는 중립 높이 (fallback 월세값 아님) */
export const HEIGHT_MISSING = 0.42;

/**
 * @param {number|null|undefined} rent 만원 단위 월세 중앙값
 * @returns {number} 월드 단위 블록 높이
 */
export function heightFor(rent) {
  if (rent == null || !Number.isFinite(Number(rent))) return HEIGHT_MISSING;
  const raw = 0.25 + (Number(rent) - 30) * 0.05;
  return Math.min(HEIGHT_MAX, Math.max(HEIGHT_MIN, raw));
}
