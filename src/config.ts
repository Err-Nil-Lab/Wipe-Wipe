// Semua angka gameplay ada di sini. Ubah, simpan, Vite reload otomatis.
export const config = {
  fog: {
    gridSize: 32, // sel per sisi kaca (32 -> 32x32). Boleh dinaikkan kalau embun terlihat kasar.
    brushRadius: 0.08, // radius kuas sebagai pecahan lebar kaca (0.08 = 8%); setel sampai usap penuh terasa ~2 dtk
    startFog: 0, // embun awal tiap jendela saat malam mulai (0 jernih, 1 buram)
    stareMaxFog: 0.5, // stare hanya jalan kalau rata-rata embun kaca di bawah angka ini
    // Embun merayap balik ke area bersih dari tepinya: lubang kecil (intip) cepat menutup, area luas bertahan.
    // 0 = mati. Makin besar makin cepat; dengan 1 menatap manual dari kaca (5 dtk) butuh kaca hampir bersih penuh.
    creepPerSec: 1,
    // Kejernihan tampilan dihitung dari rata-rata area sekitar, jadi lubang kecil tetap berkabut samar
    // dan baru jernih kalau sebagian besar kaca bersih.
    blurRadius: 0.22, // radius area rata-rata, pecahan lebar kaca
    blurMix: 0.75, // 0 = per sel (lubang kecil langsung jernih), 1 = sepenuhnya dari rata-rata area
    // Stare otomatis: aktif sendiri saat ada monster di jendela yang dilihat dan rata-rata embun < autoStareOnFog,
    // putus kalau embun >= stareMaxFog. Tombol klik tahan tidak dipakai, dan wipe tetap jalan selama menatap.
    autoStare: false,
    autoStareOnFog: 0.35,
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

  // Tampilan 3D. Satuan jarak = meter.
  view3d: {
    renderHeight: 360, // tinggi render dalam piksel; lebar mengikuti 16:9. Kecil = tampilan PS1 + ringan.
    fov: 60, // sudut pandang vertikal kamera (derajat)
    glassSize: 1.2, // sisi kaca persegi
    windowCenterY: 1.6, // tinggi tengah jendela
    fogDensity: 0.05, // kepekatan kabut luar (FogExp2); makin besar makin cepat pemandangan memudar
    eyeHeight: 1.6, // tinggi mata kamera
    stationDistance: 1.3, // jarak kamera dari kaca saat berdiri di depan jendela
    travelBob: 0.035, // goyang naik-turun kepala saat berjalan pindah jendela (meter)
    travelRoll: 0.012, // miring kepala saat berjalan (radian)
    monster: {
      farDistance: 10, // jarak dari kaca saat langkah 1 (meter)
      nearDistance: 0.1, // jarak dari kaca saat langkah di kaca (hampir menempel; tangan bertumpu di kaca)
      farLateral: 2.0, // geser ke samping maksimum di langkah 1 (dikali xOffset acak)
      nearLateral: 0.3, // geser ke samping di kaca (tetap terlihat lewat kaca)
      fadeInSec: 0.8, // muncul dari kabut
      fadeOutSec: 0.5, // menghilang ke kabut
      lurchSec: 0.07, // seberapa cepat monster "melompat" maju satu langkah (makin kecil makin tersentak)
      retreatSec: 0.3, // seberapa lambat monster mundur saat ditatap
    },
    post: {
      levels: 14, // jumlah tingkat abu-abu setelah kuantisasi (makin kecil makin kasar)
      grain: 0.05, // kekuatan butiran film
      vignette: 0.55, // gelap di tepi layar
    },
  },

  audio: {
    masterGain: 0.8, // volume keseluruhan (0 sampai 1)
    humGain: 0.12, // dengung latar selama game
    knockGain: 0.5, // ketukan saat monster menempel di kaca
    knockEverySec: 1, // ketukan berulang selama monster masih menempel
    jumpscareGain: 0.5, // suara jumpscare; keras tapi jangan sampai pecah
  },

  replayMonologueOnRetry: true, // kalah lalu ulang: monolog malam itu diputar lagi (false = langsung main)

  nightLengthSec: 300, // jam 00:00 sampai 05:00 -> 1 jam game = 1 menit

  jumpscare: {
    growSec: 0.5, // monster membesar sampai memenuhi layar
    holdSec: 0.8, // tahan sebentar sebelum layar kalah muncul
    breakSec: 0.12, // monster menggedor kaca sebelum kaca pecah
    shake: 0.025, // getar kamera (radian)
  },

  nights: [
    { monsters: 1, fogFullSec: 25 },
    { monsters: 2, fogFullSec: 25 },
    { monsters: 2, fogFullSec: 15 },
  ],
};
