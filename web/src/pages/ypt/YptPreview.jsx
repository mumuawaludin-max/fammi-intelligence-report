import YptApp from "./YptApp";
import { YPT_ID } from "./yptMeta";

/**
 * Pratinjau lepas-login dashboard Yayasan Pendidikan Telkom, dibuka lewat ?preview=ypt.
 * Pola sama dengan PaPreview/LwPreview: bukan bagian alur produk, cuma alat kerja supaya tata
 * letak bisa diperiksa berdampingan dengan Figma tanpa akun produksi.
 *
 * Sesi tiruan di bawah memakai sekolah CONTOH. Datanya sendiri tetap ditarik dari Supabase, jadi
 * tanpa login yang sah, RLS akan mengembalikan nol baris dan tiap menu tampil sebagai
 * EmptyState -- itu memang yang ingin diperiksa di sini (shell, nav, stepper, dan status kosong).
 */
const SESSION_CONTOH = {
  user_id: "preview",
  username: "yayasanpendidikantelkom",
  nama: "Yayasan Pendidikan Telkom",
  peran: "Yayasan",
  school_id: "SMK-TELKOM-PURWOKERTO",
  cakupan: [YPT_ID],
  yayasan_id: YPT_ID,
  modules: ["karakter", "kp"],
  modulesBySchool: {},
  schools: [
    { id: "TK-TELKOM-PADANG", nama: "TK Telkom Padang", jenjang: "TK", kota: "Padang" },
    { id: "TK-TELKOM-TERNATE", nama: "TK Telkom Ternate", jenjang: "TK", kota: "Ternate" },
    { id: "SD-TELKOM-BATAM", nama: "SD Telkom Batam", jenjang: "SD", kota: "Batam" },
    { id: "SD-TELKOM-PADANG", nama: "SD Telkom Padang", jenjang: "SD", kota: "Padang" },
    { id: "SMP-TELKOM-MAKASSAR", nama: "SMP Telkom Makassar", jenjang: "SMP", kota: "Makassar" },
    { id: "SMK-TELKOM-PURWOKERTO", nama: "SMK Telkom Purwokerto", jenjang: "SMK", kota: "Purwokerto" },
    { id: "SMK-TELKOM-LAMPUNG", nama: "SMK Telkom Lampung", jenjang: "SMK", kota: "Bandar Lampung" },
  ],
};

export default function YptPreview() {
  return <YptApp session={SESSION_CONTOH} onLogout={() => {}} />;
}
