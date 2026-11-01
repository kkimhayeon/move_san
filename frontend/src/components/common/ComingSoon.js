import Link from 'next/link';
import Hero from './Hero';
import { ROUTES } from '@/constants/routes';
import styles from './ComingSoon.module.css';

// 아직 기획 중인 메뉴의 자리 표시 화면
export default function ComingSoon({ eyebrow, title, subtitle, items }) {
  return (
    <>
      <Hero compact eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="page">
        <section className="card lift stack" style={{ maxWidth: 720 }}>
          <span className="tag" style={{ alignSelf: 'flex-start' }}>준비 중</span>
          <h2 style={{ fontSize: 22 }}>이런 내용을 준비하고 있어요</h2>
          <ul className={styles.list}>
            {items.map((it) => <li key={it}>{it}</li>)}
          </ul>
          <div className="chips">
            <Link href={ROUTES.home} className="btn">생활비 계산하러 가기 →</Link>
            <Link href={ROUTES.map} className="btn btn-outline">동네 탐색하기</Link>
          </div>
        </section>
      </div>
    </>
  );
}
