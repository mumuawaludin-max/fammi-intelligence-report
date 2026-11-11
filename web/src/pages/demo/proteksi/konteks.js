import { createContext, useContext } from "react";

/**
 * Konteks bersama prototipe Sekolah Proteksi:
 *   layar        id layar yang sedang terbuka (lihat layarProteksi.js)
 *   peran        id sudut pandang di header (kepsek, bk, walas, ortu)
 *   pindah(id, aksi?)  buka layar lain. `aksi` opsional, dibaca layar tujuan, mis.
 *                { jenis: "lapor" } membuka formulir Lapor kejadian di layar Kasus,
 *                { jenis: "kasus", id: "KS-016" } membuka detail satu kasus,
 *                { jenis: "tahap", id: "tugas" } menyaring antrean Kasus ke satu tahap,
 *                { jenis: "buka", id: "heart" } membuka tab aplikasi orang tua,
 *                { jenis: "gulir", id: "tindak" } ditangani di sini: gulir ke [data-bagian="tindak"].
 *   aksi         permintaan yang belum ditangani layar ini ({ jenis, id?, n }) atau null.
 *                `n` selalu bertambah, jadi permintaan yang sama dua kali tetap terbaca.
 *   aksiSelesai()  dipanggil layar sesudah aksinya dijalankan.
 *   toast(pesan)   pemberitahuan singkat di bawah layar (role="status").
 *   hitungKasus, setHitungKasus(n)  jumlah kasus aktif untuk lencana tab Kejadian; diisi layar Kasus
 *                selama terbuka, null di luar itu (lencana memakai angka registri).
 *   notifikasi   daftar notifikasi lonceng semua peran (bersama/notifikasi.js), tiap butir punya
 *                `dibaca`. beriTahu({ peran, ikon, nada, judul, isi, tujuan }) menambah butir baru
 *                di atas (`peran` boleh array), bacaNotifikasi(id), bacaSemua(peran).
 *   centang      { idButir: selesai } untuk checklist (bersama/tindakLanjut.js), hidup selama demo
 *                supaya centang di satu layar terlihat di layar lain. ubahCentang(id, selesai).
 *   rencanaBaru  { namaAnak: rencana } tindak lanjut yang disusun selama demo (layar Skrining),
 *                simpanRencana(nama, rencana).
 *   checklistTambahan  butir checklist yang lahir dari rencana itu, bentuknya sama dengan
 *                CHECKLIST; tambahChecklist(daftar) menambah (id sama diganti) dan memasang
 *                centangnya. Layar yang menampilkan checklist menggabungkannya dengan CHECKLIST.
 *   laporanBaru  laporan kejadian yang dibuat selama demo dari layar mana pun ({ id, lapor, sumber,
 *                tambahan }); layar Kasus memasukkannya ke antrean triage. buatLaporan({ lapor,
 *                sumber, tambahan? }) membagi nomor kasus berikutnya (KS-017 dst) dan mengembalikannya.
 */
export const ProteksiKonteks = createContext(null);

export function useProteksi() {
  const nilai = useContext(ProteksiKonteks);
  if (!nilai) throw new Error("useProteksi dipakai di luar SekolahProteksi");
  return nilai;
}
