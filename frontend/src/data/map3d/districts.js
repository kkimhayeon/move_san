// 구·군별 랜드마크 메타 (월세는 housing API로 연결)
// sea: 바다 위 랜드마크, at: [x,z], rot: 라디안
// model: public 기준 URL
// modelScale: fit 이후 배율 (기본 1 = 구 안에 맞게 정규화된 크기)
// modelFit: 월드 단위 최대 한 변 길이 (작을수록 구 안에 더 잘 들어감)
//
// GLB 매핑 (public/models/)
//   haeundae  → marinecity.glb
//   suyeong   → gwangali.glb
//   nam       → oryookdo.glb
//   yeongdo   → taejondae.glb
//   jung      → yongdusan.glb
//   dong      → busanstation.glb
//   seo       → sondocablecar.glb
//   saha      → gamcheon.glb
//   gangseo   → kimhae_airport.glb
//   sasang    → samrakpark.glb
//   buk       → gupomarket.glb
//   busanjin  → jeonpocaferoad.glb
//   dongnae   → sajikbaseballpark.glb
//   yeonje    → cityhall.glb
//   geumjeong → beomeosa.glb
//   gijang    → gijang.glb  (예비: osiria.glb)

export const DISTRICTS = {
  haeundae: {
    lm: '마린시티',
    desc: '해운대 앞바다의 고층 단지예요.\n밤이면 화려한 야경이 펼쳐져요.',
    model: '/models/marinecity.glb',
    modelScale: 1,
    modelFit: 2.5,
  },
  suyeong: {
    lm: '광안리',
    desc: '광안리 해변과 광안대교가 있는 곳이에요.\n밤이면 다리 조명이 바다를 물들여요.',
    sea: true,
    at: [4.8, 4],
    rot: -0.62,
    model: '/models/gwangali.glb',
    modelScale: 1,
    modelFit: 3,
  },
  nam: {
    lm: '오륙도',
    desc: '방향에 따라 다섯·여섯 개로 보이는 바위섬이에요.\n하얀 등대가 서 있어요.',
    sea: true,
    at: [4.2, 5.5],
    model: '/models/oryookdo.glb',
    modelScale: 1,
    modelFit: 2.5,
  },
  yeongdo: {
    lm: '태종대',
    desc: '영도 끝의 절벽과 숲 공원이에요.\n다누비열차로 바다를 내려다볼 수 있어요.',
    sea: true,
    at: [3.00, 8.00],
    rot: 0.75,
    model: '/models/taejondae.glb',
    modelScale: 1,
    modelFit: 3,
  },
  jung: {
    lm: '용두산공원',
    desc: '원도심 언덕의 부산타워 공원이에요.\n부산항을 한눈에 내려다볼 수 있어요.',
    small: true,
    model: '/models/yongdusan.glb',
    modelScale: 1,
    modelFit: 0.75,
  },
  dong: {
    lm: '부산역',
    desc: 'KTX가 서는 부산의 관문이에요.\n서울에서 오면 가장 먼저 만나는 동네예요.',
    small: true,
    model: '/models/busanstation.glb',
    modelScale: 1,
    modelFit: 1.4,
  },
  seo: {
    lm: '송도해상케이블카',
    desc: '송도 바다 위를 가로지르는 케이블카예요.\n발아래로 바다가 내려다보여요.',
    at: [-1.35, 5.0],
    small: true,
    model: '/models/sondocablecar.glb',
    modelScale: 1,
    modelFit: 1.5,
  },
  saha: {
    lm: '감천문화마을',
    desc: '산비탈의 알록달록한 마을이에요.\n골목마다 벽화가 이어져요.',
    at: [-3.0, 4.9],
    model: '/models/gamcheon.glb',
    modelScale: 1,
    modelFit: 2.5,
  },
  gangseo: {
    lm: '김해국제공항',
    desc: '부산의 하늘길, 김해국제공항이에요.\n국내선과 국제선이 모두 오가요.',
    at: [-5.6, 2.5],
    model: '/models/kimhae_airport.glb',
    modelScale: 1,
    modelFit: 3.5,
  },
  sasang: {
    lm: '삼락생태공원',
    desc: '낙동강 둔치의 넓은 생태공원이에요.\n벚꽃길·산책로·자전거길이 이어져요.',
    model: '/models/samrakpark.glb',
    modelScale: 1,
    modelFit: 2,
  },
  buk: {
    lm: '구포시장',
    desc: '북구의 대표 전통시장이에요.\n낙동강 근처에서 오래 장이 섰어요.',
    model: '/models/gupomarket.glb',
    modelScale: 1,
    modelFit: 2.5,
  },
  busanjin: {
    lm: '전포카페거리',
    desc: '서면 옆 카페와 맛집 골목이에요.\n부산에서 가장 붐비는 번화가 근처예요.',
    model: '/models/jeonpocaferoad.glb',
    modelScale: 1,
    modelFit: 2,
  },
  dongnae: {
    lm: '사직야구장',
    desc: '롯데 자이언츠의 홈구장이에요.\n경기 날이면 응원 함성으로 가득해요.',
    small: true,
    model: '/models/sajikbaseballpark.glb',
    modelScale: 1,
    modelFit: 1.5,
  },
  yeonje: {
    lm: '부산시청',
    desc: '부산시청이 있는 행정 중심지예요.\n주변으로 공공기관이 모여 있어요.',
    small: true,
    model: '/models/cityhall.glb',
    modelScale: 1,
    modelFit: 1.5,
  },
  geumjeong: {
    lm: '범어사',
    desc: '금정산 자락의 오래된 절이에요.\n부산대학교도 이 동네에 있어요.',
    model: '/models/beomeosa.glb',
    modelScale: 1,
    modelFit: 3,
  },
  gijang: {
    lm: '롯데월드 어드벤처 부산',
    desc: '기장 오시리아의 테마파크예요.\n롤러코스터와 관람차가 모여 있어요.',
    model: '/models/gijang.glb',
    modelScale: 1,
    modelFit: 4,
    at: [5.8, -4.0],
  },
};

// 월세 구간 색 (2D 지도 BINS와 동일한 구간)
export const RENT_FILL = ['#DCEAFE', '#B4D2FD', '#7DB0F7', '#4A88EC', '#2160D9'];
export const RENT_SIDE = ['#B9CBE2', '#9DB8DA', '#7AA2D2', '#4A80C6', '#1E4E9E'];
export const MISSING_FILL = '#CBD5E1';
export const MISSING_SIDE = '#A8B4C4';
export const NEUTRAL_FILL = '#E8EEF5';
export const NEUTRAL_SIDE = '#C6D0DC';

export function rentBucket(rent) {
  if (rent == null || !Number.isFinite(rent)) return -1;
  if (rent <= 36) return 0;
  if (rent <= 40) return 1;
  if (rent <= 45) return 2;
  if (rent <= 50) return 3;
  return 4;
}
