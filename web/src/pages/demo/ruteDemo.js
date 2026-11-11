import { hashRuteDemo } from "./demoSystems";

/**
 * Pindah layar halaman masuk (masuk, demo, laporan) lewat hash URL, tanpa memuat ulang halaman.
 * Bentuk hash dan cara membacanya ada di bacaRuteDemo (demoSystems.js).
 *
 * tambah = true menambah entri riwayat, supaya tombol Back browser kembali ke layar sebelumnya.
 * Entri ditandai `firDemo` dengan nama layarnya; penampil laporan memakainya untuk tahu bahwa entri
 * sebelumnya adalah layar demo.
 */
export function gantiRuteDemo(rute, { tambah = false } = {}) {
  const dasar = `${window.location.pathname}${window.location.search}`;
  const tujuan = `${dasar}${hashRuteDemo(rute)}`;
  const sekarang = `${dasar}${window.location.hash}`;
  const keadaan = { firDemo: rute?.layar ?? "masuk" };
  if (tambah && tujuan !== sekarang) window.history.pushState(keadaan, "", tujuan);
  else if (tujuan !== sekarang || window.history.state?.firDemo !== keadaan.firDemo) {
    window.history.replaceState(keadaan, "", tujuan);
  }
}
