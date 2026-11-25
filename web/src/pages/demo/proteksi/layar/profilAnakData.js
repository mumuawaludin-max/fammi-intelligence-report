/**
 * Data contoh khusus layar Laporan anak: Raka Pratama, kelas 2B, dilihat Bu Rina sebagai wali kelas.
 * Hasil HEART, peta dukungan, dan checklist dibaca dari berkas bersama (bersama/heart.js,
 * bersama/dukungan.js, bersama/tindakLanjut.js) supaya sama dengan layar lain. Berkas ini hanya
 * memuat yang dipakai layar ini saja: tujuan dan jadwal evaluasi tindak lanjut, ringkasan kasus
 * KS-015, riwayat, dan penanda cepat di laci Catat pengamatan. Semua nama, tanggal, dan angka contoh.
 */

/** Tujuan tindak lanjut 4 minggu, tampil di laci Semua tindak lanjut. */
export const TUJUAN = "Raka punya teman bermain dan merasa aman saat jam istirahat.";

/** Jadwal evaluasi seluruh tindak lanjut: Guru BK mengevaluasi bersama orang tua, lalu skrining ulang. */
export const EVALUASI = { tanggal: "Kamis, 3 Des", ket: "Evaluasi 4 minggu dan screening ulang HEART" };

/** Tanggal hari ini di demo, dipakai entri riwayat baru. */
export const HARI_INI = "Rabu, 11 Nov";

/**
 * Ringkasan kasus KS-015 untuk baris kasus aktif dan lacinya. `tahap` mengikuti id langkah alur
 * kejadian (bersama/alur.js); `status`: selesai, aktif (sedang berjalan), nanti. `sla` berisi batas
 * waktu tanggapan pertama; `ketSesudahTanggapan` dan `sla.sesudah` dipakai begitu butir checklist
 * tanggapan pertama (tugas wali kelas) dicentang.
 */
export const KASUS_RAKA = {
  id: "KS-015",
  judul: "Didorong dan dipukul kakak kelas di dekat kantin",
  kategori: "Perundungan fisik",
  tingkat: "Tinggi",
  ket: "Dilaporkan Ibu Dewi lewat Lapor Aman, Rabu 11 Nov 08.12. Kepala Sekolah diberi tahu.",
  sla: {
    label: "Tanggapan pertama",
    sisa: "sisa 1 j 42 m",
    batas: "Batas 12.12 hari ini",
    persen: 58,
    sesudah: "Berikutnya rencana penanganan, paling lambat Jumat 13 Nov 08.12.",
  },
  tahap: {
    lapor: { ket: "Rabu 08.12, Ibu Dewi", status: "selesai" },
    triage: { ket: "08.40, tingkat Tinggi", status: "selesai" },
    tugas: { ket: "08.41, Bu Rina dan Bu Laras", status: "selesai" },
    tangani: { ket: "Temui Raka sebelum 12.12", ketSesudahTanggapan: "Rencana penanganan sampai Jumat 13 Nov", status: "aktif" },
    pantau: { ket: "Cek tiap minggu, 2 sampai 4 minggu", status: "nanti" },
  },
  sebelumnya: "Kasus sebelumnya: KS-008, 30 Okt, saling ejek saat antre. Selesai 3 Nov lewat mediasi wali kelas.",
};

/**
 * Riwayat awal, terbaru di atas. `jenis`: skr (skrining HEART), obs (pengamatan), tindak (tindak
 * lanjut dan teman pendamping), kasus, kontak (menghubungi orang tua); menentukan ikonnya. `x` keterangan.
 */
export const RIWAYAT_AWAL = [
  { id: "r1", d: "Rabu, 11 Nov", jenis: "kasus", t: "Laporan KS-015 masuk", x: "Ibu Dewi melapor Raka didorong dan dipukul kakak kelas di dekat kantin. Tingkat Tinggi." },
  { id: "r2", d: "Selasa, 10 Nov", jenis: "obs", t: "Pengamatan Bu Rina · Relasi Pertemanan", x: "Bermain dengan Alif dan Gibran saat istirahat, terlihat lebih ceria." },
  { id: "r3", d: "Senin, 9 Nov", jenis: "tindak", t: "Teman pendamping ditetapkan", x: "Alif Ramadhan menjadi teman pendamping Raka. Kerja kelompok kecil bersama Alif dan Gibran dimulai." },
  { id: "r4", d: "Jumat, 6 Nov", jenis: "obs", t: "Pengamatan Bu Rina · Relasi Pertemanan", x: "Menyendiri di pojok kelas saat istirahat dan menolak ke kantin. Dibahas dengan Guru BK." },
  { id: "r5", d: "Kamis, 5 Nov", jenis: "tindak", t: "Tindak lanjut HEART disusun", x: "Bu Laras dan Bu Rina menyusun tindak lanjut Relasi Pertemanan dan Emosional, lalu membahasnya dengan Ibu Dewi." },
  { id: "r6", d: "Selasa, 3 Nov", jenis: "skr", t: "Hasil screening HEART keluar", x: "Relasi Pertemanan Perlu Perhatian Lebih, Emosional Perlu Diperhatikan, tiga aspek lain Aman." },
  { id: "r7", d: "Jumat, 30 Okt", jenis: "kasus", t: "Kasus KS-008", x: "Saling ejek saat antre. Dimediasi wali kelas, selesai 3 Nov." },
  { id: "r8", d: "Jumat, 23 Okt", jenis: "skr", t: "Formulir HEART wali kelas masuk", x: "Bu Rina mengisi screening HEART untuk Raka." },
];

/** Ikon riwayat menurut jenisnya (nama di ikonData.js). */
export const IKON_RIWAYAT = { skr: "skrining", obs: "pena", tindak: "ceklis", kasus: "tiket", kontak: "telepon" };

/** Penanda cepat di laci Catat pengamatan. */
export const PENANDA = ["Menyendiri", "Menangis", "Marah", "Konflik dengan teman", "Takut pada seseorang", "Membaik"];
