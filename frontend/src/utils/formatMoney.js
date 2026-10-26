// 금액 화면 표시. 계산 단위(만원)는 바꾸지 않는다.
export const round1 = (n) => Math.round(n * 10) / 10;

export const fmt = (n) => round1(n).toLocaleString('ko-KR');

export const signed = (n) => {
  const r = round1(n);
  return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r).toLocaleString('ko-KR');
};
