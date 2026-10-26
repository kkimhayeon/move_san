'use client';

import { formatWon, FREQUENCY_LABELS } from '@/constants/benefitsMock';
import styles from './BenefitsBasket.module.css';

export default function BenefitsBasket({ policies, onRemove, onClear }) {
  return (
    <section className={styles.basket} aria-label="나의 정착 혜택 바구니">
      <div className={styles.head}>
        <h3>나의 정착 혜택 바구니</h3>
        <button type="button" className="btn-ghost" onClick={onClear}>전체 비우기</button>
      </div>
      <ul className={styles.list}>
        {policies.map((policy) => (
          <li key={policy.id} className={styles.item}>
            <div>
              <span className={styles.title}>{policy.title}</span>
              <span className={styles.meta}>
                {policy.region} · {policy.category} · {FREQUENCY_LABELS[policy.frequency]} · {formatWon(policy.amount)}
              </span>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => onRemove(policy.id)}>빼기</button>
          </li>
        ))}
      </ul>
      <p className={styles.note}>검색 조건을 바꿔도 담아 둔 정책은 유지됩니다. 자격이 확인되기 전에는 금액 합산에 넣지 않습니다.</p>
    </section>
  );
}
