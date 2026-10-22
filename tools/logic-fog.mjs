// Tes logika embun merayap (creep) dan stare otomatis dengan angka dari src/config.ts. Jalankan: npm run sim
import { createServer } from "vite";

const vite = await createServer({ root: process.cwd(), server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
const { Fog } = await vite.ssrLoadModule("/src/logic/fog.ts");
const { Night } = await vite.ssrLoadModule("/src/logic/night.ts");
const { config } = await vite.ssrLoadModule("/src/config.ts");

const DT = 1 / 20;
const N = config.fog.gridSize;
const R = config.fog.brushRadius * N;
let fails = 0;
const check = (name, ok, extra = "") => { console.log(ok ? "OK  " : "FAIL", name, extra); if (!ok) fails++; };
const strokes = (f, count) => { for (let i = 0; i < count; i++) f.wipeLine(0, (i + 0.5) * (N / count), N, (i + 0.5) * (N / count), R); };
const centerFog = (f) => f.cells[(N / 2) * N + N / 2];

// 1. embun yang rata tidak berubah oleh creep
{
  const f = new Fog(N, 0.6); const before = Array.from(f.cells);
  for (let i = 0; i < 100; i++) f.creep(DT, config.fog.creepPerSec);
  check("creep tidak mengubah embun yang rata", f.cells.every((v, i) => Math.abs(v - before[i]) < 1e-6));
}

// 2. lubang kecil (1 usapan) menutup lebih cepat daripada tanpa creep
function holeLifetime(creepRate, rows) {
  const f = new Fog(N, 1); strokes(f, rows);
  let t = 0;
  while (t < 60 && centerFog(f) < 0.3) { f.grow(DT, config.nights[0].fogFullSec); f.creep(DT, creepRate); t += DT; }
  return t;
}
const withoutCreep = holeLifetime(0, 1);
const withCreep = holeLifetime(config.fog.creepPerSec, 1);
check("tanpa creep lubang 1 usapan bertahan ~0,3 x embun penuh", Math.abs(withoutCreep - 0.3 * config.nights[0].fogFullSec) < 0.2, withoutCreep.toFixed(1) + " dtk");
check("dengan creep lubang 1 usapan lebih cepat menutup", config.fog.creepPerSec === 0 || withCreep < withoutCreep * 0.8, withCreep.toFixed(1) + " dtk");

// 3. area luas yang bersih bertahan: kaca bersih penuh masih <50% setelah 5 dtk (stare manual dari kaca mungkin)
{
  const f = new Fog(N, 1); f.clear();
  for (let t = 0; t < 5; t += DT) { f.grow(DT, config.nights[0].fogFullSec); f.creep(DT, config.fog.creepPerSec); }
  check("kaca bersih penuh: embun setelah 5 dtk masih < 50%", f.fogRatio() < 0.5, (f.fogRatio() * 100).toFixed(0) + "%");
}

// 4. stare otomatis (nyalakan sementara): histeresis dan efek ke monster
config.fog.autoStare = true;
function setup(fogLevel) {
  const n = new Night(0);
  n.monsters[0].spawnIn = 1e9;
  n.monsters[0].spawn(n.current); n.monsters[0].position = 3;
  n.fogs.forEach((f) => { f.cells.fill(fogLevel); f.grow = () => {}; });
  return n;
}
{
  const n = setup(0.6); n.update(DT, false);
  check("auto-stare: embun 60% -> tidak menatap (foggy)", n.stareStatus === "foggy" && !n.staredMonster);
  n.fogs[n.current].cells.fill(0.3); n.update(DT, false);
  check("auto-stare: embun 30% -> menatap sendiri tanpa klik", n.stareStatus === "staring" && n.staredMonster === n.monsters[0]);
  const p0 = n.monsters[0].position; for (let i = 0; i < 20; i++) n.update(DT, false);
  check("auto-stare: monster mundur ~1 langkah/dtk", Math.abs(p0 - n.monsters[0].position - 1) < 0.1, (p0 - n.monsters[0].position).toFixed(2));
  n.fogs[n.current].cells.fill(0.42); n.update(DT, false);
  check("histeresis: sedang menatap, embun 42% -> tetap menatap", n.stareStatus === "staring");
  n.fogs[n.current].cells.fill(0.55); n.update(DT, false);
  check("auto-stare: embun 55% -> putus", n.stareStatus === "foggy" && !n.staredMonster);
  n.fogs[n.current].cells.fill(0.42); n.update(DT, false);
  check("histeresis: sudah putus, embun 42% -> belum menatap lagi", n.stareStatus === "foggy");
  n.fogs[n.current].cells.fill(0.3); n.startTravel((n.current + 1) % 3); n.update(DT, false);
  check("auto-stare mati saat pindah jendela", n.stareStatus === "none" && !n.staredMonster);
}
{
  const n = setup(0.2); n.monsters[0].window = null; n.update(DT, false);
  check("auto-stare: tanpa monster di jendela -> tidak ada status", n.stareStatus === "none");
}
config.fog.autoStare = false;

// 5. mode manual tetap butuh klik tahan
{
  const n = setup(0.2); n.update(DT, false);
  check("manual: tanpa klik tahan tidak menatap", n.stareStatus === "none" && !n.staredMonster);
  n.update(DT, true);
  check("manual: klik tahan + embun 20% -> menatap", n.stareStatus === "staring");
}

console.log(fails ? `${fails} GAGAL` : "SEMUA LOLOS");
await vite.close();
process.exitCode = fails ? 1 : 0;
