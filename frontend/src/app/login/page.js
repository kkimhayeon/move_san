import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { pageMeta } from '@/utils/seo';
import styles from './auth.module.css';

export const metadata = pageMeta({
  title: '로그인',
  description: '무브산 로그인 화면입니다. 계산기와 동네 지도는 로그인 없이 사용할 수 있습니다.',
  path: ROUTES.login,
  index: false,
});

// 로그인·회원가입 자리 — 인증 방식(Supabase Auth)은 아직 연결하지 않았다. 지금은 화면만 있다.
export default function LoginPage() {
  return (
    <div className="page" style={{ paddingTop: 56 }}>
      <section className={`card stack ${styles.auth}`}>
        <h1 style={{ fontSize: 26 }}>무브산 로그인</h1>
        <p className="muted small" style={{ margin: 0 }}>계산기와 동네 지도는 로그인 없이 쓸 수 있어요. 로그인은 커뮤니티와 결과 저장에 쓰일 예정이에요.</p>
        <input type="email" placeholder="이메일" disabled />
        <input type="password" placeholder="비밀번호" disabled />
        <button className="btn" disabled>로그인 (준비 중)</button>
        <Link href={ROUTES.home} className="btn btn-outline">계산기로 돌아가기</Link>
        <span className="small muted">인증은 Supabase Auth 연결을 검토 중이에요.</span>
      </section>
    </div>
  );
}
