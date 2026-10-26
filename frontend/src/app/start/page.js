import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

// 예전 단계별 입력 화면 주소 → 이제 첫 화면의 계산기로 이동
export default function StartPage() {
  redirect(ROUTES.home);
}
