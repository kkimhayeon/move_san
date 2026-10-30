import Hero from '@/components/common/Hero';
import BusanMap3D from '@/components/map3d/BusanMap3D';
import { ROUTES } from '@/constants/routes';
import { pageMeta } from '@/utils/seo';

export const metadata = pageMeta({
  title: '동네 지도',
  description: '부산 구·군별 원룸·투룸 월세 중앙값과 랜드마크를 3D 지도에서 확인할 수 있습니다.',
  path: ROUTES.map,
});

export default function MapPage() {
  return (
    <>
      <Hero
        compact
        eyebrow="NEIGHBORHOOD MAP"
        title={<>부산 라이프<br /><em>어디서 시작할까?</em></>}
        subtitle="지역을 눌러서 확인해보세요!"
      />
      <BusanMap3D />
    </>
  );
}
