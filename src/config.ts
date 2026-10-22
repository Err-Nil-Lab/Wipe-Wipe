// Semua angka gameplay ada di sini. Ubah, simpan, Vite reload otomatis.
export const config = {
  canvasSize: 720,

  fog: {
    gridSize: 32, // sel per sisi kaca (32 -> 32x32)
    brushRadiusCells: 2.5, // radius kuas dalam sel; setel sampai usap penuh terasa ~2 dtk
  },

  windowCount: 3,

  // Satu entri per malam (baru malam 1 yang dipakai di M0).
  nights: [
    { fogFullSec: 25 },
    { fogFullSec: 25 },
    { fogFullSec: 15 },
  ],
};
