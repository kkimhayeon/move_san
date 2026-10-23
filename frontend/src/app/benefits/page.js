import Hero from '@/components/common/Hero';
import BenefitBrowser from '@/components/policy/BenefitBrowser';
import { ROUTES } from '@/constants/routes';
import { pageMeta } from '@/utils/seo';

export const metadata = pageMeta({
  title: '청년 혜택',
  description: '주거, 금융, 교통, 교육, 취업 등 부산시와 기관의 청년 지원사업과 지역 금융상품을 한곳에서 볼 수 있습니다.',
  path: ROUTES.benefits,
});

export default function BenefitsPage() {
  return (
    <>
      <Hero
        compact
        eyebrow="YOUTH BENEFITS"
        title={<>부산의 청년을 위한<br /><em>다양한 혜택</em>을 한눈에</>}
        subtitle="주거, 금융, 교통, 교육, 취업 등 부산시와 기관의 청년 지원사업을 확인해 보세요."
      />
      <div className="page">
        <div className="lift">
          <BenefitBrowser />
        </div>
      </div>
    </>
  );
}
