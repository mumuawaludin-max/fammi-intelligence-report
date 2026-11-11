import { createContext, useContext } from "react";

/**
 * Konteks bersama prototipe Sekolah Proteksi:
 *   layar        id layar yang sedang terbuka (lihat layarProteksi.js)
 *   peran        id sudut pandang di header (kepsek, bk, walas, ortu)
 *   pindah(id, aksi?)  buka layar lain. `aksi` opsional, dibaca layar tujuan sekali saja, mis.
 *                { jenis: "lapor" } membuka formulir Lapor Kejadian di layar Kasus, atau
 *                { jenis: "kasus", id: "KS-016" } membuka detail satu kasus.
 *   aksi         permintaan yang belum ditangani layar ini ({ jenis, id?, n }) atau null.
 *                `n` selalu bertambah, jadi permintaan yang sama dua kali tetap terbaca.
 *   aksiSelesai()  dipanggil layar sesudah aksinya dijalankan.
 *   toast(pesan)   pemberitahuan singkat di bawah layar (role="status").
 *   hitungKasus, setHitungKasus(n)  jumlah kasus aktif untuk lencana menu; diisi layar Kasus selama
 *                terbuka, null di luar itu (lencana memakai angka registri).
 */
export const ProteksiKonteks = createContext(null);

export function useProteksi() {
  const nilai = useContext(ProteksiKonteks);
  if (!nilai) throw new Error("useProteksi dipakai di luar SekolahProteksi");
  return nilai;
}
