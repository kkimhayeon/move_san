'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/api/auth';
import { useAuth } from '@/components/layout/AuthProvider';
import { ROUTES } from '@/constants/routes';
import { safeNextPath } from '@/utils/communityFormat';
import styles from './auth.module.css';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'), ROUTES.home);
  const { user, loading, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) router.replace(nextPath);
  }, [user, router, nextPath]);

  async function handleLogin(event) {
    event.preventDefault();
    if (pending || loading || user || authError) return;
    setPending(true);
    setMessage('');
    try {
      await signIn(email.trim(), password);
      router.replace(nextPath);
    } catch (error) {
      setMessage(error.code === 'invalid_credentials'
        ? '이메일 또는 비밀번호를 확인해 주세요.'
        : error.code === 'email_not_confirmed'
          ? '이메일 인증을 완료한 후 로그인해 주세요.'
          : '로그인하지 못했어요. 잠시 후 다시 시도해 주세요.');
      setPending(false);
    }
  }

  return (
    <section className={`card ${styles.auth}`} aria-labelledby="login-title">
      <form className={styles.form} onSubmit={handleLogin} aria-busy={pending}>
        <label className={styles.field} htmlFor="email">
          이메일
          <input id="email" name="email" type="email" autoComplete="username" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={pending} />
        </label>
        <label className={styles.field} htmlFor="password">
          비밀번호
          <div className={styles.passwordWrapper}>
            <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="비밀번호를 입력해 주세요" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={pending} />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              aria-pressed={showPassword}
              aria-controls="password"
              disabled={pending}
            >
              {showPassword ? '숨기기' : '보기'}
            </button>
          </div>
        </label>
        {(message || authError) && <p className={styles.error} role="alert">{message || authError}</p>}
        <button className="btn" type="submit" disabled={pending || loading || !!user || !!authError}>
          {loading ? '로그인 상태 확인 중…' : pending || user ? '이동 중…' : '로그인'}
        </button>
      </form>
      <Link href={ROUTES.signup} className="btn btn-outline">회원가입</Link>
      <p className={styles.caption}>생활비 계산기와 동네 지도는 로그인 없이 이용할 수 있어요.</p>
    </section>
  );
}
