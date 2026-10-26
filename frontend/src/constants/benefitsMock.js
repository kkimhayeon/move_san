
/**
 * 무브산 청년 정책 화면 테스트용 Mock 데이터
 * 실제 정책 및 확정 지원금 정보가 아닙니다.
 *
 * amount: 테스트용 가상 금액 (원)
 * frequency: monthly | yearly | once
 * eligibilityStatus: unverified | verified | ineligible
 *
 * verified는 실제 정책 조건 및 신청 자격 확인 이후에만 사용.
 */

export const MOCK_POLICIES = [
  {
    id: 'mock-seoul-housing',
    region: '서울',
    category: '주거',
    title: '[예시] 서울 청년 주거비 지원',
    description: '서울 거주 청년의 주거비 부담 완화를 가정한 테스트 정책입니다.',
    amount: 150000,
    frequency: 'monthly',
    durationMonths: 12,
    minAge: 19,
    maxAge: 34,
    maxIncome: 4000,
    eligibilityStatus: 'unverified',
    exclusiveGroup: 'housing-support',
    organization: '가상 정책 데이터',
    applicationUrl: null,
    isMock: true,
  },
  {
    id: 'mock-busan-housing',
    region: '부산',
    category: '주거',
    title: '[예시] 부산 청년 주거비 지원',
    description: '부산 거주 청년의 월세 지원을 가정한 테스트 정책입니다.',
    amount: 200000,
    frequency: 'monthly',
    durationMonths: 12,
    minAge: 19,
    maxAge: 39,
    maxIncome: 4000,
    eligibilityStatus: 'unverified',
    exclusiveGroup: 'housing-support',
    organization: '가상 정책 데이터',
    applicationUrl: null,
    isMock: true,
  },
  {
    id: 'mock-busan-job',
    region: '부산',
    category: '취업',
    title: '[예시] 부산 청년 취업 지원',
    description: '부산 취업 청년의 정착 지원을 가정한 테스트 정책입니다.',
    amount: 500000,
    frequency: 'once',
    minAge: 18,
    maxAge: 39,
    maxIncome: null,
    eligibilityStatus: 'unverified',
    exclusiveGroup: null,
    organization: '가상 정책 데이터',
    applicationUrl: null,
    isMock: true,
  },
  {
    id: 'mock-seoul-transport',
    region: '서울',
    category: '교통',
    title: '[예시] 서울 청년 교통비 할인',
    description: '교통비 할인 효과를 가정한 테스트 정책입니다.',
    amount: 30000,
    frequency: 'monthly',
    durationMonths: 12,
    minAge: 19,
    maxAge: 34,
    maxIncome: null,
    eligibilityStatus: 'unverified',
    exclusiveGroup: null,
    organization: '가상 정책 데이터',
    applicationUrl: null,
    isMock: true,
  },
  {
    id: 'mock-busan-education',
    region: '부산',
    category: '교육',
    title: '[예시] 부산 청년 교육비 지원',
    description: '교육비 바우처 지급을 가정한 테스트 정책입니다.',
    amount: 100000,
    frequency: 'yearly',
    minAge: 19,
    maxAge: 39,
    maxIncome: null,
    eligibilityStatus: 'unverified',
    exclusiveGroup: null,
    organization: '가상 정책 데이터',
    applicationUrl: null,
    isMock: true,
  },
  {
    id: 'mock-busan-finance',
    region: '부산',
    category: '금융',
    title: '[예시] 부산 청년 금융 우대',
    description: '대출이자 절감 또는 금융 우대 효과를 추후 산정할 테스트 정책입니다.',
    amount: null,
    frequency: 'yearly',
    minAge: 19,
    maxAge: 39,
    maxIncome: null,
    eligibilityStatus: 'unverified',
    exclusiveGroup: null,
    organization: '가상 정책 데이터',
    applicationUrl: null,
    isMock: true,
  },
];

export const POLICY_CATEGORIES = [
  '전체',
  '주거',
  '취업',
  '금융',
  '교통',
  '교육',
];

export const FREQUENCY_LABELS = {
  monthly: '월간',
  yearly: '연간',
  once: '일회성',
};

export const formatWon = (amount) =>
  amount == null ? '금액 확인 필요' : `${amount.toLocaleString('ko-KR')}원`;

export function getPolicyYearlyAmount(policy) {
  if (policy.amount == null) return null;

  if (policy.frequency === 'monthly') {
    return policy.amount * Math.min(policy.durationMonths ?? 12, 12);
  }

  if (policy.frequency === 'yearly') {
    return policy.amount;
  }

  // 일회성 금액을 반복되는 연간 지원금으로 취급하지 않음
  return null;
}
