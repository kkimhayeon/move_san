import Hero from '@/components/common/Hero';
import CommunityBoard from '@/components/community/CommunityBoard';
import { ROUTES } from '@/constants/routes';
import { pageMeta } from '@/utils/seo';

export const metadata = pageMeta({
  title: '커뮤니티',
  description: '동네생활, 부산꿀팁, Q&A, 맛집 후기를 나누는 무브산 커뮤니티입니다.',
  path: ROUTES.community,
});

export default function CommunityPage() {
  return (
    <>
      <Hero
        compact
        eyebrow="COMMUNITY"
        title={<>먼저 살아본 사람들이 들려주는,<br /><em>진짜 부산</em></>}
        subtitle="동네생활·부산꿀팁·Q&A·맛집 후기를 공유해 주세요."
      />
      <div className="page">
        <div className="lift">
          <CommunityBoard />
        </div>
      </div>
    </>
  );
}
