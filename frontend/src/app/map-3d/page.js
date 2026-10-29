import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

/** 예전 테스트 URL → 메인 지도로 연결 */
export default async function Map3DRedirectPage({ searchParams }) {
  const params = await searchParams;
  const gu = typeof params?.gu === 'string'
    ? params.gu
    : Array.isArray(params?.gu)
      ? params.gu[0]
      : null;
  redirect(gu ? `${ROUTES.map}?gu=${encodeURIComponent(gu)}` : ROUTES.map);
}
