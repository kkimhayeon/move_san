'use client';

const ICONS = {
  pay: 'M3 7h18v12H3z M3 7l3-3h12l3 3 M16 13h2',
  rent: 'M3 11l9-7 9 7 M5 10v10h14V10 M10 20v-6h4v6',
  living: 'M4 8h16l-1.5 11h-13z M8 8V6a4 4 0 0 1 8 0v2',
};

export function FieldIcon({ name, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

export const SEOUL_FIELDS = [
  { key: 'seoulPay', icon: 'pay', label: '월급', placeholder: '예) 380' },
  { key: 'seoulRent', icon: 'rent', label: '월세 (주거비)', placeholder: '예) 90' },
  { key: 'seoulLiving', icon: 'living', label: '생활비 (식비, 통신비 등)', placeholder: '예) 120', hint: 'livingRatio' },
];

export const BUSAN_FIELDS = [
  { key: 'busanPay', icon: 'pay', label: '월급', placeholder: '예) 420', mirror: 'seoulPay' },
  { key: 'busanRent', icon: 'rent', label: '월세 (주거비)', placeholder: '예) 55', hint: 'map' },
];
