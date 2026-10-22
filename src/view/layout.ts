// Letak ruangan dan jendela di dunia 3D (satuan meter). Dipakai rumah, kamera, dan kaca
// supaya ketiganya selalu sepakat soal posisi. Dinding utara (z negatif) adalah dinding "asal";
// dinding lain didapat dengan memutarnya mengelilingi pusat ruangan.
import * as THREE from "three";
import { config } from "../config";

export const roomHalf = 2.5; // setengah sisi ruangan
export const wallHeight = 3;
export const wallThickness = 0.2;

const up = new THREE.Vector3(0, 1, 0);

// Sudut putar tiap jendela, urutan sama dengan config.windows: KIRI = barat, DEPAN = utara, KANAN = timur.
// Sudut yang sama dipakai untuk arah pandang kamera di depan jendela itu.
export const windowYaw = [Math.PI / 2, 0, -Math.PI / 2];

// Tengah kaca jendela i.
export function glassPosition(i: number): THREE.Vector3 {
  return new THREE.Vector3(0, config.view3d.windowCenterY, -roomHalf).applyAxisAngle(up, windowYaw[i]);
}

// Tempat kamera berdiri di depan jendela i.
export function stationPosition(i: number): THREE.Vector3 {
  return new THREE.Vector3(0, config.view3d.eyeHeight, -roomHalf + config.view3d.stationDistance).applyAxisAngle(up, windowYaw[i]);
}
