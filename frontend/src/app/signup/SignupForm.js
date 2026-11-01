
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { signUp } from '@/api/auth';
import { useAuth } from '@/components/layout/AuthProvider';
import EmailVerificationModal from '@/components/auth/EmailVerificationModal';
import { ROUTES } from '@/constants/routes';

import styles from '../login/auth.module.css';

export default function SignupForm() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // 회원가입 입력 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 비밀번호 표시 상태
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 요청 및 결과 상태
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  // 이미 로그인한 사용자는 홈으로 이동
  useEffect(() => {
    if (user) {
      router.replace(ROUTES.home);
    }
  }, [user, router]);

  // 회원가입 처리
  async function handleSignup(event) {
    event.preventDefault();

    if (pending || loading || user) return;

    setMessage('');

    // 비밀번호 일치 여부 확인
    if (password !== confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    setPending(true);

    try {
      const data = await signUp(email.trim(), password);

      if (data.session) {
        // 이메일 인증 없이 세션이 발급된 경우
        router.replace(ROUTES.home);
        return;
      }

      // 이메일 인증이 필요한 경우 모달 표시
      setSuccess(true);

    } catch (error) {
      if (error.code === 'user_already_exists') {
        setMessage('이미 가입된 이메일입니다.');
      } else if (error.code === 'weak_password') {
        setMessage('비밀번호가 보안 조건을 충족하지 않습니다.');
      } else if (error.code === 'over_email_send_rate_limit') {
        setMessage('이메일 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.');
      } else {
        setMessage('회원가입에 실패했습니다. 다시 시도해 주세요.');
      }
    } finally {
      setPending(false);
    }
  }

  // 이메일 인증 모달 확인
  function handleModalClose() {
    setSuccess(false);
    router.replace(ROUTES.login);
  }

  return (
    <>
      <section
        className={`card ${styles.auth}`}
        aria-labelledby="signup-title"
      >
        <form
          className={styles.form}
          onSubmit={handleSignup}
          aria-busy={pending}
        >
          {/* 이메일 */}
          <label className={styles.field} htmlFor="signup-email">
            이메일
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={pending || success}
            />
          </label>

          {/* 비밀번호 */}
          <label className={styles.field} htmlFor="signup-password">
            비밀번호
            <div className={styles.passwordWrapper}>
              <input
                id="signup-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="비밀번호를 입력해 주세요"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                disabled={pending || success}
              />

              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                aria-pressed={showPassword}
                aria-controls="signup-password"
                disabled={pending || success}
              >
                {showPassword ? '숨기기' : '보기'}
              </button>
            </div>
          </label>

          {/* 비밀번호 확인 */}
          <label
            className={styles.field}
            htmlFor="signup-confirm-password"
          >
            비밀번호 확인
            <div className={styles.passwordWrapper}>
              <input
                id="signup-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="비밀번호를 다시 입력해 주세요"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                disabled={pending || success}
              />

              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() =>
                  setShowConfirmPassword((visible) => !visible)
                }
                aria-label={
                  showConfirmPassword
                    ? '비밀번호 확인 숨기기'
                    : '비밀번호 확인 보기'
                }
                aria-pressed={showConfirmPassword}
                aria-controls="signup-confirm-password"
                disabled={pending || success}
              >
                {showConfirmPassword ? '숨기기' : '보기'}
              </button>
            </div>
          </label>

          {/* 오류 메시지 */}
          {message && (
            <p className={styles.error} role="alert">
              {message}
            </p>
          )}

          {/* 회원가입 버튼 */}
          <button
            className="btn"
            type="submit"
            disabled={pending || loading || !!user || success}
          >
            {pending ? '회원가입 처리 중…' : '회원가입'}
          </button>
        </form>

        {/* 로그인 페이지 이동 */}
        <p className={styles.authSwitch}>
          이미 계정이 있으신가요?{' '}
          <Link
            href={ROUTES.login}
            className={styles.authSwitchLink}
          >
            로그인
          </Link>
        </p>

        <p className={styles.caption}>
          생활비 계산기와 동네 지도는 로그인 없이 이용할 수 있어요.
        </p>
      </section>

      {/* 이메일 인증 안내 모달 */}
      <EmailVerificationModal
        isOpen={success}
        email={email.trim()}
        onClose={handleModalClose}
      />
    </>
  );
}
