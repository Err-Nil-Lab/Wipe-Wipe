// Kabut tanah: beberapa bidang datar setinggi lutut sampai pinggang dengan noise lembut yang bergeser
// pelan. Dari ketinggian mata, lapisan ini terlihat sebagai pita kabut yang menggulung di halaman.
import * as THREE from "three";
import { mistColor } from "./sky";

function cloudTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  let seed = 3;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 46; i++) {
    const x = random() * size;
    const y = random() * size;
    const r = 10 + random() * 24;
    // Gambar tiga kali (digeser selebar kanvas) supaya tekstur bisa disambung tanpa garis.
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
        g.addColorStop(0, "rgba(255,255,255,0.5)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 7);
  return texture;
}

const layers = [
  { height: 0.3, opacity: 0.35, speedX: 0.004, speedY: 0.002 },
  { height: 0.7, opacity: 0.3, speedX: -0.003, speedY: 0.003 },
  { height: 1.2, opacity: 0.22, speedX: 0.002, speedY: -0.004 },
];

export function buildMist(scene: THREE.Scene) {
  const meshes = layers.map((layer) => {
    const texture = cloudTexture();
    const material = new THREE.MeshBasicMaterial({ color: mistColor, alphaMap: texture, transparent: true, opacity: layer.opacity, depthWrite: false, fog: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = layer.height;
    scene.add(mesh);
    return { texture, layer };
  });

  return {
    update(timeSec: number) {
      for (const { texture, layer } of meshes) texture.offset.set(timeSec * layer.speedX, timeSec * layer.speedY);
    },
  };
}
