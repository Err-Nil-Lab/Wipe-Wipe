// Scene game: menyambungkan input mouse ke logika Night dan menggambar hasilnya.
import type { KAPLAYCtx } from "kaplay";
import { config } from "../config";
import { Night } from "../logic/night";
import { drawWindow } from "../render/window";
import { drawClock } from "../render/hud";
import { drawMinimap, isOverMinimap, windowAtPoint } from "../render/minimap";

export function registerGameScene(k: KAPLAYCtx) {
  k.scene("game", (nightIndex: number = 0) => {
    const night = new Night(nightIndex);
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
      if (night.lostBy) k.go("jumpscare", nightIndex, night.lostBy.xOffset);

      // Wipe: hover tanpa klik. Mati saat klik ditahan (stare), saat pindah, dan di minimap.
      const fog = night.activeFog();
      const inCanvas = mouse.x >= 0 && mouse.y >= 0 && mouse.x < config.canvasSize && mouse.y < config.canvasSize;
      if (fog && inCanvas && !overMinimap && !k.isMouseDown("left") && !night.isLost() && !night.isWon()) {
        const cell = { x: mouse.x / cellPx, y: mouse.y / cellPx };
        const from = lastCell ?? cell;
        fog.wipeLine(from.x, from.y, cell.x, cell.y, config.fog.brushRadiusCells);
        lastCell = cell;
      } else {
        lastCell = null; // supaya tidak ada garis usapan melompat saat wipe aktif lagi
      }
    });

    k.onMousePress("left", () => {
      if (night.isWon()) {
        k.go("game", Math.min(nightIndex + 1, config.nights.length - 1)); // sementara: alur lengkap di M4
        return;
      }
      const target = windowAtPoint(k.mousePos());
      if (target !== null) night.startTravel(target);
    });

    // Sementara untuk tes: loncat ke malam 1-3. Panel debug lengkap di M6.
    config.nights.forEach((_, i) => k.onKeyPress(String(i + 1), () => k.go("game", i)));

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
      drawClock(k, nightIndex, night.clockText());

      if (night.isWon()) {
        // Sementara: layar menang sederhana. Alur lengkap di M4.
        k.drawRect({ pos: k.vec2(0, 0), width: config.canvasSize, height: config.canvasSize, color: k.rgb(255, 255, 255), opacity: 0.85 });
        k.drawText({ text: "05:00  PAGI", pos: k.vec2(360, 330), anchor: "center", size: 64, color: k.rgb(0, 0, 0) });
        k.drawText({ text: "Klik untuk malam berikutnya", pos: k.vec2(360, 400), anchor: "center", size: 20, color: k.rgb(0, 0, 0) });
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
      // Di kiri bawah supaya tidak menutupi jam di kanan atas.
      const top = config.canvasSize - 10 - lines.length * 22;
      lines.forEach((text, i) => k.drawText({ text, pos: k.vec2(10, top + i * 22), size: 18, color: k.rgb(255, 255, 0) }));
    }
  });
}
