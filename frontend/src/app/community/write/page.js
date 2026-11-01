import Hero from '@/components/common/Hero';
import CommunityWrite from '@/components/community/CommunityWrite';
import { ROUTES } from '@/constants/routes';
import { pageMeta } from '@/utils/seo';

export const metadata = pageMeta({
  title: '글쓰기',
  description: '무브산 커뮤니티에 글을 작성합니다.',
  path: ROUTES.communityWrite,
  index: false,
});

export default function CommunityWritePage() {
  return (
    <>
      <Hero
        compact
        eyebrow="COMMUNITY"
        title="글쓰기"
        subtitle="게시판을 고르고 제목·내용·사진을 등록해 주세요."
      />
      <div className="page">
        <div className="lift">
          <CommunityWrite />
        </div>
      </div>
    </>
  );
}
