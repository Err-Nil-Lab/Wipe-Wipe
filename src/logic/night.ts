// State satu malam: embun semua jendela, jendela yang sedang dilihat, dan perpindahan.
// Tidak bergantung pada KAPLAY.
import { config } from "../config";
import { Fog } from "./fog";

export type Travel = { from: number; to: number; elapsed: number; duration: number };

export class Night {
  readonly fogs: Fog[];
  current: number = config.startWindow; // jendela yang sedang dilihat (atau asal saat pindah)
  travel: Travel | null = null;
  private fogFullSec: number;

  constructor(nightIndex: number) {
    this.fogFullSec = config.nights[nightIndex].fogFullSec;
    this.fogs = config.windows.map(() => new Fog(config.fog.gridSize, config.fog.startFog));
  }

  // Semua jendela terus berembun, juga yang tidak sedang dilihat.
  update(dt: number) {
    for (const fog of this.fogs) fog.grow(dt, this.fogFullSec);

    if (this.travel) {
      this.travel.elapsed += dt;
      if (this.travel.elapsed >= this.travel.duration) {
        this.current = this.travel.to;
        this.travel = null;
      }
    }
  }

  // Waktu pindah tergantung jendela tujuan. Diabaikan kalau sedang pindah atau sudah di sana.
  startTravel(to: number) {
    if (this.travel || to === this.current) return;
    this.travel = { from: this.current, to, elapsed: 0, duration: config.windows[to].travelSec };
  }

  isTraveling(): boolean {
    return this.travel !== null;
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
