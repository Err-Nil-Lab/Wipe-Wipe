// Status kursor dan tombol mouse yang dibaca game tiap frame.
export const input = {
  pointer: null as { x: number; y: number } | null, // posisi kursor dalam piksel layar
  holding: false, // klik kiri ditahan = menatap (stare)
  overUi: false, // kursor di atas minimap atau layar penuh: wipe dan stare mati
};

function updateOverUi(target: EventTarget | null) {
  input.overUi = (target as HTMLElement | null)?.closest?.("#minimap, #screen") != null;
}

export function initInput() {
  window.addEventListener("pointermove", (e) => {
    input.pointer = { x: e.clientX, y: e.clientY };
    updateOverUi(e.target);
  });
  document.addEventListener("pointerleave", () => (input.pointer = null));
  window.addEventListener("pointerdown", (e) => {
    updateOverUi(e.target);
    if (e.button === 0) input.holding = true;
  });
  window.addEventListener("pointerup", (e) => {
    if (e.button === 0) input.holding = false;
  });
  window.addEventListener("blur", () => (input.holding = false));
}
