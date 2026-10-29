'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GEO } from '@/data/map3d/busanGeo';
import { DISTRICTS } from '@/data/map3d/districts';
import District from './District';
import { Sea, Ripples, Clouds } from './Scenery';
import { heightFor } from './heightFor';

const TARGET = new THREE.Vector3(-0.5, 0, 1.9);
const HOME_DIR = new THREE.Vector3(0, 22, 18.5);
const FOCUS_ZOOM = 0.7;

function homeView(aspect) {
  const k = Math.max(1, 1.35 / aspect);
  return { pos: TARGET.clone().add(HOME_DIR.clone().multiplyScalar(k)), target: TARGET.clone() };
}

function focusView(focus, aspect) {
  const t = new THREE.Vector3(...focus);
  return {
    pos: t.clone().add(HOME_DIR.clone().multiplyScalar(FOCUS_ZOOM * Math.max(1, 1.2 / aspect))),
    target: t,
  };
}

/** 선택·해제로 카메라 이동. 사용자 드래그 시 자동 이동 중단. 리사이즈 시 구도 재맞춤. */
function CameraRig({ focus, reduceMotion }) {
  const { camera, size, controls } = useThree();
  const fly = useRef({
    t: 1,
    fromPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    fromT: new THREE.Vector3(),
    toT: new THREE.Vector3(),
  });
  const first = useRef(true);
  const focusKey = focus ? `${focus[0]},${focus[1]},${focus[2]}` : 'home';
  const sizeKey = `${size.width}x${size.height}`;

  useEffect(() => {
    if (!controls) return undefined;
    const stopFly = () => {
      fly.current.t = 1;
    };
    controls.addEventListener('start', stopFly);
    return () => controls.removeEventListener('start', stopFly);
  }, [controls]);

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const to = focus ? focusView(focus, aspect) : homeView(aspect);

    if (first.current || reduceMotion || !controls) {
      camera.position.copy(to.pos);
      if (controls) controls.target.copy(to.target);
      controls?.update?.();
      first.current = false;
      fly.current.t = 1;
      return;
    }

    fly.current = {
      t: 0,
      fromPos: camera.position.clone(),
      toPos: to.pos,
      fromT: controls.target.clone(),
      toT: to.target,
    };
  }, [focusKey, sizeKey, controls, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, dt) => {
    const f = fly.current;
    if (f.t >= 1 || !controls) return;
    f.t = Math.min(1, f.t + dt * 1.1);
    const e = 1 - (1 - f.t) ** 3;
    camera.position.lerpVectors(f.fromPos, f.toPos, e);
    controls.target.lerpVectors(f.fromT, f.toT, e);
  });

  return null;
}

function SceneContent({
  rentsById,
  rentLoading,
  selected,
  onSelect,
  reduceMotion,
  enableShadows,
}) {
  const [hovered, setHovered] = useState(null);

  let focus = null;
  if (selected && DISTRICTS[selected] && GEO[selected]) {
    const d = DISTRICTS[selected];
    const [x, z] = d.at || GEO[selected].c;
    focus = [x, d.sea ? 0.4 : heightFor(rentsById?.[selected]) + 0.6, z];
  }

  return (
    <>
      <color attach="background" args={['#E2EEF9']} />
      <fog attach="fog" args={['#E2EEF9', 34, 70]} />
      <hemisphereLight args={['#FFFFFF', '#B7CDE6', 1.55]} />
      <directionalLight
        castShadow={enableShadows}
        color="#FFF4E2"
        intensity={2.1}
        position={[-9, 20, 11]}
        shadow-mapSize={enableShadows ? [1024, 1024] : [512, 512]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      />

      <Sea onClick={(e) => { if (e.delta < 6) onSelect(null); }} />
      {!reduceMotion && <Ripples reduceMotion={reduceMotion} />}
      {!reduceMotion && <Clouds reduceMotion={reduceMotion} />}

      {Object.keys(GEO).map((id) => (
        <District
          key={id}
          id={id}
          geo={GEO[id]}
          info={DISTRICTS[id]}
          rent={rentsById?.[id] ?? null}
          rentLoading={rentLoading}
          selected={selected}
          hovered={hovered}
          reduceMotion={reduceMotion}
          onSelect={onSelect}
          onHover={setHovered}
        />
      ))}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minPolarAngle={0.25}
        maxPolarAngle={1.2}
        minDistance={7}
        maxDistance={60}
      />
      <CameraRig focus={focus} reduceMotion={reduceMotion} />
    </>
  );
}

export default function Map3DScene({
  rentsById,
  rentLoading,
  selected,
  onSelect,
  reduceMotion,
  compact,
}) {
  const dpr = compact ? [1, 1.25] : [1, 2];

  return (
    <Canvas
      shadows={!compact}
      flat
      dpr={dpr}
      camera={{ fov: 30, near: 0.1, far: 200, position: [0, 22, 20] }}
      style={{ touchAction: 'none' }}
      onCreated={({ gl }) => {
        const canvas = gl.domElement;
        const onLost = (e) => {
          e.preventDefault();
          console.warn('WebGL 컨텍스트를 잃었어요. 복구를 시도합니다.');
        };
        const onRestored = () => {
          console.info('WebGL 컨텍스트가 복구됐어요.');
        };
        canvas.addEventListener('webglcontextlost', onLost);
        canvas.addEventListener('webglcontextrestored', onRestored);
      }}
    >
      <SceneContent
        rentsById={rentsById}
        rentLoading={rentLoading}
        selected={selected}
        onSelect={onSelect}
        reduceMotion={reduceMotion}
        enableShadows={!compact}
      />
    </Canvas>
  );
}
