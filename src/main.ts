// Game 3D: menyambungkan input (kursor, minimap) ke logika Night dan menggambar dunia.
import "./ui/ui.css";
import * as THREE from "three";
import { config } from "./config";
import { Night } from "./logic/night";
import { createMinimap } from "./ui/minimap";
import { createCameraRig } from "./view/cameraRig";
import { buildEnvironment } from "./view/environment";
import { buildHouse } from "./view/house";
import { glassPosition, windowYaw } from "./view/layout";
import { createRenderer } from "./view/renderer";
import { MonsterView } from "./view/monsterView";
import { WindowGlass } from "./view/windowGlass";

const gfx = createRenderer(document.getElementById("app")!);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(config.view3d.fov, 16 / 9, 0.05, 130);
const rig = createCameraRig(camera);

const environment = buildEnvironment(scene);
const { lantern } = buildHouse(scene);

// ?night=2 memilih malam (indeks mulai 1). Sementara, sampai alur menu dibuat di 3D-4.
const nightIndex = Math.max(1, Math.min(config.nights.length, Number(new URLSearchParams(location.search).get("night")) || 1)) - 1;
const night = new Night(nightIndex);
const monsterViews = night.monsters.map(() => new MonsterView(scene));

// Satu kaca per jendela; semuanya diperbarui tiap frame, hanya yang di depan kamera yang bisa diusap.
const glasses = night.fogs.map((fog, i) => {
  const glass = new WindowGlass(fog, config.view3d.glassSize);
  glass.mesh.position.copy(glassPosition(i));
  glass.mesh.rotation.y = windowYaw[i];
  scene.add(glass.mesh);
  return glass;
});

const minimap = createMinimap((i) => night.startTravel(i));

const ring = document.getElementById("ring")!;
const hud = document.getElementById("hud")!;
const raycaster = new THREE.Raycaster();
let pointer: { x: number; y: number } | null = null; // posisi kursor dalam piksel layar
let overUi = false; // kursor di atas minimap: wipe mati
let holding = false; // klik kiri ditahan = menatap (stare); wipe mati selama ditahan
let stareAmount = 0; // 0..1 dihaluskan, untuk efek kamera saat menatap
let lastCell: { x: number; y: number } | null = null;

window.addEventListener("pointermove", (e) => {
  pointer = { x: e.clientX, y: e.clientY };
  overUi = (e.target as HTMLElement).closest("#minimap") !== null;
});
document.addEventListener("pointerleave", () => (pointer = null));
window.addEventListener("pointerdown", (e) => {
  if (e.button === 0) holding = true;
});
window.addEventListener("pointerup", (e) => {
  if (e.button === 0) holding = false;
});
window.addEventListener("blur", () => (holding = false));

// Kursor -> sel di kaca aktif -> usap. Cincin menunjukkan ukuran kuas di layar.
function wipeUnderPointer() {
  const fog = night.activeFog(); // null saat pindah jendela
  const rect = gfx.canvas.getBoundingClientRect();
  const inside = pointer && pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom;
  let hit: ReturnType<WindowGlass["pick"]> = null;
  if (fog && inside && !overUi && !holding) {
    const ndc = new THREE.Vector2(((pointer!.x - rect.left) / rect.width) * 2 - 1, -(((pointer!.y - rect.top) / rect.height) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    hit = glasses[night.current].pick(raycaster);
  }

  if (!fog || !hit) {
    lastCell = null; // supaya tidak ada garis usapan melompat saat wipe aktif lagi
    ring.style.display = "none";
    return;
  }

  const from = lastCell ?? hit;
  fog.wipeLine(from.x, from.y, hit.x, hit.y, config.fog.brushRadius * fog.size);
  lastCell = hit;

  // Radius cincin: proyeksikan titik di samping kursor sejauh radius kuas (meter) ke layar.
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const edge = hit.point.clone().addScaledVector(right, config.fog.brushRadius * config.view3d.glassSize).project(camera);
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

  night.update(dt, holding && !overUi); // klik di minimap = pindah, bukan menatap
  monsterViews.forEach((view, i) => view.update(dt, now / 1000, night.monsters[i], night.staredMonster === night.monsters[i]));
  rig.update(night, now / 1000);

  // Menatap: sudut pandang menyempit sedikit dan vignette mengetat.
  stareAmount += ((night.stareStatus === "staring" ? 1 : 0) - stareAmount) * Math.min(1, dt * 8);
  camera.fov = config.view3d.fov - 6 * stareAmount;
  camera.updateProjectionMatrix();
  gfx.setStare(stareAmount);

  camera.updateMatrixWorld();
  wipeUnderPointer();
  glasses.forEach((g) => g.update());
  minimap.highlight(night.travel ? night.travel.to : night.current);
  environment.update(now / 1000);
  lantern.intensity = 12 + Math.sin(now / 130) * 0.6 + Math.sin(now / 47) * 0.4; // kedip pelan

  gfx.render(scene, camera, now / 1000);

  hudTimer += dt;
  if (hudTimer > 0.4) {
    hudTimer = 0;
    const info = gfx.renderer.info.render;
    const fogText = night.fogs.map((f, i) => `${config.windows[i].name} ${(f.fogRatio() * 100).toFixed(0)}%`).join("  ");
    const monsterText = night.monsters
      .map((m, i) => (m.window === null ? `M${i + 1}: tunggu ${Math.max(0, m.spawnIn).toFixed(1)}s` : `M${i + 1}: ${config.windows[m.window].name} langkah ${m.step()} (${m.position.toFixed(2)}) menempel ${m.graceElapsed.toFixed(1)}s`))
      .join("   ");
    const state = night.isLost() ? "KALAH (jumpscare 3D di 3D-4)" : `stare: ${night.stareStatus}`;
    hud.textContent = `FPS ${fps.toFixed(0)}   embun: ${fogText}\n${monsterText}   ${state}\ndraw call ${info.calls}   segitiga ${info.triangles}`;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Untuk tes otomatis.
(window as unknown as { __game: unknown }).__game = { night, camera, scene, THREE, monsterViews };
