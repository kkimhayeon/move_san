// 결과 화면이 그릴 숫자. 금액·차이는 API result를 그대로 쓰고, 표/차트용 1년 표시만 월×12로 맞춘다.
import { livingDetail } from '@/utils/calc';
import { fmtInt } from '@/utils/formatMoney';

export const YEAR_MONTHS = 12;
const SAME_MANWON = 0.5;

const ITEM_LABELS = {
  pay: '세후 월급',
  rent: '월세',
  living: '생활비',
};

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

export function buildComparisonView(apiResult) {
  const seoul = apiResult.seoul;
  const busan = apiResult.busan;
  const livingRatio = apiResult.living_ratio;
  const diffMap = Object.fromEntries((apiResult.differences || []).map((item) => [item.item, item]));

  const specs = [
    { key: 'pay', label: ITEM_LABELS.pay, waterfallLabel: '월급', monthly: (side) => side.pay },
    { key: 'rent', label: ITEM_LABELS.rent, waterfallLabel: '월세', cost: true, chart: 'rent', hint: '누르면 월세 그래프', monthly: (side) => side.rent },
    {
      key: 'living',
      label: ITEM_LABELS.living,
      waterfallLabel: '생활비',
      cost: true,
      chart: 'living',
      hint: `부산은 서울 생활비 × ${livingRatio} · 누르면 세부 항목`,
      monthly: (side) => side.living,
    },
  ];

  const rows = specs.map((spec) => {
    const seoulYear = perYear(spec.monthly(seoul));
    const busanYear = perYear(spec.monthly(busan));
    const cityDelta = busanYear - seoulYear;
    const monthlyEffect = diffMap[spec.key]?.monthly_remaining_effect;
    const leftoverImpact = monthlyEffect != null
      ? perYear(monthlyEffect)
      : (spec.cost ? seoulYear - busanYear : cityDelta);
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

  const yearlyDiff = apiResult.annual_difference;
  const monthlyDiff = apiResult.monthly_difference;
  const gain = yearlyDiff >= 0;

  const largestItems = apiResult.largest_difference?.items ?? [];
  const topRows = rows.filter((row) => largestItems.includes(row.key));
  let top = null;
  if (topRows.length > 0) {
    const leftoverImpact = topRows.reduce((sum, row) => sum + row.leftoverImpact, 0);
    top = {
      label: topRows.map((row) => row.label).join(', '),
      leftoverImpact,
      word: leftoverWord(topRows.every((row) => row.cost), leftoverImpact),
    };
  }

  const livingRows = livingDetail(seoul.living).map((item) => ({
    label: item.label,
    example: item.example,
    shortLabel: item.shortLabel,
    seoulYear: perYear(item.seoul),
    busanYear: perYear(item.busan),
    samePrice: item.ratio === 1,
    savingPercent: Math.round((1 - item.ratio) * 100),
  }));

  return {
    result: {
      seoul: { pay: seoul.pay, rent: seoul.rent, living: seoul.living, left: seoul.monthly_remaining },
      busan: { pay: busan.pay, rent: busan.rent, living: busan.living, left: busan.monthly_remaining },
      monthlyDiff,
      yearlyDiff,
    },
    rows,
    gain,
    top,
    livingRows,
    seoulLeftYear: seoul.annual_remaining,
    busanLeftYear: busan.annual_remaining,
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
