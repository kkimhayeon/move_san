import RentTestPanel from '@/components/map/RentTestPanel';
import { ROUTES } from '@/constants/routes';
import { pageMeta } from '@/utils/seo';

export const metadata = pageMeta({
  title: '월세 연동 테스트',
  description: 'Flask 월세 API 연동을 확인하는 내부 화면입니다.',
  path: ROUTES.rentTest,
  index: false,
});

export default function RentTestPage() {
  return <RentTestPanel />;
}
