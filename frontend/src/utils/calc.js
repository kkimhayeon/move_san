import { round1 } from './formatMoney';

// 서울 vs 부산 "한 달에 남는 돈" 계산 (팀 계산식과 동일)
// 남는 돈 = 세후 월급 − 주거비 − 생활비, 부산 생활비 = 서울 생활비 × 물가비율
// 금액 단위: 만원/월

export const 물가비율 = 0.952; // 부산 생활비 지수 (서울 = 1) — 39세 이하 근로자가구 기준, 부산이 4.8% 저렴

export function compare(input) {
  const seoul = input.seoulPay - input.seoulRent - input.living;
  const busan = input.busanPay - input.busanRent - input.living * 물가비율;
  const 월차이 = busan - seoul;
  return {
    서울남는돈: round1(seoul),
    부산남는돈: round1(busan),
    월차이: round1(월차이),
    연간차이: round1(월차이 * 12),
  };
}

// 계산기 화면용: 교통비 포함, 부산 생활비는 직접 입력하지 않으면 서울 생활비 × 물가비율로 자동 계산
// 입력: { seoulPay, seoulRent, seoulLiving, seoulTransport, busanPay, busanRent, busanLiving(선택), busanTransport }
export function compareDetailed(v) {
  const busanLiving = v.busanLiving ?? v.seoulLiving * 물가비율;
  const seoul = { pay: v.seoulPay, rent: v.seoulRent, living: v.seoulLiving, transport: v.seoulTransport || 0 };
  const busan = { pay: v.busanPay, rent: v.busanRent, living: busanLiving, transport: v.busanTransport || 0 };
  seoul.left = seoul.pay - seoul.rent - seoul.living - seoul.transport;
  busan.left = busan.pay - busan.rent - busan.living - busan.transport;
  const monthlyDiff = busan.left - seoul.left;
  return { seoul, busan, monthlyDiff, yearlyDiff: monthlyDiff * 12, busanLivingAuto: v.busanLiving == null };
}

// 생활비 세부 항목 (지출 비중: 가계동향 39세 이하 근로자가구, 가격 비율: 행안부 지방물가 부산/서울)
export const LIVING_ITEMS = [
  { label: '식료품·장보기', share: 0.117, ratio: 0.930, example: '쌀·고기·채소 10품목 기준' },
  { label: '외식', share: 0.230, ratio: 0.892, example: '냉면 12,573원 → 11,726원' },
  { label: '개인서비스', share: 0.092, ratio: 0.835, example: '미용 컷트 24,224원 → 19,532원' },
  { label: '그 외 (교통·통신·의류 등)', share: 0.561, ratio: 1.0, example: '서울·부산 같은 가격으로 처리' },
];

export function livingDetail(living) {
  return LIVING_ITEMS.map((it) => {
    const seoul = living * it.share;
    const busan = seoul * it.ratio;
    return { ...it, seoul: round1(seoul), busan: round1(busan), diff: round1(busan - seoul) };
  });
}
