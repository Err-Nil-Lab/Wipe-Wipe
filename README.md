# Wipe Wipe (versi 3D)

Game horor browser first person, hitam putih ala PS1. Terjebak di cabin saat malam: usap embun dari kaca,
tatap monster di luar jendela sampai mundur, bertahan sampai jam 5 pagi. Desain lengkap ada di GDD.

Branch ini adalah versi **3D (Three.js)**. Versi 2D (KAPLAY) tetap utuh di branch
`claude/hopeful-brahmagupta-elytgs` sebagai arsip.

## Menjalankan
```
npm install
npm run dev        # buka alamat yang tampil di terminal
npm run build      # build produksi ke dist/
npm run sim        # tes logika (timing monster, jam, menang/kalah) tanpa browser
npm run balance    # perkiraan kasar keseimbangan dengan bot (lihat tools/balance-bot.mjs untuk opsi)
```

## Kontrol
- **Gerakkan mouse** di atas kaca: usap embun (hover, tanpa klik).
- **Tahan klik kiri**: menatap. Hanya bekerja kalau embun di kaca kurang dari 50%. Wipe mati selama klik ditahan.
- **Klik kotak di minimap** (kanan bawah): pindah jendela. Waktu pindah beda tiap jendela.
- **R** di layar kalah: ulang malam.

## Embun
- **Wipe itu mahal:** tiap lintasan kuas hanya menghapus sebagian embun (`config.fog.wipePerPass`), sebanding
  panjang jalur gosokan. Kursor diam tidak menghapus; gosokan cepat dan keras lebih efektif. Dengan gosokan zig-zag
  rapat ±2,6 lebar-kaca/dtk: stare siap ±3,5 dtk, monster mulai terlihat ±5,5 dtk, hampir bersih ±10 dtk
  (pemain nyata lebih lama). Intip 0,7 dtk dan usap penuh 2 dtk di GDD lama sudah tidak berlaku.
- **Blur-fill:** kejernihan dihitung dari area sekitar (`config.fog.blurRadius`, `blurMix`), jadi satu usapan hanya
  memberi strip keruh; kaca baru jelas kalau sebagian besar sudah bersih.
- **Merayap balik:** embun menutup lubang dari tepinya (`config.fog.creepPerSec`). Lubang kecil cepat menutup,
  area bersih yang luas bertahan. Isi 0 untuk mematikan.
- **Stare otomatis (opsional):** `config.fog.autoStare: true` membuat stare menyala sendiri saat embun rata-rata
  < `autoStareOnFog` dan ada monster di jendela yang dilihat; wipe tetap jalan selama menatap. Bawaan `false`
  (klik tahan).

## Tuning
Semua angka gameplay ada di satu file: `src/config.ts` (kecepatan embun, monster, waktu pindah, durasi malam,
jumpscare, volume, jarak/kabut/kamera 3D). Ubah lalu simpan; Vite memuat ulang otomatis.

Buka `?debug` di URL (mis. `http://localhost:5173/?debug`) untuk alat debug:

| Tombol | Fungsi |
|---|---|
| `1` `2` `3` | langsung ke malam itu (tanpa menu dan monolog) |
| `C` / `F` | bersihkan / buramkan semua kaca |
| `G` | mode kebal (monster tidak bisa mengalahkan) |
| `T` | waktu x10 (malam penuh dalam 30 dtk) |
| `M` | munculkan semua monster sekarang |
| `P` | jeda |

Teks di kiri bawah menampilkan FPS, status, embun per jendela, jarak tiap monster, dan draw call.

## Struktur
```
src/config.ts      semua angka gameplay dan pengaturan 3D
src/logic/         aturan game, tanpa render: fog.ts (embun), monster.ts, night.ts, progress.ts
src/flow.ts        alur layar: menu, monolog, game, menang/kalah, akhir
src/session.ts     satu malam + objek 3D-nya, wipe lewat kursor, ketukan
src/view/          Three.js: renderer PS1, rumah, lingkungan, kaca berembun, monster, kamera, jumpscare
src/ui/            HTML/CSS: menu, monolog, jam, minimap, cincin kuas
src/audio.ts       suara sintetis Web Audio (dengung, ketukan, jumpscare)
src/monologues.ts  teks monolog PLACEHOLDER (ganti dengan teks asli)
tools/             skrip simulasi logika
```

## Catatan
- Teks monolog di `src/monologues.ts` masih placeholder.
- Progres (malam tertinggi) disimpan di localStorage.
- Model dan tekstur dibuat dari kode; tidak ada file aset.
