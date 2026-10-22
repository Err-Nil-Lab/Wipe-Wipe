// Semua angka gameplay ada di sini. Ubah, simpan, Vite reload otomatis.
export const config = {
  canvasSize: 720,

  fog: {
    gridSize: 32, // sel per sisi kaca (32 -> 32x32)
    brushRadiusCells: 2.5, // radius kuas dalam sel; setel sampai usap penuh terasa ~2 dtk
    startFog: 0, // embun awal tiap jendela saat malam mulai (0 jernih, 1 buram)
    stareMaxFog: 0.5, // stare hanya jalan kalau rata-rata embun kaca di bawah angka ini
  },

  monster: {
    // Jarak monster = satu angka: 0 hilang, glassStep di kaca. "Langkah" = pembulatan ke atas.
    approachPerSec: 1 / 6, // maju saat tidak ditatap (langkah per dtk)
    retreatPerSec: 1, // mundur saat ditatap (langkah per dtk)
    glassStep: 5, // langkah saat monster menempel di kaca
    glassGraceSec: 3, // tahan di kaca selama ini tanpa ditatap -> monster masuk
    spawnPosition: 0.01, // sedikit di atas 0 supaya tampil di langkah 1 dan butuh 30 dtk ke kaca
    firstSpawnSec: [10, 15], // monster pertama muncul setelah sekian dtk (acak antara dua angka)
    respawnSec: [5, 10], // jeda muncul lagi setelah hilang
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

  nights: [
    { monsters: 1, fogFullSec: 25 },
    { monsters: 2, fogFullSec: 25 },
    { monsters: 2, fogFullSec: 15 },
  ],
};
