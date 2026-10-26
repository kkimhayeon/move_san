// 무브산 AI 도우미 — 답변 만들기
// 1) .env.local에 NEXT_PUBLIC_API_URL이 있으면 Flask POST /api/chat 으로 실제 AI 답변을 받는다 (api/chat.js sendChat)
// 2) API 주소가 없으면 아래 규칙 기반 '예시(Mock) 답변'으로 대신 답한다 — 화면에 '예시 답변 · AI 연결 전'으로 표시
//    (실제 AI 답변처럼 보이지 않게 AiChat.js에서 isMock 표시를 붙인다)
import { GU, SPOTS } from '@/constants/busan';
import { BENEFITS } from '@/constants/benefits';
import { ROUTES } from '@/constants/routes';
import { compareDetailed, LIVING_ITEMS, 물가비율 } from '@/utils/calc';
import { fmt } from '@/utils/formatMoney';

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const won = (n) => Math.round(n).toLocaleString('ko-KR');

// 질문에서 구·군 찾기: "해운대구", "해운대", 동 이름(남천동), 명소(서면, 광안리해수욕장)
function findGu(q) {
  const t = q.replace(/\s/g, '');
  for (const g of GU) {
    const short = g.name.replace(/[구군]$/, '');
    if (t.includes(g.name) || (short.length >= 2 && t.includes(short))) return g;
  }
  for (const g of GU) if (g.dongs.some((d) => t.includes(d) || (d.length >= 3 && t.includes(d.replace(/동$/, ''))))) return g;
  for (const [gu, spots] of Object.entries(SPOTS)) {
    if (spots.some(([name]) => { const n = name.split(/[·\s]/)[0]; return n.length >= 2 && t.includes(n); })) return GU.find((g) => g.name === gu);
  }
  return null;
}

// 추천 질문 (FE 과제 4번 챗봇 기준 4개)
export const SUGGESTIONS = [
  '서울에서 부산으로 이사하면 생활비가 얼마나 줄어들까?',
  '부산에서 받을 수 있는 청년 지원금은?',
  '부산에서 월세가 저렴한 지역은?',
  '부산으로 이직하면 어떤 경제적 장점이 있을까?',
];

// 내 조건(stores/userConditions.js의 useUserConditions 값)으로 '한 달에 남는 돈' 비교
function conditionsCompare(c) {
  const need = [c.seoulMonthlySalary, c.busanMonthlySalary, c.seoulMonthlyRent, c.busanMonthlyRent, c.seoulMonthlyLiving];
  if (!c || need.some((v) => v === null || v === undefined)) return null;
  const seoulLeft = c.seoulMonthlySalary - c.seoulMonthlyRent - c.seoulMonthlyLiving;
  const busanLeft = c.busanMonthlySalary - c.busanMonthlyRent - c.seoulMonthlyLiving * 물가비율;
  return { seoulLeft, busanLeft, diff: busanLeft - seoulLeft };
}

// 추천 질문 4개에 대한 예시 답변 (내 조건이 있으면 금액으로 계산)
function suggestedReply(q, c) {
  const t = q.replace(/\s/g, '');
  const pct = Math.round((1 - 물가비율) * 1000) / 10;

  if (/(이직|취업|경제적|장점)/.test(t)) {
    const r = conditionsCompare(c);
    if (r) {
      const gain = r.diff >= 0;
      return {
        text: `내 조건으로 계산하면\n· 서울: 한 달 ${fmt(r.seoulLeft)}만원 남음\n· 부산: 한 달 ${fmt(r.busanLeft)}만원 남음\n` +
          `부산이 한 달 **${fmt(Math.abs(r.diff))}만원 ${gain ? '더' : '덜'}** 남고, 1년이면 약 ${won(Math.abs(r.diff) * 12)}만원이에요.\n교통비 등은 빠져 있으니 계산기에서 한 번 더 확인해 주세요.`,
        links: [{ href: ROUTES.home, label: '계산기에서 확인' }],
      };
    }
    return {
      text: `부산으로 옮기면 보통 이런 부분에서 차이가 생겨요.\n· 월세(주거비) — 가장 큰 차이\n· 생활물가 — 서울보다 약 ${pct}% 낮음\n· 부산 청년 지원 정책\n'내 조건' 탭에 월급·월세·생활비를 넣으면 한 달에 얼마 더 남는지 계산해 드릴게요.`,
      showConditions: true,
    };
  }

  if (/(생활비|물가)/.test(t) && /(줄어|얼마나|이사)/.test(t)) {
    const lines = [`생활비 계산기 기준으로 부산의 생활물가는 서울보다 **약 ${pct}% 낮아요** (주거비 제외).`];
    if (c?.seoulMonthlyLiving != null) {
      const busan = c.seoulMonthlyLiving * 물가비율;
      lines.push(`서울 생활비 ${fmt(c.seoulMonthlyLiving)}만원 기준이면 부산에서는 약 **${fmt(busan)}만원**, 한 달에 약 ${fmt(c.seoulMonthlyLiving - busan)}만원 줄어요.`);
    } else {
      lines.push(`'내 조건' 탭에 서울 생활비를 넣으면 금액으로 계산해 드릴게요.`);
    }
    if (c?.seoulMonthlyRent != null && c?.busanMonthlyRent != null) {
      const d = c.seoulMonthlyRent - c.busanMonthlyRent;
      lines.push(`월세는 ${fmt(Math.abs(d))}만원 ${d >= 0 ? '줄어들어요' : '늘어나요'}.`);
    }
    return { text: lines.join('\n'), links: [{ href: ROUTES.home, label: '내 생활비로 계산하기' }] };
  }

  if (/(지원금|혜택|정책)/.test(t) && /청년/.test(t)) {
    const cats = [...new Set(BENEFITS.map((b) => b.cat))].join(', ');
    const lines = [`부산 청년 혜택은 **${cats}** 분야로 모아 두었어요.`];
    if (c?.age != null) lines.push(`정책마다 나이 기준이 달라서, 만 ${c.age}세가 대상인지는 각 공고에서 확인이 필요해요.`);
    lines.push('※ 금액과 조건은 아직 정리 중이라 각 기관 공고를 꼭 확인해 주세요.');
    return { text: lines.join('\n'), links: [{ href: ROUTES.benefits, label: '청년 혜택 보기' }] };
  }

  return null; // 월세 저렴한 지역 등은 아래 기존 규칙으로 답함
}

// values: 계산기 입력값(숫자), complete: 필수값을 다 넣었는지, conditions: 내 조건(useUserConditions)
export function localReply(question, { values, complete, conditions }) {
  const q = question.trim();
  const all = median(GU.map((g) => g.rent));

  const suggested = suggestedReply(q, conditions);
  if (suggested) return suggested;

  if (/^(안녕|하이|hi|hello)/i.test(q)) {
    return { text: '안녕하세요! 무브산 AI 도우미예요 😀\n부산 동네 월세, 생활비 차이, 내 조건으로 1년에 얼마 남는지 물어보세요.' };
  }

  if (/(얼마.*남|남는|모을|모으|내 ?조건|계산|잔여)/.test(q)) {
    if (!complete) {
      return { text: '내 조건으로 계산하려면 먼저 **생활비 계산기**에 서울·부산 월급과 월세, 생활비를 넣어 주세요. 다 넣으면 여기서도 바로 알려드릴게요.', links: [{ href: ROUTES.home, label: '계산기 열기' }] };
    }
    const r = compareDetailed({
      seoulPay: values.seoulPay, seoulRent: values.seoulRent, seoulLiving: values.living, seoulTransport: values.seoulTransport,
      busanPay: values.busanPay, busanRent: values.busanRent, busanLiving: values.busanLiving, busanTransport: values.busanTransport,
    });
    const gain = r.yearlyDiff >= 0;
    return {
      text: `입력하신 조건이면 부산으로 옮겼을 때 **1년에 ${won(Math.abs(r.yearlyDiff))}만원 ${gain ? '더 남아요' : '덜 남아요'}**.\n` +
        `· 서울: 한 달 ${fmt(r.seoul.left)}만원 남음\n· 부산: 한 달 ${fmt(r.busan.left)}만원 남음\n` +
        (gain ? '가장 큰 차이는 월세예요. 동네를 바꾸면 더 늘어날 수도 있어요.' : '월세가 더 낮은 동네를 골라 보면 차이가 줄어들 수 있어요.'),
      links: [{ href: ROUTES.result, label: '결과 자세히 보기' }, { href: ROUTES.map, label: '동네 월세 비교' }],
    };
  }

  if (/(싼|저렴|낮은|싸게)/.test(q) && /(동네|구|지역|월세|어디)/.test(q)) {
    const list = [...GU].sort((a, b) => a.rent - b.rent).slice(0, 3);
    return { text: `원룸 월세가 낮은 곳은\n${list.map((g, i) => `${i + 1}. ${g.name} ${g.rent}만원`).join('\n')}\n이에요. 부산 전체 중앙값은 ${fmt(all)}만원이에요.\n※ 지금은 예시 데이터예요.`, links: [{ href: ROUTES.map, label: '지도에서 보기' }] };
  }
  if (/(비싼|높은|비싸)/.test(q) && /(동네|구|지역|월세|어디)/.test(q)) {
    const list = [...GU].sort((a, b) => b.rent - a.rent).slice(0, 3);
    return { text: `원룸 월세가 높은 곳은\n${list.map((g, i) => `${i + 1}. ${g.name} ${g.rent}만원`).join('\n')}\n이에요. 바다·업무지구와 가까운 곳이 높은 편이에요.\n※ 지금은 예시 데이터예요.`, links: [{ href: ROUTES.map, label: '지도에서 보기' }] };
  }

  const gu = findGu(q);
  if (gu) {
    const d = gu.rent - all;
    const spots = (SPOTS[gu.name] || []).slice(0, 3).map((s) => s[0]).join(', ');
    const save = values.seoulRent != null && !Number.isNaN(values.seoulRent) ? values.seoulRent - gu.rent : null;
    return {
      text: `**${gu.name}** 원룸 월세 중앙값은 **${gu.rent}만원**이에요. 부산 전체 중앙값(${fmt(all)}만원)보다 ${Math.abs(d) < 0.05 ? '비슷해요' : `${fmt(Math.abs(d))}만원 ${d > 0 ? '높아요' : '낮아요'}`}.\n` +
        (save != null ? `내 서울 월세(${fmt(values.seoulRent)}만원)와 비교하면 월 ${fmt(Math.abs(save))}만원 ${save >= 0 ? '아낄 수 있어요' : '더 비싸요'}.\n` : '') +
        (spots ? `대표 장소: ${spots}\n` : '') + '※ 월세는 지금 예시 데이터예요.',
      links: [{ href: `${ROUTES.map}?gu=${encodeURIComponent(gu.name)}`, label: `${gu.name} 지도에서 보기` }],
    };
  }

  if (/(생활비|물가|장보|외식|식비)/.test(q)) {
    const lines = LIVING_ITEMS.filter((it) => it.ratio < 1).map((it) => `· ${it.label}: ${Math.round((1 - it.ratio) * 100)}% 저렴 (${it.example})`).join('\n');
    return {
      text: `부산 생활비는 서울보다 약 **${Math.round((1 - 물가비율) * 1000) / 10}% 저렴**해요 (서울 = 100일 때 부산 ${Math.round(물가비율 * 1000) / 10}).\n${lines}\n· 그 외 교통·통신·의류 등은 같은 가격으로 계산했어요.\n기준: 통계청 가계동향(39세 이하 근로자가구) 지출 비중 × 행안부 지방물가`,
      links: [{ href: ROUTES.home, label: '내 생활비로 계산하기' }],
    };
  }

  if (/(혜택|정책|지원|적금|대출|금융|청년)/.test(q)) {
    const cats = [...new Set(BENEFITS.map((b) => b.cat))].join(', ');
    return { text: `부산 청년 혜택은 **${cats}** 분야로 모아 두었어요. 정책 이름이나 요약에 들어 있는 말로 찾아볼 수 있어요.\n※ 조건은 아직 정리 중이라 각 기관 공고를 꼭 확인해 주세요.`, links: [{ href: ROUTES.benefits, label: '청년 혜택 보기' }] };
  }

  if (/(교통|지하철|버스|출퇴근)/.test(q)) {
    return { text: '부산 지하철은 교통카드 기준 1,600원이에요. 출퇴근 왕복 월 22일이면 약 7만원이에요.\n교통비는 사람마다 달라서 계산기에 직접 넣도록 했어요.', links: [{ href: ROUTES.home, label: '계산기에 교통비 넣기' }] };
  }

  return {
    text: '아직 그 질문은 잘 모르겠어요 😅\n동네 월세, 생활비 차이, 내 조건 계산, 청년 혜택에 대해 물어봐 주세요.',
    suggest: true,
  };
}
