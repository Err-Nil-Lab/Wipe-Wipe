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

      const mouse = k.mousePos();
      const overMinimap = isOverMinimap(mouse);
      const holding = k.isMouseDown("left") && !overMinimap; // klik di minimap = pindah, bukan stare
      night.update(dt, holding);

      // Wipe: hover tanpa klik. Mati saat klik ditahan (stare), saat pindah, dan di minimap.
      const fog = night.activeFog();
      const inCanvas = mouse.x >= 0 && mouse.y >= 0 && mouse.x < config.canvasSize && mouse.y < config.canvasSize;
      if (fog && inCanvas && !overMinimap && !k.isMouseDown("left") && !night.isLost()) {
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
      if (target !== null && !night.isLost()) night.startTravel(target);
    });

    k.onKeyPress("r", () => k.go("game")); // sementara: ulang malam (alur kalah/menang di M4)

    k.onDraw(() => {
      const t = night.travel;
      if (t) {
        // Layar bergeser dari jendela asal ke tujuan. Tujuan di kanan -> isi bergeser ke kiri.
        const dir = Math.sign(t.to - t.from);
        const p = night.travelProgress();
        const eased = p * p * (3 - 2 * p); // smoothstep: mulai dan berhenti halus
        drawWindow(k, night.fogs[t.from], t.from, -dir * config.canvasSize * eased, night.monsterAt(t.from));
        drawWindow(k, night.fogs[t.to], t.to, dir * config.canvasSize * (1 - eased), night.monsterAt(t.to));
      } else {
        drawWindow(k, night.fogs[night.current], night.current, 0, night.monsterAt(night.current));
      }

      drawMinimap(k, t ? t.to : night.current);
      drawDebugText(night, fps);

      if (night.isLost()) {
        // Sementara: layar kalah sederhana. Jumpscare dibuat di M3.
        k.drawRect({ pos: k.vec2(0, 0), width: config.canvasSize, height: config.canvasSize, color: k.rgb(0, 0, 0), opacity: 0.8 });
        k.drawText({ text: "KALAH", pos: k.vec2(360, 330), anchor: "center", size: 80, color: k.rgb(255, 255, 255) });
        const where = config.windows[night.lostAtWindow ?? 0].name;
        k.drawText({ text: `monster masuk lewat jendela ${where}. Tekan R untuk ulang`, pos: k.vec2(360, 400), anchor: "center", size: 20, color: k.rgb(255, 255, 255) });
      }
    });

    function drawDebugText(n: Night, currentFps: number) {
      const fogText = n.fogs.map((f, i) => `${config.windows[i].name} ${(f.fogRatio() * 100).toFixed(0)}%`).join("   ");
      const lines = [`FPS ${currentFps.toFixed(0)}   embun: ${fogText}`];
      n.monsters.forEach((m, i) => {
        if (m.window === null) lines.push(`M${i + 1}: muncul ${Math.max(0, m.spawnIn).toFixed(1)} dtk lagi`);
        else lines.push(`M${i + 1}: ${config.windows[m.window].name} langkah ${m.step()} (jarak ${m.position.toFixed(2)}) menempel ${m.graceElapsed.toFixed(1)} dtk`);
      });
      const stare = { none: "-", staring: "MENATAP", foggy: "PUTUS: kaca terlalu buram" }[n.stareStatus];
      lines.push(`stare: ${stare}`);
      lines.forEach((text, i) => k.drawText({ text, pos: k.vec2(10, 10 + i * 22), size: 18, color: k.rgb(255, 255, 0) }));
    }
  });
}
