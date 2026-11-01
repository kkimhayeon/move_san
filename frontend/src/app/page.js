import Link from 'next/link';
import Hero from '@/components/common/Hero';
import ComparisonForm from '@/components/comparison/ComparisonForm';
import { ROUTES } from '@/constants/routes';
import { SITE } from '@/constants/seo';
import { pageMeta } from '@/utils/seo';
import home from './home.module.css';

export const metadata = pageMeta({
  title: SITE.title,
  description: SITE.description,
  path: ROUTES.home,
  absolute: true,
});

const FEATURES = [
  { href: ROUTES.map, title: '부산 동네별 월세 지도', text: '구·군을 누르면 월세 중앙값과 랜드마크를 입체 지도에서 볼 수 있어요.', icon: 'M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2z M9 4v14 M15 6v14' },
  { href: ROUTES.benefits, title: '청년 정책·금융상품', text: '흩어져 있는 부산 청년 혜택과 지역 금융상품을 모아 보여줘요.', icon: 'M4 10h16 M5 10V20h14V10 M12 3l8 5H4z M9 14v3 M15 14v3' },
  { href: ROUTES.community, title: '무브산 커뮤니티', text: '먼저 부산으로 옮긴 사람들의 동네·출퇴근 이야기를 나눠요.', icon: 'M4 5h16v11H8l-4 4z M8 10h8' },
];

export default function Home() {
  return (
    <>
      <Hero
        compact
        eyebrow="MOVESAN"
        title={<>이동의 끝에서,<br /><em>여유가 시작된다</em></>}
        subtitle="월급·월세와 서울 생활비를 넣으면, 부산에서 1년에 얼마나 더 모을 수 있는지 알려드려요."
      />
      <div className="page">
        <ComparisonForm />
        <div className={`section ${home.features}`}>
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} className={home.feature}>
              <span className={home.icon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={f.icon} /></svg>
              </span>
              <span className="stack" style={{ gap: 2 }}>
                <strong>{f.title}</strong>
                <span className="muted small">{f.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
