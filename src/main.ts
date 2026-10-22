// SPIKE 3D-0: ruangan + satu jendela berembun yang bisa diusap dengan kursor.
// Tombol: T ganti jenis kaca (overlay/transmisi), R buramkan, C bersihkan. URL ?grid=64 ganti ukuran grid.
import * as THREE from "three";
import { config } from "./config";
import { Fog } from "./logic/fog";
import { createRenderer } from "./view/renderer";
import { buildSpikeScene, glassPosition } from "./view/spikeScene";
import { WindowGlass } from "./view/windowGlass";

const gridSize = Number(new URLSearchParams(location.search).get("grid")) || config.fog.gridSize;
const fogFullSec = config.nights[0].fogFullSec;

const gfx = createRenderer(document.getElementById("app")!);
const { scene, camera, lantern } = buildSpikeScene();

const fog = new Fog(gridSize, 1);
const glass = new WindowGlass(fog, config.view3d.glassSize);
glass.mesh.position.copy(glassPosition);
scene.add(glass.mesh);

const ring = document.getElementById("ring")!;
const hud = document.getElementById("hud")!;
const raycaster = new THREE.Raycaster();
let pointer: { x: number; y: number } | null = null; // posisi kursor dalam piksel layar
let lastCell: { x: number; y: number } | null = null;

window.addEventListener("pointermove", (e) => (pointer = { x: e.clientX, y: e.clientY }));
document.addEventListener("pointerleave", () => (pointer = null));
window.addEventListener("keydown", (e) => {
  if (e.key === "t") glass.setMode(glass.mode === "overlay" ? "transmission" : "overlay");
  if (e.key === "r") fog.fill();
  if (e.key === "c") fog.clear();
});

// Kursor -> sel di kaca -> usap. Cincin menunjukkan ukuran kuas di layar.
function wipeUnderPointer() {
  const rect = gfx.canvas.getBoundingClientRect();
  const inside = pointer && pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom;
  const hit = inside
    ? (raycaster.setFromCamera(new THREE.Vector2(((pointer!.x - rect.left) / rect.width) * 2 - 1, -(((pointer!.y - rect.top) / rect.height) * 2 - 1)), camera),
      glass.pick(raycaster))
    : null;

  if (!hit) {
    lastCell = null;
    ring.style.display = "none";
    return;
  }

  const radiusCells = config.fog.brushRadius * fog.size;
  const from = lastCell ?? hit;
  fog.wipeLine(from.x, from.y, hit.x, hit.y, radiusCells);
  lastCell = hit;

  // Radius cincin: proyeksikan titik di kanan kursor sejauh radius kuas (dalam meter).
  const edge = hit.point.clone().add(new THREE.Vector3(config.fog.brushRadius * config.view3d.glassSize, 0, 0)).project(camera);
  const center = hit.point.clone().project(camera);
  const radiusPx = Math.abs(edge.x - center.x) * 0.5 * rect.width;
  ring.style.display = "block";
  ring.style.width = ring.style.height = `${radiusPx * 2}px`;
  ring.style.transform = `translate(${pointer!.x - radiusPx}px, ${pointer!.y - radiusPx}px)`;
}

let last = performance.now();
let hudTimer = 0;
let fps = 60;

function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  fps += (1 / Math.max(dt, 0.0001) - fps) * 0.05;

  fog.grow(dt, fogFullSec);
  wipeUnderPointer();
  glass.update();
  lantern.intensity = 12 + Math.sin(now / 130) * 0.6 + Math.sin(now / 47) * 0.4; // kedip pelan

  gfx.render(scene, camera, now / 1000);

  hudTimer += dt;
  if (hudTimer > 0.4) {
    hudTimer = 0;
    const info = gfx.renderer.info.render;
    hud.textContent =
      `FPS ${fps.toFixed(0)}   embun ${(fog.fogRatio() * 100).toFixed(0)}%   grid ${fog.size}x${fog.size}   kaca: ${glass.mode}\n` +
      `draw call ${info.calls}   segitiga ${info.triangles}\n` +
      `T = ganti kaca, R = buramkan, C = bersihkan`;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Untuk tes otomatis.
(window as unknown as { __spike: unknown }).__spike = { fog, glass };
