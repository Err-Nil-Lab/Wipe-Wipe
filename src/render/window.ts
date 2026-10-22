// Menggambar satu jendela (latar luar, monster, embun) dengan geseran horizontal offsetX.
import type { KAPLAYCtx } from "kaplay";
import { config } from "../config";
import type { Fog } from "../logic/fog";
import type { Monster } from "../logic/monster";
import { drawMonsterShape } from "./monster";

const size = config.canvasSize;
const cellPx = size / config.fog.gridSize;

// Makin dekat makin besar dan makin turun (perspektif 2D).
function drawMonster(k: KAPLAYCtx, monster: Monster, offsetX: number) {
  const step = monster.step();
  const height = 80 + (step - 1) * 120;
  const feetY = 400 + step * 48;
  drawMonsterShape(k, offsetX + size / 2 + monster.xOffset * 200, feetY, height);
}

export function drawWindow(k: KAPLAYCtx, fog: Fog, windowIndex: number, offsetX: number, monster: Monster | null) {
  // Latar luar placeholder. Nama jendela kecil di atas supaya tiap jendela mudah dibedakan.
  k.drawRect({ pos: k.vec2(offsetX, 0), width: size, height: size, color: k.rgb(70, 70, 70) });
  k.drawText({
    text: config.windows[windowIndex].name,
    pos: k.vec2(offsetX + size / 2, 110),
    anchor: "center",
    size: 36,
    color: k.rgb(110, 110, 110),
  });

  if (monster) drawMonster(k, monster, offsetX);

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
