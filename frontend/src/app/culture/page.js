import ComingSoon from '@/components/common/ComingSoon';
import { ROUTES } from '@/constants/routes';
import { pageMeta } from '@/utils/seo';

export const metadata = pageMeta({
  title: '컬처라이프',
  description: '축제, 공연, 바다 액티비티 등 퇴근 후 부산의 일상을 소개할 예정입니다.',
  path: ROUTES.culture,
});

export default function CulturePage() {
  return (
    <ComingSoon
      eyebrow="CULTURE LIFE"
      title={<>Live Local,<br /><em>Feel Busan</em></>}
      subtitle="축제, 공연, 바다 액티비티까지 부산의 일상을 소개할 예정이에요."
      items={[
        '이달의 부산 축제·공연 일정',
        '동네별 바다·산책 코스',
        '청년 문화 할인·이용권 정보 연결',
      ]}
    />
  );
}
