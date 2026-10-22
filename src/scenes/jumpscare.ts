// Jumpscare saat kalah: monster membesar memenuhi layar, lalu layar kalah.
// Suara jumpscare ditambah di milestone audio.
import type { KAPLAYCtx } from "kaplay";
import { playJumpscare } from "../audio";
import { config } from "../config";
import { drawMonsterShape } from "../render/monster";

const cfg = config.jumpscare;
const size = config.canvasSize;

export function registerJumpscareScene(k: KAPLAYCtx) {
  k.scene("jumpscare", (nightIndex: number, monsterX: number) => {
    let t = 0;
    playJumpscare();
    const lostScreenAt = cfg.growSec + cfg.holdSec;

    k.onUpdate(() => {
      t += k.dt();
    });
    k.onKeyPress("r", () => {
      if (t >= lostScreenAt) k.go(config.replayMonologueOnRetry ? "monologue" : "game", nightIndex);
    });

    k.onDraw(() => {
      const grow = Math.min(1, t / cfg.growSec);
      const eased = grow * grow; // makin cepat di akhir supaya terasa menerkam
      // Dari ukuran di kaca (langkah 5) sampai kepala memenuhi layar.
      const height = 560 + (2400 - 560) * eased;
      const feetY = 640 + (2268 - 640) * eased;
      const centerX = size / 2 + monsterX * 200 * (1 - eased);
      const shake = t < lostScreenAt ? cfg.shake : 0;
      const dx = (Math.random() - 0.5) * shake;
      const dy = (Math.random() - 0.5) * shake;

      k.drawRect({ pos: k.vec2(0, 0), width: size, height: size, color: k.rgb(70, 70, 70) });
      drawMonsterShape(k, centerX + dx, feetY + dy, height);

      if (t >= lostScreenAt) {
        k.drawRect({ pos: k.vec2(0, 0), width: size, height: size, color: k.rgb(0, 0, 0) });
        k.drawText({ text: "KALAH", pos: k.vec2(size / 2, 320), anchor: "center", size: 80, color: k.rgb(255, 255, 255) });
        k.drawText({ text: `Tekan R untuk ulang malam ${nightIndex + 1}`, pos: k.vec2(size / 2, 390), anchor: "center", size: 20, color: k.rgb(255, 255, 255) });
      }
    });
  });
}
