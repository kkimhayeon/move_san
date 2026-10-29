import Hero from '@/components/common/Hero';
import BusanMap from '@/components/map/BusanMap';
import { ROUTES } from '@/constants/routes';
import { pageMeta } from '@/utils/seo';

export const metadata = pageMeta({
  title: '동네 지도 (간단 보기)',
  description: '3D 지도를 사용할 수 없을 때 쓰는 부산 구·군별 월세 중앙값 2D 지도입니다.',
  path: ROUTES.map2d,
  index: false,
});

export default function Map2DPage() {
  return (
    <>
      <Hero
        compact
        eyebrow="NEIGHBORHOOD MAP · 간단 보기"
        title={<>부산 라이프,<br /><em>어디서 시작할까?</em></>}
        subtitle="3D 지도를 쓸 수 없어 간단한 지도로 보여드려요. 구·군을 누르면 월세와 동네 정보를 볼 수 있어요."
      />
      <p className="page" style={{ marginTop: -8, marginBottom: 8 }}>
        <a href={ROUTES.map} className="btn-ghost" style={{ fontSize: 13 }}>
          ← 입체 지도 다시 시도
        </a>
      </p>
      <BusanMap />
    </>
  );
}
