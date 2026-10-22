// Cincin kecil di kursor yang menunjukkan ukuran kuas di layar.
const ring = document.getElementById("ring")!;

export function showRing(x: number, y: number, radiusPx: number) {
  ring.style.display = "block";
  ring.style.width = ring.style.height = `${radiusPx * 2}px`;
  ring.style.transform = `translate(${x - radiusPx}px, ${y - radiusPx}px)`;
}

export function hideRing() {
  ring.style.display = "none";
}
