// Layar HTML di atas dunia 3D: menu, monolog, menang, kalah, akhir, serta jam dan kilat jumpscare.
// Hanya menampilkan dan meneruskan klik; alurnya diatur flow.ts.
const screen = document.getElementById("screen")!;
const clock = document.getElementById("clock")!;
const flash = document.getElementById("flash")!;

// Tiap layar membuat kontainer baru. Listener klik dipasang di kontainer itu, bukan di #screen yang dipakai
// bersama, supaya listener layar sebelumnya ikut hilang dan tidak menerima klik layar berikutnya.
function show(className: string, build: (root: HTMLElement) => void) {
  const content = document.createElement("div");
  content.className = "content";
  build(content);
  screen.className = className;
  screen.replaceChildren(content);
  screen.style.display = "block";
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text: string, parent: HTMLElement, onClick?: () => void) {
  const el = document.createElement(tag);
  el.textContent = text;
  if (onClick) el.addEventListener("click", onClick);
  parent.appendChild(el);
  return el;
}

export const screens = {
  clear() {
    screen.style.display = "none";
    screen.replaceChildren();
  },

  // continueNight = indeks malam tertinggi yang terbuka (0 = belum ada progres).
  menu(continueNight: number, onStart: () => void, onContinue: () => void) {
    show("dim", (root) => {
      element("h1", "WIPE WIPE", root);
      element("button", "Mulai", root, onStart);
      if (continueNight > 0) element("button", `Lanjut (Malam ${continueNight + 1})`, root, onContinue);
    });
  },

  // Klik di mana saja untuk lanjut; setelah baris terakhir memanggil onDone.
  monologue(nightIndex: number, lines: string[], onDone: () => void) {
    let current = 0;
    show("monologue", (root) => {
      element("h2", `MALAM ${nightIndex + 1}`, root);
      const box = document.createElement("div");
      box.className = "box";
      const text = element("span", lines[0], box);
      element("span", "klik untuk lanjut", box).className = "hint";
      root.appendChild(box);
      root.addEventListener("click", () => {
        current++;
        if (current >= lines.length) return onDone();
        text.textContent = lines[current];
      });
    });
  },

  won(isLastNight: boolean, onClick: () => void) {
    show("white", (root) => {
      element("h2", "05:00  PAGI", root);
      element("p", isLastNight ? "klik untuk lanjut" : "klik untuk malam berikutnya", root);
      root.addEventListener("click", onClick);
    });
  },

  lost(nightIndex: number, onRetry: () => void) {
    show("black", (root) => {
      element("h2", "KALAH", root);
      element("button", `Ulangi malam ${nightIndex + 1}`, root, onRetry);
      element("p", "atau tekan R", root);
    });
  },

  end(onClick: () => void) {
    show("black", (root) => {
      element("h2", "TO BE CONTINUED", root);
      element("p", "klik untuk kembali ke menu", root);
      root.addEventListener("click", onClick);
    });
  },

  setClock(text: string | null) {
    clock.style.display = text === null ? "none" : "block";
    if (text !== null) clock.textContent = text;
  },

  // Kilat putih yang memudar cepat (saat kaca pecah).
  flash(fadeSec: number) {
    flash.style.transition = "none";
    flash.style.opacity = "1";
    void flash.offsetWidth; // paksa browser menerapkan opacity 1 sebelum memudar
    flash.style.transition = `opacity ${fadeSec}s ease-out`;
    flash.style.opacity = "0";
  },
};
