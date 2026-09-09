/**
 * Teks rujukan STATIS modul Corporate Culture & Wellbeing: empat tipe budaya organisasi, enam
 * dimensi profil organisasi, dan lima subdimensi kesejahteraan. Ini definisi kerangka yang sudah
 * baku di literatur plus bahasa generik untuk pembaca awam (pimpinan dan karyawan, bukan HR atau
 * psikolog), BUKAN temuan dari data asesmen. Dipakai cuma untuk menjelaskan arti angka.
 *
 * KUNCI OBJEK DI BERKAS INI WAJIB SAMA PERSIS DENGAN DATA, bukan istilah yang enak dibaca.
 * Data olahan yang diunggah lewat Admin Fammi (sheet Personal/Lembaga, lihat scImporter.js)
 * memakai nama tipe budaya Kekeluargaan/Inovasi/Orientasi/Aturan, kode dimensi karakter_lembaga
 * sampai performance, dan kode kesejahteraan kepuasan_kepemimpinan sampai work_life_balance.
 * Sebelumnya berkas ini memakai istilah akademik OCAI (Klan/Adhokrasi/Pasar/Hierarki) dan kode
 * kesejahteraan karangan dari data contoh lama; itu tidak pernah cocok dengan satu baris pun
 * data nyata, jadi diganti (2026-09-09, setelah file PT Glamindo dicek).
 *
 * Yang boleh korporat adalah LABEL TAMPILAN, bukan kunci. Satu-satunya label yang benar-benar
 * berbeda dari data adalah "Karakter Lembaga" yang ditampilkan sebagai "Karakter Perusahaan".
 */

/**
 * Empat tipe budaya, kerangka nilai bersaing (padanan OCAI Klan/Adhokrasi/Pasar/Hierarki).
 * Kunci = nilai `tipe` di data, jangan diterjemahkan.
 */
export const TIPE_BUDAYA_INFO = {
  Kekeluargaan: {
    icon: "🤝",
    ringkas: "Kolaboratif & kekeluargaan",
    deskripsi:
      "Perusahaan terasa seperti keluarga besar. Yang ditekankan kerja sama, pembinaan orang, dan rasa saling percaya. Atasan berperan sebagai mentor.",
    implikasiNaik:
      "Karyawan ingin suasana kerja yang LEBIH dekat dan personal dari kondisi sekarang. Pertimbangkan ruang ngobrol informal, mentoring lintas tim, atau kegiatan kebersamaan rutin.",
    implikasiTurun:
      "Karyawan sudah cukup nyaman dengan kedekatan yang ada, bahkan menurutnya bisa sedikit dikurangi. Jaga sisi ini, tidak perlu ditambah lebih jauh.",
    facets: [
      "Suasana kerja terasa hangat dan saling membantu",
      "Atasan berperan sebagai mentor, bukan cuma pemberi perintah",
      "Kedekatan personal antar rekan jadi perekat utama",
      "Loyalitas dan kebersamaan dihargai lebih dari kompetisi",
    ],
  },
  Inovasi: {
    icon: "💡",
    ringkas: "Inovatif & berani mencoba",
    deskripsi:
      "Perusahaan mendorong eksperimen dan ide baru. Yang dihargai kreativitas, kelincahan, dan keberanian mengambil risiko terukur.",
    implikasiNaik:
      "Karyawan merasa ruang untuk mencoba pendekatan baru masih terbatas. Pertimbangkan waktu khusus untuk eksperimen, jalur pengajuan ide yang sederhana, dan apresiasi untuk ide yang dicoba, bukan cuma yang berhasil.",
    implikasiTurun:
      "Ruang eksperimen sudah dirasa cukup, bahkan mungkin terlalu banyak perubahan mendadak. Pertimbangkan menstabilkan proses yang sudah berjalan baik.",
    facets: [
      "Ide dan cara kerja baru didorong secara aktif",
      "Kreativitas karyawan dianggap aset, bukan risiko",
      "Proses dan produk mudah menyesuaikan perubahan pasar",
      "Keberanian mencoba lebih dihargai dari kepatuhan",
    ],
  },
  Orientasi: {
    icon: "🎯",
    ringkas: "Berorientasi hasil & target",
    deskripsi:
      "Fokus utama pada pencapaian target dan hasil terukur. Yang dihargai daya saing, produktivitas, dan pemenuhan sasaran.",
    implikasiNaik:
      "Karyawan ingin orientasi hasil yang LEBIH kuat dari sekarang, biasanya berarti target atau ekspektasi kerja masih terasa kabur atau kurang menantang bagi mereka.",
    implikasiTurun:
      "Tekanan pencapaian target dirasa sudah tinggi, karyawan berharap ini diringankan. Ini sinyal risiko kelelahan kerja kalau dibiarkan, terutama bila berbarengan dengan indeks kesejahteraan rendah.",
    facets: [
      "Berorientasi pada pencapaian target dan hasil terukur",
      "Daya saing dan produktivitas jadi pendorong utama",
      "Ukuran sukses dilihat dari hasil, bukan sekadar proses",
      "Pemenuhan sasaran jadi tolak ukur keberhasilan",
    ],
  },
  Aturan: {
    icon: "🗂️",
    ringkas: "Terstruktur & taat prosedur",
    deskripsi:
      "Perusahaan berjalan di atas prosedur, aturan, dan jalur koordinasi yang jelas. Yang dihargai konsistensi, efisiensi, dan keandalan proses.",
    implikasiNaik:
      "Karyawan merasa proses kerja masih kurang terstruktur, ingin prosedur yang lebih jelas dan konsisten.",
    implikasiTurun:
      "Karyawan merasa prosedur dan persetujuan berlapis sudah memberatkan, berharap alurnya disederhanakan. Perhatikan supaya penyederhanaan tidak mengorbankan hal yang memang wajib ketat, misalnya keselamatan kerja.",
    facets: [
      "Perusahaan berjalan di atas prosedur dan aturan yang jelas",
      "Konsistensi dan efisiensi proses sangat dijaga",
      "Jalur koordinasi dan persetujuan berjalan terstruktur",
      "Keandalan proses lebih diutamakan dari kecepatan",
    ],
  },
};

/** Urutan tetap tipe budaya, dipakai komponen yang perlu daftar lengkap walau datanya kosong. */
export const TIPE_BUDAYA_ORDER = ["Kekeluargaan", "Inovasi", "Orientasi", "Aturan"];

const ARAH_TEKS = {
  naik: "Karyawan berharap tipe budaya ini LEBIH kuat dari kondisi sekarang.",
  turun: "Karyawan berharap tipe budaya ini LEBIH ringan dari kondisi sekarang.",
  tetap: "Harapan karyawan sudah sejalan dengan kondisi sekarang.",
};

export function arahTeks(arah) {
  return ARAH_TEKS[arah] || "";
}

/** Implikasi kepemimpinan untuk satu tipe budaya, sesuai arah gap-nya. */
export function implikasiBudaya(tipe, arah) {
  const info = TIPE_BUDAYA_INFO[tipe];
  if (!info) return "";
  if (arah === "naik") return info.implikasiNaik;
  if (arah === "turun") return info.implikasiTurun;
  return "Tidak ada tindakan mendesak diperlukan untuk tipe budaya ini, kondisi saat ini sudah sesuai harapan karyawan.";
}

export const ARAH_ICON = { naik: "↑", turun: "↓", tetap: "→" };

/**
 * Enam dimensi profil organisasi, rata-rata lintas keempat tipe budaya per dimensi.
 *
 * `label` dipakai untuk TAMPILAN, `labelData` untuk MENCOCOKKAN dengan isi data. Keduanya sama
 * di lima dimensi; yang berbeda cuma karakter_lembaga, karena data olahan menuliskannya sebagai
 * "Karakter Lembaga" (istilah sekolah, dipakai bersama modul School Culture) sementara di layar
 * CW harus terbaca "Karakter Perusahaan". Jangan mengganti labelData tanpa mengganti importer,
 * nanti sel heatmap tidak ketemu pasangannya.
 */
export const DIMENSI_PROFIL_INFO = {
  karakter_lembaga: {
    icon: "🏢",
    label: "Karakter Perusahaan",
    labelData: "Karakter Lembaga",
    deskripsi: "Ciri khas keseharian perusahaan yang paling terasa oleh karyawan, gabungan dari keempat tipe budaya.",
    facets: [
      "Ciri khas keseharian perusahaan terasa oleh karyawan",
      "Gabungan dari keempat tipe budaya yang berjalan bersama",
      "Identitas perusahaan tercermin dalam interaksi harian",
    ],
  },
  kepemimpinan: {
    icon: "🧭",
    label: "Kepemimpinan",
    labelData: "Kepemimpinan",
    deskripsi: "Bagaimana gaya pimpinan dirasakan karyawan sehari-hari, dari sisi pembimbingan sampai penekanan pencapaian.",
    facets: [
      "Gaya pimpinan terasa langsung dalam interaksi harian",
      "Rentang dari sisi membimbing sampai menekankan pencapaian",
      "Pengaruh pimpinan terasa di banyak keputusan operasional",
    ],
  },
  management: {
    icon: "🗂️",
    label: "Manajemen",
    labelData: "Manajemen",
    deskripsi: "Bagaimana karyawan dikelola dalam keseharian kerja: kerja sama tim, ruang inisiatif, target, dan aturan kerja.",
    facets: [
      "Kerja sama tim jadi bagian dari pengelolaan harian",
      "Ruang inisiatif karyawan diberi tempat",
      "Target dan aturan kerja berjalan berdampingan",
    ],
  },
  sinergi: {
    icon: "🤝",
    label: "Sinergi Tim",
    labelData: "Sinergi Tim",
    deskripsi: "Perekat yang menyatukan perusahaan: rasa saling percaya, semangat berkembang bersama, komitmen target, dan ketertiban.",
    facets: [
      "Rasa saling percaya jadi perekat antar unit",
      "Semangat berkembang bersama terasa di keseharian",
      "Komitmen pada target dan ketertiban berjalan seiring",
    ],
  },
  fokus: {
    icon: "🎯",
    label: "Fokus Strategis",
    labelData: "Fokus Strategis",
    deskripsi: "Penekanan strategis perusahaan saat ini: suasana kerja sehat, pembaruan cara kerja, capaian unggul, atau kelancaran operasional.",
    facets: [
      "Penekanan strategis perusahaan terlihat jelas saat ini",
      "Bisa condong ke suasana sehat, cara baru, capaian, atau operasional",
      "Arah fokus ini memengaruhi prioritas kerja sehari-hari",
    ],
  },
  performance: {
    icon: "📈",
    label: "Kinerja/Performa",
    labelData: "Kinerja/Performa",
    deskripsi: "Tolak ukur keberhasilan yang dipakai perusahaan: berkembangnya karyawan, lahirnya produk baru, capaian target, atau efisiensi biaya.",
    facets: [
      "Tolak ukur keberhasilan bervariasi antar unit",
      "Bisa dari berkembangnya karyawan sampai efisiensi biaya",
      "Ukuran ini menentukan apa yang dianggap berhasil",
    ],
  },
};

/** Urutan tetap enam dimensi, dalam KODE. Pakai ini, bukan Object.keys, supaya urutannya jelas. */
export const DIMENSI_PROFIL_ORDER = [
  "karakter_lembaga", "kepemimpinan", "management", "sinergi", "fokus", "performance",
];

/** Label data (bukan label tampilan) urut sesuai DIMENSI_PROFIL_ORDER, untuk mencocokkan heatmap. */
export const DIMENSI_LABEL_DATA = DIMENSI_PROFIL_ORDER.map((k) => DIMENSI_PROFIL_INFO[k].labelData);

/** Label data ke label tampilan, dipakai komponen yang cuma memegang label dari data. */
export const DIMENSI_LABEL_TAMPIL = Object.fromEntries(
  DIMENSI_PROFIL_ORDER.map((k) => [DIMENSI_PROFIL_INFO[k].labelData, DIMENSI_PROFIL_INFO[k].label])
);

/**
 * Lima subdimensi kesejahteraan karyawan. Kode PERSIS sama dengan kode di data olahan
 * (bagian_kesejahteraan.chart_data[].kode), turunan dari 13 butir survei b1 sampai b13.
 * Deskripsi dan facets di sini teks kerangka yang generik, bukan temuan periode berjalan.
 */
export const KESEJAHTERAAN_INFO = {
  kepuasan_kepemimpinan: {
    label: "Kepuasan pada Kepemimpinan",
    deskripsi: "Sejauh mana karyawan merasa puas dengan cara pimpinan bekerja, percaya pada keputusannya, dan merasa informasi penting disampaikan terbuka.",
    facets: [
      "Cara pimpinan menjalankan tugas dirasa memuaskan",
      "Keputusan pimpinan dipercaya karyawan",
      "Informasi penting disampaikan secara terbuka",
    ],
  },
  kenyamanan_bekerja: {
    label: "Kenyamanan Bekerja",
    deskripsi: "Rasa nyaman karyawan bekerja bersama rekan-rekannya, termasuk kebiasaan saling berbagi ide dan bekerja sama.",
    facets: [
      "Nyaman bekerja sama dengan rekan satu tim",
      "Kebiasaan berbagi ide sudah berjalan",
      "Suasana harian dirasa mendukung, bukan menekan",
    ],
  },
  pengembangan_diri: {
    label: "Pengembangan Diri",
    deskripsi: "Ruang bagi karyawan untuk belajar hal baru, menambah kemampuan, dan melihat peluang berkembang dalam kariernya.",
    facets: [
      "Ada kesempatan belajar dan menambah kemampuan",
      "Peluang berkembang dalam karier terlihat jelas",
      "Pengembangan diri difasilitasi perusahaan",
    ],
  },
  ekspektasi: {
    label: "Ekspektasi Terpenuhi",
    deskripsi: "Sejauh mana kerja keras karyawan dihargai wajar, tugasnya sesuai kemampuan, dan ia puas serta bangga bekerja di sini.",
    facets: [
      "Kerja keras dihargai secara wajar",
      "Tugas yang dikerjakan sesuai kemampuan",
      "Ada rasa puas dan bangga menjadi bagian perusahaan",
    ],
  },
  work_life_balance: {
    label: "Work-Life Balance",
    deskripsi: "Kemampuan karyawan menjaga keseimbangan antara tuntutan pekerjaan dan kehidupan pribadi, termasuk kewajaran beban dan jam kerja.",
    facets: [
      "Keseimbangan kerja dan kehidupan pribadi terjaga",
      "Beban dan jam kerja masih dalam batas wajar",
      "Waktu istirahat dirasa cukup",
    ],
  },
};

/** Urutan tetap lima subdimensi kesejahteraan, dalam KODE. */
export const KESEJAHTERAAN_ORDER = [
  "kepuasan_kepemimpinan", "kenyamanan_bekerja", "pengembangan_diri", "ekspektasi", "work_life_balance",
];

/**
 * Template interpretasi generik per kategori kualitatif kesejahteraan (5 tingkat, lihat
 * cw.types.ts KategoriKesejahteraan). Dipakai supaya pembaca yang bukan HR atau psikolog tetap
 * paham artinya, bukan cuma lihat angka dan label kosong.
 */
const KESEJAHTERAAN_INTERPRETASI = {
  "Sangat Rendah": "Butuh perhatian segera, ini area yang paling berisiko menurunkan retensi dan produktivitas kalau dibiarkan.",
  "Rendah": "Perlu jadi perhatian dalam waktu dekat, meski belum darurat.",
  "Sedang": "Dalam batas wajar, ada ruang untuk ditingkatkan tapi bukan prioritas mendesak.",
  "Tinggi": "Kondisi baik, pertahankan dengan praktik yang sudah berjalan.",
  "Sangat Tinggi": "Ini kekuatan utama perusahaan di area ini, jadikan contoh untuk unit lain.",
};

export function interpretasiKesejahteraan(kategori) {
  return KESEJAHTERAAN_INTERPRETASI[kategori] || "";
}

/** Nada kualitatif ("baik"/"netral"/"waspada"), dipakai warna badge dan label singkat. */
export function toneKesejahteraan(kategori) {
  if (kategori === "Sangat Tinggi" || kategori === "Tinggi") return "baik";
  if (kategori === "Sedang") return "netral";
  return "waspada";
}
