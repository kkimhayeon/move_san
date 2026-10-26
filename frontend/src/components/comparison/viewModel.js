// 결과 화면이 그릴 숫자. 월 입력은 compareDetailed가 맡고, 여기서 1년 금액과 부호를 맞춘다.
// cityDelta: 부산 − 서울 (표의 차이 열)
// leftoverImpact: 그 항목이 1년 잔여금을 얼마나 바꾸는지. 지출은 부호가 반대다.
import { compareDetailed, livingDetail, 물가비율 } from '@/utils/calc';
import { fmtInt } from '@/utils/formatMoney';

export const YEAR_MONTHS = 12;
const SAME_MANWON = 0.5;

export function isSameAmount(value) {
  return Math.abs(value) < SAME_MANWON;
}

export function formatSigned(value) {
  if (isSameAmount(value)) return '0';
  return `${value > 0 ? '+' : '−'}${fmtInt(Math.abs(value))}`;
}

const perYear = (monthly) => monthly * YEAR_MONTHS;

function leftoverWord(cost, impact) {
  if (isSameAmount(impact)) return '같아요';
  if (cost) return impact > 0 ? '아껴요' : '더 써요';
  return impact > 0 ? '더 벌어요' : '덜 벌어요';
}

export function buildComparisonView(values) {
  const result = compareDetailed(values);
  const specs = [
    { key: 'pay', label: '세후 월급', waterfallLabel: '월급', monthly: (side) => side.pay },
    { key: 'rent', label: '월세', waterfallLabel: '월세', cost: true, chart: 'rent', hint: '누르면 월세 그래프', monthly: (side) => side.rent },
    {
      key: 'living',
      label: '생활비',
      waterfallLabel: '생활비',
      cost: true,
      chart: 'living',
      hint: `부산은 서울 생활비 × ${물가비율} · 누르면 세부 항목`,
      monthly: (side) => side.living,
    },
  ];

  const rows = specs.map((spec) => {
    const seoulYear = perYear(spec.monthly(result.seoul));
    const busanYear = perYear(spec.monthly(result.busan));
    const cityDelta = busanYear - seoulYear;
    const leftoverImpact = spec.cost ? seoulYear - busanYear : cityDelta;
    return {
      key: spec.key,
      label: spec.label,
      waterfallLabel: spec.waterfallLabel,
      cost: Boolean(spec.cost),
      chart: spec.chart || null,
      hint: spec.hint || null,
      seoulYear,
      busanYear,
      cityDelta,
      leftoverImpact,
      favorable: isSameAmount(cityDelta) ? null : (spec.cost ? cityDelta < 0 : cityDelta > 0),
      word: leftoverWord(Boolean(spec.cost), leftoverImpact),
    };
  });

  const gain = result.yearlyDiff >= 0;
  const ranked = [...rows].sort((a, b) => (gain ? b.leftoverImpact - a.leftoverImpact : a.leftoverImpact - b.leftoverImpact));
  const top = ranked[0] && !isSameAmount(ranked[0].leftoverImpact) ? ranked[0] : null;
  const livingRows = livingDetail(result.seoul.living).map((item) => ({
    label: item.label,
    example: item.example,
    shortLabel: item.shortLabel,
    seoulYear: perYear(item.seoul),
    busanYear: perYear(item.busan),
    samePrice: item.ratio === 1,
    savingPercent: Math.round((1 - item.ratio) * 100),
  }));

  return {
    result,
    rows,
    gain,
    top,
    livingRows,
    seoulLeftYear: perYear(result.seoul.left),
    busanLeftYear: perYear(result.busan.left),
  };
}

export function groupsForChart(tab, view) {
  const row = (key) => view.rows.find((item) => item.key === key);
  if (tab === 'rent') {
    const rent = row('rent');
    return [{ label: '월세', seoul: rent.seoulYear, busan: rent.busanYear }];
  }
  if (tab === 'living') {
    return view.livingRows.map((item) => ({ label: item.shortLabel, seoul: item.seoulYear, busan: item.busanYear }));
  }
  return [
    { label: '월세', seoul: row('rent').seoulYear, busan: row('rent').busanYear },
    { label: '생활비', seoul: row('living').seoulYear, busan: row('living').busanYear },
    { label: '남는 돈', seoul: Math.max(0, view.seoulLeftYear), busan: Math.max(0, view.busanLeftYear) },
  ];
}
