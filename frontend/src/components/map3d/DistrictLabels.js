'use client';

import { useDistrictLabels } from './labelStore';
import styles from './Map3DTags.module.css';

export default function DistrictLabels() {
  const labels = useDistrictLabels();
  const entries = Object.entries(labels).sort((a, b) => (a[1].z ?? 0) - (b[1].z ?? 0));

  return (
    <div className={styles.labelLayer} aria-hidden="true">
      {entries.map(([id, L]) => (
        <div
          key={id}
          className={`${styles.tag}${L.on ? ` ${styles.on}` : ''}${L.dim ? ` ${styles.dim}` : ''}`}
          style={{ transform: `translate(${L.x}px, ${L.y}px) translate(-50%, -50%)` }}
        >
          <b>{L.name}</b>
          {L.sub ? <span>{L.sub}</span> : null}
        </div>
      ))}
    </div>
  );
}
