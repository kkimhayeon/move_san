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
        title={<>부산 16개 동네,<br /><em>입체 지도로</em></>}
        subtitle="블록이 높고 진할수록 월세가 비싸요. 구·군을 누르면 랜드마크가 세워져요."
      />
      <BusanMap3D />
    </>
  );
}
