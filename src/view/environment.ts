// Dunia di luar rumah: tanah, hutan pinus (instancing supaya hanya 3 draw call), kabut, dan cahaya bulan.
// Halaman di depan tiap jendela dikosongkan sebagai jalur monster.
import * as THREE from "three";
import { roomHalf, windowYaw } from "./layout";
import { speckleTexture } from "./textures";

const mist = new THREE.Color(0x9a9c9e);

// Pengacak dengan seed tetap supaya hutan selalu sama.
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Titik (x, z) berada di jalur kosong di depan salah satu jendela, atau terlalu dekat rumah.
function isReserved(x: number, z: number): boolean {
  if (Math.abs(x) < roomHalf + 1 && Math.abs(z) < roomHalf + 1) return true;
  return windowYaw.some((yaw) => {
    const lateral = Math.abs(x * Math.cos(yaw) - z * Math.sin(yaw)); // jarak ke garis tengah jalur
    const forward = -(x * Math.sin(yaw) + z * Math.cos(yaw)); // jarak keluar dari rumah searah jalur
    return forward > roomHalf && lateral < 2.4;
  });
}

function forest(scene: THREE.Scene, count: number) {
  const dark = new THREE.MeshLambertMaterial({ color: 0x1a1a1a, flatShading: true });
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.16, 1.2, 5), dark, count);
  const lower = new THREE.InstancedMesh(new THREE.ConeGeometry(0.95, 2.2, 6), dark, count);
  const upper = new THREE.InstancedMesh(new THREE.ConeGeometry(0.65, 1.8, 6), dark, count);
  const random = seededRandom(7);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scaleVec = new THREE.Vector3();
  const identity = new THREE.Quaternion();

  let placed = 0;
  while (placed < count) {
    const angle = random() * Math.PI * 2;
    const radius = 4 + random() * 24;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (isReserved(x, z)) continue;
    const s = 0.8 + random() * 0.9;
    scaleVec.set(s, s, s);
    const part = (mesh: THREE.InstancedMesh, y: number) => {
      mesh.setMatrixAt(placed, matrix.compose(position.set(x, y * s, z), identity, scaleVec));
    };
    part(trunk, 0.6);
    part(lower, 1.9);
    part(upper, 3.1);
    placed++;
  }
  scene.add(trunk, lower, upper);
}

export function buildEnvironment(scene: THREE.Scene) {
  scene.background = mist;
  scene.fog = new THREE.FogExp2(mist, 0.07); // kabut terang: siluet gelap terbaca di depannya

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.MeshLambertMaterial({ map: speckleTexture(70, 60, 60), flatShading: true }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  forest(scene, 260);

  // Bulan dari utara: permukaan yang menghadap rumah tetap gelap, jadi monster tampil sebagai siluet.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x303030, 0.5));
  const moon = new THREE.DirectionalLight(0xffffff, 0.9);
  moon.position.set(-6, 14, -20);
  scene.add(moon);
}
