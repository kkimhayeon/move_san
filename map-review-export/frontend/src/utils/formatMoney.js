// 금액 화면 표시. 계산 단위(만원)는 바꾸지 않는다.
export const round1 = (n) => Math.round(n * 10) / 10;

export const fmt = (n) => round1(n).toLocaleString('ko-KR');

export const signed = (n) => {
  const r = round1(n);
  return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r).toLocaleString('ko-KR');
};

// 1년 합계처럼 만원 단위 정수로 보여줄 때
export const fmtInt = (n) => Math.round(n).toLocaleString('ko-KR');

export const signedInt = (n) => {
  const rounded = Math.round(n);
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '';
  return sign + Math.abs(rounded).toLocaleString('ko-KR');
};
