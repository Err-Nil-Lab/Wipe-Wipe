// Minimap HTML di pojok kanan bawah: satu kotak per jendela, jendela aktif ditandai.
// Sesuai GDD, minimap tidak menampilkan posisi monster.
import { config } from "../config";

export function createMinimap(onSelect: (windowIndex: number) => void) {
  const root = document.createElement("div");
  root.id = "minimap";
  const boxes = config.windows.map((w, i) => {
    const box = document.createElement("button");
    box.title = w.name;
    box.addEventListener("click", () => onSelect(i));
    root.appendChild(box);
    return box;
  });
  document.body.appendChild(root);

  return {
    highlight(active: number) {
      boxes.forEach((box, i) => box.classList.toggle("active", i === active));
    },
  };
}
