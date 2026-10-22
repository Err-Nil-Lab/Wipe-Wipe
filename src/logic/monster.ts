// Satu monster. Tidak bergantung pada KAPLAY.
// Jarak disimpan sebagai satu angka (0 = hilang, glassStep = di kaca), bukan timer per langkah,
// jadi ditatap sebentar lalu dilepas tidak mengulang dari awal.
import { config } from "../config";

const cfg = config.monster;

// Angka acak di antara dua batas, mis. [5, 10].
function randomBetween(range: number[]): number {
  return range[0] + Math.random() * (range[1] - range[0]);
}

export class Monster {
  window: number | null = null; // null = sedang menunggu muncul
  position = 0;
  graceElapsed = 0; // lama menempel di kaca tanpa ditatap
  xOffset = 0; // posisi horizontal, -1 sampai 1, tetap selama satu pendekatan
  spawnIn = randomBetween(cfg.firstSpawnSec); // hitung mundur sebelum muncul

  isActive(): boolean {
    return this.window !== null;
  }

  // Langkah untuk tampilan: 1 (jauh) sampai glassStep (di kaca).
  step(): number {
    return Math.ceil(this.position);
  }

  spawn(window: number) {
    this.window = window;
    this.position = cfg.spawnPosition;
    this.graceElapsed = 0;
    this.xOffset = Math.random() * 2 - 1;
  }

  // Mengembalikan true kalau monster berhasil masuk ke rumah.
  update(dt: number, stared: boolean): boolean {
    if (this.window === null) {
      this.spawnIn -= dt;
      return false;
    }

    if (stared) {
      this.position -= cfg.retreatPerSec * dt;
      this.graceElapsed = 0; // sudah tidak menempel di kaca lagi
      if (this.position <= 0) {
        this.window = null;
        this.spawnIn = randomBetween(cfg.respawnSec);
      }
      return false;
    }

    this.position = Math.min(cfg.glassStep, this.position + cfg.approachPerSec * dt);
    if (this.position < cfg.glassStep) return false;

    this.graceElapsed += dt;
    return this.graceElapsed >= cfg.glassGraceSec;
  }
}
