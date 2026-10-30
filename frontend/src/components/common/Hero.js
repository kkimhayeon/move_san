import styles from './Hero.module.css';

// 페이지 상단 배경: 부산 하늘·바다·광안대교 느낌의 일러스트
// 다리는 우측에 두고, 하단 바다는 짧게 그려 카드와 겹치지 않게 합니다.
export default function Hero({ eyebrow, title, subtitle, top, compact = false }) {
  // 두 주탑 사이 현수선(곡선) 아래로 내려오는 수직 케이블 (주탑 x=900, 1120 / 상판 y=198)
  const hangers = [];
  for (let x = 914; x < 1120; x += 14) {
    const t = (x - 900) / 220;
    const y = 120 + 160 * t * (1 - t);
    hangers.push(<line key={x} x1={x} y1={y} x2={x} y2={196} stroke="#B7CBE4" strokeWidth="1.2" />);
  }

  return (
    <section className={compact ? `${styles.hero} ${styles.compact}` : styles.hero}>
      <svg
        className={styles.art}
        viewBox="0 0 1440 240"
        preserveAspectRatio="xMaxYMax slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E6F0FC" />
            <stop offset="1" stopColor="#F5F9FE" />
          </linearGradient>
          <linearGradient id="hero-sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8DB9EA" />
            <stop offset="1" stopColor="#C4DCF5" />
          </linearGradient>
        </defs>
        <rect width="1440" height="240" fill="url(#hero-sky)" />
        <path
          d="M0 200 C200 176 380 188 560 192 C740 196 880 170 1040 180 C1200 190 1320 174 1440 178 L1440 210 L0 210 Z"
          fill="#DCE8F6"
        />
        <g fill="#C9D9EC">
          <rect x="1236" y="134" width="22" height="66" />
          <rect x="1264" y="112" width="20" height="88" />
          <rect x="1290" y="144" width="26" height="56" />
          <rect x="1322" y="122" width="20" height="78" />
          <rect x="1348" y="152" width="30" height="48" />
          <rect x="1384" y="136" width="22" height="64" />
          <rect x="1412" y="156" width="28" height="44" />
        </g>
        {/* 바다 띠를 짧게 — 카드가 덮을 여백을 만들지 않음 */}
        <rect y="200" width="1440" height="40" fill="url(#hero-sea)" />
        <g stroke="#FFFFFF" strokeOpacity="0.75" strokeWidth="2" strokeLinecap="round">
          <line x1="980" y1="214" x2="1090" y2="214" />
          <line x1="1180" y1="224" x2="1260" y2="224" />
          <line x1="1330" y1="212" x2="1400" y2="212" />
        </g>
        <g>
          {hangers}
          <path d="M760 198 Q 840 168 900 120" fill="none" stroke="#9DB8DA" strokeWidth="2.2" />
          <path d="M900 120 Q 1010 200 1120 120" fill="none" stroke="#9DB8DA" strokeWidth="2.2" />
          <path d="M1120 120 Q 1190 168 1260 198" fill="none" stroke="#9DB8DA" strokeWidth="2.2" />
          <rect x="894" y="112" width="12" height="96" rx="2" fill="#FFFFFF" stroke="#B9CCE4" />
          <rect x="1114" y="112" width="12" height="96" rx="2" fill="#FFFFFF" stroke="#B9CCE4" />
          <rect x="740" y="195" width="560" height="5" fill="#FFFFFF" stroke="#C7D7EA" />
        </g>
      </svg>
      <div className={styles.content}>
        {top && <div>{top}</div>}
        <div className={styles.text}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.sub}>{subtitle}</p>}
        </div>
      </div>
    </section>
  );
}
