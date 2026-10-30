'use client';

import dynamic from 'next/dynamic';

const BusanMap3D = dynamic(() => import('./BusanMap3D'), {
  ssr: false,
  loading: () => (
    <div className="page" style={{ paddingTop: 12 }}>
      <div
        className="card"
        style={{ minHeight: 360, display: 'grid', placeItems: 'center', color: 'var(--sub)' }}
      >
        3D 지도를 불러오는 중…
      </div>
    </div>
  ),
});

export default function BusanMap3DLazy() {
  return <BusanMap3D />;
}
