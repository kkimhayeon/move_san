import Hero from '@/components/common/Hero';
import CommunityBoard from '@/components/community/CommunityBoard';
import { ROUTES } from '@/constants/routes';
import { pageMeta } from '@/utils/seo';

export const metadata = pageMeta({
  title: '커뮤니티',
  description: '부산 이주 후기, 동네 추천, 생활 정보를 나누는 무브산 커뮤니티입니다.',
  path: ROUTES.community,
});

export default function CommunityPage() {
  return (
    <>
      <Hero
        compact
        eyebrow="COMMUNITY"
        title={<>부산에서의 <em>이야기</em>를 나눠요</>}
        subtitle="이주 후기부터 생활 정보까지, 다양한 경험을 공유해 주세요."
      />
      <div className="page">
        <div className="lift">
          <CommunityBoard />
        </div>
      </div>
    </>
  );
}
