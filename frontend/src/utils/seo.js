import { SITE } from '@/constants/seo';

// 페이지 메타데이터가 같은 형태라 한곳으로 모았다.
// absolute: true면 레이아웃 title 템플릿(| 무브산)을 붙이지 않는다. 홈 제목에 쓴다.
export function pageMeta({ title, description, path, index = true, absolute = false }) {
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE.name,
      locale: 'ko_KR',
      type: 'website',
    },
  };
}
