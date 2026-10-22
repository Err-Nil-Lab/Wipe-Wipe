// Tes logika satu malam: jumlah monster, embun, jam, menang/kalah, plus bot sederhana (informasi saja, bukan acuan keseimbangan). Jalankan: npm run sim.
import { createServer } from "vite";
const vite = await createServer({ root: process.cwd(), server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
const { Night } = await vite.ssrLoadModule("/src/logic/night.ts");
const { config } = await vite.ssrLoadModule("/src/config.ts");
const DT = 1 / 60;
let fails = 0;
const check = (name, ok, extra = "") => { console.log(ok ? "OK  " : "FAIL", name, extra); if (!ok) fails++; };

// jumlah monster & embun per malam
check("malam 1: 1 monster", new Night(0).monsters.length === 1);
check("malam 2: 2 monster", new Night(1).monsters.length === 2);
check("malam 3: 2 monster", new Night(2).monsters.length === 2);
for (const [i, sec] of [[0, 25], [2, 15]]) {
  const n = new Night(i); n.monsters.forEach(m => m.spawnIn = 1e9);
  let t = 0; while (n.fogs[0].fogRatio() < 0.999) { n.update(DT, false); t += DT; }
  check(`malam ${i + 1}: embun penuh ${sec} dtk`, Math.abs(t - sec) < 0.1, t.toFixed(2));
}

// jam dan menang: tanpa monster, tepat 300 dtk
{
  const n = new Night(0); n.monsters.forEach(m => m.spawnIn = 1e9);
  const marks = {}; let t = 0;
  while (!n.isWon()) { n.update(DT, false); t += DT; for (const c of ["01:00","02:00","03:00","04:00","05:00"]) if (!marks[c] && n.clockText() === c) marks[c] = t; }
  check("jam 00:00 di awal", new Night(0).clockText() === "00:00");
  check("menang tepat ~300 dtk", Math.abs(t - 300) < 0.1, t.toFixed(2));
  check("jam 01:00 di ~60 dtk", Math.abs(marks["01:00"] - 60) < 0.1, marks["01:00"]?.toFixed(2));
  check("jam 05:00 saat menang", n.clockText() === "05:00");
  const e = n.elapsed; n.update(DT, false);
  check("setelah menang update berhenti", n.elapsed === e);
}

// monster masuk di jendela lain tetap kalah (jumpscare pemicu): pemain di DEPAN, monster di KANAN
{
  const n = new Night(0); n.monsters[0].spawnIn = 0; n.update(DT, false);
  n.monsters[0].window = 2; n.current = 1;
  let t = 0; while (!n.isLost() && t < 100) { n.update(DT, false); t += DT; }
  check("kalah walau pemain di jendela lain", n.isLost() && n.lostBy.window === 2, t.toFixed(1));
  const e = n.elapsed; n.update(DT, false);
  check("setelah kalah update berhenti", n.elapsed === e);
}

// bot sederhana: pemain "rajin" -> hanya untuk sanity (bukan ukuran keseimbangan)
function playBot(nightIndex, skill) {
  const n = new Night(nightIndex); let sinceWipe = 0;
  while (!n.isLost() && !n.isWon()) {
    // lihat jendela dengan monster terdekat ke kaca
    const target = n.monsters.filter(m => m.isActive()).sort((a, b) => b.position - a.position)[0];
    if (target && !n.travel && target.window !== n.current && target.position > 1.5) n.startTravel(target.window);
    const f = n.activeFog();
    sinceWipe += DT;
    if (f && sinceWipe > skill) { f.clear(); sinceWipe = 0; } // skill = detik antar usapan penuh
    const hold = !n.travel && n.monsterAt(n.current) && n.fogs[n.current].fogRatio() < 0.45;
    n.update(DT, !!hold);
  }
  return n.isWon();
}
for (const night of [0, 1, 2]) {
  const wins = Array.from({ length: 30 }, () => playBot(night, 4)).filter(Boolean).length;
  console.log(`info bot (usap penuh tiap 4 dtk) malam ${night + 1}: menang ${wins}/30`);
}
console.log(fails ? `${fails} GAGAL` : "SEMUA LOLOS");
await vite.close();
