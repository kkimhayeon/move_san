'use client';

import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { createLandmark } from './landmarks';
import { heightFor } from './heightFor';
import { setDistrictLabel } from './labelStore';
import {
  MISSING_FILL,
  MISSING_SIDE,
  NEUTRAL_FILL,
  NEUTRAL_SIDE,
  RENT_FILL,
  RENT_SIDE,
  rentBucket,
} from '@/data/map3d/districts';

const _proj = new THREE.Vector3();

function buildGeometry(polys, cx, cz) {
  const toV = (ring) => {
    const v = [];
    for (let k = 0; k < ring.length; k += 2) v.push(new THREE.Vector2(ring[k], -ring[k + 1]));
    return v;
  };
  const shapes = polys.map((poly) => {
    const s = new THREE.Shape(toV(poly[0]));
    poly.slice(1).forEach((h) => s.holes.push(new THREE.Path(toV(h))));
    return s;
  });
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 1,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.05,
    bevelSegments: 2,
    curveSegments: 1,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(-cx, 0, -cz);
  return geo;
}

const backOut = (x, s) => 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2;
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** GLB가 구 경계를 넘지 않도록 바운딩박스 기준 정규화 (바닥 y=0, xz 중앙) */
const DEFAULT_MODEL_FIT = 1.05;

function fitModelToSize(root, maxSize) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 1e-6);
  const s = maxSize / maxDim;
  root.scale.multiplyScalar(s);
  root.updateMatrixWorld(true);
  box.setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= box.min.y;
}

function GlbModel({ url, fitSize = DEFAULT_MODEL_FIT }) {
  const { scene, animations } = useGLTF(url);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    fitModelToSize(clone, fitSize);
    return clone;
  }, [scene, fitSize]);
  const { actions } = useAnimations(animations, model);

  useEffect(() => {
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    const playing = Object.values(actions).filter(Boolean);
    playing.forEach((a) => a.reset().play());
    return () => {
      playing.forEach((a) => {
        a.stop();
        a.reset();
      });
    };
  }, [model, actions]);

  // 클론 메시의 geometry만 정리. material/texture는 GLTF 캐시와 공유될 수 있어 dispose하지 않음.
  useEffect(() => () => {
    model.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
  }, [model]);

  return <primitive object={model} />;
}

class ModelBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(err) {
    console.warn('랜드마크 모델을 불러오지 못해 기본 모형으로 표시해요:', err?.message || err);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const FADE_TOP = new THREE.Color('#DCE4EE');
const FADE_SIDE = new THREE.Color('#C6D0DC');
const BURST_COLORS = ['#FF8E7E', '#FFD35E', '#8FE0B5', '#7CC4F0', '#B79CF2', '#FFB86B', '#FF8E7E', '#8FE0B5'];
const tmpTop = new THREE.Color();
const tmpSide = new THREE.Color();

function fillColors(rent, loading) {
  if (loading) return { top: NEUTRAL_FILL, side: NEUTRAL_SIDE };
  const b = rentBucket(rent);
  if (b < 0) return { top: MISSING_FILL, side: MISSING_SIDE };
  return { top: RENT_FILL[b], side: RENT_SIDE[b] };
}

function formatTagRent(rent, loading) {
  if (loading) return '';
  if (rent == null || !Number.isFinite(Number(rent))) return '자료 없음';
  const n = Math.round(Number(rent) * 100) / 100;
  return `${n.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}만원`;
}

export default function District({
  id,
  geo,
  info,
  rent,
  rentLoading,
  selected,
  hovered,
  reduceMotion,
  onSelect,
  onHover,
}) {
  const [cx, cz] = geo.c;
  const [lx, lz] = info.at || [cx, cz];
  // GLB는 fit 후 modelScale(기본 1)만 곱함. 코드 모형은 기존 상대 크기 유지.
  const lmScale = info.model
    ? (info.modelScale ?? 1)
    : (info.modelScale ?? (info.sea ? 1.3 : info.small ? 1.15 : 1.55));
  const modelFit = info.modelFit ?? (info.small ? 0.85 : info.sea ? 1.15 : DEFAULT_MODEL_FIT);

  const geometry = useMemo(() => buildGeometry(geo.polys, cx, cz), [geo, cx, cz]);
  const landmark = useMemo(() => createLandmark(id), [id]);

  const { size, camera } = useThree();
  const land = useRef();
  const top = useRef();
  const side = useRef();
  const lm = useRef();
  const label = useRef();
  const ring = useRef();
  const bits = useRef([]);
  const s = useRef({ h: heightFor(rent), lift: 0, fade: 0, sel: false, t0: -10, from: 0, f: 0 });
  const [loadGlb, setLoadGlb] = useState(false);

  const isSel = selected === id;
  const dim = !!selected && !isSel;
  const isHover = hovered === id && !isSel;
  const colors = fillColors(rent, rentLoading);

  useEffect(() => {
    if (isSel && info.model) setLoadGlb(true);
  }, [isSel, info.model]);

  useEffect(() => () => setDistrictLabel(id, null), [id]);

  useFrame((state, dt) => {
    const now = state.clock.elapsedTime;
    const k = reduceMotion ? 1 : 1 - 0.0015 ** Math.min(dt, 0.05);
    const a = s.current;

    a.h += ((dim ? heightFor(rent) * 0.85 : heightFor(rent)) - a.h) * k;
    a.lift += ((isSel ? 0.25 : 0) - a.lift) * k;
    a.fade += ((dim ? 0.68 : 0) - a.fade) * k;
    land.current.scale.y = a.h;
    land.current.position.y = a.lift;
    top.current.color.copy(tmpTop.set(colors.top).lerp(FADE_TOP, a.fade));
    side.current.color.copy(tmpSide.set(colors.side).lerp(FADE_SIDE, a.fade));
    const glow = isHover ? 0.1 : 0;
    top.current.emissive.setRGB(glow, glow, glow);

    if (a.sel !== isSel) {
      a.sel = isSel;
      a.t0 = now;
      a.from = a.f;
    }
    const since = now - a.t0;
    let sy = 0;
    let sxz = 0;
    let wobble = 0;
    let spin = 0;
    if (isSel) {
      const x = reduceMotion ? 1 : clamp01((since - 0.15) / 0.8);
      sy = backOut(x, 2.8);
      sxz = backOut(x, 1.2);
      wobble = Math.sin(x * Math.PI * 3) * (1 - x) * 0.18;
      spin = (1 - x) * 0.9;
      a.f = x;
    } else {
      const x = reduceMotion ? 1 : clamp01(since / 0.25);
      a.f = a.from * (1 - x);
      sy = sxz = a.f;
    }
    const ground = info.sea ? 0 : a.h * 1.035 + a.lift;
    lm.current.visible = sy > 0.001;
    lm.current.scale.set(lmScale * sxz, lmScale * Math.max(sy, 0), lmScale * sxz);
    lm.current.position.y = ground;
    lm.current.rotation.set(0, (info.rot || 0) + spin, wobble);
    if (lm.current.visible) landmark.update(reduceMotion ? 0 : now);

    const bt = isSel && !reduceMotion ? since - 0.15 : -1;
    const showBurst = bt > 0 && bt < 0.9;
    ring.current.visible = showBurst;
    if (showBurst) {
      const u = bt / 0.9;
      ring.current.position.set(lx, ground + 0.03, lz);
      ring.current.scale.setScalar(0.4 + u * 2.4);
      ring.current.material.opacity = 0.85 * (1 - u);
    }
    bits.current.forEach((m, i) => {
      if (!m) return;
      m.visible = showBurst;
      if (!showBurst) return;
      const ang = (i / bits.current.length) * Math.PI * 2;
      const r = bt * 1.9;
      m.position.set(lx + Math.cos(ang) * r, ground + 0.1 + bt * 3.2 - bt * bt * 4.5, lz + Math.sin(ang) * r);
      m.scale.setScalar(1 - bt / 0.9);
      m.rotation.set(bt * 8, bt * 6, 0);
    });

    const lyTarget = isSel
      ? ground + (info.model ? 1.0 : 1.45) * lmScale + 0.15
      : (info.sea ? 0 : a.h * 1.035) + 0.2;
    const L = label.current;
    L.position.x += ((isSel ? lx : cx) - L.position.x) * k;
    L.position.z += ((isSel ? lz : cz) - L.position.z) * k;
    L.position.y += (lyTarget - L.position.y) * k;

    L.getWorldPosition(_proj);
    _proj.project(camera);
    const screenX = (_proj.x * 0.5 + 0.5) * size.width;
    const screenY = (-_proj.y * 0.5 + 0.5) * size.height;
    const inFront = _proj.z < 1;
    setDistrictLabel(id, inFront ? {
      x: screenX,
      y: screenY,
      name: geo.name,
      sub: isSel ? info.lm : formatTagRent(rent, rentLoading),
      on: isSel,
      dim,
      z: isSel ? 30 : isHover ? 20 : 10,
    } : null);
  });

  const handlers = {
    onClick: (e) => {
      e.stopPropagation();
      if (e.delta < 6) onSelect(isSel ? null : id);
    },
    onPointerOver: (e) => {
      e.stopPropagation();
      onHover(id);
    },
    onPointerOut: () => onHover(null),
  };

  const showGlb = Boolean(info.model && loadGlb && (isSel || s.current.f > 0.001));

  return (
    <group>
      <group {...handlers}>
        <mesh
          ref={land}
          geometry={geometry}
          position={[cx, 0, cz]}
          scale={[0.972, heightFor(rent), 0.972]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial ref={top} attach="material-0" color={colors.top} roughness={0.85} />
          <meshStandardMaterial ref={side} attach="material-1" color={colors.side} roughness={0.9} />
        </mesh>
        <group ref={lm} position={[lx, 0, lz]} visible={false}>
          {showGlb ? (
            <ModelBoundary fallback={<primitive object={landmark.group} />}>
              <Suspense fallback={null}>
                <GlbModel url={info.model} fitSize={modelFit} />
              </Suspense>
            </ModelBoundary>
          ) : (
            <primitive object={landmark.group} />
          )}
        </group>
      </group>

      <mesh ref={ring} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.42, 0.5, 40]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0} depthWrite={false} />
      </mesh>
      {BURST_COLORS.map((c, i) => (
        <mesh key={i} ref={(el) => { bits.current[i] = el; }} visible={false}>
          <boxGeometry args={[0.09, 0.09, 0.09]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}

      <group ref={label} position={[cx, 0.6, cz]} />
    </group>
  );
}
