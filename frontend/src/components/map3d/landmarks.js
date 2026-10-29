// 랜드마크 3D 모형 (순수 Three.js로 작성)
// createLandmark(id)는 { group, update(t) }를 돌려주고, React 쪽(District.jsx)에서 <primitive>로 붙입니다.
// 모형을 바꾸고 싶으면 아래 LM 객체에서 해당 구의 함수만 고치면 됩니다.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// ---------- 재질 · 도형 도우미 ----------
const matCache = new Map();
function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.72, ...opts }));
  return matCache.get(key);
}
function add(parent, geo, color, x = 0, y = 0, z = 0, opts) {
  const m = new THREE.Mesh(geo, mat(color, opts));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}
const box = (p, w, h, d, c, x, y, z, r = 0.035, o) => add(p, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.2, h / 2.2, d / 2.2)), c, x, y + h / 2, z, o);
const cyl = (p, r1, r2, h, c, x, y, z, s = 16, o) => add(p, new THREE.CylinderGeometry(r1, r2, h, s), c, x, y + h / 2, z, o);
const ball = (p, r, c, x, y, z, o) => add(p, new THREE.SphereGeometry(r, 18, 12), c, x, y, z, o);
const cone = (p, r, h, c, x, y, z, s = 16, o) => add(p, new THREE.ConeGeometry(r, h, s), c, x, y + h / 2, z, o);
function tree(p, x, z, s = 1, c = '#7CC57F') {
  cyl(p, 0.03 * s, 0.04 * s, 0.16 * s, '#A9805A', x, 0, z, 8);
  ball(p, 0.15 * s, c, x, 0.27 * s, z);
}
function tube(p, pts, r, c) {
  const curve = new THREE.CatmullRomCurve3(pts.map(a => new THREE.Vector3(...a)));
  return add(p, new THREE.TubeGeometry(curve, 48, r, 6), c);
}
const GLOW = { emissive: '#FFE7A3', emissiveIntensity: 0.9 };

// ---------- 랜드마크 ----------
let anim = []; // createLandmark 호출 중 채워지는 애니메이션 목록
const LM = {
  haeundae(g) {
    cyl(g, 0.78, 0.82, 0.05, '#F6E3B4', 0.05, 0, 0.35, 28);
    cyl(g, 0.02, 0.02, 0.62, '#FFFFFF', -0.25, 0, 0.45, 8);
    cone(g, 0.36, 0.16, '#FF8E7E', -0.25, 0.56, 0.45, 10);
    cyl(g, 0.02, 0.02, 0.5, '#FFFFFF', 0.35, 0, 0.6, 8);
    cone(g, 0.28, 0.13, '#7CC4F0', 0.35, 0.44, 0.6, 10);
    ball(g, 0.08, '#FFD35E', 0.1, 0.13, 0.7);
    box(g, 0.3, 1.55, 0.3, '#D3E0EF', -0.15, 0.04, -0.35, 0.06);
    cone(g, 0.12, 0.3, '#D3E0EF', -0.15, 1.59, -0.35, 4);
    box(g, 0.28, 1.25, 0.28, '#C3D4E9', 0.25, 0.04, -0.25, 0.06);
    box(g, 0.26, 0.95, 0.26, '#DCE6F2', 0.58, 0.04, -0.4, 0.06);
  },
  suyeong(g) {
    const L = 1.75;
    box(g, L * 2, 0.07, 0.2, '#F4F7FB', 0, 0.3, 0, 0.02);
    for (const x of [-0.85, 0.85]) {
      box(g, 0.1, 0.38, 0.1, '#E2E9F2', x, -0.05, 0, 0.02);
      box(g, 0.09, 0.75, 0.06, '#FFFFFF', x, 0.36, -0.08, 0.02);
      box(g, 0.09, 0.75, 0.06, '#FFFFFF', x, 0.36, 0.08, 0.02);
      box(g, 0.09, 0.05, 0.22, '#FFFFFF', x, 1.06, 0, 0.015);
    }
    for (const z of [-0.08, 0.08]) {
      tube(g, [[-L, 0.37, z], [-1.3, 0.62, z], [-0.85, 1.1, z], [-0.4, 0.62, z], [0, 0.46, z], [0.4, 0.62, z], [0.85, 1.1, z], [1.3, 0.62, z], [L, 0.37, z]], 0.018, '#8FB2E6');
    }
    const cols = ['#FF8E7E', '#FFD35E', '#8FE0B5', '#7CC4F0', '#B79CF2'];
    for (let i = 0; i < 15; i++) ball(g, 0.035, cols[i % 5], -1.6 + i * 0.228, 0.42, 0.11, { emissive: cols[i % 5], emissiveIntensity: 0.6 });
  },
  nam(g) {
    const rock = new THREE.DodecahedronGeometry(1, 0);
    [[-0.45, 0.1, 0.2, 0.22], [-0.1, -0.15, 0.18, 0.17], [0.25, 0.15, 0.24, 0.2], [0.55, -0.1, 0.14, 0.13], [0.05, 0.35, 0.12, 0.11]].forEach(([x, z, s, h]) => {
      const m = add(g, rock, '#A9BCA6', x, h * 0.4, z); m.scale.set(s, h, s); m.rotation.y = x * 3;
      ball(g, s * 0.75, '#8FC98D', x, h * 0.95, z).scale.set(1, 0.35, 1);
    });
    cyl(g, 0.08, 0.11, 0.5, '#FFFFFF', 0.25, 0.3, 0.15, 14);
    cyl(g, 0.1, 0.1, 0.09, '#EE6E5E', 0.25, 0.8, 0.15, 14);
    const lamp = ball(g, 0.06, '#FFF1B8', 0.25, 0.93, 0.15, GLOW);
    cone(g, 0.1, 0.08, '#EE6E5E', 0.25, 0.97, 0.15, 14);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.1, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#FFF0A8', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    beam.geometry.translate(0, -0.55, 0); beam.rotation.z = Math.PI / 2;
    const pivot = new THREE.Group(); pivot.position.copy(lamp.position); pivot.add(beam); g.add(pivot);
    anim.push(t => { pivot.rotation.y = t * 1.2; });
  },
  yeongdo(g) {
    box(g, 0.5, 0.32, 0.46, '#E6ECF3', -0.95, -0.02, 0, 0.04);
    box(g, 0.5, 0.32, 0.46, '#E6ECF3', 0.95, -0.02, 0, 0.04);
    box(g, 0.75, 0.07, 0.34, '#BFCBDA', -1.45, 0.25, 0, 0.02);
    box(g, 0.75, 0.07, 0.34, '#BFCBDA', 1.45, 0.25, 0, 0.02);
    box(g, 0.12, 0.42, 0.12, '#FFFFFF', 0.95, 0.3, 0.17, 0.02);
    box(g, 0.12, 0.42, 0.12, '#FFFFFF', 0.95, 0.3, -0.17, 0.02);
    const pivot = new THREE.Group(); pivot.position.set(0.72, 0.33, 0); g.add(pivot);
    box(pivot, 1.44, 0.07, 0.34, '#F08A6C', -0.72, -0.035, 0, 0.02);
    box(pivot, 1.3, 0.012, 0.03, '#FFFFFF', -0.72, 0.035, 0, 0.005);
    anim.push(t => { const c = (t % 12) / 12; const k = c < 0.35 ? 0 : c < 0.5 ? (c - 0.35) / 0.15 : c < 0.8 ? 1 : c < 0.95 ? 1 - (c - 0.8) / 0.15 : 0; pivot.rotation.z = -k * k * (3 - 2 * k) * 0.9; });
  },
  jung(g) {
    const hill = ball(g, 0.5, '#9ED38D', 0, 0, 0); hill.scale.set(1, 0.42, 1);
    cyl(g, 0.05, 0.075, 1.25, '#F7F9FC', 0, 0.18, 0, 14);
    cyl(g, 0.15, 0.2, 0.1, '#FFFFFF', 0, 1.3, 0, 20);
    cyl(g, 0.2, 0.15, 0.12, '#8DB6EA', 0, 1.4, 0, 20, { emissive: '#8DB6EA', emissiveIntensity: 0.15 });
    cyl(g, 0.17, 0.2, 0.04, '#FFFFFF', 0, 1.52, 0, 20);
    cyl(g, 0.012, 0.012, 0.32, '#EE6E5E', 0, 1.56, 0, 6);
    tree(g, 0.32, 0.18, 0.8); tree(g, -0.3, 0.2, 0.7, '#8CCB78');
  },
  dong(g) {
    box(g, 1.25, 0.3, 0.5, '#EEF2F7', 0, 0, -0.1, 0.05);
    const roof = add(g, new THREE.CylinderGeometry(0.27, 0.27, 1.3, 20, 1, false, 0, Math.PI), '#8CB8EA', 0, 0.3, -0.1, { side: THREE.DoubleSide });
    roof.rotation.z = Math.PI / 2;
    box(g, 1.9, 0.02, 0.1, '#9AA6B8', 0, 0, 0.38, 0.01);
    const train = new THREE.Group(); g.add(train);
    const body = add(train, new THREE.CapsuleGeometry(0.075, 0.55, 6, 12), '#FFFFFF', 0, 0.1, 0.38); body.rotation.z = Math.PI / 2;
    box(train, 0.6, 0.035, 0.16, '#4F7FD6', 0, 0.09, 0.38, 0.015);
    anim.push(t => { train.position.x = Math.sin(t * 0.45) * 0.55; });
  },
  seo(g) {
    cyl(g, 0.035, 0.06, 1.0, '#E7ECF3', -0.75, 0, 0, 10);
    cyl(g, 0.035, 0.06, 1.0, '#E7ECF3', 0.75, 0, 0, 10);
    tube(g, [[-0.75, 0.98, 0], [0, 0.86, 0], [0.75, 0.98, 0]], 0.012, '#6F7D92');
    const car = new THREE.Group(); g.add(car);
    cyl(car, 0.008, 0.008, 0.16, '#6F7D92', 0, -0.16, 0, 6);
    box(car, 0.17, 0.15, 0.15, '#FF6F6F', 0, -0.3, 0, 0.04);
    box(car, 0.18, 0.05, 0.155, '#E8F4FF', 0, -0.23, 0, 0.015);
    anim.push(t => { const u = (Math.sin(t * 0.5) + 1) / 2; const x = -0.6 + u * 1.2; car.position.set(x, 0.98 - 0.12 * (1 - (x / 0.75) ** 2), 0); });
  },
  saha(g) {
    box(g, 1.15, 0.14, 0.95, '#CFE5C2', 0, 0, 0, 0.05);
    box(g, 0.85, 0.14, 0.7, '#C4DFB6', 0, 0.14, -0.1, 0.05);
    box(g, 0.55, 0.14, 0.45, '#B9D9AA', 0, 0.28, -0.18, 0.05);
    const cols = ['#FF9C8F', '#FFD36E', '#8FD3C7', '#9DB8F2', '#F7B6D2', '#B9E28C', '#FFB86B'];
    const spots = [[-0.42, 0.14, 0.3], [-0.14, 0.14, 0.33], [0.14, 0.14, 0.3], [0.42, 0.14, 0.32], [-0.3, 0.28, 0.12], [0, 0.28, 0.1], [0.3, 0.28, 0.12], [-0.15, 0.42, -0.1], [0.15, 0.42, -0.1]];
    spots.forEach(([x, y, z], i) => {
      box(g, 0.2, 0.16, 0.16, cols[i % cols.length], x, y, z, 0.03);
      box(g, 0.22, 0.03, 0.18, '#7FA6E0', x, y + 0.16, z, 0.01);
    });
  },
  gangseo(g) {
    box(g, 2.3, 0.03, 0.36, '#7D8A9C', 0, 0, 0, 0.015);
    for (let i = 0; i < 7; i++) box(g, 0.16, 0.035, 0.03, '#FFFFFF', -0.9 + i * 0.3, 0, 0, 0.01);
    box(g, 0.5, 0.28, 0.3, '#EEF2F7', 0.4, 0, -0.5, 0.04);
    cyl(g, 0.05, 0.06, 0.55, '#FFFFFF', -0.5, 0, -0.5, 10);
    cyl(g, 0.12, 0.1, 0.1, '#8CB8EA', -0.5, 0.55, -0.5, 14);
    const orbit = new THREE.Group(); g.add(orbit); orbit.position.y = 1.25;
    const plane = new THREE.Group(); orbit.add(plane); plane.position.x = 1.15;
    const fus = add(plane, new THREE.CapsuleGeometry(0.07, 0.42, 6, 12), '#FFFFFF'); fus.rotation.x = Math.PI / 2;
    box(plane, 0.7, 0.025, 0.14, '#FFFFFF', 0, -0.01, 0.02, 0.01);
    box(plane, 0.25, 0.02, 0.08, '#FFFFFF', 0, 0.02, -0.25, 0.01);
    box(plane, 0.02, 0.14, 0.1, '#5B8DEF', 0, 0.02, -0.26, 0.01);
    anim.push(t => { orbit.rotation.y = -t * 0.35; plane.rotation.z = 0.25; });
  },
  sasang(g) {
    const bus = new THREE.Group(); g.add(bus); bus.rotation.y = 0.3;
    box(bus, 0.8, 0.32, 0.34, '#5FA8E8', 0, 0.06, 0, 0.07);
    box(bus, 0.7, 0.1, 0.35, '#E8F4FF', 0, 0.22, 0, 0.03);
    box(bus, 0.8, 0.03, 0.345, '#FFD35E', 0, 0.12, 0, 0.01);
    for (const x of [-0.25, 0.25]) for (const z of [-0.17, 0.17]) { const w = add(bus, new THREE.CylinderGeometry(0.07, 0.07, 0.05, 14), '#3B4659', x, 0.07, z); w.rotation.x = Math.PI / 2; }
    cyl(g, 0.015, 0.015, 0.55, '#8A96AB', 0.6, 0, 0.25, 6);
    box(g, 0.2, 0.14, 0.03, '#1A5FD0', 0.6, 0.48, 0.25, 0.02);
    anim.push(t => { bus.position.y = Math.abs(Math.sin(t * 6)) * 0.012; });
  },
  buk(g) {
    const river = box(g, 0.32, 0.02, 1.7, '#7CC4F0', -0.7, 0, 0, 0.01);
    river.rotation.y = 0.2;
    [[-0.2, -0.35, 1.1], [0.15, -0.1, 0.9], [-0.1, 0.25, 1], [0.35, 0.3, 0.8], [0.45, -0.4, 0.75], [0.05, 0.6, 0.7]].forEach(([x, z, s], i) => tree(g, x, z, s, i % 2 ? '#8CCB78' : '#6FBF73'));
  },
  busanjin(g) {
    const B = [[-0.35, -0.15, 0.85, '#C9C0F2'], [0, -0.3, 1.2, '#BFD8F4'], [0.32, -0.1, 0.95, '#FFC7B0'], [-0.05, 0.22, 0.6, '#BFEBD8'], [0.38, 0.3, 0.5, '#FFE3A3']];
    B.forEach(([x, z, h, c]) => { box(g, 0.28, h, 0.28, c, x, 0, z, 0.05); box(g, 0.29, 0.06, 0.29, '#FFF4C8', x, h * 0.62, z, 0.02, GLOW); });
    box(g, 0.34, 0.16, 0.04, '#FF7A9C', -0.35, 0.95, -0.02, 0.03, { emissive: '#FF7A9C', emissiveIntensity: 0.45 });
  },
  dongnae(g) {
    cyl(g, 0.42, 0.38, 0.16, '#C9A27A', 0, 0, 0, 24);
    cyl(g, 0.36, 0.36, 0.02, '#86D6EA', 0, 0.15, 0, 24);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ball(g, 0.06, '#B9B2A6', Math.cos(a) * 0.48, 0.04, Math.sin(a) * 0.48); }
    const steam = [];
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), new THREE.MeshStandardMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.8, depthWrite: false }));
      s.position.set((i - 1.5) * 0.12, 0.3, (i % 2) * 0.1 - 0.05); g.add(s); steam.push(s);
    }
    anim.push(t => steam.forEach((s, i) => { const u = (t * 0.35 + i / 4) % 1; s.position.y = 0.22 + u * 0.75; s.scale.setScalar(0.6 + u * 0.9); s.material.opacity = 0.85 * (1 - u); }));
  },
  yeonje(g) {
    box(g, 0.8, 0.45, 0.45, '#E9EEF5', 0, 0, 0, 0.05);
    box(g, 0.38, 0.55, 0.32, '#F7F9FC', 0, 0.45, 0, 0.05);
    for (let i = 0; i < 4; i++) box(g, 0.09, 0.14, 0.01, '#8CB8EA', -0.27 + i * 0.18, 0.18, 0.23, 0.01);
    cyl(g, 0.012, 0.012, 0.55, '#C7CFDA', 0.5, 0, 0.3, 6);
    box(g, 0.18, 0.11, 0.012, '#5B8DEF', 0.6, 0.42, 0.3, 0.005);
    tree(g, -0.55, 0.3, 0.7);
  },
  geumjeong(g) {
    box(g, 0.95, 0.08, 0.7, '#E2D3B2', 0, 0, 0, 0.03);
    box(g, 0.66, 0.3, 0.44, '#D85E50', 0, 0.08, 0, 0.03);
    const roof = add(g, new THREE.ConeGeometry(0.62, 0.32, 4), '#5E7D6C', 0, 0.54, 0, { flatShading: true });
    roof.rotation.y = Math.PI / 4; roof.scale.set(1.15, 1, 0.8);
    tree(g, 0.6, 0.3, 0.75, '#5FAF6A'); tree(g, -0.62, 0.25, 0.85, '#6FBF73'); tree(g, -0.5, -0.35, 0.7, '#5FAF6A');
  },
  gijang(g) {
    const rock = add(g, new THREE.DodecahedronGeometry(0.5, 0), '#B4BEC9', 0, 0.1, 0); rock.scale.set(1, 0.45, 0.9);
    box(g, 0.34, 0.36, 0.5, '#FFFFFF', 0, 0.28, 0, 0.03);
    const roof = add(g, new THREE.ConeGeometry(0.31, 0.24, 4), '#E8584B', 0, 0.76, 0, { flatShading: true });
    roof.rotation.y = Math.PI / 4; roof.scale.set(0.8, 1, 1.15);
    cyl(g, 0.08, 0.08, 0.32, '#FFFFFF', 0, 0.28, 0.32, 12);
    cone(g, 0.1, 0.2, '#E8584B', 0, 0.6, 0.32, 12);
    box(g, 0.02, 0.14, 0.02, '#FFFFFF', 0, 0.8, 0.32, 0.005);
    box(g, 0.08, 0.02, 0.02, '#FFFFFF', 0, 0.88, 0.32, 0.005);
    box(g, 0.08, 0.12, 0.01, '#7CC4F0', 0, 0.4, 0.255, 0.01);
  }
};

export function createLandmark(id) {
  const group = new THREE.Group();
  anim = [];
  LM[id](group);
  const fns = anim;
  group.traverse(o => { if (o.isMesh) o.userData.id = id; });
  return { group, update: t => fns.forEach(f => f(t)) };
}
