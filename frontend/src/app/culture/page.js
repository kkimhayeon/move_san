import CultureLife from '@/components/culture/CultureLife';
import { ROUTES } from '@/constants/routes';
import { pageMeta } from '@/utils/seo';

export const metadata = pageMeta({
  title: '컬처라이프',
  description: '부산의 전시·공연·팝업과 동네 공간, 로컬 스토리를 소개합니다.',
  path: ROUTES.culture,
});

export default function CulturePage() {
  return <CultureLife />;
}
