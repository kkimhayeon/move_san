import { Suspense } from 'react';
import { ROUTES } from '@/constants/routes';
import { pageMeta } from '@/utils/seo';
import LoginForm from './LoginForm';
import styles from './auth.module.css';

export const metadata = pageMeta({
  title: '로그인',
  description: '무브산 로그인 화면입니다. 계산기와 동네 지도는 로그인 없이 사용할 수 있습니다.',
  path: ROUTES.login,
  index: false,
});

export default function LoginPage() {
  return (
    <div className={`page ${styles.page}`}>
      <Suspense fallback={<section className={`card ${styles.auth}`}><p className="muted">로그인 화면을 준비하는 중…</p></section>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
