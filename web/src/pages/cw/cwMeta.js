/**
 * Teks rujukan STATIS tentang empat tipe budaya organisasi kerangka OCAI (Cameron & Quinn).
 * Ini definisi kerangka yang sudah baku di literatur, BUKAN temuan dari data asesmen -- dipakai
 * cuma untuk menjelaskan arti tiap tipe di dialog detail, supaya pembaca yang belum kenal OCAI
 * tetap paham. Angka apa pun tetap datang dari laporan, tidak pernah dari sini.
 */
export const TIPE_BUDAYA_INFO = {
  Klan: {
    icon: "🤝",
    ringkas: "Kolaboratif & kekeluargaan",
    deskripsi:
      "Organisasi terasa seperti keluarga besar. Yang ditekankan kerja sama, pembinaan orang, dan rasa saling percaya. Pemimpin berperan sebagai mentor.",
  },
  Adhokrasi: {
    icon: "💡",
    ringkas: "Inovatif & berani mencoba",
    deskripsi:
      "Organisasi mendorong eksperimen dan ide baru. Yang dihargai kreativitas, kelincahan, dan keberanian mengambil risiko terukur.",
  },
  Pasar: {
    icon: "🎯",
    ringkas: "Berorientasi hasil & target",
    deskripsi:
      "Fokus utama pada pencapaian target dan hasil terukur. Yang dihargai daya saing, produktivitas, dan pemenuhan sasaran.",
  },
  Hierarki: {
    icon: "🗂️",
    ringkas: "Terstruktur & taat prosedur",
    deskripsi:
      "Organisasi berjalan di atas prosedur, aturan, dan jalur koordinasi yang jelas. Yang dihargai konsistensi, efisiensi, dan keandalan proses.",
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

export const ARAH_ICON = { naik: "↑", turun: "↓", tetap: "→" };
