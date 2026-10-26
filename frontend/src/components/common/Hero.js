import styles from './Hero.module.css';

// 페이지 상단 배경: 부산 하늘·바다·광안대교 느낌의 일러스트
export default function Hero({ eyebrow, title, subtitle, top, compact = false }) {
  // 두 주탑 사이 현수선(곡선) 아래로 내려오는 수직 케이블 (주탑 x=900, 1120 / 상판 y=300)
  const hangers = [];
  for (let x = 914; x < 1120; x += 14) {
    const t = (x - 900) / 220;
    const y = 222 + 160 * t * (1 - t);
    hangers.push(<line key={x} x1={x} y1={y} x2={x} y2={298} stroke="#B7CBE4" strokeWidth="1.2" />);
  }
  return (
    <section className={compact ? `${styles.hero} ${styles.compact}` : styles.hero}>
      <svg className={styles.art} viewBox="0 0 1440 380" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E6F0FC" /><stop offset="1" stopColor="#F5F9FE" /></linearGradient>
          <linearGradient id="hero-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8DB9EA" /><stop offset="0.6" stopColor="#C4DCF5" /><stop offset="1" stopColor="#F4F7FB" /></linearGradient>
        </defs>
        <rect width="1440" height="380" fill="url(#hero-sky)" />
        <path d="M0 292 C200 268 380 280 560 284 C740 288 880 262 1040 272 C1200 282 1320 266 1440 270 L1440 306 L0 306 Z" fill="#DCE8F6" />
        <g fill="#C9D9EC">
          <rect x="1236" y="236" width="22" height="66" /><rect x="1264" y="214" width="20" height="88" /><rect x="1290" y="246" width="26" height="56" />
          <rect x="1322" y="224" width="20" height="78" /><rect x="1348" y="254" width="30" height="48" /><rect x="1384" y="238" width="22" height="64" /><rect x="1412" y="258" width="28" height="44" />
        </g>
        <rect y="302" width="1440" height="78" fill="url(#hero-sea)" />
        <g stroke="#FFFFFF" strokeOpacity="0.75" strokeWidth="2" strokeLinecap="round">
          <line x1="980" y1="326" x2="1090" y2="326" /><line x1="1180" y1="344" x2="1260" y2="344" /><line x1="820" y1="350" x2="880" y2="350" />
          <line x1="1330" y1="322" x2="1400" y2="322" />
        </g>
        <g>
          {hangers}
          <path d="M760 300 Q 840 270 900 222" fill="none" stroke="#9DB8DA" strokeWidth="2.2" />
          <path d="M900 222 Q 1010 302 1120 222" fill="none" stroke="#9DB8DA" strokeWidth="2.2" />
          <path d="M1120 222 Q 1190 270 1260 300" fill="none" stroke="#9DB8DA" strokeWidth="2.2" />
          <rect x="894" y="214" width="12" height="96" rx="2" fill="#FFFFFF" stroke="#B9CCE4" />
          <rect x="1114" y="214" width="12" height="96" rx="2" fill="#FFFFFF" stroke="#B9CCE4" />
          <rect x="740" y="297" width="560" height="5" fill="#FFFFFF" stroke="#C7D7EA" />
        </g>
      </svg>
      <div className={styles.content}>
        {top && <div>{top}</div>}
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.sub}>{subtitle}</p>}
      </div>
    </section>
  );
}
