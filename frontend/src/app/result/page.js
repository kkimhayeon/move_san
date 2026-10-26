import ComparisonResult from '@/components/comparison/ComparisonResult';
import { ROUTES } from '@/constants/routes';
import { pageMeta } from '@/utils/seo';

export const metadata = pageMeta({
  title: '계산 결과',
  description: '입력한 월급·월세·서울 생활비와 물가 비율로 계산한 부산 생활비로 본 1년 잔여금 비교입니다.',
  path: ROUTES.result,
  index: false,
});

export default function ResultPage() {
  return <ComparisonResult />;
}
