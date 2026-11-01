'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { signOut } from '@/api/auth';
import { getMyProfile } from '@/api/user';
import { usePathname } from 'next/navigation';
import { NAV, ROUTES } from '@/constants/routes';
import styles from './Header.module.css';

export default function Header() {
  const path = usePathname();
  const { user, loading } = useAuth();

  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [nickname, setNickname] = useState(null);

  // 로그인한 사용자 프로필 조회
  useEffect(() => {
    if (loading) return;

    if (!user) {
      setNickname(null);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await getMyProfile();

        if (!cancelled) {
          setNickname(response.result.nickname);
        }
      } catch (error) {
        console.error('프로필 조회 실패:', error);

        if (!cancelled) {
          setNickname(null);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.id, loading]);

  async function handleLogout() {
    if (signingOut) return;

    setSigningOut(true);
    setLogoutError('');

    try {
      await signOut();
      setNickname(null);
    } catch {
      setLogoutError('로그아웃하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link
          href={ROUTES.home}
          className={styles.logo}
          aria-label="무브산 홈"
        >
          <img
            src="/logo.png"
            alt="무브산 MOVESAN"
            className={styles.logoImg}
          />
        </Link>

        <nav className={styles.nav}>
          {NAV.map((n) => {
            const active = n.href === ROUTES.community
              ? path === ROUTES.community || path.startsWith(`${ROUTES.community}/`)
              : n.match.includes(path);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={active ? `${styles.navItem} ${styles.active}` : styles.navItem}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.headerActions}>
          {loading ? (
            <span className={styles.textLink} role="status">
              확인 중…
            </span>
          ) : user ? (
            <>
              <span
                className={styles.userLabel}
                title={user.email}
              >
                {nickname ?? '사용자'}님
              </span>

              <button
                type="button"
                className={styles.logoutBtn}
                onClick={handleLogout}
                disabled={signingOut}
              >
                {signingOut ? '로그아웃 중…' : '로그아웃'}
              </button>
            </>
          ) : (
            <Link
              href={ROUTES.login}
              className={styles.pillBtn}
            >
              로그인
            </Link>
          )}

          {logoutError && (
            <span className={styles.logoutError} role="alert">
              {logoutError}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}