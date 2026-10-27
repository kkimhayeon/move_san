'use client';

import { useEffect } from 'react';
import styles from './EmailVerificationModal.module.css';

export default function EmailVerificationModal({
  isOpen,
  email,
  onClose,
}) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="verification-title"
        aria-describedby="verification-description"
      >
        <div className={styles.icon}>✉</div>

        <h2 id="verification-title" className={styles.title}>
          이메일을 확인해 주세요!
        </h2>

        <p
          id="verification-description"
          className={styles.description}
        >
          <strong>{email}</strong>
          <br />
          이메일 인증 안내를 확인해 주세요.
          <br />
          인증을 완료한 후 로그인할 수 있어요.
        </p>

        <p className={styles.notice}>
          메일이 보이지 않는다면 스팸함도 확인해 주세요.
        </p>

        <button
          type="button"
          className={styles.confirmButton}
          onClick={onClose}
        >
          확인했어요
        </button>
      </div>
    </div>
  );
}