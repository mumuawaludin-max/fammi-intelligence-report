/**
 * Teks rujukan STATIS tentang empat tipe budaya organisasi kerangka OCAI (Cameron & Quinn),
 * plus template interpretasi untuk dialog detail. Ini definisi kerangka yang sudah baku di
 * literatur dan template bahasa generik untuk membantu pembaca awam (bukan HR/psikolog),
 * BUKAN temuan dari data asesmen -- dipakai cuma untuk menjelaskan arti angka, tidak pernah
 * jadi sumber angka itu sendiri.
 */
export const TIPE_BUDAYA_INFO = {
  Klan: {
    icon: "🤝",
    ringkas: "Kolaboratif & kekeluargaan",
    deskripsi:
      "Organisasi terasa seperti keluarga besar. Yang ditekankan kerja sama, pembinaan orang, dan rasa saling percaya. Pemimpin berperan sebagai mentor.",
    implikasiNaik:
      "Karyawan ingin suasana kerja yang LEBIH dekat dan personal dari kondisi sekarang. Pertimbangkan ruang ngobrol informal, mentoring lintas tim, atau kegiatan kebersamaan rutin.",
    implikasiTurun:
      "Karyawan sudah cukup nyaman dengan kedekatan yang ada, bahkan menurutnya bisa sedikit dikurangi. Jaga sisi ini, tidak perlu ditambah lebih jauh.",
  },
  Adhokrasi: {
    icon: "💡",
    ringkas: "Inovatif & berani mencoba",
    deskripsi:
      "Organisasi mendorong eksperimen dan ide baru. Yang dihargai kreativitas, kelincahan, dan keberanian mengambil risiko terukur.",
    implikasiNaik:
      "Karyawan merasa ruang untuk mencoba pendekatan baru masih terbatas. Pertimbangkan waktu khusus untuk eksperimen, jalur pengajuan ide yang sederhana, dan apresiasi untuk ide yang dicoba (bukan cuma yang berhasil).",
    implikasiTurun:
      "Ruang eksperimen sudah dirasa cukup, bahkan mungkin terlalu banyak perubahan mendadak. Pertimbangkan menstabilkan proses yang sudah berjalan baik.",
  },
  Pasar: {
    icon: "🎯",
    ringkas: "Berorientasi hasil & target",
    deskripsi:
      "Fokus utama pada pencapaian target dan hasil terukur. Yang dihargai daya saing, produktivitas, dan pemenuhan sasaran.",
    implikasiNaik:
      "Karyawan ingin orientasi hasil yang LEBIH kuat dari sekarang -- biasanya berarti target/ekspektasi kerja masih terasa kabur atau kurang menantang bagi mereka.",
    implikasiTurun:
      "Tekanan pencapaian target dirasa sudah tinggi, karyawan berharap ini diringankan. Ini sinyal risiko kelelahan kerja kalau dibiarkan, terutama bila berbarengan dengan indeks kesejahteraan rendah.",
  },
  Hierarki: {
    icon: "🗂️",
    ringkas: "Terstruktur & taat prosedur",
    deskripsi:
      "Organisasi berjalan di atas prosedur, aturan, dan jalur koordinasi yang jelas. Yang dihargai konsistensi, efisiensi, dan keandalan proses.",
    implikasiNaik:
      "Karyawan merasa proses kerja masih kurang terstruktur, ingin prosedur yang lebih jelas dan konsisten.",
    implikasiTurun:
      "Karyawan merasa prosedur dan persetujuan berlapis sudah memberatkan, berharap alurnya disederhanakan. Perhatikan supaya penyederhanaan tidak mengorbankan hal yang memang wajib ketat (mis. keselamatan kerja).",
  },
};

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
  return "Tidak ada tindakan mendesak diperlukan untuk tipe budaya ini -- kondisi saat ini sudah sesuai harapan karyawan.";
}

export const ARAH_ICON = { naik: "↑", turun: "↓", tetap: "→" };

/**
 * Template interpretasi generik per kategori kualitatif kesejahteraan (5-tingkat, lihat
 * cw.types.ts KategoriKesejahteraan). Dipakai di dialog detail subdimensi supaya pimpinan yang
 * bukan HR/psikolog tetap paham artinya, bukan cuma lihat angka & label kosong.
 */
const KESEJAHTERAAN_INTERPRETASI = {
  "Sangat Rendah": "Butuh perhatian segera -- ini area yang paling berisiko menurunkan retensi dan produktivitas kalau dibiarkan.",
  "Rendah": "Perlu jadi perhatian dalam waktu dekat, meski belum darurat.",
  "Sedang": "Dalam batas wajar, ada ruang untuk ditingkatkan tapi bukan prioritas mendesak.",
  "Tinggi": "Kondisi baik, pertahankan dengan praktik yang sudah berjalan.",
  "Sangat Tinggi": "Ini kekuatan utama organisasi di area ini -- jadikan contoh untuk unit/subdimensi lain.",
};

export function interpretasiKesejahteraan(kategori) {
  return KESEJAHTERAAN_INTERPRETASI[kategori] || "";
}

/** Warna teks kualitatif ("baik"/"waspada") dipakai bareng tone label singkat di beberapa dialog. */
export function toneKesejahteraan(kategori) {
  if (kategori === "Sangat Tinggi" || kategori === "Tinggi") return "baik";
  if (kategori === "Sedang") return "netral";
  return "waspada";
}
