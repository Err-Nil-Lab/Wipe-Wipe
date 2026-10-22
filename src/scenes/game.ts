// Scene game: menyambungkan input mouse ke logika Night dan menggambar hasilnya.
import type { KAPLAYCtx } from "kaplay";
import { config } from "../config";
import { Night } from "../logic/night";
import { drawWindow } from "../render/window";
import { drawMinimap, isOverMinimap, windowAtPoint } from "../render/minimap";

export function registerGameScene(k: KAPLAYCtx) {
  k.scene("game", () => {
    const night = new Night(0);
    const cellPx = config.canvasSize / config.fog.gridSize;
    let lastCell: { x: number; y: number } | null = null;
    let fps = 60;

    k.onUpdate(() => {
      const dt = k.dt();
      fps += (1 / dt - fps) * 0.05; // rata-rata halus supaya angka tidak loncat
      night.update(dt);

      // Wipe: hover tanpa klik. Mati saat pindah jendela dan saat kursor di minimap.
      const mouse = k.mousePos();
      const fog = night.activeFog();
      const inCanvas = mouse.x >= 0 && mouse.y >= 0 && mouse.x < config.canvasSize && mouse.y < config.canvasSize;
      if (fog && inCanvas && !isOverMinimap(mouse)) {
        const cell = { x: mouse.x / cellPx, y: mouse.y / cellPx };
        const from = lastCell ?? cell;
        fog.wipeLine(from.x, from.y, cell.x, cell.y, config.fog.brushRadiusCells);
        lastCell = cell;
      } else {
        lastCell = null; // supaya tidak ada garis usapan melompat saat wipe aktif lagi
      }
    });

    k.onMousePress("left", () => {
      const target = windowAtPoint(k.mousePos());
      if (target !== null) night.startTravel(target);
    });

    k.onDraw(() => {
      const t = night.travel;
      if (t) {
        // Layar bergeser dari jendela asal ke tujuan. Tujuan di kanan -> isi bergeser ke kiri.
        const dir = Math.sign(t.to - t.from);
        const p = night.travelProgress();
        const eased = p * p * (3 - 2 * p); // smoothstep: mulai dan berhenti halus
        drawWindow(k, night.fogs[t.from], t.from, -dir * config.canvasSize * eased);
        drawWindow(k, night.fogs[t.to], t.to, dir * config.canvasSize * (1 - eased));
      } else {
        drawWindow(k, night.fogs[night.current], night.current, 0);
      }

      drawMinimap(k, t ? t.to : night.current);

      const fogText = night.fogs.map((f, i) => `${config.windows[i].name} ${(f.fogRatio() * 100).toFixed(0)}%`).join("   ");
      k.drawText({ text: `FPS ${fps.toFixed(0)}   embun: ${fogText}`, pos: k.vec2(10, 10), size: 18, color: k.rgb(255, 255, 0) });
    });
  });
}
