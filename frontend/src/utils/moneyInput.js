// 계산기 금액 입력. 화면 단위는 만원이고, 저장값은 문자열이다.

export function sanitizeMoney(raw) {
  const cleaned = String(raw).replace(/[^0-9.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot < 0) return cleaned;
  return cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
}

export function parseMoney(value) {
  const text = String(value ?? '').trim();
  if (text === '' || text === '.') return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}
