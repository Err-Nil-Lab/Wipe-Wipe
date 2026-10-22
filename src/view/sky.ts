// Langit: kubah bergradasi (terang di cakrawala sama dengan warna kabut, gelap di atas), bintang, dan bulan.
// Bulan ada di utara-timur laut supaya terlihat dari jendela DEPAN.
import * as THREE from "three";
import { config } from "../config";

export const mistColor = new THREE.Color(0x9a9c9e);
const zenithColor = new THREE.Color(0x15181a);

// Arah bulan dari pusat dunia (sudah dinormalkan); dipakai juga untuk arah cahaya bulan.
export const moonDirection = new THREE.Vector3(0.25, 0.32, -0.91).normalize();

function dome(radius: number): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 20, 14);
  const position = geometry.getAttribute("position");
  const colors = new Float32Array(position.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const elevation = Math.max(0, position.getY(i) / radius); // 0 di cakrawala, 1 di puncak
    const t = THREE.MathUtils.smoothstep(elevation, 0, 0.55);
    color.copy(mistColor).lerp(zenithColor, t);
    colors.set([color.r, color.g, color.b], i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  mesh.renderOrder = -10;
  return mesh;
}

function stars(radius: number, count: number): THREE.Points {
  const positions = new Float32Array(count * 3);
  let seed = 11;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); // pengacak sederhana dengan seed tetap
  for (let i = 0; i < count; i++) {
    const azimuth = random() * Math.PI * 2;
    const elevation = THREE.MathUtils.degToRad(8 + random() * 80);
    positions.set([Math.cos(elevation) * Math.cos(azimuth) * radius, Math.sin(elevation) * radius, Math.cos(elevation) * Math.sin(azimuth) * radius], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false, depthWrite: false }));
  points.renderOrder = -9;
  return points;
}

function moon(distance: number): THREE.Group {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(3, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, depthWrite: false }));
  const halo = new THREE.Mesh(new THREE.CircleGeometry(8, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, fog: false, depthWrite: false }));
  halo.position.z = -0.1; // di belakang cakram
  group.add(halo, disc);
  group.position.copy(moonDirection).multiplyScalar(distance);
  group.lookAt(0, 0, 0);
  group.renderOrder = -8;
  return group;
}

export function buildSky(scene: THREE.Scene) {
  scene.background = mistColor;
  scene.fog = new THREE.FogExp2(mistColor, config.view3d.fogDensity); // kabut terang: siluet gelap terbaca di depannya
  scene.add(dome(100), stars(95, 220), moon(85));
}
