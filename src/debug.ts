// Alat debug untuk tuning, aktif hanya dengan ?debug di URL: teks status, tombol pintas, dan hook uji.
// Angka gameplay diubah di src/config.ts (simpan, Vite memuat ulang otomatis).
import { config } from "./config";
import type { createFlow } from "./flow";
import type { createRenderer } from "./view/renderer";

export function createDebug(flow: ReturnType<typeof createFlow>, gfx: ReturnType<typeof createRenderer>, step: (dt: number) => void) {
  const hud = document.getElementById("hud")!;
  const state = { paused: false, timeScale: 1, fps: 60, hudTimer: 0 };

  window.addEventListener("keydown", (e) => {
    const night = flow.session?.night;
    const number = Number(e.key);
    if (number >= 1 && number <= config.nights.length) flow.startNightDirect(number - 1); // langsung ke malam, tanpa monolog
    if (!night) return;
    if (e.key === "c") night.fogs.forEach((f) => f.clear());
    if (e.key === "f") night.fogs.forEach((f) => f.fill());
    if (e.key === "g") night.invincible = !night.invincible;
    if (e.key === "t") state.timeScale = state.timeScale === 1 ? 10 : 1;
    if (e.key === "m") night.monsters.forEach((m) => (m.spawnIn = Math.min(m.spawnIn, 0))); // semua monster muncul sekarang
    if (e.key === "p") state.paused = !state.paused;
  });

  // Hook untuk tes otomatis: jeda loop dan majukan game dengan dt yang ditentukan.
  (window as unknown as { __debug: unknown }).__debug = {
    pause: () => (state.paused = true),
    resume: () => (state.paused = false),
    step: (dt: number, count = 1) => {
      for (let i = 0; i < count; i++) step(dt);
    },
    memory: () => ({ ...gfx.renderer.info.memory }),
  };

  function update(realDt: number) {
    state.fps += (1 / Math.max(realDt, 0.0001) - state.fps) * 0.05;
    state.hudTimer += realDt;
    if (state.hudTimer < 0.3) return;
    state.hudTimer = 0;

    const night = flow.session?.night;
    const info = gfx.renderer.info.render;
    const fogText = night?.fogs.map((f, i) => `${config.windows[i].name} ${(f.fogRatio() * 100).toFixed(0)}%`).join("  ");
    const monsterText = night?.monsters
      .map((m, i) => (m.window === null ? `M${i + 1}: tunggu ${Math.max(0, m.spawnIn).toFixed(1)}s` : `M${i + 1}: ${config.windows[m.window].name} langkah ${m.step()} (${m.position.toFixed(2)}) menempel ${m.graceElapsed.toFixed(1)}s`))
      .join("   ");
    const flags = `kebal ${night?.invincible ? "ON" : "off"}  waktu x${state.timeScale}  ${state.paused ? "DIJEDA" : ""}`;
    hud.textContent =
      `FPS ${state.fps.toFixed(0)}  ${flow.state}  stare ${night?.stareStatus}  ${flags}\n` +
      `embun: ${fogText}\n${monsterText}\n` +
      `draw call ${info.calls}  segitiga ${info.triangles}\n` +
      `1-3 malam  C bersih  F buram  G kebal  T waktu x10  M munculkan monster  P jeda`;
  }

  return {
    get paused() {
      return state.paused;
    },
    get timeScale() {
      return state.timeScale;
    },
    update,
  };
}
