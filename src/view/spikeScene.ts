// SEMENTARA (spike 3D-0): ruangan kotak, satu jendela, halaman luar sederhana.
// Diganti house.ts dan environment.ts di milestone berikutnya.
import * as THREE from "three";
import { config } from "../config";
import { plankTexture, speckleTexture } from "./textures";

const half = 2.5; // setengah sisi ruangan
const wallThickness = 0.2;
const wallHeight = 3;

// Posisi tengah kaca: di dinding utara, tepat di tengah ketebalan dinding.
export const glassPosition = new THREE.Vector3(0, config.view3d.windowCenterY, -half);
// Kamera berdiri 1,3 m di depan kaca, setinggi mata.
export const cameraPosition = new THREE.Vector3(0, 1.6, -half + 1.3);

function box(w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  return mesh;
}

function dummyMonster(x: number, z: number) {
  const black = new THREE.MeshLambertMaterial({ color: 0x050505, flatShading: true });
  const eye = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const group = new THREE.Group();
  group.add(box(0.45, 1.0, 0.25, black, 0, 1.0, 0));
  group.add(box(0.12, 0.9, 0.12, black, -0.2, 0.45, 0));
  group.add(box(0.12, 0.9, 0.12, black, 0.2, 0.45, 0));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 6, 5), black);
  head.position.set(0, 1.75, 0);
  group.add(head);
  for (const side of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 3), eye);
    e.position.set(side * 0.06, 1.77, 0.15);
    group.add(e);
  }
  group.position.set(x, 0, z);
  group.rotation.y = Math.PI; // menghadap rumah
  return group;
}

export function buildSpikeScene() {
  const scene = new THREE.Scene();
  const mist = new THREE.Color(0x9a9c9e);
  scene.background = mist;
  scene.fog = new THREE.FogExp2(mist, 0.07); // kabut terang: siluet gelap terbaca di depannya

  const planks = new THREE.MeshLambertMaterial({ map: plankTexture(150, 3, 2), flatShading: true });
  const floorMat = new THREE.MeshLambertMaterial({ map: plankTexture(110, 4, 4, 5), flatShading: true });

  // Ruangan: lantai, langit-langit, 3 dinding utuh, dan dinding utara dengan lubang jendela.
  const wallY = wallHeight / 2;
  const room = new THREE.Group();
  room.add(box(2 * half, 0.1, 2 * half, floorMat, 0, -0.05, 0));
  room.add(box(2 * half, 0.1, 2 * half, planks, 0, wallHeight + 0.05, 0));
  room.add(box(2 * half, wallHeight, wallThickness, planks, 0, wallY, half)); // selatan
  room.add(box(wallThickness, wallHeight, 2 * half, planks, -half, wallY, 0)); // barat
  room.add(box(wallThickness, wallHeight, 2 * half, planks, half, wallY, 0)); // timur

  const g = config.view3d.glassSize;
  const cy = config.view3d.windowCenterY;
  const sideWidth = half - g / 2;
  const northZ = -half;
  room.add(box(sideWidth, wallHeight, wallThickness, planks, -(half - sideWidth / 2), wallY, northZ));
  room.add(box(sideWidth, wallHeight, wallThickness, planks, half - sideWidth / 2, wallY, northZ));
  room.add(box(g, cy - g / 2, wallThickness, planks, 0, (cy - g / 2) / 2, northZ));
  room.add(box(g, wallHeight - cy - g / 2, wallThickness, planks, 0, wallHeight - (wallHeight - cy - g / 2) / 2, northZ));

  // Bingkai jendela tebal + ambang di bawahnya.
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a, flatShading: true });
  const f = 0.09;
  room.add(box(g + 2 * f, f, 0.26, frameMat, 0, cy + g / 2 + f / 2, northZ));
  room.add(box(g + 2 * f, f, 0.26, frameMat, 0, cy - g / 2 - f / 2, northZ));
  room.add(box(f, g, 0.26, frameMat, -g / 2 - f / 2, cy, northZ));
  room.add(box(f, g, 0.26, frameMat, g / 2 + f / 2, cy, northZ));
  room.add(box(g + 0.3, 0.06, 0.3, frameMat, 0, cy - g / 2 - f - 0.03, northZ + 0.12));
  scene.add(room);

  // Halaman luar di utara jendela: tanah, pohon, dan dua boneka monster untuk menilai keterbacaan.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshLambertMaterial({ map: speckleTexture(70, 40, 40), flatShading: true }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.01, -half - 38);
  scene.add(ground);

  const treeMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a, flatShading: true });
  for (let i = 0; i < 36; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (1.8 + ((i * 7) % 11) * 1.1); // menyisakan jalur kosong di tengah
    const z = -half - 3 - ((i * 5) % 13) * 1.2;
    const tree = new THREE.Group();
    tree.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.2, 5), treeMat));
    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 6), treeMat);
    cone1.position.y = 1.9;
    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.8, 6), treeMat);
    cone2.position.y = 3.1;
    tree.add(cone1, cone2);
    tree.position.set(x, 0.6, z);
    scene.add(tree);
  }
  scene.add(dummyMonster(-0.4, -half - 3.0)); // 3 m dari kaca
  scene.add(dummyMonster(0.8, -half - 9.0)); // 9 m dari kaca

  // Cahaya: lentera di dalam (berkedip), bulan dari utara (permukaan menghadap rumah tetap gelap).
  scene.add(new THREE.HemisphereLight(0xffffff, 0x303030, 0.5));
  const moon = new THREE.DirectionalLight(0xffffff, 0.9);
  moon.position.set(-6, 14, -20);
  scene.add(moon);
  const lantern = new THREE.PointLight(0xffffff, 12, 0, 2);
  lantern.position.set(0, 2.4, -0.3);
  scene.add(lantern);

  const camera = new THREE.PerspectiveCamera(config.view3d.fov, 16 / 9, 0.05, 80);
  camera.position.copy(cameraPosition);
  camera.lookAt(glassPosition);

  return { scene, camera, lantern };
}
