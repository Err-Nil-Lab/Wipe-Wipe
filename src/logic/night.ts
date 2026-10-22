// State satu malam: embun semua jendela, monster, jendela yang sedang dilihat, dan perpindahan.
// Tidak bergantung pada KAPLAY.
import { config } from "../config";
import { Fog } from "./fog";
import { Monster } from "./monster";

export type Travel = { from: number; to: number; elapsed: number; duration: number };

// none: tidak sedang menatap. staring: tatapan bekerja. foggy: klik ditahan tapi kaca terlalu buram.
export type StareStatus = "none" | "staring" | "foggy";

export class Night {
  readonly fogs: Fog[];
  readonly monsters: Monster[];
  current: number = config.startWindow; // jendela yang sedang dilihat (atau asal saat pindah)
  travel: Travel | null = null;
  stareStatus: StareStatus = "none";
  lostAtWindow: number | null = null; // jendela tempat monster masuk; null = belum kalah
  private fogFullSec: number;

  constructor(nightIndex: number) {
    const night = config.nights[nightIndex];
    this.fogFullSec = night.fogFullSec;
    this.fogs = config.windows.map(() => new Fog(config.fog.gridSize, config.fog.startFog));
    this.monsters = Array.from({ length: night.monsters }, () => new Monster());
  }

  isLost(): boolean {
    return this.lostAtWindow !== null;
  }

  // holdingStare = klik kiri ditahan di luar minimap.
  update(dt: number, holdingStare: boolean) {
    if (this.isLost()) return;

    // Semua jendela terus berembun, juga yang tidak sedang dilihat.
    for (const fog of this.fogs) fog.grow(dt, this.fogFullSec);

    if (this.travel) {
      this.travel.elapsed += dt;
      if (this.travel.elapsed >= this.travel.duration) {
        this.current = this.travel.to;
        this.travel = null;
      }
    }

    const target = this.updateStare(holdingStare);
    for (const monster of this.monsters) {
      if (monster.update(dt, monster === target) && monster.window !== null) {
        this.lostAtWindow = monster.window;
        return;
      }
      if (!monster.isActive() && monster.spawnIn <= 0) this.spawnInFreeWindow(monster);
    }
  }

  // Menentukan monster mana yang sedang ditatap (kalau ada) dan mengisi stareStatus.
  private updateStare(holdingStare: boolean): Monster | null {
    this.stareStatus = "none";
    if (!holdingStare || this.travel) return null;
    if (this.fogs[this.current].fogRatio() >= config.fog.stareMaxFog) {
      this.stareStatus = "foggy";
      return null;
    }
    const target = this.monsterAt(this.current);
    if (target) this.stareStatus = "staring";
    return target;
  }

  // Satu jendela hanya boleh satu monster. Kalau semua penuh, coba lagi di frame berikutnya.
  private spawnInFreeWindow(monster: Monster) {
    const free = config.windows.map((_, i) => i).filter((i) => !this.monsterAt(i));
    if (free.length === 0) return;
    monster.spawn(free[Math.floor(Math.random() * free.length)]);
  }

  monsterAt(window: number): Monster | null {
    return this.monsters.find((m) => m.window === window) ?? null;
  }

  // Waktu pindah tergantung jendela tujuan. Diabaikan kalau sedang pindah atau sudah di sana.
  startTravel(to: number) {
    if (this.travel || to === this.current) return;
    this.travel = { from: this.current, to, elapsed: 0, duration: config.windows[to].travelSec };
  }

  // Jendela yang menerima usapan: hanya saat tidak sedang pindah.
  activeFog(): Fog | null {
    return this.travel ? null : this.fogs[this.current];
  }

  // 0 sampai 1, untuk animasi geser.
  travelProgress(): number {
    return this.travel ? this.travel.elapsed / this.travel.duration : 0;
  }
}
