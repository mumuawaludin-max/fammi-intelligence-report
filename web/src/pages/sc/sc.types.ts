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

/** Satu titik radar: skor satu tipe budaya, saat ini vs harapan, skala 0-100. */
export interface RadarBudayaPoint {
  tipe: TipeBudayaSekolah;
  saat_ini: number;
  harapan: number;
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

/** Satu subdimensi kesejahteraan staf. Label persis 5 subdimensi di data olahan. */
export interface SubdimensiKesejahteraan {
  kode: string;
  label: string;
  nilai: number;
  kategori: KategoriNilai;
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

/** Struktur penuh satu laporan individu SC. */
export interface LaporanIndividuSC {
  meta: ScMeta;
  header: ScHeader;
  bagian_budaya: BagianBudaya;
  bagian_kesejahteraan: BagianKesejahteraan;
  bagian_profil_organisasi: BagianProfilOrganisasi;
  bagian_cermin: string;
  bagian_refleksi: string;
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
  /** Fase E item 14: tren indeks kesejahteraan lintas periode (level sekolah, bukan per unit).
   * Satu entri kalau baru satu periode -- komponen tampil menunggu periode kedua sendiri. */
  tren_kesejahteraan?: { periode_id: string; indeks: number | null }[];
}
