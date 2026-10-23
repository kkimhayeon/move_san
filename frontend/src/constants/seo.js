// 사이트 SEO 기본값. 페이지 고유 title·description은 각 page.js에서 덮어쓴다.
// SITE_URL은 서버 전용 환경변수다. 클라이언트 번들에 넣지 않는다.
export const SITE = {
  name: '무브산',
  url: process.env.SITE_URL || 'http://localhost:3000',
  title: '무브산 — 같은 월급, 부산에서는 얼마나 남을까?',
  description: '서울에서 부산으로 이직·이주를 고민하는 청년을 위해 월급·월세·생활비·교통비를 비교해 1년에 얼마나 더 모을 수 있는지 계산하고, 부산 구·군별 원룸 월세를 지도로 보여줍니다.',
};
