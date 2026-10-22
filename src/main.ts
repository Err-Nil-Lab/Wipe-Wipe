// Boot: renderer, dunia 3D (rumah + lingkungan), kamera, input, dan alur layar. Lalu loop game.
import "./ui/ui.css";
import * as THREE from "three";
import { unlockAudio } from "./audio";
import { config } from "./config";
import { createFlow } from "./flow";
import { initInput } from "./input";
import { createCameraRig } from "./view/cameraRig";
import { buildEnvironment } from "./view/environment";
import { buildHouse } from "./view/house";
import { createRenderer } from "./view/renderer";

// ?debug menampilkan teks debug dan membuka tombol 1-3 (langsung masuk malam tanpa menu/monolog).
const debug = new URLSearchParams(location.search).has("debug");

const gfx = createRenderer(document.getElementById("app")!);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(config.view3d.fov, 16 / 9, 0.05, 130);
const rig = createCameraRig(camera);
const environment = buildEnvironment(scene);
const { lantern } = buildHouse(scene);

initInput();
// Browser baru mengizinkan suara setelah pemain berinteraksi.
window.addEventListener("pointerdown", unlockAudio);

const flow = createFlow(scene, camera, gfx, rig);
flow.showMenu();

if (debug) {
  window.addEventListener("keydown", (e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= config.nights.length) flow.startNightDirect(n - 1);
  });
}

const hud = document.getElementById("hud")!;
let last = performance.now();
let clockSec = 0; // waktu animasi: jumlah semua dt, supaya sama dengan waktu game saat dijeda/dimajukan manual
let hudTimer = 0;
let fps = 60;
let paused = false;

// Satu langkah game + gambar. Dipanggil tiap frame, atau manual dengan dt tertentu saat debug.
function tick(dt: number) {
  clockSec += dt;
  fps += (1 / Math.max(dt, 0.0001) - fps) * 0.05;

  flow.update(dt, clockSec);
  environment.update(clockSec);
  lantern.intensity = 12 + Math.sin(clockSec * 7.7) * 0.6 + Math.sin(clockSec * 21) * 0.4; // kedip pelan
  gfx.render(scene, camera, clockSec);

  hudTimer += dt;
  if (debug && hudTimer > 0.4) {
    hudTimer = 0;
    const night = flow.session?.night;
    const info = gfx.renderer.info.render;
    const fogText = night?.fogs.map((f, i) => `${config.windows[i].name} ${(f.fogRatio() * 100).toFixed(0)}%`).join("  ");
    const monsterText = night?.monsters
      .map((m, i) => (m.window === null ? `M${i + 1}: tunggu ${Math.max(0, m.spawnIn).toFixed(1)}s` : `M${i + 1}: ${config.windows[m.window].name} langkah ${m.step()} (${m.position.toFixed(2)}) menempel ${m.graceElapsed.toFixed(1)}s`))
      .join("   ");
    hud.textContent = `FPS ${fps.toFixed(0)}   ${flow.state}   embun: ${fogText}\n${monsterText}   stare: ${night?.stareStatus}\ndraw call ${info.calls}   segitiga ${info.triangles}`;
  }
}

function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!paused) tick(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Alat uji (hanya dengan ?debug): jeda loop dan majukan game dengan dt yang ditentukan.
if (debug) {
  (window as unknown as { __debug: unknown }).__debug = {
    pause: () => (paused = true),
    resume: () => (paused = false),
    step: (dt: number, count = 1) => {
      for (let i = 0; i < count; i++) tick(dt);
    },
  };
}

// Untuk tes otomatis.
Object.defineProperty(window, "__game", { get: () => ({ night: flow.session?.night, session: flow.session, camera, scene, THREE, flow }) });
