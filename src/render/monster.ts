// Siluet monster placeholder (kotak badan + kepala bulat + mata putih).
import type { KAPLAYCtx } from "kaplay";

export function drawMonsterShape(k: KAPLAYCtx, centerX: number, feetY: number, height: number) {
  const width = height * 0.45;
  const black = k.rgb(0, 0, 0);
  const headY = feetY - height * 0.82;

  k.drawRect({ pos: k.vec2(centerX - width / 2, feetY - height * 0.65), width, height: height * 0.65, color: black });
  k.drawCircle({ pos: k.vec2(centerX, headY), radius: height * 0.17, color: black });
  for (const side of [-1, 1]) {
    k.drawCircle({ pos: k.vec2(centerX + side * height * 0.06, headY), radius: height * 0.025, color: k.rgb(255, 255, 255) });
  }
}
