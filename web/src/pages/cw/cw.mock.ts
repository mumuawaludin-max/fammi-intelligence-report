/**
 * Data dummy modul Corporate Culture & Wellbeing (CW). Konteksnya KORPORAT: satu perusahaan
 * dengan beberapa unit/divisi, respondennya karyawan -- bukan sekolah/guru/murid seperti tiga
 * modul FIR lainnya. Semua angka dan nama rekaan, BUKAN organisasi nyata; tandai SampleTag di
 * UI selama data ini yang dipakai.
 *
 * Nama subdimensi kesejahteraan dan istilah lain yang tidak disebut eksplisit pemilik produk
 * juga rekaan -- lihat catatan ASUMSI di cw.types.ts.
 */
import type { LaporanAgregatCW, LaporanIndividuCW } from "./cw.types";

const ORGANISASI_ID = "org-sinergi-nusantara";
const PERIODE = "2026-07";

const DISCLAIMER_INDIVIDU =
  "Laporan ini adalah hasil pengolahan jawaban asesmen Anda dan bersifat rahasia. Gunakan sebagai bahan refleksi pribadi, bukan alat penilaian kinerja formal.";

/** Responden 1: profil budaya seimbang, kesejahteraan baik. */
const RESPONDEN_1: LaporanIndividuCW = {
  meta: {
    responden_id: "cw-kry-001",
    nama_responden: "Arum Kusuma",
    jabatan: "Analis Data Senior",
    unit: "Teknologi",
    organisasi_id: ORGANISASI_ID,
    periode_id: PERIODE,
  },
  header: {
    hook: "Anda melihat perusahaan ini sebagai tempat yang hangat dan terus bertumbuh.",
    sub_hook: "Profil budaya Anda condong ke arah kolaboratif dengan dorongan inovasi yang sehat.",
  },
  bagian_budaya: {
    narasi:
      "Persepsi Anda terhadap budaya perusahaan saat ini paling kuat di sisi Klan, menandakan Anda merasakan kedekatan dan rasa saling percaya di antara rekan satu tim. Harapan Anda ke depan tidak jauh berbeda, hanya ingin porsi Adhokrasi (ruang bereksperimen) sedikit lebih besar.",
    chart_data: [
      { tipe: "Klan", saat_ini: 68, harapan: 72 },
      { tipe: "Adhokrasi", saat_ini: 54, harapan: 66 },
      { tipe: "Pasar", saat_ini: 41, harapan: 40 },
      { tipe: "Hierarki", saat_ini: 47, harapan: 42 },
    ],
    tabel_gap: [
      { label: "Klan", arah: "naik", nilai_gap: 4 },
      { label: "Adhokrasi", arah: "naik", nilai_gap: 12 },
      { label: "Pasar", arah: "tetap", nilai_gap: -1 },
      { label: "Hierarki", arah: "turun", nilai_gap: -5 },
    ],
  },
  bagian_kesejahteraan: {
    narasi:
      "Secara umum kondisi kesejahteraan Anda berada di kategori Tinggi. Dukungan rekan kerja jadi titik terkuat, sementara beban kerja masih dalam batas wajar meski sedikit lebih tinggi dari subdimensi lain.",
    indeks: 78,
    kategori: "Tinggi",
    chart_data: [
      { kode: "beban_kerja", label: "Beban Kerja", nilai: 66, kategori: "Sedang" },
      { kode: "dukungan_sosial", label: "Dukungan Rekan Kerja", nilai: 88, kategori: "Sangat Tinggi" },
      { kode: "keseimbangan_hidup", label: "Keseimbangan Hidup-Kerja", nilai: 74, kategori: "Tinggi" },
      { kode: "pengembangan_diri", label: "Pengembangan Karier", nilai: 82, kategori: "Sangat Tinggi" },
      { kode: "kepuasan_kerja", label: "Kepuasan Kerja", nilai: 80, kategori: "Tinggi" },
    ],
  },
  bagian_cermin:
    "Rekan-rekan melihat Anda sebagai sosok yang mudah diajak berdiskusi dan konsisten hadir saat tim butuh bantuan teknis. Kehangatan ini jadi salah satu perekat suasana kerja di divisi Anda.",
  bagian_refleksi:
    "Apa satu hal kecil yang bisa Anda lakukan bulan ini supaya ruang mencoba pendekatan baru terasa lebih terbuka di tim Anda?",
  footer: { disclaimer: DISCLAIMER_INDIVIDU },
};

/** Responden 2: gap besar Hierarki tinggi vs harapan lebih kolaboratif, kesejahteraan sedang. */
const RESPONDEN_2: LaporanIndividuCW = {
  meta: {
    responden_id: "cw-kry-002",
    nama_responden: "Bimo Prasetyo",
    jabatan: "Staf Administrasi Keuangan",
    unit: "Keuangan & Umum",
    organisasi_id: ORGANISASI_ID,
    periode_id: PERIODE,
  },
  header: {
    hook: "Anda merasakan perusahaan ini masih banyak diatur oleh prosedur dan persetujuan berlapis.",
    sub_hook: "Harapan Anda condong pada suasana kerja yang lebih dekat dan saling mendukung.",
  },
  bagian_budaya: {
    narasi:
      "Persepsi Anda menunjukkan budaya saat ini didominasi Hierarki, banyak proses berjalan sesuai prosedur formal. Namun harapan Anda bergeser cukup jauh ke arah Klan, menandakan keinginan akan suasana kerja yang lebih personal dan fleksibel.",
    chart_data: [
      { tipe: "Klan", saat_ini: 32, harapan: 60 },
      { tipe: "Adhokrasi", saat_ini: 28, harapan: 35 },
      { tipe: "Pasar", saat_ini: 38, harapan: 32 },
      { tipe: "Hierarki", saat_ini: 71, harapan: 48 },
    ],
    tabel_gap: [
      { label: "Klan", arah: "naik", nilai_gap: 28 },
      { label: "Adhokrasi", arah: "naik", nilai_gap: 7 },
      { label: "Pasar", arah: "turun", nilai_gap: -6 },
      { label: "Hierarki", arah: "turun", nilai_gap: -23 },
    ],
  },
  bagian_kesejahteraan: {
    narasi:
      "Kondisi kesejahteraan Anda berada di kategori Sedang. Beban kerja jadi subdimensi yang paling perlu diperhatikan, sementara kepuasan kerja masih relatif terjaga.",
    indeks: 58,
    kategori: "Sedang",
    chart_data: [
      { kode: "beban_kerja", label: "Beban Kerja", nilai: 39, kategori: "Rendah" },
      { kode: "dukungan_sosial", label: "Dukungan Rekan Kerja", nilai: 61, kategori: "Sedang" },
      { kode: "keseimbangan_hidup", label: "Keseimbangan Hidup-Kerja", nilai: 52, kategori: "Sedang" },
      { kode: "pengembangan_diri", label: "Pengembangan Karier", nilai: 55, kategori: "Sedang" },
      { kode: "kepuasan_kerja", label: "Kepuasan Kerja", nilai: 68, kategori: "Sedang" },
    ],
  },
  bagian_cermin:
    "Rekan kerja menilai Anda sebagai orang yang teliti dan bisa diandalkan untuk urusan administratif, meski beberapa menyebut Anda jarang berbagi cerita di luar urusan pekerjaan.",
  bagian_refleksi:
    "Prosedur mana yang menurut Anda sudah tidak perlu terlalu berlapis, dan siapa satu rekan kerja yang bisa Anda ajak bicara lebih terbuka minggu ini?",
  footer: { disclaimer: DISCLAIMER_INDIVIDU },
};

/** Responden 3: budaya Pasar/kompetitif dominan, kesejahteraan paling perlu perhatian. */
const RESPONDEN_3: LaporanIndividuCW = {
  meta: {
    responden_id: "cw-kry-003",
    nama_responden: "Citra Wulandari",
    jabatan: "Manajer Penjualan Wilayah",
    unit: "Penjualan & Pemasaran",
    organisasi_id: ORGANISASI_ID,
    periode_id: PERIODE,
  },
  header: {
    hook: "Anda merasakan tekanan pencapaian target menjadi warna utama keseharian kerja.",
    sub_hook: "Anda berharap ada ruang lebih besar untuk saling mendukung, bukan sekadar mengejar angka.",
  },
  bagian_budaya: {
    narasi:
      "Budaya yang Anda rasakan saat ini paling menonjol di sisi Pasar, dengan penekanan pada pencapaian dan hasil terukur. Harapan Anda relatif merata di semua tipe, dengan kenaikan paling terasa pada Klan.",
    chart_data: [
      { tipe: "Klan", saat_ini: 30, harapan: 52 },
      { tipe: "Adhokrasi", saat_ini: 40, harapan: 48 },
      { tipe: "Pasar", saat_ini: 74, harapan: 58 },
      { tipe: "Hierarki", saat_ini: 45, harapan: 40 },
    ],
    tabel_gap: [
      { label: "Klan", arah: "naik", nilai_gap: 22 },
      { label: "Adhokrasi", arah: "naik", nilai_gap: 8 },
      { label: "Pasar", arah: "turun", nilai_gap: -16 },
      { label: "Hierarki", arah: "turun", nilai_gap: -5 },
    ],
  },
  bagian_kesejahteraan: {
    narasi:
      "Indeks kesejahteraan Anda berada di kategori Rendah, terutama ditekan beban kerja dan keseimbangan hidup-kerja yang jadi dua subdimensi terlemah. Ini pola yang perlu jadi perhatian bersama, bukan cuma catatan pribadi.",
    indeks: 44,
    kategori: "Rendah",
    chart_data: [
      { kode: "beban_kerja", label: "Beban Kerja", nilai: 28, kategori: "Sangat Rendah" },
      { kode: "dukungan_sosial", label: "Dukungan Rekan Kerja", nilai: 50, kategori: "Sedang" },
      { kode: "keseimbangan_hidup", label: "Keseimbangan Hidup-Kerja", nilai: 33, kategori: "Rendah" },
      { kode: "pengembangan_diri", label: "Pengembangan Karier", nilai: 58, kategori: "Sedang" },
      { kode: "kepuasan_kerja", label: "Kepuasan Kerja", nilai: 51, kategori: "Sedang" },
    ],
  },
  bagian_cermin:
    "Rekan kerja mengagumi dedikasi Anda mengejar target tim, namun beberapa juga khawatir Anda jarang terlihat benar-benar berhenti sejenak di sela jam kerja.",
  bagian_refleksi:
    "Kalau boleh menunda satu target minggu ini demi waktu istirahat yang cukup, target mana yang akan Anda pilih?",
  footer: { disclaimer: DISCLAIMER_INDIVIDU },
};

export const MOCK_LAPORAN_INDIVIDU_CW: LaporanIndividuCW[] = [RESPONDEN_1, RESPONDEN_2, RESPONDEN_3];

/**
 * Data dummy laporan agregat/pimpinan, satu organisasi satu periode. Angka dibuat masuk akal
 * berdampingan dengan 3 responden di atas (indeks agregat 60, di antara 78/58/44), TAPI tidak
 * dihitung otomatis dari mereka -- ini dummy independen, bukan agregasi nyata.
 *
 * chart_data dan tabel_gap sengaja dijaga konsisten: selisih harapan - saat_ini tiap tipe sama
 * persis dengan nilai_gap, dan Klan dibuat tertinggi supaya cocok dengan narasi maupun stat tile
 * "Budaya Dominan" yang menghitung argmax saat_ini.
 */
export const MOCK_LAPORAN_AGREGAT_CW: LaporanAgregatCW = {
  meta: {
    organisasi_id: ORGANISASI_ID,
    organisasi_nama: "PT Sinergi Nusantara (contoh)",
    periode_id: PERIODE,
    jumlah_responden: 142,
  },
  header: {
    hook: "Budaya kerja perusahaan Anda condong kolaboratif, tapi kesejahteraan tim Penjualan perlu perhatian.",
    sub_hook: "Ringkasan dari 142 karyawan lintas empat unit pada periode ini.",
  },
  bagian_budaya: {
    narasi:
      "Secara umum karyawan merasakan budaya Klan paling kuat, dengan harapan yang juga bergerak ke arah sana, artinya arah yang diinginkan karyawan sudah sejalan dengan kondisi saat ini. Gap terbesar ada pada Adhokrasi: karyawan berharap ruang bereksperimen dan mencoba pendekatan baru lebih terbuka dari kondisi sekarang.",
    chart_data: [
      { tipe: "Klan", saat_ini: 58, harapan: 67 },
      { tipe: "Adhokrasi", saat_ini: 41, harapan: 55 },
      { tipe: "Pasar", saat_ini: 46, harapan: 42 },
      { tipe: "Hierarki", saat_ini: 55, harapan: 47 },
    ],
    tabel_gap: [
      { label: "Klan", arah: "naik", nilai_gap: 9 },
      { label: "Adhokrasi", arah: "naik", nilai_gap: 14 },
      { label: "Pasar", arah: "turun", nilai_gap: -4 },
      { label: "Hierarki", arah: "turun", nilai_gap: -8 },
    ],
  },
  bagian_kesejahteraan: {
    narasi:
      "Indeks kesejahteraan gabungan berada di kategori Sedang. Dukungan antar rekan kerja jadi subdimensi terkuat, sementara beban kerja jadi titik yang paling perlu diperhatikan perusahaan secara keseluruhan.",
    indeks: 60,
    kategori: "Sedang",
    chart_data: [
      { kode: "beban_kerja", label: "Beban Kerja", nilai: 44, kategori: "Rendah" },
      { kode: "dukungan_sosial", label: "Dukungan Rekan Kerja", nilai: 72, kategori: "Tinggi" },
      { kode: "keseimbangan_hidup", label: "Keseimbangan Hidup-Kerja", nilai: 53, kategori: "Sedang" },
      { kode: "pengembangan_diri", label: "Pengembangan Karier", nilai: 65, kategori: "Sedang" },
      { kode: "kepuasan_kerja", label: "Kepuasan Kerja", nilai: 66, kategori: "Sedang" },
    ],
  },
  perbandingan_antarunit: {
    narasi:
      "Kesejahteraan paling tinggi dirasakan unit Teknologi, menurun bertahap ke Penjualan & Pemasaran. Budaya Klan mendominasi persepsi di Teknologi dan Keuangan & Umum, sementara Penjualan & Pemasaran condong ke budaya Pasar yang berorientasi pencapaian.",
    rows: [
      { unit: "Teknologi", jumlah_responden: 38, budaya_dominan: "Klan", indeks_kesejahteraan: 74, kategori_kesejahteraan: "Tinggi" },
      { unit: "Keuangan & Umum", jumlah_responden: 26, budaya_dominan: "Klan", indeks_kesejahteraan: 66, kategori_kesejahteraan: "Sedang" },
      { unit: "Operasional", jumlah_responden: 45, budaya_dominan: "Hierarki", indeks_kesejahteraan: 58, kategori_kesejahteraan: "Sedang" },
      { unit: "Penjualan & Pemasaran", jumlah_responden: 33, budaya_dominan: "Pasar", indeks_kesejahteraan: 46, kategori_kesejahteraan: "Rendah" },
    ],
  },
  prioritas_perbaikan: [
    {
      peringkat: 1,
      action: "Tinjau ulang beban kerja dan target tim Penjualan & Pemasaran.",
      trigger_desc: "Indeks kesejahteraan unit ini paling rendah (46, kategori Rendah), ditekan subdimensi Beban Kerja.",
      area: "Beban Kerja · Penjualan & Pemasaran",
    },
    {
      peringkat: 2,
      action: "Buka ruang eksperimen dan uji coba ide baru secara terjadwal, bukan insidental.",
      trigger_desc: "Gap Adhokrasi paling besar dari semua tipe budaya (+14 poin antara saat ini dan harapan).",
      area: "Adhokrasi · Seluruh unit",
    },
    {
      peringkat: 3,
      action: "Sederhanakan alur persetujuan yang berlapis di unit Operasional.",
      trigger_desc: "Operasional satu-satunya unit dengan budaya dominan Hierarki, sementara harapan perusahaan bergerak turun 8 poin di tipe ini.",
      area: "Hierarki · Operasional",
    },
  ],
  footer: {
    disclaimer:
      "Laporan ini adalah hasil pengolahan jawaban asesmen seluruh karyawan yang mengisi pada periode berjalan dan bersifat rahasia. Gunakan sebagai bahan pengambilan keputusan organisasi, bukan alat evaluasi individu karyawan tertentu.",
  },
};
