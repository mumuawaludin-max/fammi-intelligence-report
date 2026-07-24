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
  },
  kepemimpinan: {
    icon: "🧭",
    label: "Kepemimpinan",
    deskripsi: "Bagaimana gaya pimpinan sekolah dirasakan staf sehari-hari, dari sisi pembimbingan sampai penekanan pencapaian.",
  },
  management: {
    icon: "🗂️",
    label: "Manajemen",
    deskripsi: "Bagaimana staf dikelola dalam keseharian kerja: kerja sama tim, ruang inisiatif, target, dan aturan kerja.",
  },
  sinergi: {
    icon: "🤝",
    label: "Sinergi Tim",
    deskripsi: "Perekat yang menyatukan sekolah: rasa saling percaya, semangat berkembang bersama, komitmen target, dan ketertiban.",
  },
  fokus: {
    icon: "🎯",
    label: "Fokus Strategis",
    deskripsi: "Penekanan strategis sekolah saat ini: suasana kerja sehat, pembaruan metode, capaian unggul, atau kelancaran operasional.",
  },
  performance: {
    icon: "📈",
    label: "Kinerja/Performa",
    deskripsi: "Tolok ukur keberhasilan yang dipakai sekolah: berkembangnya staf, lahirnya program baru, mutu lulusan, atau efisiensi biaya.",
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
