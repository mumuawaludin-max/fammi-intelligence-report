/**
 * Teks rujukan STATIS tentang empat tipe budaya sekolah (kerangka OCAI, label persis data olahan:
 * Kekeluargaan/Inovasi/Orientasi/Aturan -- padanan istilah akademik Klan/Adhokrasi/Pasar/Hierarki
 * yang dipakai modul CW korporat, lihat pages/cw/cwMeta.js), plus template interpretasi untuk
 * dialog detail. Ini definisi kerangka yang sudah baku di literatur dan bahasa generik untuk
 * pembaca awam (guru/staf, bukan HR/psikolog), BUKAN temuan dari data asesmen.
 */
/** Fase E item 15: catatan metodologi/status instrumen, statis (bukan dari data), dipasang di
 * footer kedua laporan (agregat & individu) supaya pembaca tahu dasar instrumennya tanpa perlu
 * dokumen terpisah. Bukan fitur interaktif, cuma satu kalimat transparansi. */
export const METODOLOGI_NOTE =
  "Instrumen: asesmen budaya kerja (kerangka nilai bersaing, kondisi sekarang vs harapan staf) dan kesejahteraan staf School Culture. Skor sudah final dari pipeline pengolahan Fammi; laporan ini menata dan merangkai narasinya, bukan menghitung ulang.";

export const TIPE_BUDAYA_INFO = {
  Kekeluargaan: {
    icon: "🤝",
    ringkas: "Hangat & kekeluargaan",
    deskripsi:
      "Sekolah terasa seperti keluarga besar. Yang ditekankan kebersamaan, saling membantu antar guru dan staf, serta kedekatan dengan pimpinan. Pimpinan berperan sebagai pembimbing.",
    implikasiNaik:
      "Staf ingin suasana kerja yang LEBIH dekat dan personal dari kondisi sekarang. Pertimbangkan ruang ngobrol informal antar guru, mentoring lintas jenjang, atau kegiatan kebersamaan rutin.",
    implikasiTurun:
      "Staf sudah cukup nyaman dengan kedekatan yang ada, bahkan menurutnya bisa sedikit dikurangi. Jaga sisi ini, tidak perlu ditambah lebih jauh.",
    facets: [
      "Suasana kerja terasa hangat dan saling membantu",
      "Pimpinan berperan sebagai pembimbing, bukan cuma atasan",
      "Kedekatan personal antar staf jadi perekat utama",
      "Loyalitas dan kebersamaan dihargai lebih dari kompetisi",
    ],
  },
  Inovasi: {
    icon: "💡",
    ringkas: "Terbuka & berkembang",
    deskripsi:
      "Sekolah mendorong metode mengajar dan ide baru. Yang dihargai kreativitas guru, kelincahan menyesuaikan kurikulum, dan keberanian mencoba pendekatan belajar baru.",
    implikasiNaik:
      "Staf merasa ruang mencoba metode baru masih terbatas. Pertimbangkan waktu khusus untuk uji coba pendekatan mengajar, jalur pengajuan ide yang sederhana, dan apresiasi untuk ide yang dicoba.",
    implikasiTurun:
      "Ruang eksperimen sudah dirasa cukup, bahkan mungkin terlalu banyak perubahan mendadak. Pertimbangkan menstabilkan metode yang sudah berjalan baik.",
    facets: [
      "Ide dan metode mengajar baru didorong secara aktif",
      "Kreativitas guru dianggap aset, bukan risiko",
      "Kurikulum dan pendekatan belajar mudah menyesuaikan",
      "Keberanian mencoba hal baru lebih dihargai dari kepatuhan",
    ],
  },
  Orientasi: {
    icon: "🎯",
    ringkas: "Berorientasi hasil",
    deskripsi:
      "Fokus utama pada pencapaian target dan mutu lulusan. Yang dihargai daya saing akademik, produktivitas, dan pemenuhan target sekolah.",
    implikasiNaik:
      "Staf ingin orientasi hasil yang LEBIH kuat dari sekarang -- biasanya berarti target/ekspektasi kerja masih terasa kabur atau kurang menantang bagi mereka.",
    implikasiTurun:
      "Tekanan pencapaian target dirasa sudah tinggi, staf berharap ini diringankan. Ini sinyal risiko kelelahan kerja kalau dibiarkan, terutama bila berbarengan dengan indeks kesejahteraan rendah.",
    facets: [
      "Berorientasi pada pencapaian target dan mutu lulusan",
      "Daya saing akademik dan produktivitas jadi pendorong utama",
      "Ukuran sukses dilihat dari hasil terukur, bukan sekadar proses",
      "Pemenuhan target sekolah jadi tolok ukur keberhasilan",
    ],
  },
  Aturan: {
    icon: "🗂️",
    ringkas: "Tertib & sesuai prosedur",
    deskripsi:
      "Sekolah berjalan di atas prosedur, tata tertib, dan jalur koordinasi yang jelas. Yang dihargai konsistensi, kedisiplinan, dan keandalan proses administrasi.",
    implikasiNaik:
      "Staf merasa proses kerja masih kurang terstruktur, ingin prosedur yang lebih jelas dan konsisten.",
    implikasiTurun:
      "Staf merasa prosedur dan persetujuan berlapis sudah memberatkan, berharap alurnya disederhanakan. Perhatikan supaya penyederhanaan tidak mengorbankan hal yang memang wajib ketat (mis. keamanan anak).",
    facets: [
      "Sekolah berjalan di atas prosedur dan tata tertib yang jelas",
      "Konsistensi dan kedisiplinan proses sangat dijaga",
      "Jalur koordinasi dan persetujuan berjalan terstruktur",
      "Keandalan administrasi lebih diutamakan dari kecepatan",
    ],
  },
};

const ARAH_TEKS = {
  naik: "Staf berharap tipe budaya ini LEBIH kuat dari kondisi sekarang.",
  turun: "Staf berharap tipe budaya ini LEBIH ringan dari kondisi sekarang.",
  tetap: "Harapan staf sudah sejalan dengan kondisi sekarang.",
};

export function arahTeks(arah) {
  return ARAH_TEKS[arah] || "";
}

export function implikasiBudaya(tipe, arah) {
  const info = TIPE_BUDAYA_INFO[tipe];
  if (!info) return "";
  if (arah === "naik") return info.implikasiNaik;
  if (arah === "turun") return info.implikasiTurun;
  return "Tidak ada tindakan mendesak diperlukan untuk tipe budaya ini -- kondisi saat ini sudah sesuai harapan staf.";
}

export const ARAH_ICON = { naik: "↑", turun: "↓", tetap: "→" };

/**
 * Enam dimensi profil organisasi (rata-rata lintas 4 tipe budaya per dimensi: karakter lembaga,
 * kepemimpinan, manajemen, sinergi, fokus strategis, performa) -- padanan nilai_karakter_lembaga
 * dst di data olahan. TIDAK ADA di modul CW korporat, khusus SC.
 */
export const DIMENSI_PROFIL_INFO = {
  karakter_lembaga: {
    icon: "🏫",
    label: "Karakter Lembaga",
    deskripsi: "Ciri khas keseharian sekolah yang paling terasa oleh staf, gabungan dari keempat tipe budaya.",
    facets: [
      "Ciri khas keseharian sekolah terasa oleh semua staf",
      "Gabungan dari keempat tipe budaya yang berjalan bersama",
      "Identitas sekolah tercermin jelas dalam interaksi harian",
    ],
  },
  kepemimpinan: {
    icon: "🧭",
    label: "Kepemimpinan",
    deskripsi: "Bagaimana gaya pimpinan sekolah dirasakan staf sehari-hari, dari sisi pembimbingan sampai penekanan pencapaian.",
    facets: [
      "Gaya pimpinan terasa langsung dalam interaksi sehari-hari",
      "Rentang dari sisi membimbing sampai menekankan pencapaian",
      "Pengaruh pimpinan terasa di banyak keputusan operasional",
    ],
  },
  management: {
    icon: "🗂️",
    label: "Manajemen",
    deskripsi: "Bagaimana staf dikelola dalam keseharian kerja: kerja sama tim, ruang inisiatif, target, dan aturan kerja.",
    facets: [
      "Kerja sama tim jadi bagian dari pengelolaan harian",
      "Ruang inisiatif staf diberi tempat dalam pengelolaan",
      "Target dan aturan kerja berjalan berdampingan",
    ],
  },
  sinergi: {
    icon: "🤝",
    label: "Sinergi Tim",
    deskripsi: "Perekat yang menyatukan sekolah: rasa saling percaya, semangat berkembang bersama, komitmen target, dan ketertiban.",
    facets: [
      "Rasa saling percaya jadi perekat antarstaf",
      "Semangat berkembang bersama terasa di keseharian",
      "Komitmen pada target dan ketertiban berjalan seiring",
    ],
  },
  fokus: {
    icon: "🎯",
    label: "Fokus Strategis",
    deskripsi: "Penekanan strategis sekolah saat ini: suasana kerja sehat, pembaruan metode, capaian unggul, atau kelancaran operasional.",
    facets: [
      "Penekanan strategis sekolah terlihat jelas saat ini",
      "Bisa condong ke suasana sehat, metode baru, capaian, atau operasional",
      "Arah fokus ini memengaruhi prioritas kerja sehari-hari",
    ],
  },
  performance: {
    icon: "📈",
    label: "Kinerja/Performa",
    deskripsi: "Tolok ukur keberhasilan yang dipakai sekolah: berkembangnya staf, lahirnya program baru, mutu lulusan, atau efisiensi biaya.",
    facets: [
      "Tolok ukur keberhasilan sekolah bervariasi antar unit",
      "Bisa dari berkembangnya staf sampai efisiensi biaya",
      "Ukuran ini menentukan apa yang dianggap berhasil",
    ],
  },
};

/**
 * Lima subdimensi kesejahteraan staf -- kode PERSIS sama dengan kode di data olahan
 * (bagian_kesejahteraan.chart_data[].kode), dipakai untuk section "02 Kesejahteraan Tim" di
 * dashboard Laporan Lembaga (padanan DIMENSI_PROFIL_INFO di atas, tapi untuk domain
 * kesejahteraan). Deskripsi generik kerangka, bukan temuan spesifik periode.
 */
export const KESEJAHTERAAN_INFO = {
  kepuasan_kepemimpinan: {
    label: "Kepuasan pada Kepemimpinan",
    deskripsi: "Sejauh mana staf merasa didengar, dibimbing, dan diperlakukan adil oleh pimpinan sekolah sehari-hari.",
    facets: [
      "Staf merasa didengar oleh pimpinan sekolah",
      "Pembimbingan dan arahan dirasa jelas dan adil",
      "Kepercayaan antara staf dan pimpinan terjaga",
    ],
  },
  kenyamanan_bekerja: {
    label: "Kenyamanan Bekerja",
    deskripsi: "Rasa aman dan nyaman staf dengan lingkungan, fasilitas, dan suasana kerja sehari-hari di sekolah.",
    facets: [
      "Lingkungan dan fasilitas kerja terasa aman dan layak",
      "Suasana harian di sekolah dirasa nyaman",
      "Staf merasa betah menjalani rutinitas kerja",
    ],
  },
  pengembangan_diri: {
    label: "Pengembangan Diri",
    deskripsi: "Ruang bagi staf untuk belajar hal baru, naik kompetensi, dan berkembang dalam kariernya di sekolah.",
    facets: [
      "Ada ruang belajar hal baru dan naik kompetensi",
      "Jenjang karier di sekolah terasa terbuka",
      "Pelatihan dan pengembangan diri difasilitasi",
    ],
  },
  ekspektasi: {
    label: "Ekspektasi Terpenuhi",
    deskripsi: "Sejauh mana kenyataan bekerja di sekolah ini sesuai dengan yang staf bayangkan sebelum bergabung.",
    facets: [
      "Realita kerja sesuai bayangan awal bergabung",
      "Peran dan tanggung jawab sesuai yang dijanjikan",
      "Tidak ada kesenjangan besar antara harapan dan kenyataan",
    ],
  },
  work_life_balance: {
    label: "Keseimbangan Kerja-Hidup",
    deskripsi: "Kemampuan staf menjaga keseimbangan antara tuntutan pekerjaan dan kehidupan pribadi/keluarga.",
    facets: [
      "Staf mampu menjaga waktu untuk keluarga dan pribadi",
      "Beban kerja tidak mengorbankan kehidupan di luar sekolah",
      "Waktu istirahat dan cuti dirasa cukup",
    ],
  },
};

/**
 * Template interpretasi generik per kategori kualitatif 5-tingkat, dipakai kesejahteraan maupun
 * profil organisasi (skala sama). Supaya pembaca non-HR/psikolog tetap paham artinya.
 */
const NILAI_INTERPRETASI = {
  "Sangat Rendah": "Butuh perhatian segera -- ini area yang paling berisiko menurunkan retensi staf dan mutu layanan kalau dibiarkan.",
  "Rendah": "Perlu jadi perhatian dalam waktu dekat, meski belum darurat.",
  "Sedang": "Dalam batas wajar, ada ruang untuk ditingkatkan tapi bukan prioritas mendesak.",
  "Tinggi": "Kondisi baik, pertahankan dengan praktik yang sudah berjalan.",
  "Sangat Tinggi": "Ini kekuatan utama sekolah di area ini -- jadikan contoh untuk unit/jenjang lain.",
};

export function interpretasiKesejahteraan(kategori) {
  return NILAI_INTERPRETASI[kategori] || "";
}

export function toneKesejahteraan(kategori) {
  if (kategori === "Sangat Tinggi" || kategori === "Tinggi") return "baik";
  if (kategori === "Sedang") return "netral";
  return "waspada";
}
