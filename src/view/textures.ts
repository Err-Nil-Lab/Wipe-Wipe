// Tekstur prosedural dari canvas kecil dengan filter NEAREST (tampilan PS1), tanpa file gambar.
import * as THREE from "three";

// Pengacak dengan seed tetap supaya tampilan selalu sama (penting untuk membandingkan screenshot).
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toTexture(canvas: HTMLCanvasElement, repeatX: number, repeatY: number): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Papan kayu vertikal dengan serat acak. base = kecerahan dasar 0-255.
export function plankTexture(base: number, repeatX: number, repeatY: number, seed = 1): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const random = seededRandom(seed);

  for (let plank = 0; plank < 4; plank++) {
    const shade = base + (random() - 0.5) * 30;
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(plank * 16, 0, 16, size);
    for (let grain = 0; grain < 14; grain++) {
      const g = shade - 10 - random() * 18;
      ctx.fillStyle = `rgb(${g},${g},${g})`;
      ctx.fillRect(plank * 16 + 1 + Math.floor(random() * 14), Math.floor(random() * size), 1, 4 + Math.floor(random() * 14));
    }
    ctx.fillStyle = `rgb(${base * 0.35},${base * 0.35},${base * 0.35})`; // celah antar papan
    ctx.fillRect(plank * 16, 0, 1, size);
  }
  return toTexture(canvas, repeatX, repeatY);
}

// Bintik acak untuk tanah. base = kecerahan dasar 0-255.
export function speckleTexture(base: number, repeatX: number, repeatY: number, seed = 2): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const random = seededRandom(seed);
  ctx.fillStyle = `rgb(${base},${base},${base})`;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 500; i++) {
    const v = base + (random() - 0.5) * 60;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.floor(random() * size), Math.floor(random() * size), 1 + Math.floor(random() * 2), 1 + Math.floor(random() * 2));
  }
  return toTexture(canvas, repeatX, repeatY);
}
