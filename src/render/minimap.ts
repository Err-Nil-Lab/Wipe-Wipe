// Minimap: kotak kecil per jendela di pojok kanan bawah. Menggambar dan mengecek klik.
import type { KAPLAYCtx, Vec2 } from "kaplay";
import { config } from "../config";

type Box = { x: number; y: number; size: number };

function boxes(): Box[] {
  const { boxSize, gap, margin } = config.minimap;
  const count = config.windows.length;
  const totalWidth = count * boxSize + (count - 1) * gap;
  const startX = config.canvasSize - margin - totalWidth;
  const y = config.canvasSize - margin - boxSize;
  return config.windows.map((_, i) => ({ x: startX + i * (boxSize + gap), y, size: boxSize }));
}

function contains(box: Box, p: Vec2, pad = 0): boolean {
  return p.x >= box.x - pad && p.x <= box.x + box.size + pad && p.y >= box.y - pad && p.y <= box.y + box.size + pad;
}

// Indeks jendela yang diklik, atau null kalau klik di luar kotak.
export function windowAtPoint(p: Vec2): number | null {
  const index = boxes().findIndex((b) => contains(b, p));
  return index === -1 ? null : index;
}

// Kursor di area minimap (dengan sedikit margin): wipe dimatikan di sini.
export function isOverMinimap(p: Vec2): boolean {
  return boxes().some((b) => contains(b, p, config.minimap.gap));
}

export function drawMinimap(k: KAPLAYCtx, highlighted: number) {
  boxes().forEach((b, i) => {
    const isHighlighted = i === highlighted;
    k.drawRect({
      pos: k.vec2(b.x, b.y),
      width: b.size,
      height: b.size,
      color: k.rgb(0, 0, 0),
      opacity: 0.7,
      outline: { width: 2, color: k.rgb(255, 255, 255) },
    });
    if (isHighlighted) {
      k.drawRect({ pos: k.vec2(b.x + 8, b.y + 8), width: b.size - 16, height: b.size - 16, color: k.rgb(255, 255, 255) });
    }
  });
}
