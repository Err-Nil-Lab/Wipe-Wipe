// Layar setelah malam 3 selesai.
import type { KAPLAYCtx } from "kaplay";
import { config } from "../config";

export function registerEndScene(k: KAPLAYCtx) {
  k.scene("end", () => {
    k.onMousePress("left", () => k.go("menu"));
    k.onDraw(() => {
      const size = config.canvasSize;
      k.drawText({ text: "TO BE CONTINUED", pos: k.vec2(size / 2, size / 2), anchor: "center", size: 56, color: k.rgb(255, 255, 255) });
      k.drawText({ text: "klik untuk kembali ke menu", pos: k.vec2(size / 2, size / 2 + 60), anchor: "center", size: 18, color: k.rgb(150, 150, 150) });
    });
  });
}
