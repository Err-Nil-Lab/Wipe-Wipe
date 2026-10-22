// Tes logika monster/stare/respawn dengan angka dari src/config.ts. Jalankan: npm run sim (dari akar proyek).
import { createServer } from "vite";
const vite = await createServer({ root: process.cwd(), server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
const { Night } = await vite.ssrLoadModule("/src/logic/night.ts");
const { config } = await vite.ssrLoadModule("/src/config.ts");
const DT = 1 / 60;
let fails = 0;
const check = (name, ok, extra = "") => { console.log(ok ? "OK  " : "FAIL", name, extra); if (!ok) fails++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// helper: jalankan sampai kondisi, kembalikan waktu
function runUntil(night, cond, hold = () => false, max = 200) {
  let t = 0;
  while (!cond() && t < max) { night.update(DT, hold()); t += DT; }
  return t;
}

// 1. malam 1: satu monster, spawn 10-15 dtk, langkah 1
{
  const n = new Night(0);
  const tSpawn = runUntil(n, () => n.monsters[0].isActive());
  check("spawn monster pertama 10-15 dtk", tSpawn >= 10 && tSpawn <= 15.1, tSpawn.toFixed(2));
  check("muncul di langkah 1", n.monsters[0].step() === 1);
  // 2. tanpa ditatap: 30 dtk ke kaca, lalu 3 dtk jeda -> kalah
  const tGlass = runUntil(n, () => n.monsters[0].step() === 5 && n.monsters[0].position >= 5);
  check("dari spawn ke kaca ~30 dtk", near(tGlass, 30, 0.2), tGlass.toFixed(2));
  const tLose = runUntil(n, () => n.isLost());
  check("jeda di kaca 3 dtk lalu kalah", near(tLose, 3, 0.1), tLose.toFixed(2));
}

// 3. stare dari kaca sampai hilang = 5 dtk; kaca harus bersih
{
  const n = new Night(0);
  n.monsters[0].spawnIn = 0; n.update(DT, false);
  runUntil(n, () => n.monsters[0].position >= 5);
  n.monsters[0].graceElapsed = 2.5; // hampir masuk
  n.fogs[n.current].clear(); // monster belum tentu di jendela aktif -> pindahkan lihat
  const w = n.monsters[0].window; n.current = w; n.fogs[w].clear();
  // jaga kaca tetap bersih tiap frame (embun tumbuh 4%/dtk, 5 dtk = 20%, masih < 50%)
  const t = runUntil(n, () => !n.monsters[0].isActive(), () => true);
  check("stare dari kaca sampai hilang ~5 dtk", near(t, 5, 0.1), t.toFixed(2));
  check("tidak kalah walau grace hampir habis", !n.isLost());
  // 4. respawn 5-10 dtk
  const tRe = runUntil(n, () => n.monsters[0].isActive());
  check("respawn 5-10 dtk", tRe >= 5 && tRe <= 10.1, tRe.toFixed(2));
}

// 5. stare putus kalau embun >= 50%
{
  const n = new Night(0);
  n.monsters[0].spawnIn = 0; n.update(DT, false);
  const w = n.monsters[0].window; n.current = w;
  runUntil(n, () => n.monsters[0].position >= 2);
  const before = n.monsters[0].position;
  n.fogs[w].fill(); n.fogs[w].cells.fill(0.6);
  n.update(DT, true);
  check("stare putus saat embun 60%", n.stareStatus === "foggy" && n.monsters[0].position > before);
  n.fogs[w].clear(); n.update(DT, true);
  check("stare jalan saat kaca bersih", n.stareStatus === "staring");
}

// 6. klik tahan tanpa monster / di jendela lain / saat pindah: monster tidak mundur
{
  const n = new Night(0);
  n.monsters[0].spawnIn = 0; n.update(DT, false);
  const w = n.monsters[0].window;
  const other = (w + 1) % 3; n.current = other; n.fogs[other].clear();
  const p0 = n.monsters[0].position; n.update(DT, true);
  check("tatap jendela lain: monster tetap maju", n.monsters[0].position > p0 && n.stareStatus === "none");
  n.current = w; n.fogs[w].clear(); n.startTravel((w + 1) % 3);
  const p1 = n.monsters[0].position; n.update(DT, true);
  check("tatap saat pindah: tidak berpengaruh", n.monsters[0].position > p1 && n.stareStatus === "none");
}

// 7. tidak ada 2 monster di satu jendela (malam 2, 5 menit, berkali-kali)
{
  let clash = 0, minDist = 9;
  for (let trial = 0; trial < 30; trial++) {
    const n = new Night(1);
    for (let t = 0; t < 300; t += DT) {
      n.update(DT, true); // mengintip terus; kaca embun >50% sering memutus
      const act = n.monsters.filter(m => m.isActive()).map(m => m.window);
      if (new Set(act).size !== act.length) clash++;
      if (n.isLost()) break;
    }
  }
  check("tidak pernah 2 monster di satu jendela", clash === 0, "bentrok=" + clash);
}

// 8. tatapan putus-sambung tidak mereset jarak
{
  const n = new Night(0);
  n.monsters[0].spawnIn = 0; n.update(DT, false);
  const w = n.monsters[0].window; n.current = w; n.fogs[w].clear();
  runUntil(n, () => n.monsters[0].position >= 3);
  const p = n.monsters[0].position;
  n.fogs[w].clear(); // menunggu tadi membuat kaca buram; bersihkan sebelum menatap
  runUntil(n, () => false, () => true, 0.5); // tatap 0.5 dtk
  check("tatap sebentar: jarak berkurang ~0.5, bukan reset", near(n.monsters[0].position, p - 0.5, 0.05) && n.monsters[0].position > 0);
}

console.log(fails ? `${fails} GAGAL` : "SEMUA LOLOS");
await vite.close();
