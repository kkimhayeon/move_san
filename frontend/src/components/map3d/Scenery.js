'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// 바다
export function Sea({ onClick }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-0.02} receiveShadow onClick={onClick}>
      <planeGeometry args={[220, 220]} />
      <meshStandardMaterial color="#A3CDF0" roughness={0.95} />
    </mesh>
  );
}

// 바다 위 물결 동그라미
const RIPPLES = [[-4, 7.5], [1.5, 7.8], [5.5, 4.2], [7.5, 2.5], [-7.5, 7], [4.2, 6.6], [-1.8, 8.6], [8.6, -1]];
export function Ripples({ reduceMotion }) {
  const refs = useRef([]);
  useFrame(({ clock }) => {
    const t = reduceMotion ? 0 : clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * 0.3 + i * 0.7) % 1;
      m.scale.setScalar(0.6 + u * 1.8);
      m.material.opacity = 0.55 * (1 - u);
    });
  });
  return RIPPLES.map(([x, z], i) => (
    <mesh key={i} ref={el => (refs.current[i] = el)} rotation-x={-Math.PI / 2} position={[x, 0.005, z]}>
      <ringGeometry args={[0.22, 0.27, 32]} />
      <meshBasicMaterial color="#FFFFFF" transparent opacity={0.5} />
    </mesh>
  ));
}

// 떠다니는 구름
const CLOUDS = [[-6, 3.6, -7, 1], [3, 4, -9.5, 1.2], [10, 3.4, -3, 0.9]];
const PUFFS = [[0, 0, 0, 0.5], [0.45, -0.05, 0.1, 0.38], [-0.45, -0.08, 0, 0.36], [0.15, 0.2, -0.1, 0.36]];
export function Clouds({ reduceMotion }) {
  const refs = useRef([]);
  const speeds = useMemo(() => CLOUDS.map(c => 0.18 + c[3] * 0.05), []);
  useFrame((_, dt) => {
    if (reduceMotion) return;
    refs.current.forEach((g, i) => {
      if (!g) return;
      g.position.x += speeds[i] * Math.min(dt, 0.05);
      if (g.position.x > 15) g.position.x = -15;
    });
  });
  return CLOUDS.map(([x, y, z, s], i) => (
    <group key={i} ref={el => (refs.current[i] = el)} position={[x, y, z]} scale={s}>
      {PUFFS.map(([a, b, c, r], j) => (
        <mesh key={j} position={[a, b, c]}>
          <sphereGeometry args={[r, 16, 12]} />
          <meshStandardMaterial color="#FFFFFF" roughness={1} />
        </mesh>
      ))}
    </group>
  ));
}
