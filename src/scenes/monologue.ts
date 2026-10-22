// Monolog awal malam, gaya visual novel: kotak teks di bawah, klik untuk lanjut.
// Jam malam belum jalan di sini karena game baru dimulai setelah monolog selesai.
import type { KAPLAYCtx } from "kaplay";
import { config } from "../config";
import { monologues } from "../monologues";

export function registerMonologueScene(k: KAPLAYCtx) {
  k.scene("monologue", (nightIndex: number) => {
    const lines = monologues[nightIndex];
    let current = 0;

    k.onMousePress("left", () => {
      // k.go() baru berjalan di akhir frame, jadi current tidak boleh melewati baris terakhir:
      // frame ini masih menggambar lines[current].
      if (current < lines.length - 1) current++;
      else k.go("game", nightIndex);
    });

    k.onDraw(() => {
      const size = config.canvasSize;
      k.drawText({ text: `MALAM ${nightIndex + 1}`, pos: k.vec2(size / 2, 200), anchor: "center", size: 56, color: k.rgb(255, 255, 255) });

      // Kotak teks
      k.drawRect({ pos: k.vec2(40, 500), width: size - 80, height: 180, color: k.rgb(0, 0, 0), outline: { width: 3, color: k.rgb(255, 255, 255) } });
      k.drawText({ text: lines[current], pos: k.vec2(64, 524), width: size - 128, size: 24, color: k.rgb(255, 255, 255) });
      k.drawText({ text: "klik untuk lanjut", pos: k.vec2(size - 60, 660), anchor: "botright", size: 16, color: k.rgb(150, 150, 150) });
    });
  });
}
