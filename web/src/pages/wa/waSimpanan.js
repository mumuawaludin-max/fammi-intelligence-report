// Penanda "panduan sudah pernah dilihat" per perangkat. Ini kenyamanan tampilan, bukan data
// penting: kalau penyimpanan browser tidak tersedia (mode privat, diblokir), panduan cukup
// muncul lagi. Tidak pernah menyimpan isi laporan.

export function sudahDilihat(kunci) {
  try {
    return window.localStorage.getItem(`fir-wa-${kunci}`) === "1";
  } catch {
    return false;
  }
}

export function tandaiDilihat(kunci) {
  try {
    window.localStorage.setItem(`fir-wa-${kunci}`, "1");
  } catch {
    // penyimpanan tidak tersedia; abaikan
  }
}

export function lupakanSemua() {
  try {
    Object.keys(window.localStorage).filter((k) => k.startsWith("fir-wa-")).forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // penyimpanan tidak tersedia; abaikan
  }
}
