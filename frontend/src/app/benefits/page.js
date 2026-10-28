import Hero from '@/components/common/Hero';
import BenefitBrowser from '@/components/policy/BenefitBrowser';
import { ROUTES } from '@/constants/routes';
import { pageMeta } from '@/utils/seo';

export const metadata = pageMeta({
  title: '청년 혜택',
  description: '부산시와 기관의 청년 지원사업을 카테고리와 키워드로 찾아볼 수 있습니다.',
  path: ROUTES.benefits,
});

export default function BenefitsPage() {
  return (
    <>
      <Hero
        compact
        eyebrow="YOUTH BENEFITS"
        title={<>당신의 첫걸음에,<br /><em>혜택을 더하다</em></>}
        subtitle="정책, 금융상품, 문화 및 모임 활동 등 부산시와 기관의 청년 지원사업을 확인해 보세요."
      />
      
      <div className="page">
        <div className="lift stack" style={{ gap: 36 }}>
          <BenefitBrowser />
        </div>
      </div>
    </>
  );
}
