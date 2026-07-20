/**
 * Tipe data untuk skema JSON "baku" modul Corporate Culture & Wellbeing (CW), sisi laporan
 * individu. Field dan struktur di sini mengikuti persis apa yang dideskripsikan pemilik produk
 * (header, bagian_budaya, bagian_kesejahteraan, bagian_cermin, bagian_refleksi, footer).
 *
 * PENTING: belum ada contoh JSON asli yang bisa dibaca -- semua nama field turunan (bukan field
 * utama yang eksplisit disebut) adalah INFERENSI, ditandai komentar "ASUMSI" di tiap tempat.
 * Begitu contoh JSON asli tersedia, cocokkan ulang tipe ini field per field sebelum dipakai UI
 * produksi. Lihat juga docs/cw-module-design-spec.md bagian 8 untuk daftar item terbuka lain.
 *
 * Empat tipe budaya organisasi (Klan/Adhokrasi/Pasar/Hierarki) tampak mengikuti kerangka OCAI
 * (Organizational Culture Assessment Instrument, Cameron & Quinn) -- kemungkinan besar padanan
 * dari 4 "Aspek Culture" di wireframe Figma (Kekeluargaan/Inovasi/Orientasi/Aturan), cuma beda
 * istilah (akademik vs sehari-hari). Belum dikonfirmasi, jangan dianggap pasti sama.
 */

/** Empat tipe budaya organisasi menurut kerangka OCAI. Urutan tetap: Klan, Adhokrasi, Pasar, Hierarki. */
export type TipeBudayaOrganisasi = "Klan" | "Adhokrasi" | "Pasar" | "Hierarki";

/**
 * ASUMSI: arah gap antara "saat_ini" dan "harapan" untuk satu tipe budaya. Nilai union ini
 * tebakan berdasarkan pola umum laporan gap-analysis, belum dikonfirmasi ke skema asli.
 */
export type ArahGap = "naik" | "turun" | "tetap";

export interface CwHeader {
  /** Kalimat pembuka/hook laporan, 1 kalimat. */
  hook: string;
  /** Sub-kalimat pelengkap hook. */
  sub_hook: string;
}

/** Satu titik data radar: skor satu tipe budaya, saat ini vs harapan, skala 0-100. */
export interface RadarBudayaPoint {
  tipe: TipeBudayaOrganisasi;
  /** 0-100. */
  saat_ini: number;
  /** 0-100. */
  harapan: number;
}

/** Satu baris tabel gap: ringkasan tekstual dari RadarBudayaPoint yang bersangkutan. */
export interface TabelGapRow {
  label: string;
  arah: ArahGap;
  /**
   * ASUMSI, bukan dari deskripsi eksplisit user -- besar gap (harapan - saat_ini) dalam poin.
   * Berguna untuk sortir/styling tapi hapus field ini kalau ternyata tidak ada di skema asli.
   */
  nilai_gap?: number;
}

export interface BagianBudaya {
  /** Narasi 2-4 kalimat merangkum profil budaya responden. */
  narasi: string;
  /** Selalu 4 entri: satu per TipeBudayaOrganisasi, urutan Klan/Adhokrasi/Pasar/Hierarki. */
  chart_data: RadarBudayaPoint[];
  /** Biasanya 4 baris juga (satu per tipe budaya), tapi tidak divalidasi harus sama panjang. */
  tabel_gap: TabelGapRow[];
}

/**
 * ASUMSI: skala kualitatif indeks kesejahteraan, 5 tingkat mengikuti pola yang sudah diusulkan
 * di docs/cw-module-design-spec.md bagian 2 (--cw-nilai-*). Belum dikonfirmasi ke skema asli --
 * bisa saja cuma 3 tingkat atau istilah lain sama sekali.
 */
export type KategoriKesejahteraan =
  | "Sangat Rendah"
  | "Rendah"
  | "Sedang"
  | "Tinggi"
  | "Sangat Tinggi";

/** Satu batang pada chart_data kesejahteraan: satu subdimensi (mis. "Beban Kerja"). */
export interface SubdimensiKesejahteraan {
  /**
   * ASUMSI: kode pendek subdimensi, dipakai sebagai React key/identitas stabil. Nama subdimensi
   * asli (Beban Kerja, Dukungan Sosial, dst) belum diketahui -- lihat cw.mock.ts untuk contoh
   * yang dipakai sementara.
   */
  kode: string;
  label: string;
  /** 0-100, ASUMSI skala sama dengan radar budaya. */
  nilai: number;
  kategori: KategoriKesejahteraan;
}

export interface BagianKesejahteraan {
  /** Narasi 2-4 kalimat merangkum kondisi kesejahteraan responden. */
  narasi: string;
  /** Indeks gabungan seluruh subdimensi, 0-100. */
  indeks: number;
  kategori: KategoriKesejahteraan;
  chart_data: SubdimensiKesejahteraan[];
}

export interface CwFooter {
  disclaimer: string;
}

/**
 * ASUMSI SELURUHNYA: skema baku yang dideskripsikan user cuma mendefinisikan isi laporan
 * (header, bagian_budaya, dst), belum menyebutkan bagaimana laporan itu diidentifikasi
 * pemiliknya. `meta` ditambahkan supaya satu objek laporan tetap bisa dipetakan ke responden,
 * sekolah, dan periode yang benar (dibutuhkan UI maupun RLS nantinya). Pindahkan/ubah bentuknya
 * begitu skema asli tersedia -- jangan anggap field ini bagian dari kontrak baku.
 */
export interface CwMeta {
  responden_id: string;
  nama_responden: string;
  /** Mis. "Analis Data", "Manajer Penjualan". Opsional karena belum tentu semua responden punya. */
  jabatan?: string;
  /** Unit/divisi tempat responden bekerja, dipakai untuk agregasi antarunit. */
  unit?: string;
  organisasi_id: string;
  /** Format "YYYY-MM", konsisten dengan periode_id modul lain (lihat mi_hasil, karakter_skor). */
  periode_id: string;
}

/**
 * Satu langkah tindak lanjut PRIBADI untuk karyawan yang bersangkutan.
 *
 * ASUMSI, bukan dari skema yang disebutkan pemilik produk -- ditambahkan karena laporan individu
 * tanpa "jadi saya harus apa?" berhenti sebagai informasi, bukan alat bantu. Beda dari
 * PrioritasPerbaikan di laporan agregat: itu keputusan level organisasi untuk pimpinan, ini
 * langkah kecil yang bisa dijalankan karyawan sendiri tanpa menunggu kebijakan.
 */
export interface AksiPribadi {
  id: string;
  /** Kalimat aksi, diawali kata kerja. Mis. "Blokir 1 jam tanpa rapat tiap Rabu pagi". */
  judul: string;
  /** Penjelasan 1-2 kalimat: kenapa ini disarankan untuk orang ini. */
  alasan: string;
  /** Subdimensi/tipe budaya yang jadi sumber saran, dipakai sebagai tag di UI. */
  terkait: string;
  /** Perkiraan rentang waktu, mis. "Minggu ini", "1 bulan". */
  jangka: string;
  /** Ikon pendek (emoji) untuk badge di daftar aksi. */
  ikon: string;
}

/** Struktur penuh satu laporan individu CW. */
export interface LaporanIndividuCW {
  meta: CwMeta;
  header: CwHeader;
  bagian_budaya: BagianBudaya;
  bagian_kesejahteraan: BagianKesejahteraan;
  /** Teks bebas -- refleksi "cermin" (bagaimana responden dipersepsikan/memandang dirinya). */
  bagian_cermin: string;
  /** Teks bebas -- ajakan/pertanyaan refleksi untuk responden. */
  bagian_refleksi: string;
  /** ASUMSI (lihat AksiPribadi): 2-4 langkah tindak lanjut pribadi. */
  rencana_aksi?: AksiPribadi[];
  footer: CwFooter;
}

/* ============================================================================================
 * LAPORAN AGREGAT (Pimpinan/Manajemen)
 *
 * PENTING -- lebih spekulatif dari LaporanIndividuCW di atas: untuk laporan individu setidaknya
 * ada deskripsi struktur eksplisit dari pemilik produk (header/bagian_budaya/dst persis
 * disebutkan). Untuk agregat, yang ada cuma satu kalimat: "struktur serupa plus perbandingan
 * antarjenjang" (step 4, chat sebelumnya) plus "tiga prioritas perbaikan" (dari daftar tahapan
 * implementasi). SEMUA di bawah ini, termasuk nama field, adalah tebakan berdasar dua petunjuk
 * itu -- wajib dicek ulang terhadap skema JSON asli begitu tersedia, jangan dianggap final.
 * ============================================================================================ */

export interface CwMetaAgregat {
  organisasi_id: string;
  organisasi_nama: string;
  /** Format "YYYY-MM". */
  periode_id: string;
  jumlah_responden: number;
}

/**
 * Satu unit/divisi organisasi (mis. Operasional, Teknologi, Penjualan). Dulu bernama "jenjang"
 * waktu modul ini masih diasumsikan konteks sekolah -- diganti ke "unit" karena CW adalah modul
 * korporat: yang dibandingkan divisi/departemen, bukan jenjang pendidikan. Dibiarkan `string`
 * bebas (bukan union tetap) karena struktur unit beda-beda tiap organisasi.
 */
export interface PerbandinganUnitRow {
  unit: string;
  jumlah_responden: number;
  /** Tipe budaya paling menonjol (nilai saat_ini tertinggi) di unit ini. */
  budaya_dominan: TipeBudayaOrganisasi;
  indeks_kesejahteraan: number;
  kategori_kesejahteraan: KategoriKesejahteraan;
}

export interface PerbandinganAntarunit {
  /** Narasi 2-4 kalimat merangkum pola perbedaan antarunit. */
  narasi: string;
  rows: PerbandinganUnitRow[];
}

/**
 * Satu prioritas perbaikan. Field action/trigger_desc sengaja disamakan namanya dengan kolom
 * tindak_lanjut yang sudah dipakai modul lain (lihat useKarakterData.js, MIPage.jsx) supaya bisa
 * langsung dipetakan ke komponen FollowupCard/FollowupRibbon existing tanpa lapisan terjemahan
 * tambahan -- BUKAN berarti field ini pasti datang dari tabel tindak_lanjut yang sama, cuma
 * kemiripan nama untuk memudahkan reuse komponen.
 */
export interface PrioritasPerbaikan {
  /** 1 = paling prioritas. Selalu 3 item per laporan (sesuai "tiga prioritas perbaikan"). */
  peringkat: 1 | 2 | 3;
  action: string;
  trigger_desc: string;
  /** Label area/unit yang jadi konteks tambahan, mis. "Beban Kerja · Operasional". */
  area: string;
  /**
   * ASUMSI, ditambahkan supaya dialog detail lebih menjelaskan -- bukan dari deskripsi user.
   * 2-4 langkah konkret, ditampilkan sebagai checklist di dialog. Hapus field ini kalau skema
   * asli ternyata tidak punya rincian langkah.
   */
  langkah?: string[];
  /** ASUMSI: dampak yang diharapkan kalau prioritas ini dijalankan, 1 kalimat. */
  dampak?: string;
}

/** Struktur penuh laporan agregat/pimpinan CW satu sekolah satu periode. */
export interface LaporanAgregatCW {
  meta: CwMetaAgregat;
  header: CwHeader;
  /** Sama shape dengan individu, tapi mewakili rata-rata/agregat seluruh responden organisasi. */
  bagian_budaya: BagianBudaya;
  bagian_kesejahteraan: BagianKesejahteraan;
  perbandingan_antarunit: PerbandinganAntarunit;
  /** Selalu 3 item, urut peringkat 1-3. */
  prioritas_perbaikan: PrioritasPerbaikan[];
  footer: CwFooter;
}
