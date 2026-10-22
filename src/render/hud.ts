// Tampilan di atas game: nama malam dan jam di pojok kanan atas.
import type { KAPLAYCtx } from "kaplay";
import { config } from "../config";

export function drawClock(k: KAPLAYCtx, nightIndex: number, clockText: string) {
  k.drawText({
    text: `MALAM ${nightIndex + 1}   ${clockText}`,
    pos: k.vec2(config.canvasSize - 14, 12),
    anchor: "topright",
    size: 28,
    color: k.rgb(255, 255, 255),
  });
}
