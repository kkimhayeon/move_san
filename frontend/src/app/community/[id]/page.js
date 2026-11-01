import Hero from '@/components/common/Hero';
import CommunityPost from '@/components/community/CommunityPost';
import { ROUTES } from '@/constants/routes';
import { pageMeta } from '@/utils/seo';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return pageMeta({
    title: '게시글',
    description: '무브산 커뮤니티 게시글입니다.',
    path: ROUTES.communityPost(id),
  });
}

export default async function CommunityPostPage({ params }) {
  const { id } = await params;
  return (
    <>
      <Hero
        compact
        eyebrow="COMMUNITY"
        title="게시글"
        subtitle="본문과 댓글을 확인해 보세요."
      />
      <div className="page">
        <div className="lift">
          <CommunityPost postId={id} />
        </div>
      </div>
    </>
  );
}
