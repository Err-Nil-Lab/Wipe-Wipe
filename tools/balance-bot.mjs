// Bot "pemain" sederhana untuk perkiraan kasar keseimbangan malam 1-3 dengan angka dari src/config.ts.
// BUKAN pengganti main sendiri. Asumsi (ubah di VARIANTS bila perlu):
// - Pemain berkeliling KIRI -> DEPAN -> KANAN, mengintip tiap jendela (peekSec) untuk melihat monster.
// - Mendengar ketukan monster di kaca jendela lain lalu pindah ke sana setelah reactSec.
// - Ada monster di jendela itu: mengusap sampai embun < 35% (kaca bersih penuh butuh wipeFullSec), lalu menatap
//   sampai hilang; kalau embun naik >= 50% menatap putus dan ia mengusap lagi.
// Jalankan: npm run balance                      (angka dari config.ts)
//           npm run balance -- 60 3 2,4          (60 malam per sel, monster 1 langkah tiap 3 dtk, respawn 2-4 dtk)
import { createServer } from "vite";

const vite = await createServer({ root: process.cwd(), server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
const { Night } = await vite.ssrLoadModule("/src/logic/night.ts");
const { config } = await vite.ssrLoadModule("/src/config.ts");

const DT = 1 / 20;
const RUNS = Number(process.argv[2]) || 60;
// Argumen opsional untuk mencoba angka lain tanpa mengubah config.ts.
if (process.argv[3]) config.monster.approachPerSec = 1 / Number(process.argv[3]);
if (process.argv[4]) config.monster.respawnSec = process.argv[4].split(",").map(Number);
const VARIANTS = [
  { name: "teliti   (intip 0.7s, bereaksi 0.6s, usap penuh 2s)", peekSec: 0.7, reactSec: 0.6, wipeFullSec: 2 },
  { name: "rata-rata (intip 1.2s, bereaksi 1.2s, usap penuh 2.5s)", peekSec: 1.2, reactSec: 1.2, wipeFullSec: 2.5 },
  { name: "lambat   (intip 2.0s, bereaksi 2.5s, usap penuh 3.5s)", peekSec: 2.0, reactSec: 2.5, wipeFullSec: 3.5 },
];

function play(nightIndex, v) {
  const n = new Night(nightIndex);
  let atWindow = 0; // lama berada di jendela sekarang (detik)
  let sawMonster = false;
  let knockHeardFor = 0;

  while (!n.isLost() && !n.isWon()) {
    const fog = n.fogs[n.current];
    let holding = false;

    if (!n.travel) {
      atWindow += DT;
      const here = n.monsterAt(n.current);
      const knocking = n.monsters.find((m) => m.window !== null && m.window !== n.current && m.position >= config.monster.glassStep);

      if (knocking) knockHeardFor += DT;
      else knockHeardFor = 0;

      if (knocking && knockHeardFor >= v.reactSec) {
        n.startTravel(knocking.window);
        atWindow = 0;
        sawMonster = false;
      } else if (here) {
        if (atWindow >= v.peekSec) sawMonster = true;
        if (sawMonster) {
          if (fog.fogRatio() >= 0.35) for (let i = 0; i < fog.cells.length; i++) fog.cells[i] = Math.max(0, fog.cells[i] - DT / v.wipeFullSec);
          else holding = true;
        }
      } else if (atWindow >= v.peekSec) {
        n.startTravel((n.current + 1) % config.windows.length); // tidak ada apa-apa: lanjut ke jendela berikutnya
        atWindow = 0;
        sawMonster = false;
      }
    }
    n.update(DT, holding);
  }
  return n.isWon();
}

console.log(`Perkiraan keseimbangan: ${RUNS} malam per sel; monster 1 langkah tiap ${(1 / config.monster.approachPerSec).toFixed(1)} dtk, respawn ${config.monster.respawnSec.join("-")} dtk`);
console.log("Target GDD: malam 1 hampir semua lolos, malam 3 sekitar separuh. Bot tidak pernah panik atau salah klik, jadi manusia lebih buruk.\n");
for (const v of VARIANTS) {
  const rates = [0, 1, 2].map((i) => {
    let wins = 0;
    for (let r = 0; r < RUNS; r++) if (play(i, v)) wins++;
    return `${Math.round((wins / RUNS) * 100)}%`;
  });
  console.log(`${v.name}\n   malam 1: ${rates[0]}   malam 2: ${rates[1]}   malam 3: ${rates[2]}`);
}
await vite.close();
