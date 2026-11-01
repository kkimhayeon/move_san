'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './LoginRequiredModal.module.css';

export default function LoginRequiredModal({
  isOpen,
  onClose,
  loginHref,
  title = '회원만 접근 가능합니다',
  description = '글쓰기는 로그인 후 이용할 수 있어요.',
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-required-title"
        aria-describedby="login-required-description"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="login-required-title" className={styles.title}>
          {title}
        </h2>
        <p id="login-required-description" className={styles.description}>
          {description}
        </p>
        <div className={styles.actions}>
          <Link className={styles.loginBtn} href={loginHref} onClick={onClose}>
            로그인 하러 가기
          </Link>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
