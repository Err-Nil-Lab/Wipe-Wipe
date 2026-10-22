// Semua angka gameplay ada di sini. Ubah, simpan, Vite reload otomatis.
export const config = {
  canvasSize: 720,

  fog: {
    gridSize: 32, // sel per sisi kaca (32 -> 32x32)
    brushRadiusCells: 2.5, // radius kuas dalam sel; setel sampai usap penuh terasa ~2 dtk
    startFog: 0, // embun awal tiap jendela saat malam mulai (0 jernih, 1 buram)
  },

  // Urutan = susunan dari kiri ke kanan. travelSec = waktu pindah KE jendela itu.
  windows: [
    { name: "KIRI", travelSec: 1 },
    { name: "DEPAN", travelSec: 1.5 },
    { name: "KANAN", travelSec: 2 },
  ],
  startWindow: 1, // malam dimulai di jendela ini (indeks di windows)

  minimap: {
    boxSize: 44,
    gap: 8,
    margin: 14, // jarak dari pojok kanan bawah
  },

  // Satu entri per malam (baru fogFullSec yang dipakai sejauh ini).
  nights: [
    { fogFullSec: 25 },
    { fogFullSec: 25 },
    { fogFullSec: 15 },
  ],
};
