// Embun satu jendela: grid sel, tiap sel 0 (jernih) sampai 1 (buram).
// Tidak bergantung pada KAPLAY.
export class Fog {
  readonly size: number;
  readonly cells: Float32Array;

  constructor(size: number, startFog = 1) {
    this.size = size;
    this.cells = new Float32Array(size * size).fill(startFog);
  }

  // Embun menebal merata di semua sel.
  grow(dt: number, fullSec: number) {
    const add = dt / fullSec;
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i] = Math.min(1, this.cells[i] + add);
    }
  }

  // Hapus embun di sekitar titik (x, y) dalam satuan sel.
  wipeAt(x: number, y: number, radius: number) {
    const minX = Math.max(0, Math.floor(x - radius));
    const maxX = Math.min(this.size - 1, Math.ceil(x + radius));
    const minY = Math.max(0, Math.floor(y - radius));
    const maxY = Math.min(this.size - 1, Math.ceil(y + radius));
    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const dx = cx + 0.5 - x;
        const dy = cy + 0.5 - y;
        if (dx * dx + dy * dy <= radius * radius) this.cells[cy * this.size + cx] = 0;
      }
    }
  }

  // Usap sepanjang garis dari titik lama ke titik baru, supaya gerakan
  // mouse yang cepat tidak meninggalkan lubang di antara frame.
  wipeLine(x0: number, y0: number, x1: number, y1: number, radius: number) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (radius * 0.5)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.wipeAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius);
    }
  }

  // Rata-rata semua sel, 0 sampai 1.
  fogRatio(): number {
    let sum = 0;
    for (let i = 0; i < this.cells.length; i++) sum += this.cells[i];
    return sum / this.cells.length;
  }

  clear() {
    this.cells.fill(0);
  }

  fill() {
    this.cells.fill(1);
  }
}
