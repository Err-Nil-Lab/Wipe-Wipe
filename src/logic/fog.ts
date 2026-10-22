// Embun satu jendela: grid sel, tiap sel 0 (jernih) sampai 1 (buram).
// Tidak bergantung pada KAPLAY.
export class Fog {
  readonly size: number;
  readonly cells: Float32Array;
  private readonly scratch: Float32Array;

  constructor(size: number, startFog = 1) {
    this.size = size;
    this.cells = new Float32Array(size * size).fill(startFog);
    this.scratch = new Float32Array(size * size);
  }

  // Embun merayap balik: sel yang lebih bersih dari rata-rata tetangganya ditarik ke arah rata-rata itu.
  // Lubang kecil dikelilingi embun jadi cepat menutup; di tengah area bersih yang luas tidak ada yang menarik.
  creep(dt: number, rate: number) {
    if (rate <= 0) return;
    const n = this.size;
    const c = this.cells;
    const pull = Math.min(1, rate * dt);
    this.scratch.set(c);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        let sum = 0;
        let count = 0;
        if (x > 0) { sum += c[y * n + x - 1]; count++; }
        if (x < n - 1) { sum += c[y * n + x + 1]; count++; }
        if (y > 0) { sum += c[(y - 1) * n + x]; count++; }
        if (y < n - 1) { sum += c[(y + 1) * n + x]; count++; }
        const average = sum / count;
        const i = y * n + x;
        if (average > c[i]) this.scratch[i] = c[i] + (average - c[i]) * pull;
      }
    }
    c.set(this.scratch);
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

  // Gosok: hapus sebagian embun sepanjang garis dari titik lama ke titik baru. Jumlah yang hilang sebanding
  // panjang jalur (kursor diam tidak menghapus), tidak bergantung berapa frame yang dipakai. perPass = bagian
  // embun yang hilang di garis tengah kuas ketika satu lintasan penuh melewati sel; tepi kuas menghapus lebih sedikit.
  rub(x0: number, y0: number, x1: number, y1: number, radius: number, perPass: number) {
    const length = Math.hypot(x1 - x0, y1 - y0);
    if (length < 1e-4) return;
    const spacing = radius * 0.5; // jarak antar cap kuas
    const stamps = Math.max(1, Math.ceil(length / spacing));
    const step = length / stamps;
    // Hasil integral kekuatan kuas (1 - d²/r²) sepanjang garis tengah = 4r/3, dibagi spacing.
    const perStamp = (perPass * (step / spacing)) / (((4 / 3) * radius) / spacing);
    for (let s = 1; s <= stamps; s++) this.stamp(x0 + ((x1 - x0) * s) / stamps, y0 + ((y1 - y0) * s) / stamps, radius, perStamp);
  }

  // Satu cap kuas: kurangi embun dengan kekuatan yang menurun ke tepi (1 - d²/r²).
  private stamp(x: number, y: number, radius: number, amount: number) {
    const minX = Math.max(0, Math.floor(x - radius));
    const maxX = Math.min(this.size - 1, Math.ceil(x + radius));
    const minY = Math.max(0, Math.floor(y - radius));
    const maxY = Math.min(this.size - 1, Math.ceil(y + radius));
    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const d2 = ((cx + 0.5 - x) ** 2 + (cy + 0.5 - y) ** 2) / (radius * radius);
        if (d2 >= 1) continue;
        const i = cy * this.size + cx;
        this.cells[i] = Math.max(0, this.cells[i] - amount * (1 - d2));
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
