// Flask 주소. 프로젝트 폴더의 .env.local에 NEXT_PUBLIC_API_URL=http://localhost:5000 처럼 적으면 API를 사용한다.
// 이 값은 브라우저 번들에도 포함된다. 서버 전용 비밀키에는 NEXT_PUBLIC_ 접두사를 붙이지 않는다.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
