// Generator data CONTOH modul Wellbeing Assessment untuk pratinjau (?preview=wa) dan uji UI.
// Semua orang, unit, jawaban, dan narasi di sini BUATAN. Generator menyusun workbook tiruan
// berbentuk persis berkas olahan (tujuh sheet, nama kolom sama), lalu melewatkannya ke pembaca
// yang sama dengan berkas asli, jadi bentuk datanya dijamin identik.
//
// Agregat kelompok di sini dihitung oleh generator karena workbook tiruan tidak punya proses
// olah di hulu. Ini bukan jalur baca FIR; FIR tetap membaca angka final dari berkas.
//
// Pemakaian (dari folder web/): npm run wa:contoh

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bacaDatasetWa } from "../../src/pages/wa/lib/waPembaca.js";

// ── Acak dengan benih tetap supaya hasilnya stabil antar-jalan ─────────────────────────────
let benih = 20261019;
function acak() {
  benih = (benih * 1664525 + 1013904223) % 4294967296;
  return benih / 4294967296;
}
const pilih = (arr) => arr[Math.floor(acak() * arr.length)];
const antara = (a, b) => a + acak() * (b - a);
const bulat1 = (v) => Math.round(v * 10) / 10;
const bulat2 = (v) => Math.round(v * 100) / 100;
const rata = (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

// ── Kamus instrumen (teks butir kuesioner, bukan data pribadi) ──────────────────────────────
const ITEM = [
  ["P1", "p", "Senang dengan perjalanan hidup sendiri"], ["P2", "p", "Percaya diri dan berpikir positif tentang diri"],
  ["P3", "p", "Nyaman menjadi diri sendiri saat membandingkan dengan orang lain"], ["P4", "p", "Menyukai sebagian besar kepribadian sendiri"],
  ["P5", "p", "Merasa hidup sendiri tidak kalah bermanfaat dari orang lain"], ["P6", "p", "Puas dengan pencapaian hidup sendiri"],
  ["P7", "p", "Bersikap positif terhadap diri sendiri"],
  ["R1", "r", "Dikenal sebagai pribadi yang suka memberi dan berbagi waktu"], ["R2", "r", "Dilihat orang sebagai pribadi yang penyayang"],
  ["R3", "r", "Saling percaya dengan teman-teman"], ["R4", "r", "Menikmati percakapan pribadi dengan keluarga dan teman"],
  ["R5", "r", "Mudah mempertahankan hubungan dekat"], ["R6", "r", "Punya teman dekat untuk berbagi kekhawatiran"],
  ["R7", "r", "Punya hubungan yang hangat dan saling percaya"],
  ["O1", "o", "Meyakini hidup sebagai proses belajar dan bertumbuh"], ["O2", "o", "Menghargai pengalaman baru yang menantang cara berpikir"],
  ["O3", "o", "Merasa berkembang sebagai pribadi dari waktu ke waktu"], ["O4", "o", "Tertarik pada kegiatan yang memperluas wawasan"],
  ["O5", "o", "Merasakan kemajuan diri selama bertahun-tahun"], ["O6", "o", "Masih berupaya melakukan perbaikan dalam hidup"],
  ["O7", "o", "Menikmati situasi baru yang mengubah cara lama"],
  ["T1", "t", "Senang membuat rencana masa depan dan mewujudkannya"], ["T2", "t", "Punya arah dan tujuan hidup"],
  ["T3", "t", "Merasa hidup punya tujuan, tidak sekadar mengembara"], ["T4", "t", "Memikirkan masa depan, tidak hanya hari ini"],
  ["T5", "t", "Paham apa yang ingin dicapai dalam hidup"], ["T6", "t", "Merasa aktivitas sehari-hari bermakna"],
  ["T7", "t", "Tidak merasa terburu-buru menuntaskan segalanya dalam hidup"],
  ["E1", "e", "Merasa bertanggung jawab atas situasi tempat tinggal"], ["E2", "e", "Mampu membangun lingkungan dan gaya hidup yang sesuai"],
  ["E3", "e", "Baik dalam mengatur banyak tanggung jawab harian"], ["E4", "e", "Tuntutan harian tidak membuat putus asa"],
  ["E5", "e", "Merasa cocok dengan orang dan komunitas sekitar"], ["E6", "e", "Tidak merasa terbebani oleh tanggung jawab"],
  ["E7", "e", "Mampu mengatur hidup secara memuaskan"],
  ["K1", "k", "Berani menyuarakan pendapat meski berbeda dari kebanyakan"], ["K2", "k", "Keputusan tidak mudah terpengaruh orang lain"],
  ["K3", "k", "Menilai diri berdasarkan nilai yang dianggap penting sendiri"], ["K4", "k", "Yakin dengan pendapat sendiri meski berbeda dari umum"],
  ["K5", "k", "Tidak mudah terpengaruh orang berpendapat kuat"], ["K6", "k", "Mudah menyuarakan pendapat tentang hal kontroversial"],
  ["K7", "k", "Tidak terlalu khawatir dengan pikiran orang lain tentang diri"],
  ["S1", "peran_pekerjaan", "Puas dengan pekerjaan saat ini"], ["S2", "kepemimpinan_keputusan", "Puas dengan kepemimpinan pimpinan"],
  ["S3", "kepemimpinan_keputusan", "Puas dengan keputusan pimpinan"], ["S4", "peran_pekerjaan", "Puas dengan tugas yang diberikan"],
  ["S5", "relasi_budaya", "Puas dengan hubungan rekan kerja"], ["S6", "organisasi_komunikasi", "Puas dengan pencapaian lembaga"],
  ["S7", "pengembangan_karir", "Puas dengan pengembangan diri di tempat kerja"], ["S8", "pengembangan_karir", "Puas dengan peluang pengembangan karier"],
  ["S9", "keseimbangan_apresiasi", "Puas dengan keseimbangan kerja dan kehidupan"], ["S10", "keseimbangan_apresiasi", "Puas dengan sistem reward dan apresiasi"],
  ["S11", "organisasi_komunikasi", "Puas dengan transparansi komunikasi"], ["S12", "relasi_budaya", "Puas dengan budaya kolaborasi dan inovasi"],
];
const ASPEK = ["p", "r", "o", "t", "e", "k"];
const LABEL_ASPEK = { p: "Penerimaan Diri", r: "Relasi dengan Orang Lain", o: "Optimalisasi Potensi Diri", t: "Tujuan Hidup", e: "Eksplorasi Tempat Kerja", k: "Kemandirian Personal" };
const DIMENSI = ["peran_pekerjaan", "kepemimpinan_keputusan", "relasi_budaya", "organisasi_komunikasi", "pengembangan_karir", "keseimbangan_apresiasi"];
const LABEL_DIMENSI = { peran_pekerjaan: "Peran & Pekerjaan", kepemimpinan_keputusan: "Kepemimpinan & Keputusan", relasi_budaya: "Relasi & Budaya Kerja", organisasi_komunikasi: "Organisasi & Komunikasi", pengembangan_karir: "Pengembangan & Karir", keseimbangan_apresiasi: "Keseimbangan & Apresiasi" };
const ITEM_DIMENSI = { peran_pekerjaan: [0, 3], kepemimpinan_keputusan: [1, 2], relasi_budaya: [4, 11], organisasi_komunikasi: [5, 10], pengembangan_karir: [6, 7], keseimbangan_apresiasi: [8, 9] };

const PILIHAN = {
  disukai: ["Hubungan baik dengan rekan kerja", "Kesempatan belajar dan berkembang", "Lingkungan kerja yang nyaman", "Kepemimpinan yang baik", "Work-life balance yang baik", "Saya belum bisa menjawab"],
  tidak_disukai: ["Beban kerja yang terlalu berat", "Kurangnya komunikasi dari pimpinan", "Tidak ada penghargaan atau apresiasi", "Kurangnya peluang pengembangan diri", "Lingkungan kerja yang kurang suportif", "Tidak ada yang saya tidak sukai", "Saya belum bisa menjawab"],
  mudah: ["Berkomunikasi dengan rekan kerja", "Mengikuti aturan kerja", "Beradaptasi dengan perubahan", "Menyelesaikan tugas sesuai target", "Mengembangkan keterampilan baru"],
  sulit: ["Mengelola beban kerja yang berat", "Mencapai keseimbangan antara kerja dan kehidupan pribadi", "Menyampaikan pendapat kepada pimpinan", "Mendapatkan dukungan untuk pengembangan diri", "Menyesuaikan diri dengan budaya kerja", "Tidak ada hal yang sulit"],
  keputusan_disukai: ["Peningkatan kesempatan pengembangan diri", "Peningkatan kesejahteraan karyawan", "Perbaikan sistem kerja", "Peningkatan fasilitas dan sarana kerja", "Meningkatkan transparansi dalam organisasi"],
  keputusan_tidak_disukai: ["Ketidakkonsistenan dalam aturan kerja", "Kurangnya keterlibatan karyawan dalam pengambilan keputusan", "Pengurangan fasilitas atau tunjangan", "Perubahan sistem kerja yang tidak efektif", "Tidak ada keputusan yang tidak saya sukai", "Saya belum bisa menjawab"],
};

const UNIT = [
  { nama: "TK Contoh Baruga", jenjang: "TK" },
  { nama: "SD Contoh Kajaolalido", jenjang: "SD" },
  { nama: "SMP Contoh Baruga", jenjang: "SMP" },
  { nama: "SMA Contoh Bone", jenjang: "SMA" },
  { nama: "Asrama Contoh Bone", jenjang: "Asrama" },
  { nama: "Departemen Contoh", jenjang: "Kantor" },
];
const JABATAN = {
  TK: [["Guru", "Guru Kelas"], ["Pimpinan", "Kepala TK"], ["Pendukung Layanan", "Pengasuh Baby House"]],
  SD: [["Guru", "Guru Kelas"], ["Guru", "Guru Al-Qur'an"], ["Tenaga Kependidikan", "Tata Usaha"]],
  SMP: [["Guru", "Guru Matematika"], ["Pimpinan", "Wakil Kepala Sekolah"], ["Tenaga Kependidikan", "Laboran"]],
  SMA: [["Guru", "Guru Bahasa Inggris"], ["Guru", "Guru BK"], ["Tenaga Kependidikan", "Pustakawan"]],
  Asrama: [["Pembina Asrama", "Pembina Asrama"], ["Pendukung Layanan", "Staf Dapur"], ["Pimpinan", "Koordinator Pembina"]],
  Kantor: [["Staf Kantor", "Staf Keuangan"], ["Staf Kantor", "Staf ICT"], ["Pendukung Layanan", "Petugas Keamanan"]],
};
const PERAN_TESTIMONI = { Pimpinan: "Pimpinan Sekolah", Guru: "Guru", "Pembina Asrama": "Guru", "Tenaga Kependidikan": "Staf dan Karyawan", "Staf Kantor": "Staf dan Karyawan", "Pendukung Layanan": "Staf dan Karyawan" };
const NAMA_DEPAN = ["Rahmi", "Fajar", "Nurul", "Andi", "Sitti", "Ilham", "Dewi", "Rizal", "Hasna", "Arief", "Wulan", "Taufik", "Laila", "Bayu", "Mira", "Yusuf", "Citra", "Hendra", "Intan", "Rafli"];
const NAMA_BELAKANG = ["Pratiwi", "Saputra", "Aulia", "Mahendra", "Rahayu", "Kurniawan", "Lestari", "Hidayat", "Anggraini", "Syahputra"];

const TERBUKA = {
  tempat_kerja_lebih_baik: [
    ["Komunikasi terbuka", "Komunikasi yang lebih terbuka antara pimpinan dan tim, terutama soal perubahan jadwal mendadak."],
    ["Kekompakan tim", "Kebersamaan tim dijaga dengan kegiatan santai sebulan sekali di luar urusan pekerjaan."],
    ["Pembagian tugas", "Pembagian tugas tambahan yang lebih merata supaya tidak menumpuk di orang yang sama."],
    ["Fasilitas kerja", "Ruang kerja yang lebih tenang untuk menyiapkan materi dan memeriksa tugas."],
  ],
  kebijakan_diubah: [
    ["Beban administrasi", "Laporan yang isinya sama tidak perlu dibuat dua kali dalam format berbeda, cukup satu sistem."],
    ["Jam kerja", "Kegiatan akhir pekan dijadwalkan lebih awal supaya keluarga bisa ikut menyesuaikan."],
    ["Status dan karier", "Alur kenaikan jenjang dijelaskan terbuka sejak awal tahun ajaran."],
  ],
  pimpinan_efektif: [
    ["Mendengar aspirasi", "Pimpinan menyediakan waktu rutin untuk mendengar tanpa langsung menilai."],
    ["Arahan jelas", "Prioritas kerja disampaikan jelas di awal pekan dan tidak berubah di tengah jalan."],
    ["Hadir di lapangan", "Sesekali hadir langsung melihat kondisi kelas dan asrama supaya paham beban nyata."],
  ],
  pelatihan_dibutuhkan: [
    ["Pedagogik", "Pelatihan manajemen kelas dan media ajar interaktif untuk anak yang beragam."],
    ["IT dan digital", "Pelatihan memakai aplikasi kerja dan pemanfaatan AI untuk menyiapkan materi."],
    ["Kelola stres", "Pelatihan mengelola emosi dan menjaga keseimbangan kerja dengan keluarga."],
    ["Kepemimpinan", "Pelatihan memimpin rapat singkat dan memberi umpan balik yang membangun."],
  ],
};

// ── Orang ───────────────────────────────────────────────────────────────────────────────────
const N = 40;
const orang = [];
for (let i = 0; i < N; i++) {
  const unit = UNIT[i % UNIT.length];
  const [kelompokJabatan, jabatan] = pilih(JABATAN[unit.jenjang]);
  // Dasar skor: sebagian besar baik, beberapa di tengah, satu di bawah untuk menguji tampilan.
  const dasar = i === 7 ? 1.4 : i % 9 === 4 ? antara(2.6, 3.3) : antara(4.1, 5.6);
  const geser = { p: antara(-0.4, 0.3), r: antara(-0.2, 0.4), o: antara(0, 0.5), t: antara(-0.3, 0.3), e: antara(-0.3, 0.3), k: antara(-0.8, 0) };
  const skorItem = ITEM.slice(0, 42).map(([kode, a]) => ({ kode, aspek: a, skor: Math.max(1, Math.min(6, Math.round(dasar + geser[a] + antara(-0.9, 0.9)))) }));
  const kepuasanItem = Array.from({ length: 12 }, () => Math.max(1, Math.min(5, Math.round(dasar * 0.78 + antara(-0.8, 0.9)))));
  orang.push({
    id: `R${String(i + 1).padStart(3, "0")}`,
    nama: `${NAMA_DEPAN[i % NAMA_DEPAN.length]} ${NAMA_BELAKANG[(i * 3) % NAMA_BELAKANG.length]}`,
    jk: i % 3 === 0 ? "Laki-laki" : "Perempuan",
    usia: Math.round(antara(23, 56)),
    unit, kelompokJabatan, jabatan,
    skorItem, kepuasanItem,
    pilihan: Object.fromEntries(Object.entries(PILIHAN).map(([k, opsi]) => {
      const n = 1 + Math.floor(acak() * 3);
      return [k, [...new Set(Array.from({ length: n }, () => pilih(opsi)))]];
    })),
    cerita: i % 4 !== 3,
    perluAhli: i === 7 || i === 22,
  });
}

// ── Turunan per orang (meniru Tahap A prompt) ────────────────────────────────────────────────
const katAspek = (s) => (s <= 14 ? "Perlu Pendampingan" : s <= 28 ? "Perlu Perhatian" : "Baik");
const katTotal = (s) => (s <= 70 ? "Perlu Pendampingan" : s <= 140 ? "Perlu Perhatian" : "Baik");
const katItem = (s) => (s >= 5 ? "kuat" : s === 4 ? "cukup" : "perlu penguatan");
const katItemKel = (r) => (r >= 5 ? "kuat" : r >= 4 ? "cukup" : "perlu penguatan");
const kat5 = (r) => (r >= 4.2 ? "Sangat Puas" : r >= 3.4 ? "Puas" : r >= 2.6 ? "Netral" : r >= 1.8 ? "Tidak Puas" : "Sangat Tidak Puas");
const kat3 = (r) => (r >= 3.4 ? "Puas" : r >= 2.6 ? "Netral" : "Tidak Puas");
const setengah = (r) => Math.round(r * 2) / 2;

for (const o of orang) {
  o.aspek = Object.fromEntries(ASPEK.map((a) => {
    const skor = o.skorItem.filter((x) => x.aspek === a).reduce((s, x) => s + x.skor, 0);
    return [a, { skor, pct: bulat1((skor / 42) * 100), kategori: katAspek(skor) }];
  }));
  o.total = ASPEK.reduce((s, a) => s + o.aspek[a].skor, 0);
  o.urutAspek = [...ASPEK].sort((a, b) => o.aspek[b].skor - o.aspek[a].skor || ASPEK.indexOf(a) - ASPEK.indexOf(b));
  o.dim = Object.fromEntries(DIMENSI.map((d) => {
    const r = bulat2(rata(ITEM_DIMENSI[d].map((j) => o.kepuasanItem[j])));
    return [d, { rata: r, kategori: kat5(r) }];
  }));
  o.kepuasan = bulat2(rata(o.kepuasanItem));
  o.urutDim = [...DIMENSI].sort((a, b) => o.dim[b].rata - o.dim[a].rata || DIMENSI.indexOf(a) - DIMENSI.indexOf(b));
}

function laporanIndividu(o) {
  const kuat = LABEL_ASPEK[o.urutAspek[0]];
  const lemah = LABEL_ASPEK[o.urutAspek[5]];
  const dimKuat = LABEL_DIMENSI[o.urutDim[0]];
  const dimLemah = LABEL_DIMENSI[o.urutDim[5]];
  return {
    ringkasan: {
      wellbeing: `Contoh narasi. Kekuatan utama Anda ada di ${kuat}, aspek yang paling menonjol di antara enam aspek. ${lemah} relatif lebih rendah dan bisa jadi titik awal untuk dirawat.`,
      kepuasan: `Contoh narasi. Yang paling Anda nikmati di tempat kerja adalah ${dimKuat}. ${dimLemah} belum sepenuhnya sesuai harapan Anda.`,
    },
    wellbeing: {
      hal_kuat: "Anda memandang hidup sebagai proses belajar dan merasa keseharian Anda punya makna. Itu modal yang kuat.",
      hal_tantangan: "Ada kecenderungan menahan pendapat saat suasana kurang mendukung. Wajar, dan bisa dilatih pelan-pelan.",
    },
    kepuasan: {
      hal_kuat: `Anda merasa cukup puas pada ${dimKuat.toLowerCase()}.`,
      hal_tantangan: `${dimLemah} masih terasa kurang dan layak disampaikan lewat jalur yang ada.`,
    },
    // Penjelasan per aspek untuk keenam aspek (lihat prompt pengolah Excel, isian "aspek").
    aspek: Object.fromEntries(o.urutAspek.map((a, i) => [a, i < 3
      ? {
        arti: `Contoh narasi. ${LABEL_ASPEK[a]} termasuk aspek terkuat Anda; sebagian besar pernyataannya sudah terasa dalam keseharian.`,
        langkah: "Jadikan ini pegangan: saat pekan terasa berat, ingat satu hal di aspek ini yang selama ini membantu Anda bertahan.",
      }
      : {
        arti: `Contoh narasi. ${LABEL_ASPEK[a]} lebih rendah dibanding aspek lain; ada beberapa pernyataan yang belum terasa.`,
        langkah: "Pilih satu pernyataan dengan bar jingga, lalu coba satu tindakan kecil yang mendekatkan Anda ke sana pekan ini.",
      }])),
    refleksi: "Jika satu hal kecil di pekan ini bisa membuat Anda lebih ringan, kira-kira apa yang paling ingin Anda mulai?",
    langkah_kecil: [
      { judul: "Tulis tiga hal yang berjalan baik setiap Jumat sore", alasan: "Cocok untuk menguatkan penerimaan diri lewat kebiasaan kecil yang konsisten.", terkait: o.urutAspek[5], jangka: "Minggu ini" },
      { judul: "Sampaikan satu usulan kecil di rapat berikutnya", alasan: "Melatih kemandirian bersuara dalam situasi yang aman.", terkait: "k", jangka: "Bulan ini" },
      ...(acak() > 0.4 ? [{ judul: "Jadwalkan satu jam tanpa pekerjaan di akhir pekan", alasan: "Menjaga keseimbangan agar tenaga terisi kembali.", terkait: "keseimbangan_apresiasi", jangka: "3 bulan" }] : []),
    ],
    respons_cerita: o.cerita
      ? {
        ada: true,
        draf: o.perluAhli
          ? "Terima kasih sudah bercerita dengan jujur. Rasa berat yang Anda tulis wajar dirasakan, dan tidak perlu ditanggung sendiri. Jika terasa makin berat, sampaikan ke Human Capital bahwa Anda ingin dihubungkan dengan psikolog."
          : "Terima kasih sudah berbagi cerita. Lelah setelah pekan yang padat itu wajar, dan Anda sudah menemukan cara untuk tetap bertahan. Coba sisihkan satu waktu kecil setiap hari yang benar-benar untuk diri sendiri.",
        perlu_perhatian_ahli: o.perluAhli,
        alasan_perhatian: o.perluAhli ? "contoh: cerita berat, perlu rujukan ahli" : "",
      }
      : { ada: false, draf: "Anda memilih tidak menuliskan cerita, dan itu boleh. Jika suatu saat ada yang mengganjal, orang yang paling Anda percaya bisa jadi tempat bercerita.", perlu_perhatian_ahli: false, alasan_perhatian: "" },
  };
}

const KOLOM_NAMA = "TUlis Nama Lengkap Anda Disini";
// Kolom BB berkas olahan: cerita pegawai. Pembaca hanya menyalinnya ke baris respons_cerita.
const KOLOM_CERITA = "Adakah yang ingin anda ceritakan dan tanyakan tentang kelelahan atau stress anda saat ini?";
const ceritaContoh = (o) => (!o.cerita ? "Tidak ada"
  : o.perluAhli
    ? "Contoh cerita. Beberapa pekan ini tidur saya sering terputus dan pekerjaan terasa makin berat. Saya bingung harus cerita ke siapa."
    : "Contoh cerita. Pekan ini padat karena persiapan ujian, jadi pulang selalu lelah. Untungnya akhir pekan masih bisa santai bersama keluarga.");
const kolomIndividu = [
  KOLOM_NAMA, "id_responden", "dipakai", "isian_ganda", "jenis_kelamin_bersih", "usia", "unit_asli", "unit_normal", "jenjang",
  "kelompok_jabatan", "jabatan_bersih", "peran_testimoni", "protek_total", "protek_pct", "protek_kategori",
  ...ASPEK.flatMap((a) => [`${a}_skor`, `${a}_pct`, `${a}_kategori`]),
  "aspek_tertinggi", "aspek_terendah", "n_item_kuat", "n_item_cukup", "n_item_perlu", "item_json",
  "kepuasan_rata", "kepuasan_kategori5", "kepuasan_kategori3", "kepuasan_bintang",
  ...DIMENSI.flatMap((d) => [`kep_${d}`, `kep_${d}_kategori`]),
  "kep_dimensi_tertinggi", "kep_dimensi_terendah",
  ...Object.keys(PILIHAN).map((k) => `pilihan_${k}_json`),
  KOLOM_CERITA, "cerita_ada", "cerita_perlu_ahli", "laporan_json",
];
const barisIndividu = orang.map((o) => {
  const itemJson = o.skorItem.map((x) => ({ kode: x.kode, aspek: x.aspek, skor: x.skor, pct: bulat1((x.skor / 6) * 100), kategori: katItem(x.skor) }));
  const nItem = (k) => itemJson.filter((x) => x.kategori === k).length;
  const nilai = {
    [KOLOM_NAMA]: o.nama, id_responden: o.id, dipakai: "Ya", isian_ganda: "Tidak", jenis_kelamin_bersih: o.jk, usia: o.usia,
    unit_asli: o.unit.nama, unit_normal: o.unit.nama, jenjang: o.unit.jenjang, kelompok_jabatan: o.kelompokJabatan,
    jabatan_bersih: o.jabatan, peran_testimoni: PERAN_TESTIMONI[o.kelompokJabatan] || "Lainnya",
    protek_total: o.total, protek_pct: bulat1((o.total / 252) * 100), protek_kategori: katTotal(o.total),
    ...Object.fromEntries(ASPEK.flatMap((a) => [[`${a}_skor`, o.aspek[a].skor], [`${a}_pct`, o.aspek[a].pct], [`${a}_kategori`, o.aspek[a].kategori]])),
    aspek_tertinggi: o.urutAspek[0], aspek_terendah: o.urutAspek[5],
    n_item_kuat: nItem("kuat"), n_item_cukup: nItem("cukup"), n_item_perlu: nItem("perlu penguatan"), item_json: JSON.stringify(itemJson),
    kepuasan_rata: o.kepuasan, kepuasan_kategori5: kat5(o.kepuasan), kepuasan_kategori3: kat3(o.kepuasan), kepuasan_bintang: setengah(o.kepuasan),
    ...Object.fromEntries(DIMENSI.flatMap((d) => [[`kep_${d}`, o.dim[d].rata], [`kep_${d}_kategori`, o.dim[d].kategori]])),
    kep_dimensi_tertinggi: o.urutDim[0], kep_dimensi_terendah: o.urutDim[5],
    ...Object.fromEntries(Object.keys(PILIHAN).map((k) => [`pilihan_${k}_json`, JSON.stringify(o.pilihan[k])])),
    [KOLOM_CERITA]: ceritaContoh(o), cerita_ada: o.cerita ? "Ya" : "Tidak", cerita_perlu_ahli: o.perluAhli ? "Ya" : "", laporan_json: JSON.stringify(laporanIndividu(o)),
  };
  return kolomIndividu.map((k) => nilai[k] ?? null);
});

// ── Testimoni ───────────────────────────────────────────────────────────────────────────────
const barisTestimoni = [];
for (const o of orang) {
  for (const [kode, pool] of Object.entries(TERBUKA)) {
    if (acak() < 0.2) continue;
    const [tema, jawaban] = pilih(pool);
    barisTestimoni.push([o.id, o.nama, o.unit.nama, o.unit.jenjang, PERAN_TESTIMONI[o.kelompokJabatan] || "Lainnya", kode, jawaban, jawaban.split(/\s+/).length, "Ya", "", tema]);
  }
}

// ── Kelompok ────────────────────────────────────────────────────────────────────────────────
function pearson(xs, ys) {
  const mx = rata(xs); const my = rata(ys);
  let a = 0; let bx = 0; let by = 0;
  xs.forEach((x, i) => { a += (x - mx) * (ys[i] - my); bx += (x - mx) ** 2; by += (ys[i] - my) ** 2; });
  return bx && by ? bulat2(a / Math.sqrt(bx * by)) : null;
}

const cakupan = [
  { cakupan: "lembaga", nama: "Lembaga Contoh", anggota: orang },
  ...[...new Set(orang.map((o) => o.unit.jenjang))].map((j) => ({ cakupan: "jenjang", nama: j, anggota: orang.filter((o) => o.unit.jenjang === j) })),
  ...UNIT.map((u) => ({ cakupan: "unit", nama: u.nama, anggota: orang.filter((o) => o.unit.nama === u.nama) })),
  ...[...new Set(orang.map((o) => o.kelompokJabatan))].map((k) => ({ cakupan: "kelompok_jabatan", nama: k, anggota: orang.filter((o) => o.kelompokJabatan === k) })),
];

function laporanKelompok(c, urutAspek, urutDim, frek) {
  const lembaga = c.cakupan === "lembaga";
  const atas = (kode) => frek[kode]?.find(([p]) => !/belum bisa menjawab|^tidak ada/i.test(p))?.[0] || "-";
  return {
    ringkasan: {
      wellbeing: `Contoh narasi. ${LABEL_ASPEK[urutAspek[0]]} menjadi kekuatan ${lembaga ? "lembaga" : "kelompok ini"}, sedangkan ${LABEL_ASPEK[urutAspek[5]]} relatif paling rendah dan layak diberi perhatian bersama.`,
      kepuasan: `Contoh narasi. ${LABEL_DIMENSI[urutDim[0]]} paling memuaskan, sementara ${LABEL_DIMENSI[urutDim[5]]} belum sesuai harapan sebagian pegawai.`,
    },
    wellbeing: {
      hal_baik: "Pegawai memandang hidup sebagai proses belajar dan merasa bertanggung jawab atas keseharian mereka.",
      hal_ditingkatkan: `${LABEL_ASPEK[urutAspek[5]]} perlu dikuatkan, terutama keberanian menyuarakan pendapat saat berbeda dari kebanyakan.`,
      resume_kuat: `Pada pegawai yang Baik, ${LABEL_ASPEK[urutAspek[0]]} paling sering menjadi aspek tertinggi.`,
      resume_lemah: `Pada pegawai yang Perlu Perhatian, ${LABEL_ASPEK[urutAspek[5]]} paling sering menjadi aspek terendah.`,
    },
    kepuasan: {
      hal_baik: `Hubungan dengan rekan kerja paling memuaskan, sejalan dengan ${LABEL_DIMENSI[urutDim[0]]} yang tinggi.`,
      hal_ditingkatkan: `${LABEL_DIMENSI[urutDim[5]]} menjadi dimensi dengan ketidakpuasan terbanyak.`,
    },
    survey: {
      fokus_kekuatan: `Pegawai paling menyukai ${atas("disukai").toLowerCase()} dan merasa ${atas("mudah").toLowerCase()} hal yang paling mudah.`,
      perbaikan_segera: `${atas("tidak_disukai")} dan ${atas("sulit").toLowerCase()} perlu ditangani lebih dulu.`,
      narasi: Object.fromEntries(Object.keys(PILIHAN).map((k) => [k, `Contoh narasi. ${atas(k)} paling sering dipilih untuk pertanyaan ini.`])),
    },
    testimoni: {
      tema: Object.fromEntries(Object.entries(TERBUKA).map(([kode, pool]) => [kode, pool.map(([tema, isi]) => ({
        tema,
        jumlah: barisTestimoni.filter((t) => t[5] === kode && t[10] === tema && c.anggota.some((o) => o.id === t[0])).length,
        ringkasan: `Contoh ringkasan. ${isi}`,
      })).filter((t) => t.jumlah > 0).sort((a, b) => b.jumlah - a.jumlah)])),
    },
    tema_cerita: lembaga ? [
      { tema: "Merasa baik dan terkendali", jumlah: 11 },
      { tema: "Beban kerja dan tugas tambahan", jumlah: 9 },
      { tema: "Keseimbangan kerja dan keluarga", jumlah: 7 },
      { tema: "Kondisi fisik dan kesehatan", jumlah: 5 },
    ] : [],
    insight: [
      { judul: "Contoh temuan: kemandirian merata rendah", isi: "Kemandirian Personal menjadi aspek terendah di hampir semua kelompok. Polanya lintas unit, jadi penanganannya juga perlu lintas unit.", bukti: "contoh bukti angka dari berkas olahan" },
      ...(lembaga ? [
        { judul: "Contoh temuan: asrama paling terbebani", isi: "Kelompok asrama punya rata-rata wellbeing dan kepuasan terendah. Pelatihan yang mereka minta terpusat pada pengasuhan dan kelola stres.", bukti: "contoh bukti angka" },
        { judul: "Contoh temuan: wellbeing dan kepuasan bergerak bersama", isi: "Pegawai yang lebih puas cenderung lebih baik kondisinya. Perbaikan kondisi kerja berpeluang ikut mengangkat kesejahteraan pribadi.", bukti: "contoh korelasi" },
      ] : []),
    ],
    tindak_lanjut: [
      {
        prioritas: "tinggi", untuk: "Direksi", judul: "Pangkas laporan ganda sebelum semester baru",
        mengapa: "Contoh alasan. Beban administrasi muncul di pilihan ganda dan jawaban terbuka sekaligus. Keputusannya lintas unit.",
        terkait: "sulit; kebijakan_diubah; e",
        langkah: ["Inventarisasi laporan wajib satu semester", "Putuskan laporan yang digabung atau dihapus", "Umumkan daftar baru ke semua unit"],
        indikator: ["Jumlah laporan wajib turun sepertiga", "Keluhan beban kerja turun pada survei berikutnya"],
      },
      {
        prioritas: "sedang", untuk: "Pimpinan unit", judul: "Buka sesi dengar pendapat bulanan",
        mengapa: "Contoh alasan. Kemandirian bersuara rendah merata; ruang aman untuk berpendapat membantu melatihnya.",
        terkait: "k; pimpinan_efektif",
        langkah: ["Jadwalkan tiga puluh menit setiap awal bulan", "Mulai dari satu pertanyaan terbuka", "Tindak lanjuti satu usulan yang masuk"],
        indikator: ["Jumlah usulan yang masuk per sesi", "Usulan yang ditindaklanjuti dalam sebulan"],
      },
    ],
  };
}

const kolomKelompok = [
  "cakupan", "nama", "n_responden", "n_perempuan", "n_laki", "usia_rata", "usia_min", "usia_max", "protek_rata", "protek_pct",
  "n_baik", "n_perlu_perhatian", "n_pendampingan", "pct_baik", "pct_perlu_perhatian", "pct_pendampingan",
  ...ASPEK.flatMap((a) => [`${a}_rata`, `${a}_pct`, `${a}_n_baik`, `${a}_n_perlu_perhatian`, `${a}_n_pendampingan`]),
  "aspek_tertinggi", "aspek_terendah", "item_json", "n_item_kuat", "n_item_cukup", "n_item_perlu",
  "kepuasan_rata", "kepuasan_kategori5", "kepuasan_bintang", "n_puas", "n_netral", "n_tidak_puas", "pct_puas", "pct_netral", "pct_tidak_puas",
  ...DIMENSI.flatMap((d) => [`kep_${d}_rata`, `kep_${d}_kategori5`, `kep_${d}_n_sangat_puas`, `kep_${d}_n_puas`, `kep_${d}_n_netral`, `kep_${d}_n_tidak_puas`, `kep_${d}_n_sangat_tidak_puas`]),
  "kep_dimensi_tertinggi", "kep_dimensi_terendah", "korelasi_protek_kepuasan", "n_cerita", "laporan_json",
];
const barisPilihan = [];
const barisKelompok = cakupan.map((c) => {
  const a = c.anggota;
  const n = a.length;
  const hitung = (f) => a.filter(f).length;
  const pct = (x) => bulat1((x / n) * 100);
  const aspekRata = Object.fromEntries(ASPEK.map((k) => [k, bulat1(rata(a.map((o) => o.aspek[k].skor)))]));
  const urutAspek = [...ASPEK].sort((x, y) => aspekRata[y] - aspekRata[x]);
  const dimRata = Object.fromEntries(DIMENSI.map((d) => [d, bulat2(rata(a.map((o) => o.dim[d].rata)))]));
  const urutDim = [...DIMENSI].sort((x, y) => dimRata[y] - dimRata[x]);
  const itemJson = ITEM.slice(0, 42).map(([kode, asp], j) => {
    const r = bulat2(rata(a.map((o) => o.skorItem[j].skor)));
    return { kode, aspek: asp, rata: r, pct: bulat1((r / 6) * 100), kategori: katItemKel(r) };
  });
  const kep = bulat2(rata(a.map((o) => o.kepuasan)));
  const protekRata = bulat1(rata(a.map((o) => o.total)));
  const frek = Object.fromEntries(Object.keys(PILIHAN).map((k) => {
    const f = {};
    a.forEach((o) => o.pilihan[k].forEach((p) => { f[p] = (f[p] || 0) + 1; }));
    return [k, Object.entries(f).sort((x, y) => y[1] - x[1])];
  }));
  for (const [k, daftar] of Object.entries(frek)) for (const [p, j] of daftar) barisPilihan.push([c.cakupan, c.nama, k, p, j, pct(j)]);
  const nilai = {
    cakupan: c.cakupan, nama: c.nama, n_responden: n, n_perempuan: hitung((o) => o.jk === "Perempuan"), n_laki: hitung((o) => o.jk === "Laki-laki"),
    usia_rata: bulat1(rata(a.map((o) => o.usia))), usia_min: Math.min(...a.map((o) => o.usia)), usia_max: Math.max(...a.map((o) => o.usia)),
    protek_rata: protekRata, protek_pct: bulat1((protekRata / 252) * 100),
    n_baik: hitung((o) => katTotal(o.total) === "Baik"), n_perlu_perhatian: hitung((o) => katTotal(o.total) === "Perlu Perhatian"), n_pendampingan: hitung((o) => katTotal(o.total) === "Perlu Pendampingan"),
    pct_baik: pct(hitung((o) => katTotal(o.total) === "Baik")), pct_perlu_perhatian: pct(hitung((o) => katTotal(o.total) === "Perlu Perhatian")), pct_pendampingan: pct(hitung((o) => katTotal(o.total) === "Perlu Pendampingan")),
    ...Object.fromEntries(ASPEK.flatMap((k) => [
      [`${k}_rata`, aspekRata[k]], [`${k}_pct`, bulat1((aspekRata[k] / 42) * 100)],
      [`${k}_n_baik`, hitung((o) => o.aspek[k].kategori === "Baik")], [`${k}_n_perlu_perhatian`, hitung((o) => o.aspek[k].kategori === "Perlu Perhatian")], [`${k}_n_pendampingan`, hitung((o) => o.aspek[k].kategori === "Perlu Pendampingan")],
    ])),
    aspek_tertinggi: urutAspek[0], aspek_terendah: urutAspek[5], item_json: JSON.stringify(itemJson),
    n_item_kuat: itemJson.filter((x) => x.kategori === "kuat").length, n_item_cukup: itemJson.filter((x) => x.kategori === "cukup").length, n_item_perlu: itemJson.filter((x) => x.kategori === "perlu penguatan").length,
    kepuasan_rata: kep, kepuasan_kategori5: kat5(kep), kepuasan_bintang: setengah(kep),
    n_puas: hitung((o) => kat3(o.kepuasan) === "Puas"), n_netral: hitung((o) => kat3(o.kepuasan) === "Netral"), n_tidak_puas: hitung((o) => kat3(o.kepuasan) === "Tidak Puas"),
    pct_puas: pct(hitung((o) => kat3(o.kepuasan) === "Puas")), pct_netral: pct(hitung((o) => kat3(o.kepuasan) === "Netral")), pct_tidak_puas: pct(hitung((o) => kat3(o.kepuasan) === "Tidak Puas")),
    ...Object.fromEntries(DIMENSI.flatMap((d) => [
      [`kep_${d}_rata`, dimRata[d]], [`kep_${d}_kategori5`, kat5(dimRata[d])],
      [`kep_${d}_n_sangat_puas`, hitung((o) => o.dim[d].kategori === "Sangat Puas")], [`kep_${d}_n_puas`, hitung((o) => o.dim[d].kategori === "Puas")],
      [`kep_${d}_n_netral`, hitung((o) => o.dim[d].kategori === "Netral")], [`kep_${d}_n_tidak_puas`, hitung((o) => o.dim[d].kategori === "Tidak Puas")],
      [`kep_${d}_n_sangat_tidak_puas`, hitung((o) => o.dim[d].kategori === "Sangat Tidak Puas")],
    ])),
    kep_dimensi_tertinggi: urutDim[0], kep_dimensi_terendah: urutDim[5],
    korelasi_protek_kepuasan: n >= 10 ? pearson(a.map((o) => o.total), a.map((o) => o.kepuasan)) : null,
    n_cerita: hitung((o) => o.cerita),
    laporan_json: n >= 5 ? JSON.stringify(laporanKelompok(c, urutAspek, urutDim, frek)) : "",
  };
  return kolomKelompok.map((k) => nilai[k] ?? null);
});

const parameter = [
  ["tanggal_pengolahan", "2026-10-19", "data contoh"], ["n_baris_asli", N, ""], ["n_baris_dipakai", N, ""],
  ["kategori_aspek", "1-14 Perlu Pendampingan; 15-28 Perlu Perhatian; 29-42 Baik", ""], ["kategori_total", "1-70 Perlu Pendampingan; 71-140 Perlu Perhatian; 141-252 Baik", ""],
  ["kategori_kepuasan_5", ">= 4,20 Sangat Puas; 3,40-4,19 Puas; 2,60-3,39 Netral; 1,80-2,59 Tidak Puas; < 1,80 Sangat Tidak Puas", ""],
  ["kategori_kepuasan_3", ">= 3,40 Puas; 2,60-3,39 Netral; < 2,60 Tidak Puas", ""],
];

const sheets = {
  INDIVIDU: [kolomIndividu, ...barisIndividu],
  KELOMPOK: [kolomKelompok, ...barisKelompok],
  PILIHAN: [["cakupan", "nama", "pertanyaan_kode", "pilihan", "jumlah", "pct_responden"], ...barisPilihan],
  TESTIMONI: [["id_responden", "nama", "unit_normal", "jenjang", "peran_testimoni", "pertanyaan_kode", "jawaban", "panjang_kata", "layak_tampil", "alasan_tidak_tampil", "tema"], ...barisTestimoni],
  ITEM: [["kode", "instrumen", "aspek_atau_dimensi", "label_aspek", "teks_asli", "teks_singkat", "arah_asli"],
    ...ITEM.map(([kode, k, t]) => [kode, kode.startsWith("S") ? "kepuasan" : "protek", k, LABEL_ASPEK[k] || LABEL_DIMENSI[k], t, t, "positif"])],
  PARAMETER: [["nama", "nilai", "keterangan"], ...parameter],
  CATATAN_QC: [["jenis", "id_responden", "keterangan"]],
};

const dataset = bacaDatasetWa(sheets, {
  lembaga: "Lembaga Contoh", sekolahId: "CONTOH", periodeId: "2026-10", sumber: "buat-data-contoh.mjs", dibuat: "2026-10-19T00:00:00.000Z", contoh: true,
});

// Rekap umpan balik tiruan untuk tab "Dampak Asesmen" di pratinjau. Bentuknya sama dengan keluaran
// fungsi Postgres wa_umpan_balik_ringkasan (migration 20261021100000); di produksi rekap selalu
// dihitung di database, bukan di sini.
const OPSI_UB = {
  sesuai: ["Sangat sesuai", "Cukup sesuai", "Kurang sesuai", "Tidak sesuai"],
  rencana: ["Mencoba satu langkah kecil dari laporan", "Lebih menjaga waktu istirahat", "Bercerita ke orang yang dipercaya", "Menyampaikan kebutuhan ke Human Capital", "Membicarakan beban kerja dengan atasan", "Lainnya", "Belum tahu"],
  diperhatikan: ["Ya", "Sedikit", "Belum"],
};
const ESAI_UB = {
  alasan_puas: [
    "Contoh esai. Penjelasannya sesuai dengan yang saya rasakan beberapa bulan ini.",
    "Contoh esai. Bagian langkah kecil paling membantu karena jelas harus mulai dari mana.",
    "Contoh esai. Bahasanya mudah dipahami, tapi saya ingin penjelasan yang lebih panjang untuk aspek terendah.",
    "Contoh esai. Saya baru sadar selama ini jarang meluangkan waktu untuk diri sendiri.",
  ],
  perubahan: [
    "Contoh esai. Saya mulai pulang tepat waktu dua kali sepekan.",
    "Contoh esai. Saya jadi lebih berani menyampaikan pendapat di rapat.",
    "Contoh esai. Saya ingin lebih sering mengobrol dengan rekan satu unit.",
  ],
};
function umpanBalikContoh() {
  const isi = dataset.individu.filter(() => acak() < 0.7);
  const jam = (i) => new Date(Date.UTC(2026, 9, 19, 2, 0) + i * 17 * 60_000).toISOString();
  const nilai = {};
  for (const kode of ["puas_keseluruhan", "kualitas_laporan", "paham_diri", "rekomendasi"]) {
    const v = isi.map(() => Math.min(10, Math.max(3, Math.round(6 + acak() * 5))));
    nilai[kode] = { rata: bulat2(rata(v)), n: v.length, sebaran: Array.from({ length: 10 }, (_, i) => v.filter((x) => x === i + 1).length) };
  }
  const pilihan = {};
  for (const [kode, opsi] of Object.entries(OPSI_UB)) {
    const hitung = Object.fromEntries(opsi.map((o) => [o, 0]));
    for (let i = 0; i < isi.length; i++) {
      if (kode === "rencana") opsi.forEach((o, j) => { if (acak() < [0.7, 0.45, 0.35, 0.15, 0.2, 0.08, 0.06][j]) hitung[o] += 1; });
      else hitung[opsi[Math.min(opsi.length - 1, Math.floor(acak() * acak() * opsi.length))]] += 1;
    }
    pilihan[kode] = { n: isi.length, opsi: hitung };
  }
  const esai = Object.fromEntries(Object.entries(ESAI_UB).map(([kode, daftar]) => [kode, daftar.map((teks, i) => ({ teks, pada: jam(isi.length - i) }))]));
  const lainnya = { rencana: ["Contoh lainnya. Ikut kajian pekanan bersama rekan", "Contoh lainnya. Olahraga pagi dua kali sepekan"].map((teks, i) => ({ teks, pada: jam(isi.length - i) })) };
  return { n: isi.length, peserta: dataset.individu.length, terakhir: jam(isi.length), ambang: 3, terbuka: true, nilai, pilihan, esai, lainnya };
}
dataset.umpanBalikContoh = umpanBalikContoh();

const tujuan = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/pages/wa/data/wa.contoh.json");
fs.mkdirSync(path.dirname(tujuan), { recursive: true });
fs.writeFileSync(tujuan, `${JSON.stringify(dataset)}\n`);
const l = dataset.kelompok.find((k) => k.cakupan === "lembaga");
console.log(`Data contoh: ${dataset.individu.length} orang, ${dataset.kelompok.length} kelompok, ${dataset.narasi.length} narasi.`);
console.log(`Kategori PROTEK: ${Object.entries(l.protek.n).map(([k, v]) => `${k} ${v}`).join(", ")}`);
console.log(`Ditulis ke ${path.relative(process.cwd(), tujuan)}`);
