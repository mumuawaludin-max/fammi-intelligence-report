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

/**
 * Empat tipe budaya organisasi, kerangka nilai bersaing. Nilainya PERSIS seperti yang ditulis
 * data olahan (sheet Personal/Lembaga), bukan istilah akademik OCAI Klan/Adhokrasi/Pasar/Hierarki
 * yang sempat dipakai di sini sampai 2026-09-09. Urutan tetap.
 */
export type TipeBudayaOrganisasi = "Kekeluargaan" | "Inovasi" | "Orientasi" | "Aturan";

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
  /** Label status hasil pemeringkatan gap di hulu ("Selaras"/"Perlu perhatian"/dst). */
  status?: string;
  /** Kalimat interpretasi khusus tipe ini untuk periode berjalan, dari hulu. */
  interpretation?: string;
  /** Ringkasan fokus yang disarankan, dipakai kartu "Fokus yang Disarankan" di bagian C. */
  focus?: string;
  /** Daftar aksi ringkas untuk panel "Arah fokus" di 01-B. */
  priorityActions?: string[];
  /** Langkah bertahap untuk bagian C, urut. */
  phases?: LangkahTindakLanjut[];
  indicators?: IndikatorKeberhasilan[];
  warnings?: string[];
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
export interface ButirKesejahteraan {
  label: string;
  /** Skala 1-5, rata-rata butir mentah. */
  nilai: number;
}

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
  /** Breakdown butir mentah pembentuk subdimensi ini, skala 1-5. */
  items?: ButirKesejahteraan[];
  focus?: string;
  priorityActions?: string[];
  phases?: LangkahTindakLanjut[];
  indicators?: IndikatorKeberhasilan[];
  warnings?: string[];
}

export interface BagianKesejahteraan {
  /** Narasi 2-4 kalimat merangkum kondisi kesejahteraan responden. */
  narasi: string;
  /** Indeks gabungan seluruh subdimensi, 0-100. */
  indeks: number;
  kategori: KategoriKesejahteraan;
  chart_data: SubdimensiKesejahteraan[];
}

/** Satu langkah tindak lanjut hasil perumusan di hulu, sudah lewat gerbang persetujuan. */
export interface LangkahTindakLanjut {
  aksi: string;
  /** Jangka waktu, mis. "Minggu ini", "30 hari". Boleh kosong. */
  waktu?: string | null;
}

/** Penanda keberhasilan satu langkah tindak lanjut. */
export interface IndikatorKeberhasilan {
  title: string;
  detail?: string;
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
  /** Raw dari kolom demografi, mis. "Laki-laki"/"Perempuan"/"L"/"P". Dipakai untuk sapaan
   * Bapak/Ibu di hero laporan individu; kosong berarti sapaan dilewati. */
  jenis_kelamin?: string;
  /** Nama perusahaan, dipakai di kalimat hero laporan individu. */
  nama_perusahaan?: string;
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

/**
 * Jawaban esai verbatim satu karyawan. Ditampilkan apa adanya (bukan sintesis Gemini) dan cuma
 * ke pemilik laporan sendiri, lihat gating viewerIsOwner di CwLaporanIndividuPage.jsx.
 */
export interface JawabanSurveyCW {
  /** Q1: gambaran perusahaan dalam satu frasa, dipakai jadi judul hero. */
  gambaran_perusahaan?: string;
  /** Q2: yang membuat betah bekerja. */
  betah?: string;
  /** Q3: hal yang menguras energi. */
  hal_menguras_energi?: string;
  /** Q4: perubahan yang diharapkan. */
  yang_ingin_diubah?: string;
}

/** Satu langkah konkret di dalam satu area lingkar kontribusi. */
export interface LangkahKontribusi {
  judul: string;
  instruksi?: string;
  contoh?: string[];
  tujuan?: string;
}

/**
 * Satu area lingkar kontribusi: apa yang ada di kendali sendiri, apa yang bisa dipengaruhi, apa
 * yang butuh dukungan sistem. Isinya per orang (di SC digenerate Gemini di hulu), konsep tiga
 * areanya sendiri statis di CwLaporanIndividuPage.jsx.
 */
export interface LingkarKontribusiArea {
  locus: "control" | "influence" | "system";
  mengapa_fokus: string;
  langkah?: LangkahKontribusi[];
}

/** Struktur penuh satu laporan individu CW. */
export interface LaporanIndividuCW {
  meta: CwMeta;
  header: CwHeader;
  bagian_budaya: BagianBudaya;
  bagian_kesejahteraan: BagianKesejahteraan;
  /** Enam dimensi profil organisasi menurut satu orang ini. Opsional: laporan lama belum punya. */
  bagian_profil_organisasi?: BagianProfilOrganisasi;
  jawaban_survey?: JawabanSurveyCW;
  lingkar_kontribusi?: LingkarKontribusiArea[];
  /** Kapan laporan ini disetujui admin. Jadi titik nol jadwal check-in 30 hari. */
  approved_at?: string | null;
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
  bagian_profil_organisasi: BagianProfilOrganisasi;
  analisis: AnalisisAgregatCW;
  cerita_karyawan: CeritaKaryawan;
  tema_esai: TemaEsaiCW[];
  /**
   * Dipertahankan di skema tapi TIDAK lagi dirender di dashboard: section Perbandingan
   * Antarunit dan Prioritas Perbaikan lintas-fokus ikut dihapus saat struktur disamakan dengan
   * School Culture. Jangan dikembalikan ke tampilan tanpa instruksi baru.
   */
  perbandingan_antarunit: PerbandinganAntarunit;
  /** Selalu 3 item, urut peringkat 1-3. */
  prioritas_perbaikan: PrioritasPerbaikan[];
  footer: CwFooter;
}

/* ============================================================================================
 * BAGIAN TAMBAHAN LAPORAN AGREGAT
 *
 * Ditambahkan saat dashboard Laporan Organisasi CW disamakan strukturnya dengan modul School
 * Culture (tiga section 01/02/03, masing-masing A/B/C). Bentuk field mengikuti padanannya di
 * pages/sc/sc.types.ts supaya kalau nanti pipeline hulu CW dibangun, skemanya tinggal mengikuti
 * yang sudah berjalan di SC, bukan bentuk ketiga yang baru.
 * ============================================================================================ */

/** Satu dari enam dimensi profil organisasi, rata-rata lintas keempat tipe budaya. */
export interface DimensiProfilOrganisasi {
  /** Kode pendek, cocok dengan DIMENSI_PROFIL_INFO di cwMeta.js. */
  kode: string;
  label: string;
  /** 0-100. */
  nilai: number;
  kategori: KategoriKesejahteraan;
  phases?: LangkahTindakLanjut[];
  indicators?: IndikatorKeberhasilan[];
  warnings?: string[];
}

export interface BagianProfilOrganisasi {
  narasi: string;
  /** Selalu 6 entri, urutan mengikuti DIMENSI_PROFIL_INFO. */
  chart_data: DimensiProfilOrganisasi[];
}

/**
 * Satu sel rata-rata item mentah gambaran_<dimensi>_<tipe>, skala 1-5. Dipakai dua kali dengan
 * sumber yang sama: dikelompokkan per tipe di 01-D, per dimensi di 03-B.
 */
export interface SelHeatmap {
  dimensi: string;
  tipe: TipeBudayaOrganisasi;
  nilai_mentah: number | null;
  /** Redaksi butir survei untuk sel ini, mis. "Pimpinan seperti pembimbing". Diturunkan dari
   * nama kolom berkas klien, jadi bunyinya beda-beda per klien dan per pasangan dimensi x tipe.
   * Opsional supaya laporan lama yang belum membawanya tetap sah; layar jatuh ke label cadangan
   * per tipe kalau null. */
  label_item?: string | null;
}

export interface AnalisisAgregatCW {
  heatmap: SelHeatmap[];
}

/** Satu frasa word cloud hasil sintesis jawaban esai karyawan (bukan kutipan asli, demi privasi). */
export interface FrasaCeritaKaryawan {
  frasa: string;
  jumlah_mention: number;
}

export interface CeritaKaryawan {
  gambaran_perusahaan: FrasaCeritaKaryawan[];
  saat_ini: FrasaCeritaKaryawan[];
  ingin_diubah: FrasaCeritaKaryawan[];
}

/** Satu tema hasil sintesis jawaban esai, dipakai section 02-C. */
export interface TemaEsaiCW {
  tema: string;
  ringkasan: string;
  jumlah_mention: number;
}
