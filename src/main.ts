// Boot: renderer, dunia 3D (rumah + lingkungan), kamera, input, dan alur layar. Lalu loop game.
import "./ui/ui.css";
import * as THREE from "three";
import { unlockAudio } from "./audio";
import { config } from "./config";
import { createDebug } from "./debug";
import { createFlow } from "./flow";
import { initInput } from "./input";
import { createCameraRig } from "./view/cameraRig";
import { buildEnvironment } from "./view/environment";
import { buildHouse } from "./view/house";
import { createRenderer } from "./view/renderer";

// ?debug menyalakan alat debug (lihat debug.ts).
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

let last = performance.now();
let clockSec = 0; // waktu animasi: jumlah semua dt, supaya sama dengan waktu game saat dijeda atau dimajukan manual

// Satu langkah game + gambar. Dipanggil tiap frame, atau manual lewat alat debug.
function tick(dt: number) {
  clockSec += dt;
  flow.update(dt, clockSec);
  environment.update(clockSec);
  lantern.intensity = 12 + Math.sin(clockSec * 7.7) * 0.6 + Math.sin(clockSec * 21) * 0.4; // kedip pelan
  gfx.render(scene, camera, clockSec);
}

const dbg = debug ? createDebug(flow, gfx, tick) : null;

function frame(now: number) {
  const realDt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!dbg?.paused) tick(realDt * (dbg?.timeScale ?? 1));
  dbg?.update(realDt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Untuk tes otomatis.
Object.defineProperty(window, "__game", { get: () => ({ night: flow.session?.night, session: flow.session, camera, scene, THREE, flow }) });
