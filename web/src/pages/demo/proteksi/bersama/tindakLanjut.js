/**
 * Tindak lanjut dan checklist. Alur pencegahan: hasil skrining HEART -> tindak lanjut per aspek
 * (siapa melakukan apa, kapan) -> checklist yang dicentang masing-masing orang. Tugas dari alur
 * kejadian (penugasan kasus) ikut masuk checklist orang yang ditugaskan, ditandai `alur:
 * "kejadian"`, supaya wali kelas cukup membuka satu daftar.
 *
 * Status centang hidup di konteks prototipe (SekolahProteksi), jadi centang di Ruang wali kelas
 * ikut terlihat di Laporan anak dan aplikasi orang tua selama demo berjalan. Semua data contoh.
 */

/** Pemilik tugas. `orang` = nama yang tampil, `peran` = id sudut pandang yang boleh mencentang. */
export const PEMILIK = {
  walas: { label: "Wali kelas", orang: "Bu Rina", peran: "walas" },
  bk: { label: "Guru BK", orang: "Bu Laras", peran: "bk" },
  ortu: { label: "Orang tua", orang: "Ibu Dewi", peran: "ortu" },
  piket: { label: "Guru piket", orang: "Pak Joko", peran: null },
};

/** Label alur untuk penanda kecil di daftar checklist. */
export const LABEL_ALUR = {
  skrining: "Skrining",
  cegah: "Tindak lanjut",
  kejadian: "Kasus",
};

/**
 * Semua butir checklist. `aspek` = id aspek HEART (null kalau berlaku untuk semua aspek atau
 * bukan dari HEART). `selesai` = keadaan awal saat demo dibuka. `kasus` = id kasus bila butir ini
 * hasil penugasan alur kejadian.
 */
export const CHECKLIST = [
  // Raka Pratama: Relasi Pertemanan (Waspada)
  { id: "raka-buddy", anak: "Raka Pratama", aspek: "relasi", alur: "cegah", judul: "Tetapkan buddy untuk Raka", ket: "Buddy: Alif Ramadhan", oleh: "walas", waktu: "Senin, 9 Nov", selesai: true },
  { id: "raka-kelompok", anak: "Raka Pratama", aspek: "relasi", alur: "cegah", judul: "Kerja kelompok kecil bersama Alif dan Gibran, 3 kali seminggu", oleh: "walas", waktu: "Mulai 9 Nov", selesai: false },
  { id: "raka-kantin", anak: "Raka Pratama", aspek: "relasi", alur: "cegah", judul: "Awasi area kantin saat istirahat panjang", oleh: "piket", waktu: "Setiap hari", selesai: false },
  { id: "raka-sesi-bk", anak: "Raka Pratama", aspek: "relasi", alur: "cegah", judul: "Sesi BK: berani bilang tidak dan mencari bantuan", oleh: "bk", waktu: "Kamis, 12 Nov", selesai: false },
  { id: "raka-main-rumah", anak: "Raka Pratama", aspek: "relasi", alur: "cegah", judul: "Undang 1 atau 2 teman sekelas bermain di rumah", oleh: "ortu", waktu: "Akhir pekan ini", selesai: false },
  // Raka Pratama: Emosional (Perlu Perhatian)
  { id: "raka-obrolan", anak: "Raka Pratama", aspek: "emosional", alur: "cegah", judul: "Obrolan hasil skrining dengan orang tua", oleh: "walas", waktu: "Kamis, 5 Nov", selesai: true },
  { id: "raka-pojok", anak: "Raka Pratama", aspek: "emosional", alur: "cegah", judul: "Pojok tenang dan kartu perasaan di kelas", oleh: "walas", waktu: "Kamis, 19 Nov", selesai: false },
  { id: "raka-sakit-perut", anak: "Raka Pratama", aspek: "emosional", alur: "cegah", judul: "Catat keluhan sakit perut tiap pagi", oleh: "ortu", waktu: "Setiap pagi", selesai: false },
  { id: "raka-cerita", anak: "Raka Pratama", aspek: "emosional", alur: "cegah", judul: "Tanyakan perasaannya sepulang sekolah", oleh: "ortu", waktu: "Setiap hari", selesai: true },
  // Raka Pratama: semua aspek
  { id: "raka-evaluasi", anak: "Raka Pratama", aspek: null, alur: "cegah", judul: "Evaluasi 4 minggu dan skrining ulang", oleh: "bk", waktu: "Kamis, 3 Des", selesai: false },
  // Raka Pratama: penugasan kasus KS-015
  { id: "ks015-respon", anak: "Raka Pratama", aspek: null, alur: "kejadian", kasus: "KS-015", judul: "KS-015: temui Raka dan catat kronologi", oleh: "walas", waktu: "Hari ini, sebelum 12.12", selesai: false },

  // Kelas 2B lainnya (checklist Bu Rina)
  { id: "2b-skrining", anak: null, aspek: null, alur: "skrining", judul: "Isi skrining HEART untuk Bagas dan Putri", oleh: "walas", waktu: "Jumat, 13 Nov", selesai: false },
  { id: "2b-buddy-rizky", anak: "Rizky Maulana", aspek: "hiperaktivitas", alur: "cegah", judul: "Tetapkan buddy untuk Rizky", oleh: "walas", waktu: "Jumat, 13 Nov", selesai: false },
  { id: "2b-observasi", anak: null, aspek: null, alur: "cegah", judul: "Observasi minggu ke-3: Keisha, Rizky, Naura, Arka", oleh: "walas", waktu: "Jumat, 13 Nov", selesai: false },
  { id: "2b-aqila-pojok", anak: "Aqila Zahra", aspek: "emosional", alur: "cegah", judul: "Ajak Aqila ke pojok tenang saat cemas", oleh: "walas", waktu: "Mulai 6 Nov", selesai: true },
];

/** Butir checklist satu anak. */
export function checklistAnak(nama) {
  return CHECKLIST.filter((c) => c.anak === nama);
}

/** Butir checklist milik satu pemilik (walas, bk, ortu, piket). */
export function checklistMilik(oleh) {
  return CHECKLIST.filter((c) => c.oleh === oleh);
}

/** Keadaan awal centang, { id: selesai }. Konteks prototipe memakainya sebagai nilai awal. */
export const CENTANG_AWAL = Object.fromEntries(CHECKLIST.map((c) => [c.id, c.selesai]));
