// 무브산 사용자 조건 데이터 구조
// - 챗봇, 생활비 계산기, 동네 탐색, 청년 혜택 페이지가 같은 형식으로 읽고 쓸 수 있게 정의
// - 금액 단위는 생활비 계산기와 같은 "만원 / 월" (연소득만 "만원 / 년")
// - 값이 없으면 null (0과 구분하기 위해)

export type EmploymentStatus = "employed" | "jobOffer" | "jobSeeking" | "student" | "other";
export type HousingType = "monthlyRent" | "jeonse" | "withFamily" | "own" | "other";
export type IncomeBand = "under2000" | "2000to4000" | "over4000";

export interface UserConditions {
  /** 데이터 형식 버전 (필드가 바뀌면 올림) */
  version: 1;
  /** 만 나이 */
  age: number | null;
  /** 현재 상태: 재직 / 부산 오퍼 받음 / 구직 / 학생 / 기타 */
  employmentStatus: EmploymentStatus | null;
  /** 서울 세후 월급 (만원/월) — 계산기 seoulSalary와 같은 값 */
  seoulMonthlySalary: number | null;
  /** 부산 예상 세후 월급 (만원/월) — 계산기 busanSalary와 같은 값 */
  busanMonthlySalary: number | null;
  /** 서울 월세 (만원/월) — 계산기 seoulRent와 같은 값 */
  seoulMonthlyRent: number | null;
  /** 부산 예상 월세 (만원/월) — 계산기 busanRent와 같은 값 */
  busanMonthlyRent: number | null;
  /** 서울 생활비 (만원/월) — 계산기 seoulLiving과 같은 값 */
  seoulMonthlyLiving: number | null;
  /** 현재 주거 형태 */
  housingType: HousingType | null;
  /** 연소득 구간 (청년 혜택 필터용, 만원/년) */
  incomeBand: IncomeBand | null;
  /** 부산 근무 예정 구·군 (예: "해운대구") — 동네 탐색 페이지용 */
  busanWorkDistrict: string | null;
  /** 마지막 저장 시각 (ISO 문자열) */
  updatedAt: string | null;
}

export const DEFAULT_USER_CONDITIONS: UserConditions = {
  version: 1,
  age: null,
  employmentStatus: null,
  seoulMonthlySalary: null,
  busanMonthlySalary: null,
  seoulMonthlyRent: null,
  busanMonthlyRent: null,
  seoulMonthlyLiving: null,
  housingType: null,
  incomeBand: null,
  busanWorkDistrict: null,
  updatedAt: null,
};

export const EMPLOYMENT_LABELS: Record<EmploymentStatus, string> = {
  employed: "재직 중",
  jobOffer: "부산 오퍼 받음",
  jobSeeking: "구직 중",
  student: "학생",
  other: "기타",
};

export const HOUSING_LABELS: Record<HousingType, string> = {
  monthlyRent: "월세",
  jeonse: "전세",
  withFamily: "가족과 거주",
  own: "자가",
  other: "기타",
};

export const INCOME_LABELS: Record<IncomeBand, string> = {
  under2000: "2천만원 이하",
  "2000to4000": "2천~4천만원",
  over4000: "4천만원 초과",
};

export const BUSAN_DISTRICTS = [
  "중구", "서구", "동구", "영도구", "부산진구", "동래구", "남구", "북구",
  "해운대구", "사하구", "금정구", "강서구", "연제구", "수영구", "사상구", "기장군",
] as const;
