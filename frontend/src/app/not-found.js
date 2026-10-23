import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { pageMeta } from '@/utils/seo';

export const metadata = pageMeta({
  title: '페이지를 찾을 수 없어요',
  description: '요청한 주소의 화면이 없습니다.',
  path: '/404',
  index: false,
});

export default function NotFound() {
  return (
    <div className="page" style={{ paddingTop: 56 }}>
      <section className="card stack" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 26 }}>페이지를 찾을 수 없어요</h1>
        <p className="muted" style={{ margin: 0 }}>주소가 바뀌었거나 없는 화면이에요.</p>
        <Link href={ROUTES.home} className="btn" style={{ alignSelf: 'center' }}>홈으로 가기</Link>
      </section>
    </div>
  );
}
