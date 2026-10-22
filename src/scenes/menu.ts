// Menu awal: Mulai (malam 1) dan, kalau ada progres, Lanjut (malam tertinggi).
import type { KAPLAYCtx } from "kaplay";
import { config } from "../config";
import { loadHighestNight } from "../logic/progress";

const buttonWidth = 320;
const buttonHeight = 56;

export function registerMenuScene(k: KAPLAYCtx) {
  k.scene("menu", () => {
    const highest = loadHighestNight();
    const buttons = [{ label: "Mulai", y: 380, nightIndex: 0 }];
    if (highest > 0) buttons.push({ label: `Lanjut (Malam ${highest + 1})`, y: 460, nightIndex: highest });

    const isHovered = (y: number) => {
      const m = k.mousePos();
      return Math.abs(m.x - config.canvasSize / 2) <= buttonWidth / 2 && Math.abs(m.y - y) <= buttonHeight / 2;
    };

    k.onMousePress("left", () => {
      const clicked = buttons.find((b) => isHovered(b.y));
      if (clicked) k.go("monologue", clicked.nightIndex);
    });

    k.onDraw(() => {
      k.drawText({ text: "WIPE WIPE", pos: k.vec2(config.canvasSize / 2, 220), anchor: "center", size: 80, color: k.rgb(255, 255, 255) });
      for (const b of buttons) {
        const hovered = isHovered(b.y);
        k.drawRect({
          pos: k.vec2(config.canvasSize / 2, b.y),
          anchor: "center",
          width: buttonWidth,
          height: buttonHeight,
          color: hovered ? k.rgb(255, 255, 255) : k.rgb(0, 0, 0),
          outline: { width: 3, color: k.rgb(255, 255, 255) },
        });
        k.drawText({ text: b.label, pos: k.vec2(config.canvasSize / 2, b.y), anchor: "center", size: 26, color: hovered ? k.rgb(0, 0, 0) : k.rgb(255, 255, 255) });
      }
    });
  });
}
