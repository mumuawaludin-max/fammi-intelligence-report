/**
 * Tipe data modul School Culture (SC) -- modul TERPISAH dari Corporate Culture & Wellbeing (CW,
 * lihat pages/cw/), instruksi eksplisit pemilik produk: "modul terpisah tapi dengan UI/UX yang
 * sama, baik untuk karyawan dan pimpinan". SC dipakai untuk sekolah/yayasan yang mensurvei
 * budaya kerja STAF-nya sendiri (guru, tenaga kependidikan, pimpinan unit) -- bukan murid,
 * beda dari tiga modul FIR lainnya (MI/Screening/Karakter).
 *
 * Struktur field di sini diturunkan dari contoh data olahan yang dibagikan pemilik produk
 * (sheet "Personal" dan "Lembaga", kerangka OCAI: Kekeluargaan/Inovasi/Orientasi/Aturan) --
 * lihat referensi label di scMeta.js. Field yang bukan bagian eksplisit dari data itu (rencana
 * aksi, dialog, dst) ditandai ASUMSI, pola sama dengan cw.types.ts.
 */

/** Empat tipe budaya sekolah, label persis dari data olahan (bukan istilah akademik OCAI). */
export type TipeBudayaSekolah = "Kekeluargaan" | "Inovasi" | "Orientasi" | "Aturan";

export type ArahGap = "naik" | "turun" | "tetap";

export interface ScHeader {
  hook: string;
  sub_hook: string;
}

/** Status 3-tingkat per tipe budaya untuk redesign dashboard agregat (references/
 * school-culture-redesign/). DIHITUNG dari RANKING gap absolut antar 4 tipe yang sudah final
 * (terbesar -> "Perlu perhatian", terkecil -> "Selaras", dua di tengah -> "Ringan") -- BUKAN
 * skor/threshold baru, cuma mengurutkan angka gap yang sudah ada (preseden: gapTerbesar() di
 * useScData.js sudah melakukan hal serupa). Lihat dimensiStatus() di useScData.js. */
export type StatusBudaya = "Perlu perhatian" | "Ringan" | "Selaras";

/** Satu titik radar: skor satu tipe budaya, saat ini vs harapan, skala 0-100. Field opsional di
 * bawah (status..warnings) untuk redesign dashboard agregat (Budaya Kerja) -- SEMUA opsional
 * supaya laporan lama yang belum digenerate ulang dengan data lebih lengkap tetap valid, dan
 * supaya field yang genuinely belum tersedia dari pipeline manapun (indicators/warnings/
 * targetImpact) bisa dirender sebagai empty-state jujur, bukan dikarang. Lihat audit redesign SC
 * (percakapan) untuk daftar lengkap field yang masih data gap. */
export interface RadarBudayaPoint {
  tipe: TipeBudayaSekolah;
  saat_ini: number;
  harapan: number;
  /** Ranking gap, lihat StatusBudaya. */
  status?: StatusBudaya;
  /** Fallback statis dari scMeta.js TIPE_BUDAYA_INFO kalau narasi spesifik periode ini tidak
   * ada -- BUKAN data gap murni, cuma generik per-tipe bukan per-laporan. */
  descriptor?: string;
  interpretation?: string;
  focus?: string;
  /** Diisi dari prioritas_perbaikan yang fokus='budaya' dan cocok temanya, kalau ada. */
  priorityActions?: string[];
  /** Bentuknya SAMA dengan LangkahTimeline (lihat di bawah) -- SENGAJA tidak dipaksa jadi
   * "tepat 3 fase 30/60/90 hari" seperti reference, karena sumber datanya (tindak_lanjut.konkret)
   * tidak punya granularitas hari, cuma teks jangka bebas ("Minggu ini"/"Bulan ini"/dst). */
  phases?: LangkahTimeline[];
  targetImpact?: string;
  /** DATA GAP murni -- tidak ada di pipeline manapun sekarang, selalu undefined sampai ada
   * sumber datanya. Komponen WAJIB render empty-state, bukan array kosong diam-diam. */
  indicators?: { title: string; detail: string }[];
  warnings?: string[];
}

export interface TabelGapRow {
  label: string;
  arah: ArahGap;
  nilai_gap?: number;
}

export interface BagianBudaya {
  narasi: string;
  /** Selalu 4 entri, urutan tetap Kekeluargaan/Inovasi/Orientasi/Aturan. */
  chart_data: RadarBudayaPoint[];
  tabel_gap: TabelGapRow[];
}

/** Skala kualitatif 5-tingkat, dipakai kesejahteraan maupun profil organisasi. */
export type KategoriNilai = "Sangat Rendah" | "Rendah" | "Sedang" | "Tinggi" | "Sangat Tinggi";

/** Satu subdimensi kesejahteraan staf. Label persis 5 subdimensi di data olahan. Field opsional
 * di bawah (status..warnings) untuk dashboard Laporan Lembaga bagian "Kesejahteraan Tim" --
 * SAMA maknanya dengan field sejenis di RadarBudayaPoint, cuma di sini `status` diisi LANGSUNG
 * dari `kategori` yang sudah final (tidak ada konsep target/harapan/ranking gap untuk
 * kesejahteraan, beda dari budaya). */
export interface SubdimensiKesejahteraan {
  kode: string;
  label: string;
  nilai: number;
  kategori: KategoriNilai;
  status?: KategoriNilai;
  /** Breakdown butir mentah (b1-b13 di sheet Personal) yang membentuk skor subdimensi ini,
   * rata-rata lintas seluruh responden periode ini (lihat driverItemsKesejahteraan di
   * useScData.js). Skala 1-5 (bukan persen) supaya bisa dipakai rating bintang langsung, sama
   * pola dengan nilai_mentah di HeatmapCell. Opsional: laporan lama sebelum field ini ada, atau
   * sekolah yang jawaban_mentah-nya tidak punya kolom b1-b13, tetap valid tanpa breakdown ini. */
  items?: { label: string; nilai: number }[];
  /** Diisi dari prioritas_perbaikan yang fokus='kesejahteraan' dan cocok temanya, kalau ada. */
  priorityActions?: string[];
  phases?: LangkahTimeline[];
  targetImpact?: string;
  /** DATA GAP murni -- tidak ada di pipeline manapun sekarang. */
  indicators?: { title: string; detail: string }[];
  warnings?: string[];
}

export interface BagianKesejahteraan {
  narasi: string;
  indeks: number;
  kategori: KategoriNilai;
  chart_data: SubdimensiKesejahteraan[];
}

/**
 * Breakdown 6 dimensi OCAI (nilai_karakter_lembaga, nilai_kepemimpinan, nilai_management,
 * nilai_sinergi, nilai_fokus, nilai_performance di data olahan) -- rata-rata lintas keempat tipe
 * budaya per dimensi. TIDAK ADA di modul CW korporat, ditambahkan khusus SC atas instruksi
 * eksplisit pemilik produk supaya data ini ikut divisualkan, bukan cuma catatan struktur.
 */
export interface DimensiProfil {
  kode: string;
  label: string;
  nilai: number;
  kategori: KategoriNilai;
  /** Opsional: sheet Personal tidak punya ringkasan harapan siap pakai untuk profil organisasi
   * (beda dari budaya yang selalu punya mean_harapan_*) -- importer mengisi ini dari rata-rata
   * item mentah kalau tersedia (lihat buildDimensiHarapan di scImporter.js). Laporan lama yang
   * di-generate sebelum field ini ada tetap valid, cuma tidak tampilkan baris harapan/gap. */
  harapan?: number;
  gap?: number;
  /** Padanan status di RadarBudayaPoint/SubdimensiKesejahteraan, diisi dari `kategori`.
   * priorityActions/phases/targetImpact SELALU undefined untuk dimensi ini -- skema
   * tindak_lanjut tidak punya fokus='organisasi' sama sekali (lihat cocokkanTlKeLabel di
   * useScData.js), bukan berarti belum sempat dicocokkan. */
  status?: KategoriNilai;
  priorityActions?: string[];
  phases?: LangkahTimeline[];
  targetImpact?: string;
  indicators?: { title: string; detail: string }[];
  warnings?: string[];
}

export interface BagianProfilOrganisasi {
  narasi: string;
  /** Selalu 6 entri: karakter_lembaga, kepemimpinan, management, sinergi, fokus, performance. */
  chart_data: DimensiProfil[];
}

export interface ScFooter {
  disclaimer: string;
}

/**
 * Demografi responden. Nama field ikut persis data olahan (unit/jenjang/peran_kerja), beda dari
 * cw.types.ts yang pakai "jabatan" -- sekolah tidak selalu punya jabatan formal per staf, yang
 * ada peran kerja (Guru/Tenaga Kependidikan/Pimpinan Unit/Lainnya) dan jenjang penempatan.
 */
export interface ScMeta {
  responden_id: string;
  nama_responden: string;
  /** Mis. "Guru", "Tenaga Kependidikan", "Pimpinan Unit", "Lainnya". */
  peran_kerja?: string;
  /** Unit/biro kerja, mis. "Kurikulum SD", "Tata Usaha". */
  unit?: string;
  /** Jenjang penempatan, mis. "SD", "SMP", "SMA/SMK", "Non-Jenjang (TU, Kantor Yayasan)". */
  jenjang?: string;
  organisasi_id: string;
  /** Format "YYYY-MM". */
  periode_id: string;
}

/** Satu langkah tindak lanjut pribadi -- ASUMSI, sama alasannya dengan AksiPribadi di cw.types.ts. */
export interface AksiPribadi {
  id: string;
  judul: string;
  alasan: string;
  terkait: string;
  jangka: string;
  ikon: string;
}

/** Empat jawaban esai VERBATIM (satu huruf pun tidak diubah dari isian staf sendiri), dipetakan
 * langsung dari sc_personal.essay -- BEDA dari bagian_cermin (yang membaurkan sebagian jawaban
 * ini dengan konteks tulisan Gemini jadi satu paragraf). Dipakai laporan individu REMAKE TOTAL
 * (rombak "Jawaban Survey Anda" + kartu "Perubahan yang Anda harapkan" di hero) atas instruksi
 * eksplisit pemilik produk, screenshot referensi. Optional per field: staf boleh mengosongkan
 * jawaban esai apa pun, komponen WAJIB render status kosong yang jujur, bukan string kosong. */
export interface JawabanSurveyIndividu {
  betah?: string;
  hal_menguras_energi?: string;
  yang_ingin_disampaikan?: string;
  yang_ingin_diubah?: string;
}

/** Struktur penuh satu laporan individu SC. */
export interface LaporanIndividuSC {
  meta: ScMeta;
  header: ScHeader;
  bagian_budaya: BagianBudaya;
  bagian_kesejahteraan: BagianKesejahteraan;
  bagian_profil_organisasi: BagianProfilOrganisasi;
  bagian_cermin: string;
  bagian_refleksi: string;
  /** Opsional: cuma terisi untuk laporan yang digenerate ulang sesudah field ini ditambahkan
   * (generate-sc-individu/index.ts) -- laporan lama tetap valid tanpa section "Jawaban Survey
   * Anda" versi verbatim ini. */
  jawaban_survey?: JawabanSurveyIndividu;
  rencana_aksi?: AksiPribadi[];
  footer: ScFooter;
}

/* ============================================================================================
 * LAPORAN AGREGAT (Pimpinan/Yayasan/Kepsek)
 * ============================================================================================ */

export interface ScMetaAgregat {
  organisasi_id: string;
  organisasi_nama: string;
  periode_id: string;
  jumlah_responden: number;
}

/** Satu unit kerja sekolah (mis. "SD", "SMP", "Tata Usaha & Kantor Yayasan"). */
export interface PerbandinganUnitRow {
  unit: string;
  jumlah_responden: number;
  budaya_dominan: TipeBudayaSekolah;
  indeks_kesejahteraan: number;
  kategori_kesejahteraan: KategoriNilai;
}

export interface PerbandinganAntarunit {
  narasi: string;
  rows: PerbandinganUnitRow[];
}

/** Fase D item 12: satu tema hasil pengelompokan Gemini atas jawaban esai staf (Q3/Q5/Q6
 * digabung), sudah lewat gerbang approve briefing (ApprovalDrawer.jsx) sebelum tampil di sini. */
export interface TemaEsai {
  tema: string;
  ringkasan: string;
  jumlah_mention: number;
}

/** Section "01-E" (Cerita dari Para Pegawai, khusus bagian Budaya Kerja): dua daftar kalimat
 * SINTESIS Gemini (bukan verbatim) dari jawaban esai Q2 (gambaran tempat kerja saat ini) dan Q3
 * (yang ingin diubah), sudah lewat gerbang approve briefing sebelum tampil di sini -- lihat
 * SYSTEM_INSTRUCTION_SC_BRIEFING untuk aturan anti-identifikasi yang lebih ketat dari tema_esai. */
export interface CeritaPegawai {
  saat_ini: string[];
  ingin_diubah: string[];
}

/** Satu langkah dalam timeline prioritas perbaikan (Fase E item 13) -- waktu = jangka bebas dari
 * Gemini (mis. "Minggu ini", "Bulan ini", "3 bulan"), bukan angka hari yang dikarang. */
export interface LangkahTimeline {
  aksi: string;
  waktu?: string | null;
}

export interface PrioritasPerbaikan {
  peringkat: 1 | 2 | 3;
  action: string;
  trigger_desc: string;
  area: string;
  langkah?: LangkahTimeline[];
  dampak?: string;
}

/** Satu tally % per tipe budaya -- dipakai pie_dominan (jumlah/persen responden dominan tipe
 * itu) dan sebagai baris distribusi_arah (persen naik/tetap/turun). */
export interface TallyTipe {
  tipe: TipeBudayaSekolah;
  jumlah?: number;
  persen: number;
}

export interface DistribusiArahRow {
  tipe: TipeBudayaSekolah;
  naik: number;
  tetap: number;
  turun: number;
}

/** Sebaran nilai satu subdimensi kesejahteraan, satu angka per responden (anonim) -- bahan
 * strip/dot plot. */
export interface SebaranSubdimensi {
  kode: string;
  label: string;
  nilai: number[];
}

export interface TallyKategori {
  kategori: KategoriNilai;
  jumlah: number;
  persen: number;
}

export interface HeatmapCell {
  dimensi: string;
  tipe: TipeBudayaSekolah;
  nilai: number | null;
  /** Skala 1-5 mentah (bukan persen) -- dipakai 01-D untuk rating bintang, hindari round-trip
   * pembulatan persen->5. Opsional: cell lama sebelum field ini ada tetap valid. */
  nilai_mentah?: number | null;
}

/** Satu titik scatter (Fase D, Blueprint bagian 3 Level 6): tipe budaya dominan staf itu vs
 * indeks kesejahteraan gabungannya, anonim. */
export interface ScatterPoint {
  tipe_dominan: TipeBudayaSekolah;
  indeks: number;
}

/**
 * Insight tambahan (Blueprint School Culture v2 bagian 3, Level 2/3/4/5) -- dihitung sebagai
 * SEBARAN/TALLY dari sc_personal, bukan bagian skema asli LaporanAgregatSC. Opsional: data mock
 * lama / laporan yang dibuat sebelum field ini ada tetap valid tanpa section-section ini.
 */
export interface AnalisisSc {
  pie_dominan: TallyTipe[];
  distribusi_arah: DistribusiArahRow[];
  sebaran_wellbeing: SebaranSubdimensi[];
  donut_kategori_wellbeing: TallyKategori[];
  heatmap: HeatmapCell[];
  scatter_budaya_wellbeing: ScatterPoint[];
  jumlah_responden_dianalisis: number;
}

/** Struktur penuh laporan agregat/pimpinan SC satu sekolah/yayasan satu periode. */
export interface LaporanAgregatSC {
  meta: ScMetaAgregat;
  header: ScHeader;
  bagian_budaya: BagianBudaya;
  bagian_kesejahteraan: BagianKesejahteraan;
  bagian_profil_organisasi: BagianProfilOrganisasi;
  perbandingan_antarunit: PerbandinganAntarunit;
  prioritas_perbaikan: PrioritasPerbaikan[];
  footer: ScFooter;
  analisis?: AnalisisSc;
  /** Opsional: baru terisi kalau briefing periode ini sudah digenerate ulang sesudah Fase D
   * (draf lama sebelum kolom tema_esai ada tetap valid tanpa section ini). */
  tema_esai?: TemaEsai[];
  /** Opsional: baru terisi kalau briefing periode ini sudah digenerate ulang sesudah section
   * 01-E ditambahkan. */
  cerita_pegawai?: CeritaPegawai | null;
  /** Fase E item 14: tren indeks kesejahteraan lintas periode (level sekolah, bukan per unit).
   * Satu entri kalau baru satu periode -- komponen tampil menunggu periode kedua sendiri. */
  tren_kesejahteraan?: { periode_id: string; indeks: number | null }[];
  /** Kapan laporan ini terakhir disetujui/digenerate -- untuk redesign dashboard agregat,
   * padanan `generatedAt` reference. Diambil dari briefing.created_at/sc_hasil.generated_at. */
  generated_at?: string | null;
  /** Empat field di bawah ini DATA GAP MURNI (padanan actionOwner/reviewCadence/targetDate/
   * nextReview reference) -- tidak ada konsep pemilik program/cadence/tanggal target di skema
   * SC manapun sekarang (tidak di tindak_lanjut, tidak di briefing). Selalu undefined sampai ada
   * keputusan produk soal di mana ini disimpan/di-assign. Komponen WAJIB render empty-state. */
  action_owner?: string | null;
  review_cadence?: string | null;
  target_date?: string | null;
  next_review?: string | null;
}
