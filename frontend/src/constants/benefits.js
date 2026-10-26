// 부산 청년 정책·금융상품 목록
// ⚠️ 화면 확인용 예시 → 혜택 담당이 정리한 실제 정책·상품 데이터(이름, 금액, 조건, 신청 링크)로 교체
// ages: 대상 연령대, income: 대상 소득 구간, housing: 대상 거주 형태 (조건 없으면 전부 넣기)

export const CATEGORIES = ['주거 지원', '금융 지원', '생활 지원', '취업·창업', '교통 지원', '교육·문화'];

export const FILTERS = {
  ages: { label: '연령대', options: ['19세 이하', '20대', '30대'] },
  income: { label: '소득 구간', options: ['2천만원 이하', '2~4천만원', '4천만원 이상'] },
  housing: { label: '거주 형태', options: ['무주택', '월세', '자가·기타'] },
};

const ALL_AGES = ['19세 이하', '20대', '30대'];
const ADULT = ['20대', '30대'];
const ALL_INCOME = ['2천만원 이하', '2~4천만원', '4천만원 이상'];
const LOW_MID = ['2천만원 이하', '2~4천만원'];
const ALL_HOUSING = ['무주택', '월세', '자가·기타'];

export const BENEFITS = [
  { id: 'rent', cat: '주거 지원', title: '[부산 청년 월세 지원]', desc: '부산에 사는 무주택 청년의 월세 부담을 덜어주는 지원사업 예시', info: '지원 금액·기간 [입력 필요]', org: '[주관 기관 입력]', ages: ALL_AGES, income: LOW_MID, housing: ['무주택', '월세'], featured: true },
  { id: 'deposit', cat: '주거 지원', title: '[청년 전월세 보증금 대출 이자 지원]', desc: '전월세 보증금 대출 이자의 일부를 지원하는 정책 예시', info: '이자 지원율·한도 [입력 필요]', org: '[주관 기관 입력]', ages: ADULT, income: LOW_MID, housing: ['무주택', '월세'] },
  { id: 'saving', cat: '금융 지원', title: '[부산 청년 우대적금]', desc: '부산 청년을 위한 지역 특화 적금 상품 예시', info: '금리·월 납입 한도 [입력 필요]', org: '[금융기관 입력]', ages: ALL_AGES, income: ALL_INCOME, housing: ALL_HOUSING, featured: true },
  { id: 'asset', cat: '금융 지원', title: '[청년 자산형성 적금]', desc: '청년의 목돈 마련을 돕는 정책형 적금 예시', info: '우대 조건 [입력 필요]', org: '[주관 기관 입력]', ages: ADULT, income: LOW_MID, housing: ALL_HOUSING },
  { id: 'transit', cat: '교통 지원', title: '[동백패스 교통비 환급]', desc: '월 대중교통비가 기준을 넘으면 초과분을 돌려주는 부산 교통 정책 예시', info: '환급 기준·한도 [입력 필요]', org: '[주관 기관 입력]', ages: ALL_AGES, income: ALL_INCOME, housing: ALL_HOUSING, featured: true },
  { id: 'settle', cat: '생활 지원', title: '[이주 청년 정착 지원금]', desc: '부산으로 전입한 청년의 정착을 돕는 지원 예시', info: '지원 금액·전입 조건 [입력 필요]', org: '[주관 기관 입력]', ages: ADULT, income: LOW_MID, housing: ALL_HOUSING },
  { id: 'job', cat: '취업·창업', title: '[부산 청년 일자리 지원]', desc: '부산 지역 기업에 취업한 청년을 지원하는 사업 예시', info: '지원 내용 [입력 필요]', org: '[주관 기관 입력]', ages: ADULT, income: ALL_INCOME, housing: ALL_HOUSING },
  { id: 'startup', cat: '취업·창업', title: '[청년 창업 공간 지원]', desc: '창업 청년에게 사무 공간과 멘토링을 제공하는 사업 예시', info: '모집 시기·지원 기간 [입력 필요]', org: '[주관 기관 입력]', ages: ADULT, income: ALL_INCOME, housing: ALL_HOUSING },
  { id: 'culture', cat: '교육·문화', title: '[청년 문화 이용권]', desc: '공연·전시·도서 등 문화생활 비용을 지원하는 사업 예시', info: '지원 금액 [입력 필요]', org: '[주관 기관 입력]', ages: ['19세 이하', '20대'], income: ALL_INCOME, housing: ALL_HOUSING },
];

// 카테고리별 아이콘 (SVG path, viewBox 0 0 24 24)
export const CAT_ICON = {
  '주거 지원': 'M3 11l9-7 9 7 M5 10v10h14V10 M10 20v-6h4v6',
  '금융 지원': 'M12 3v18 M17 7H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6',
  '생활 지원': 'M4 8h16l-1.5 11h-13z M8 8V6a4 4 0 0 1 8 0v2',
  '취업·창업': 'M4 8h16v11H4z M9 8V5h6v3 M4 13h16',
  '교통 지원': 'M6 4h12a2 2 0 0 1 2 2v10H4V6a2 2 0 0 1 2-2z M4 11h16 M7 19v-3 M17 19v-3',
  '교육·문화': 'M2 9l10-5 10 5-10 5z M6 11v5c0 1 3 3 6 3s6-2 6-3v-5',
};
