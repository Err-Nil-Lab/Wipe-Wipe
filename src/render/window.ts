// Menggambar satu jendela (latar luar + embun) dengan geseran horizontal offsetX.
import type { KAPLAYCtx } from "kaplay";
import { config } from "../config";
import type { Fog } from "../logic/fog";

const size = config.canvasSize;
const cellPx = size / config.fog.gridSize;

export function drawWindow(k: KAPLAYCtx, fog: Fog, windowIndex: number, offsetX: number) {
  // Latar luar placeholder. Nama jendela ditulis supaya tiap jendela mudah dibedakan.
  k.drawRect({ pos: k.vec2(offsetX, 0), width: size, height: size, color: k.rgb(25, 25, 25) });
  k.drawText({
    text: config.windows[windowIndex].name,
    pos: k.vec2(offsetX + size / 2, size / 2),
    anchor: "center",
    size: 120,
    color: k.rgb(230, 230, 230),
  });

  // Embun: satu kotak abu per sel, makin buram makin tidak transparan.
  // Batas kotak dibulatkan ke piksel utuh: tanpa celah dan tanpa tumpang tindih
  // (tumpang tindih membuat garis grid terlihat karena opacity menumpuk).
  const n = fog.size;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const v = fog.cells[y * n + x];
      if (v <= 0.01) continue;
      const left = Math.round(x * cellPx);
      const top = Math.round(y * cellPx);
      k.drawRect({
        pos: k.vec2(offsetX + left, top),
        width: Math.round((x + 1) * cellPx) - left,
        height: Math.round((y + 1) * cellPx) - top,
        color: k.rgb(150, 150, 150),
        opacity: v,
      });
    }
  }
}
