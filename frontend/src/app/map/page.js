import Hero from '@/components/common/Hero';
import BusanMap from '@/components/map/BusanMap';
import { ROUTES } from '@/constants/routes';
import { pageMeta } from '@/utils/seo';

export const metadata = pageMeta({
  title: '동네 지도',
  description: '부산 구·군별 원룸·투룸 월세 중앙값과 동네 정보를 지도에서 확인할 수 있습니다.',
  path: ROUTES.map,
});

export default function MapPage() {
  return (
    <>
      <Hero
        compact
        eyebrow="NEIGHBORHOOD MAP"
        title={<>부산 동네별 <em>월세 중앙값</em><br />한눈에 보기</>}
        subtitle="구·군을 누르면 월세 중앙값과 동네 정보를 볼 수 있어요."
      />
      <BusanMap />
    </>
  );
}
