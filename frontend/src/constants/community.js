/** FE에 노출하는 게시판 코드 (DB free는 숨김) */
export const BOARD_CODES = ['LOCAL_LIFE', 'BUSAN_TIPS', 'QNA', 'RESTAURANT_REVIEW'];

/** categories API 실패 시·목록 표시용 기본 이름 (탭/작성에는 BOARD_CODES만 노출) */
export const BOARD_LABELS = {
  LOCAL_LIFE: '동네생활',
  BUSAN_TIPS: '부산꿀팁',
  QNA: 'Q&A',
  RESTAURANT_REVIEW: '맛집 후기',
  // 전체 목록에 과거 free 글이 보일 수 있어 표시명만 둔다. 탭·작성 선택에는 넣지 않는다.
  free: '자유게시판',
};

export const POST_LIMITS = {
  titleMax: 100,
  contentMax: 10000,
  commentMax: 1000,
  searchMax: 100,
  pageSize: 20,
  commentPageSize: 20,
  maxImages: 5,
  maxImageBytes: 5 * 1024 * 1024, // 5MiB — 명세 COMMUNITY-009
  imageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  imageAccept: 'image/jpeg,image/png,image/webp',
};
