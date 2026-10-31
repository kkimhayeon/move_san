'use client';

import { useEffect, useRef } from 'react';
import { welcomePack } from '@/data/welcomePack';
import styles from './WelcomePackModal.module.css';

const MARKS = ['①', '②', '③', '④', '⑤', '⑥'];

function focusableIn(root) {
  if (!root) return [];
  return [...root.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])')];
}

export default function WelcomePackModal({ onClose }) {
  const dialogRef = useRef(null);
  const { intro, eligibility, benefits, existingCustomers, disclaimer } = welcomePack;

  useEffect(() => {
    const restore = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const dialog = dialogRef.current;
    dialog?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const items = focusableIn(dialog);
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onFocusIn(event) {
      if (!dialog || dialog.contains(event.target)) return;
      const items = focusableIn(dialog);
      (items[0] || dialog).focus();
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
      if (restore?.isConnected) restore.focus();
    };
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-pack-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.body}>
          <span className={styles.badge}>{welcomePack.badge}</span>
          <h2 id="welcome-pack-title" className={styles.title}>{welcomePack.name}</h2>
          <p className={styles.summary}>{welcomePack.summary}</p>

          <section className={styles.section}>
            <h3 className={styles.label}>{intro.title}</h3>
            {intro.paragraphs.map((paragraph) => (
              <p key={paragraph} className={styles.text}>{paragraph}</p>
            ))}
          </section>

          <section className={styles.section}>
            <h3 className={styles.label}>
              {eligibility.title}
              <span className={styles.note}>{eligibility.note}</span>
            </h3>
            <ul className={styles.list}>
              {eligibility.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className={styles.section}>
            <h3 className={styles.label}>{benefits.title}</h3>
            <ol className={styles.benefits}>
              {benefits.items.map((item, index) => (
                <li key={item.title}>
                  <span className={styles.mark} aria-hidden="true">{MARKS[index] || `${index + 1}.`}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.section}>
            <h3 className={styles.label}>{existingCustomers.title}</h3>
            <ul className={styles.list}>
              {existingCustomers.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          {disclaimer ? (
            <section className={styles.disclaimer}>
              <h3>{disclaimer.title}</h3>
              <p>{disclaimer.body}</p>
            </section>
          ) : null}
        </div>

        <div className={styles.actions}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {welcomePack.closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
