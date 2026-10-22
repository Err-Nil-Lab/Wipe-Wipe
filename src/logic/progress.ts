// Malam tertinggi yang sudah terbuka (indeks 0-based), disimpan di localStorage.
// localStorage bisa melempar error (mode privat, dll.), jadi semua akses dibungkus try/catch.
import { config } from "../config";

const KEY = "wipewipe.highestNight";

export function loadHighestNight(): number {
  try {
    const saved = Number(localStorage.getItem(KEY));
    return Number.isInteger(saved) && saved >= 0 && saved < config.nights.length ? saved : 0;
  } catch {
    return 0;
  }
}

// Hanya menyimpan kalau lebih tinggi dari yang sudah ada.
export function saveHighestNight(nightIndex: number) {
  try {
    if (nightIndex > loadHighestNight()) localStorage.setItem(KEY, String(nightIndex));
  } catch {
    // tanpa penyimpanan, game tetap jalan; progres hilang saat refresh
  }
}
