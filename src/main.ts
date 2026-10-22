// M0: spike embun. Satu jendela diusap dengan hover; semua jendela tetap berembun.
// File ini akan diganti scene game di milestone berikutnya.
import kaplay from "kaplay";
import { config } from "./config";
import { Fog } from "./logic/fog";

const k = kaplay({
  width: config.canvasSize,
  height: config.canvasSize,
  background: [0, 0, 0],
  letterbox: true,
  global: false,
});

const fogs = Array.from({ length: config.windowCount }, () => new Fog(config.fog.gridSize, 1));
const active = fogs[0]; // M0: hanya jendela 0 yang digambar
const fullSec = config.nights[0].fogFullSec;

const cellPx = config.canvasSize / config.fog.gridSize;
let lastCell: { x: number; y: number } | null = null;
let fps = 60;

k.onUpdate(() => {
  const dt = k.dt();
  fps += (1 / dt - fps) * 0.05; // rata-rata halus supaya angka tidak loncat

  // Semua jendela tumbuh embun, walau hanya satu yang digambar.
  for (const fog of fogs) fog.grow(dt, fullSec);

  // Wipe: hover tanpa klik. Mouse dikonversi ke satuan sel.
  const mouse = k.mousePos();
  const cell = { x: mouse.x / cellPx, y: mouse.y / cellPx };
  const inside = mouse.x >= 0 && mouse.y >= 0 && mouse.x < config.canvasSize && mouse.y < config.canvasSize;
  if (inside) {
    const from = lastCell ?? cell;
    active.wipeLine(from.x, from.y, cell.x, cell.y, config.fog.brushRadiusCells);
    lastCell = cell;
  } else {
    lastCell = null;
  }

  if (k.isKeyPressed("c")) active.clear();
  if (k.isKeyPressed("r")) active.fill();
});

k.onDraw(() => {
  // Latar "pemandangan luar" placeholder, supaya terlihat apa yang diusap.
  k.drawRect({ pos: k.vec2(0, 0), width: config.canvasSize, height: config.canvasSize, color: k.rgb(25, 25, 25) });
  k.drawCircle({ pos: k.vec2(360, 330), radius: 120, color: k.rgb(230, 230, 230) });
  k.drawRect({ pos: k.vec2(300, 450), width: 120, height: 270, color: k.rgb(230, 230, 230) });

  // Embun: satu kotak abu per sel, makin buram makin tidak transparan.
  const n = active.size;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const v = active.cells[y * n + x];
      if (v <= 0.01) continue;
      // Batas kotak dibulatkan ke piksel utuh: tanpa celah dan tanpa tumpang tindih
      // (tumpang tindih membuat garis grid terlihat karena opacity menumpuk).
      const left = Math.round(x * cellPx);
      const top = Math.round(y * cellPx);
      k.drawRect({
        pos: k.vec2(left, top),
        width: Math.round((x + 1) * cellPx) - left,
        height: Math.round((y + 1) * cellPx) - top,
        color: k.rgb(150, 150, 150),
        opacity: v,
      });
    }
  }

  const info = `FPS ${fps.toFixed(0)}   embun ${(active.fogRatio() * 100).toFixed(0)}%   tombol C = bersihkan, R = buramkan`; // tanpa [..]: KAPLAY menganggapnya tag gaya teks
  k.drawText({ text: info, pos: k.vec2(10, 10), size: 18, color: k.rgb(255, 255, 0) });
});
