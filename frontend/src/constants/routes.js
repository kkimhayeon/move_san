export const ROUTES = {
  home: '/',
  result: '/result',
  benefits: '/benefits',
  map: '/map',
  culture: '/culture',
  community: '/community',
  login: '/login',
  rentTest: '/rent-test',
};

export const NAV = [
  { href: ROUTES.home, label: '생활비 계산기', match: [ROUTES.home, ROUTES.result] },
  { href: ROUTES.benefits, label: '청년 혜택', match: [ROUTES.benefits] },
  { href: ROUTES.map, label: '동네 탐색', match: [ROUTES.map] },
  { href: ROUTES.culture, label: '컬처라이프', match: [ROUTES.culture] },
  { href: ROUTES.community, label: '커뮤니티', match: [ROUTES.community] },
];

// 검색 노출 대상. 개인 입력·로그인·연동 테스트 주소는 넣지 않는다.
export const SITEMAP_PATHS = [
  ROUTES.home,
  ROUTES.benefits,
  ROUTES.map,
  ROUTES.community,
  ROUTES.culture,
];

export const NOINDEX_PATHS = [ROUTES.result, ROUTES.login, ROUTES.rentTest];
