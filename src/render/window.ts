// Menggambar satu jendela (latar luar, monster, embun) dengan geseran horizontal offsetX.
import type { KAPLAYCtx } from "kaplay";
import { config } from "../config";
import type { Fog } from "../logic/fog";
import type { Monster } from "../logic/monster";

const size = config.canvasSize;
const cellPx = size / config.fog.gridSize;

// Siluet placeholder: makin dekat makin besar dan makin turun (perspektif 2D).
function drawMonster(k: KAPLAYCtx, monster: Monster, offsetX: number) {
  const step = monster.step();
  const height = 80 + (step - 1) * 120;
  const width = height * 0.45;
  const feetY = 400 + step * 48;
  const centerX = offsetX + size / 2 + monster.xOffset * 200;
  const black = k.rgb(0, 0, 0);

  k.drawRect({ pos: k.vec2(centerX - width / 2, feetY - height * 0.65), width, height: height * 0.65, color: black });
  const headY = feetY - height * 0.82;
  k.drawCircle({ pos: k.vec2(centerX, headY), radius: height * 0.17, color: black });
  for (const side of [-1, 1]) {
    k.drawCircle({ pos: k.vec2(centerX + side * height * 0.06, headY), radius: height * 0.025, color: k.rgb(255, 255, 255) });
  }
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
