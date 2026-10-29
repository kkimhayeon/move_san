'use client';

import { Component, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { useIsCompact, useReducedMotion } from './useReducedMotion';
import { canUseWebGL } from './webgl';
import DistrictLabels from './DistrictLabels';
import { clearDistrictLabels } from './labelStore';
import styles from './BusanMap3D.module.css';

const Map3DScene = dynamic(() => import('./Map3DScene'), {
  ssr: false,
  loading: () => <div className={styles.stageLoading}>3D 지도를 준비하는 중…</div>,
});

class SceneBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.warn('3D 지도 렌더링 오류:', error?.message || error);
  }

  render() {
    if (this.state.error) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function Fallback({ message }) {
  return (
    <div className={styles.webglFallback} role="alert">
      <p>{message || '이 브라우저에서는 3D 지도를 표시할 수 없어요.'}</p>
      <Link href={ROUTES.map} className="btn btn-grad">
        기존 2D 지도로 보기 →
      </Link>
    </div>
  );
}

export default function Map3DCanvas({
  rentsById,
  rentLoading,
  selectedId,
  onSelectId,
}) {
  const reduceMotion = useReducedMotion();
  const compact = useIsCompact();
  const [webgl, setWebgl] = useState(null);

  useEffect(() => {
    setWebgl(canUseWebGL());
  }, []);

  useEffect(() => () => clearDistrictLabels(), []);

  if (webgl === null) {
    return <div className={styles.stageLoading}>3D 지도를 준비하는 중…</div>;
  }

  if (!webgl) {
    return <Fallback />;
  }

  return (
    <SceneBoundary fallback={<Fallback />}>
      <div className={styles.canvasHost}>
        <Map3DScene
          rentsById={rentsById}
          rentLoading={rentLoading}
          selected={selectedId}
          onSelect={onSelectId}
          reduceMotion={reduceMotion}
          compact={compact}
        />
        <DistrictLabels />
      </div>
    </SceneBoundary>
  );
}
