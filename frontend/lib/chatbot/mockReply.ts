// 예시(Mock) 답변
// - 실제 AI가 아니라, 정해진 규칙으로 만든 답변이에요.
// - 화면에도 항상 "예시 답변"이라고 표시돼요.
// - 백엔드 AI API가 연결되면 이 파일은 API가 없을 때만 쓰여요.

import type { UserConditions } from "@/types/userConditions";

/** 생활비 계산기와 같은 부산/서울 생활물가 비율 (1인 근로자가구 지출 비중 기준, 주거비 제외) */
const LIVING_RATIO = 0.949;

export const SUGGESTED_QUESTIONS = [
  "서울에서 부산으로 이사하면 생활비가 얼마나 줄어들까?",
  "부산에서 받을 수 있는 청년 지원금은?",
  "부산에서 월세가 저렴한 지역은?",
  "부산으로 이직하면 어떤 경제적 장점이 있을까?",
] as const;

const man = (n: number) => `${Math.round(n * 10) / 10}만원`;

function livingReply(c: UserConditions): string {
  const lines = [
    `생활비 계산기 기준으로 부산의 생활물가는 서울보다 **약 5.1% 낮아요** (서울 100 → 부산 94.9, 주거비 제외).`,
  ];
  if (c.seoulMonthlyLiving !== null) {
    const busan = c.seoulMonthlyLiving * LIVING_RATIO;
    lines.push(
      `입력하신 서울 생활비 ${man(c.seoulMonthlyLiving)}을 기준으로 하면 부산에서는 약 **${man(busan)}**, 한 달에 약 ${man(c.seoulMonthlyLiving - busan)} 줄어요.`,
    );
  } else {
    lines.push("'내 조건' 탭에 서울 생활비를 넣으면 금액으로 계산해 드릴게요.");
  }
  if (c.seoulMonthlyRent !== null && c.busanMonthlyRent !== null) {
    const diff = c.seoulMonthlyRent - c.busanMonthlyRent;
    lines.push(`월세는 ${man(Math.abs(diff))} ${diff >= 0 ? "줄어들어요" : "늘어나요"}.`);
  }
  lines.push("자세한 비교는 메인 화면의 생활비 계산기에서 확인해 주세요.");
  return lines.join("\n");
}

function benefitReply(c: UserConditions): string {
  const lines = [
    "부산 청년 지원은 크게 **주거(월세·보증금), 일자리(취업·이직), 금융(적금·대출)** 분야로 나뉘어요.",
  ];
  if (c.age !== null) {
    lines.push(`정책마다 나이 기준이 달라서, 만 ${c.age}세가 대상인지는 각 공고에서 확인이 필요해요.`);
  }
  lines.push("정확한 금액과 신청 조건은 '청년 혜택' 페이지와 각 기관 공고를 확인해 주세요.");
  return lines.join("\n");
}

function rentReply(c: UserConditions): string {
  const lines = ["아직 동네별 월세 데이터가 챗봇에 연결되지 않았어요."];
  if (c.busanWorkDistrict) {
    lines.push(`근무 예정지(${c.busanWorkDistrict}) 주변 월세는 '동네 탐색' 페이지에서 비교해 볼 수 있어요.`);
  } else {
    lines.push("'동네 탐색' 페이지에서 구·군별 월세를 비교해 볼 수 있어요.");
  }
  return lines.join("\n");
}

function moveReply(c: UserConditions): string {
  const { seoulMonthlySalary: ss, busanMonthlySalary: bs, seoulMonthlyRent: sr, busanMonthlyRent: br, seoulMonthlyLiving: sl } = c;
  if (ss !== null && bs !== null && sr !== null && br !== null && sl !== null) {
    const seoulLeft = ss - sr - sl;
    const busanLeft = bs - br - sl * LIVING_RATIO;
    const diff = busanLeft - seoulLeft;
    return [
      "입력하신 조건으로 계산하면",
      `· 서울: 한 달 ${man(seoulLeft)} 남음`,
      `· 부산: 한 달 ${man(busanLeft)} 남음`,
      `부산이 한 달 **${man(Math.abs(diff))} ${diff >= 0 ? "더" : "덜"}** 남고, 1년이면 약 ${man(Math.abs(diff) * 12)}이에요.`,
      "교통비 등은 빠져 있으니 생활비 계산기에서 다시 확인해 주세요.",
    ].join("\n");
  }
  return [
    "부산으로 옮기면 보통 이런 부분에서 차이가 생겨요.",
    "· 월세(주거비) — 가장 큰 차이",
    "· 생활물가 — 서울보다 약 5.1% 낮음",
    "· 부산 청년 지원 정책",
    "'내 조건' 탭에 월급·월세·생활비를 넣으면 한 달에 얼마 더 남는지 계산해 드릴게요.",
  ].join("\n");
}

export function getMockReply(question: string, conditions: UserConditions): string {
  const q = question.replace(/\s/g, "");

  if (/(이직|취업|경제적|장점|남아|남는|모을)/.test(q)) return moveReply(conditions);
  if (/(월세|집값|동네|지역|구)/.test(q) && /(싼|저렴|낮)/.test(q)) return rentReply(conditions);
  if (/(지원금|혜택|정책|청년)/.test(q)) return benefitReply(conditions);
  if (/(생활비|물가|줄어)/.test(q)) return livingReply(conditions);
  if (/^(안녕|하이|hi|hello)/i.test(q)) {
    return "안녕하세요! 무브산 챗봇이에요.\n생활비, 청년 지원, 월세, 이직 장점에 대해 궁금한 점을 입력해 주세요.";
  }
  return "아직 그 질문에 대한 예시 답변이 없어요.\n생활비, 청년 지원, 월세, 이직 장점에 대해 물어봐 주세요.";
}
