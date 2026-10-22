// Kamera first person: berdiri di depan jendela aktif, atau berjalan melengkung lewat tengah ruangan
// saat pindah jendela. Tidak berisi aturan game; hanya membaca state dari Night.
import * as THREE from "three";
import { config } from "../config";
import type { Night } from "../logic/night";
import { stationPosition, windowYaw } from "./layout";

const center = new THREE.Vector3(0, config.view3d.eyeHeight, 0); // titik kontrol lengkung jalan

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export function createCameraRig(camera: THREE.PerspectiveCamera) {
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();

  function update(night: Night, timeSec: number) {
    let yaw = windowYaw[night.current];
    let roll = 0;
    // Napas pelan saat diam: naik-turun dan miring sangat kecil.
    let bob = Math.sin(timeSec * 1.3) * 0.008;
    let pitch = Math.sin(timeSec * 0.9) * 0.004;

    const travel = night.travel;
    if (!travel) {
      camera.position.copy(stationPosition(night.current));
    } else {
      const progress = night.travelProgress();
      const e = smoothstep(progress);
      const from = stationPosition(travel.from);
      const to = stationPosition(travel.to);
      // Kurva Bezier kuadrat dari stasiun asal ke tujuan, melengkung ke tengah ruangan.
      a.copy(from).lerp(center, e);
      b.copy(center).lerp(to, e);
      camera.position.copy(a.lerp(b, e));

      yaw = windowYaw[travel.from] + (windowYaw[travel.to] - windowYaw[travel.from]) * e;
      // Goyang langkah: dua langkah per detik perjalanan, mereda di awal dan akhir.
      const fade = Math.sin(progress * Math.PI);
      const phase = progress * travel.duration * 2 * Math.PI * 2;
      bob += Math.abs(Math.sin(phase / 2)) * config.view3d.travelBob * fade;
      roll = Math.sin(phase / 2) * config.view3d.travelRoll * fade;
    }

    camera.position.y += bob;
    camera.rotation.set(pitch, yaw, roll, "YXZ");
  }

  return { update };
}
