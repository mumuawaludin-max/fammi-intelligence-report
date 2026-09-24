// Aturan penyajian modul Screening Awal Wellbeing.
//
// Tidak ada satu pun fungsi di sini yang menghitung skor. Semua angka (subskala, indeks, gap,
// pola, skor prioritas) sudah final dari berkas olahan. Yang dikerjakan di sini hanya:
// memilih apa yang boleh tampil untuk peran tertentu, memberi label kategori pada angka final,
// menyusun lencana dari penanda yang sudah ada, menghitung jumlah orang, dan menyusun kalimat.

import {
  ALASAN, ASUMSI_BAWAAN, BARIS_SKOR, INDEKS, JALUR, KATEGORI_BAWAAN, KEBUTUHAN, SUBSKALA, URUTAN_PROFIL,
  labelJalur, labelKebutuhan, labelPola,
} from "./swMeta.js";

// ── Format angka ────────────────────────────────────────────────────────────────────────────

export function formatAngka(n, digit = 1) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "-";
  return Number(n).toLocaleString("id-ID", { maximumFractionDigits: digit, minimumFractionDigits: 0 });
}

/** `porsi` 0-1 -> "34%". */
export function formatPersen(porsi, digit = 0) {
  if (porsi === null || porsi === undefined || Number.isNaN(Number(porsi))) return "-";
  return `${formatAngka(Number(porsi) * 100, digit)}%`;
}

export function porsi(bagian, total) {
  return total > 0 ? bagian / total : 0;
}

/** "2026-09" -> "September 2026". */
export function labelPeriode(periodeId) {
  if (!periodeId) return "";
  const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const [y, m] = String(periodeId).split("-").map(Number);
  return `${BULAN[m - 1] || ""} ${y}`.trim();
}

// ── Asumsi ──────────────────────────────────────────────────────────────────────────────────

/** Asumsi dataset digabung dengan bawaan, supaya kunci yang belum ada di berkas tetap terisi. */
export function lengkapiAsumsi(asumsi) {
  const a = asumsi || {};
  return {
    ...ASUMSI_BAWAAN,
    ...a,
    bobotDenganPengamatan: { ...ASUMSI_BAWAAN.bobotDenganPengamatan, ...(a.bobotDenganPengamatan || {}) },
    bobotTanpaPengamatan: { ...ASUMSI_BAWAAN.bobotTanpaPengamatan, ...(a.bobotTanpaPengamatan || {}) },
    labelGap: { ...ASUMSI_BAWAAN.labelGap, ...(a.labelGap || {}) },
    harapanDatar: { ...ASUMSI_BAWAAN.harapanDatar, ...(a.harapanDatar || {}) },
    qcPimpinan: { ...ASUMSI_BAWAAN.qcPimpinan, ...(a.qcPimpinan || {}) },
    kategori: Array.isArray(a.kategori) && a.kategori.length === 5 ? a.kategori : ASUMSI_BAWAAN.kategori,
  };
}

// ── Kategori kondisi ────────────────────────────────────────────────────────────────────────

/** Kategori tampilan (label + warna) dengan batas dari asumsi. */
export function daftarKategori(asumsi) {
  const batas = lengkapiAsumsi(asumsi).kategori;
  return KATEGORI_BAWAAN.map((k) => {
    const b = batas.find((x) => x.kunci === k.kunci);
    return b ? { ...k, min: b.min, max: b.max } : k;
  });
}

/**
 * Kategori untuk satu angka final 0-100. Batas bawah inklusif; angka pecahan di antara dua
 * batas bulat (mis. 58,6) masuk kategori yang batas bawahnya sudah dilewati.
 */
export function kategoriKondisi(nilai, asumsi) {
  if (nilai === null || nilai === undefined || Number.isNaN(Number(nilai))) return null;
  const daftar = daftarKategori(asumsi);
  let hasil = daftar[0];
  for (const k of daftar) if (Number(nilai) >= k.min) hasil = k;
  return hasil;
}

/**
 * Histogram nilai ({"62.5": 40, ...}) dikelompokkan ke lima kategori. Histogram disimpan per
 * nilai, bukan per kategori, supaya batas kategori bisa diubah di Panel Asumsi tanpa pengolahan
 * ulang.
 */
export function sebaranKategori(histogram, asumsi) {
  const hasil = Object.fromEntries(daftarKategori(asumsi).map((k) => [k.kunci, 0]));
  for (const [nilai, jumlah] of Object.entries(histogram || {})) {
    const k = kategoriKondisi(Number(nilai), asumsi);
    if (k) hasil[k.kunci] += jumlah;
  }
  return hasil;
}

export function labelKeselarasan(gap, asumsi) {
  if (gap === null || gap === undefined) return null;
  const { selaras, ringan, sedang } = lengkapiAsumsi(asumsi).labelGap;
  if (gap <= selaras) return "Selaras";
  if (gap <= ringan) return "Ringan";
  if (gap <= sedang) return "Sedang";
  return "Signifikan";
}

// ── Peran dan hak lihat ─────────────────────────────────────────────────────────────────────

export const PERAN_SW = ["yayasan", "kepalaUnit", "hc", "pegawai"];

/** Peran modul dari nilai profiles.peran. Peran lain tidak punya akses ke modul ini. */
export function peranSw(session) {
  switch (session?.peran) {
    case "Yayasan": return "yayasan";
    case "KepalaUnit": return "kepalaUnit";
    case "HumanCapital": return "hc";
    case "Pegawai": return "pegawai";
    default: return null;
  }
}

const HAK = {
  yayasan: ["tab.ringkasan", "tab.daftar", "tab.peta", "tab.pimpinan", "tab.suara"],
  kepalaUnit: ["tab.ringkasan", "tab.daftar", "tab.peta", "tab.suara"],
  hc: [
    "tab.ringkasan", "tab.daftar", "tab.profil", "tab.peta", "tab.pimpinan", "tab.suara",
    "daftar.nama", "profil.tinjauan", "profil.cari", "pimpinan.qc",
  ],
  pegawai: ["tab.profil"],
};

export function bolehLihat(peran, fitur) {
  return Boolean(HAK[peran]?.includes(fitur));
}

// ── Ambang penyajian unit ───────────────────────────────────────────────────────────────────

/**
 * Satu-satunya aturan ambang penyajian unit, dipakai semua layar. Sejak 2026-09-17 (keputusan
 * pemilik produk: laporan harus utuh, unit yang hilang dari daftar memancing pertanyaan) unit
 * dengan pengisi kurang dari minPengisiUnit tetap tampil bagi Yayasan, Human Capital, dan kepala
 * unit (yang terakhir hanya unitnya sendiri, dibatasi di siapkanDataUntukPeran). Ambang cuma
 * berlaku untuk pegawai: unit kecil tidak dipakai sebagai pembanding laporan pribadinya.
 */
export function unitBolehTampil(unit, peran, asumsi) {
  if (!unit) return false;
  if (peran !== "pegawai") return true;
  return !unitKecil(unit, asumsi);
}

export function saringUnitTampil(units, peran, asumsi) {
  return (units || []).filter((u) => unitBolehTampil(u, peran, asumsi));
}

/** Jumlah unit kecil dalam daftar yang sedang tampil, untuk catatan "angkanya mudah berubah". */
export function jumlahUnitKecil(units, asumsi) {
  return (units || []).filter((u) => unitKecil(u, asumsi)).length;
}

export function unitKecil(unit, asumsi) {
  return (unit?.nPengisi ?? 0) < lengkapiAsumsi(asumsi).minPengisiUnit;
}

// ── Lencana alasan ──────────────────────────────────────────────────────────────────────────

/**
 * Lencana alasan satu orang, urutan tetap mengikuti ALASAN. Satu orang bisa punya beberapa
 * alasan sekaligus. Semua penanda dibaca dari kolom final: Permintaan, K15, T_Fungsi, angka
 * kondisi, Gap_Harapan, Pola, dan Jalur. Kolom Penanda di sheet 05 hanya menyimpan SATU alasan
 * utama per orang, jadi tidak dipakai di sini.
 */
export function susunAlasan(individu, asumsi) {
  if (!individu) return [];
  const a = lengkapiAsumsi(asumsi);
  const ada = {
    minta: individu.permintaan === "ya",
    atasan: individu.pengamatan?.indikator?.includes("K15") === true,
    fungsi: typeof individu.skor?.fungsi === "number" && individu.skor.fungsi < a.ambangFungsi,
    ragu: individu.permintaan === "mungkin",
    datar: typeof individu.kondisi === "number" && typeof individu.gapHarapan === "number"
      && individu.kondisi <= a.harapanDatar.kondisiMaks && individu.gapHarapan <= a.harapanDatar.gapMaks,
    tekanan: individu.pola === "tekanan",
    wakil: individu.peserta?.jalur === "kuota",
  };
  return ALASAN.filter((x) => ada[x.kunci]).map((x) => x.kunci);
}

/**
 * Jumlah ORANG per alasan. Tiap alasan dihitung sendiri-sendiri, jadi jumlah seluruh kartu bisa
 * melebihi jumlah peserta. Alasan bernilai nol tetap ada di hasil.
 */
export function hitungAlasan(daftar, asumsi) {
  const hasil = Object.fromEntries(ALASAN.map((x) => [x.kunci, 0]));
  for (const orang of daftar || []) for (const k of susunAlasan(orang, asumsi)) hasil[k] += 1;
  return hasil;
}

/** Satu kalimat pendek kenapa satu alasan bernilai nol. */
export function penjelasNol(kunci, { asumsi, unit = null } = {}) {
  const a = lengkapiAsumsi(asumsi);
  switch (kunci) {
    case "minta": return "Belum ada yang meminta dibantu.";
    case "atasan": return "Belum ada laporan dari atasan.";
    case "fungsi": return `Belum ada skor di bawah ${formatAngka(a.ambangFungsi)}.`;
    case "ragu": return "Belum ada yang menjawab \"mungkin\".";
    case "datar": return "Belum ada yang mengira akan tetap berat.";
    case "tekanan": return "Belum ada atau belum dinilai.";
    case "wakil":
      if (!unit) return "Semua unit sudah terwakili.";
      return unit.kuotaPeserta === 0 ? "Unit ini tidak mendapat kursi perwakilan." : "Kursi unit ini terisi lewat alasan khusus.";
    default: return "";
  }
}

/**
 * Kalimat untuk unit tanpa satu pun peserta, supaya angka nol tidak terbaca sebagai data hilang.
 * Peserta masuk lewat penanda (minta sendiri, disampaikan atasan, dst.) atau kursi perwakilan
 * yang dibagi sebanding jumlah pengisi; unit kecil bisa mendapat nol kursi.
 */
export function kalimatTanpaPeserta(unit) {
  if (!unit) return "";
  const n = unit.nPengisi ?? 0;
  const awal = `Tidak ada dari ${n} pengisi yang meminta dibantu atau memenuhi penanda lain`;
  if (unit.kuotaPeserta === 0) {
    return `${awal}, dan unit ini tidak mendapat kursi perwakilan karena kursi dibagi sebanding jumlah pengisi.`;
  }
  return `${awal}.`;
}

// ── Perbandingan tiga lapis ─────────────────────────────────────────────────────────────────

function nilaiDari(sumber, kunci) {
  if (!sumber) return null;
  const v = kunci === INDEKS.kunci ? sumber.indeks : sumber.skor?.[kunci];
  return typeof v === "number" ? v : null;
}

function selisih(a, b) {
  return a === null || b === null ? null : Math.round((a - b) * 10) / 10;
}

/**
 * Nilai orang, rata-rata unit, dan rata-rata lembaga untuk lima subskala plus indeks.
 * `unit` boleh null (unit di bawah ambang untuk peran selain Human Capital); lapis unit lalu kosong.
 */
export function bandingTigaLapis(individu, unit, lembaga) {
  return BARIS_SKOR.map((s) => {
    const diri = nilaiDari(individu, s.kunci);
    const u = nilaiDari(unit, s.kunci);
    const l = nilaiDari(lembaga, s.kunci);
    return {
      kunci: s.kunci, label: s.label, diri, unit: u, lembaga: l,
      selisihUnit: selisih(diri, u), selisihLembaga: selisih(diri, l),
    };
  });
}

const AMBANG_SETARA = 1;

function posisi(selisihNilai) {
  if (selisihNilai === null) return null;
  if (Math.abs(selisihNilai) < AMBANG_SETARA) return "setara dengan";
  return selisihNilai < 0 ? "di bawah" : "di atas";
}

/**
 * Tiga kalimat di bawah grafik tiga lapis. Tidak memakai kata peringkat atau persentil.
 * Kalau lapis unit kosong, dua kalimat pertama membandingkan dengan lembaga.
 */
export function kalimatTigaLapis(baris) {
  const sub = baris.filter((b) => b.kunci !== INDEKS.kunci);
  const indeks = baris.find((b) => b.kunci === INDEKS.kunci);
  const adaUnit = sub.some((b) => b.unit !== null);
  const kunciSelisih = adaUnit ? "selisihUnit" : "selisihLembaga";
  const pembanding = adaUnit ? "rata-rata unit" : "rata-rata lembaga";
  const nilaiPembanding = (b) => (adaUnit ? b.unit : b.lembaga);

  const valid = sub.filter((b) => b[kunciSelisih] !== null);
  const bawah = valid.filter((b) => b[kunciSelisih] <= -AMBANG_SETARA).sort((a, b) => a[kunciSelisih] - b[kunciSelisih])[0];
  const atas = valid.filter((b) => b[kunciSelisih] >= AMBANG_SETARA).sort((a, b) => b[kunciSelisih] - a[kunciSelisih])[0];

  const k1 = bawah
    ? `Paling jauh di bawah ${pembanding}: ${bawah.label} (${formatAngka(bawah.diri)} vs ${formatAngka(nilaiPembanding(bawah))}).`
    : `Tidak ada aspek di bawah ${pembanding}.`;
  const k2 = atas
    ? `Paling jauh di atas ${pembanding}: ${atas.label} (${formatAngka(atas.diri)} vs ${formatAngka(nilaiPembanding(atas))}).`
    : `Tidak ada aspek di atas ${pembanding}.`;

  let k3 = "Skor total belum tersedia.";
  if (indeks && indeks.diri !== null) {
    const bagian = [];
    if (indeks.unit !== null) bagian.push(`${posisi(indeks.selisihUnit)} unit (${formatAngka(indeks.unit)})`);
    if (indeks.lembaga !== null) bagian.push(`${posisi(indeks.selisihLembaga)} lembaga (${formatAngka(indeks.lembaga)})`);
    k3 = `Skor total ${formatAngka(indeks.diri)}${bagian.length ? `: ${bagian.join(", ")}` : ""}.`;
  }
  return [k1, k2, k3];
}

// ── Kalimat temuan ringkasan ────────────────────────────────────────────────────────────────

function subskalaEkstrem(ringkas, arah) {
  const daftar = SUBSKALA.map((s) => ({ ...s, nilai: ringkas?.skor?.[s.kunci] }))
    .filter((s) => typeof s.nilai === "number");
  if (!daftar.length) return null;
  daftar.sort((a, b) => (arah === "tinggi" ? b.nilai - a.nilai : a.nilai - b.nilai));
  return daftar[0];
}

/** Subskala terendah (dipakai untuk garis tepi emas di kartu subskala). */
export function subskalaTerendah(ringkas) {
  return subskalaEkstrem(ringkas, "rendah")?.kunci || null;
}

/**
 * Dua kalimat temuan: sisi yang sudah kuat dan sisi yang perlu perhatian. Disusun dari angka
 * final dan tema terbanyak; tidak ada tafsir sebab akibat.
 */
export function susunTemuan(ringkas, { temaBertahan, temaMenguras } = {}) {
  const tinggi = subskalaEkstrem(ringkas, "tinggi");
  const rendah = subskalaEkstrem(ringkas, "rendah");
  const kekuatan = [];
  const perhatian = [];
  if (tinggi) kekuatan.push({ label: "Aspek tertinggi", isi: `${tinggi.pendek} ${formatAngka(tinggi.nilai)}` });
  if (temaBertahan) kekuatan.push({ label: "Membuat bertahan", isi: temaBertahan });
  if (rendah) perhatian.push({ label: "Aspek terendah", isi: `${rendah.pendek} ${formatAngka(rendah.nilai)}` });
  if (temaMenguras) perhatian.push({ label: "Paling menguras", isi: temaMenguras });
  return { kekuatan, perhatian };
}

// ── Kebutuhan dukungan ──────────────────────────────────────────────────────────────────────

/** Tiga kebutuhan terbanyak dari hitungan {kunci: jumlah}; seri diputus urutan KEBUTUHAN. */
export function kebutuhanTeratas(hitungan, n = 3) {
  return KEBUTUHAN.map((k, i) => ({ kunci: k.kunci, label: labelKebutuhan(k.kunci), jumlah: hitungan?.[k.kunci] || 0, i }))
    .filter((k) => k.jumlah > 0)
    .sort((a, b) => b.jumlah - a.jumlah || a.i - b.i)
    .slice(0, n)
    .map(({ i: _i, ...k }) => k);
}

// ── Daftar rekomendasi ──────────────────────────────────────────────────────────────────────

export const SARINGAN_KOSONG = {
  alasan: "", unit: "", kelompok: "", jenjang: "", jalur: "", pola: "", status: "",
};

/** Status data pengamatan satu orang. */
export function statusData(individu) {
  return individu?.pengamatan ? "lengkap" : "diri";
}

export const LABEL_STATUS_DATA = {
  lengkap: "Diri + atasan",
  diri: "Isian diri saja",
};

/** Saring daftar peserta. Semua saringan bisa digabung; string kosong berarti tidak disaring. */
export function saringPeserta(daftar, saringan, { units = [], asumsi } = {}) {
  const s = { ...SARINGAN_KOSONG, ...(saringan || {}) };
  const kelompokUnit = Object.fromEntries(units.map((u) => [u.id, u.kelompok]));
  return (daftar || []).filter((o) => {
    if (s.alasan && !susunAlasan(o, asumsi).includes(s.alasan)) return false;
    if (s.unit && o.unitId !== s.unit) return false;
    if (s.kelompok && kelompokUnit[o.unitId] !== s.kelompok) return false;
    if (s.jenjang && (o.jenjang || "Tanpa jenjang") !== s.jenjang) return false;
    if (s.jalur && o.peserta?.jalur !== s.jalur) return false;
    if (s.pola && (o.pola || "tanpa") !== s.pola) return false;
    if (s.status && statusData(o) !== s.status) return false;
    return true;
  });
}

/**
 * Urutan daftar peserta. Bawaan: unit lalu nama. Skor prioritas hanya dipakai kalau pengguna
 * memilihnya sendiri, dan tetap diputus unit lalu nama supaya urutannya stabil.
 * Kunci "prioritas" (tampilan Semua pegawai): peserta asesmen lanjutan lebih dulu, lalu skor
 * prioritas final dari berkas, tertinggi dulu; arah "turun" membalik keduanya.
 */
export function urutPeserta(daftar, { kunci = "unit", arah = "naik", namaUnit = {} } = {}) {
  const kali = arah === "turun" ? -1 : 1;
  const unitNama = (o) => namaUnit[o.unitId] || o.unitId || "";
  const dasar = (a, b) => unitNama(a).localeCompare(unitNama(b), "id") || a.nama.localeCompare(b.nama, "id");
  return [...(daftar || [])].sort((a, b) => {
    if (kunci === "prioritas") {
      return kali * ((b.peserta ? 1 : 0) - (a.peserta ? 1 : 0) || (b.spa ?? -1) - (a.spa ?? -1)) || dasar(a, b);
    }
    if (kunci === "spa") return kali * ((a.spa ?? -1) - (b.spa ?? -1)) || dasar(a, b);
    if (kunci === "nama") return kali * a.nama.localeCompare(b.nama, "id") || dasar(a, b);
    return kali * dasar(a, b);
  });
}

// ── Semua pegawai (Human Capital) ───────────────────────────────────────────────────────────

/** Pilihan urutan tampilan Semua pegawai. Bawaan: prioritas, supaya peserta unit itu di atas. */
export const URUTAN_SEMUA = [
  { nilai: "prioritas", label: "Prioritas (peserta di atas)" },
  { nilai: "unit", label: "Unit lalu nama" },
  { nilai: "nama", label: "Nama" },
];

/** Semua pegawai, peserta maupun bukan, disaring satu unit. String kosong berarti semua unit. */
export function saringPegawai(daftar, unitId = "") {
  return (daftar || []).filter((o) => !unitId || o.unitId === unitId);
}

/** Opsi saringan unit berisi jumlah pegawai, diurutkan menurut nama unit. */
export function opsiUnitPegawai(units, daftar) {
  const jumlah = {};
  for (const o of daftar || []) jumlah[o.unitId] = (jumlah[o.unitId] || 0) + 1;
  return (units || [])
    .filter((u) => jumlah[u.id])
    .map((u) => ({ nilai: u.id, label: `${u.nama} (${jumlah[u.id]})` }))
    .sort((a, b) => a.label.localeCompare(b.label, "id"));
}

/** Kolom penanda di berkas Excel: "Ya" untuk yang masuk daftar 200 peserta. */
export const KOLOM_PESERTA = "Peserta asesmen lanjutan";

/**
 * Urutan kolom berkas Excel "Semua pegawai": kolom tabel di layar, plus nomor dan kolom penanda
 * peserta tepat setelah nama (barisnya juga diberi warna, lihat swEkspor.js).
 */
export const KOLOM_EKSPOR_PEGAWAI = [
  "No", "Nama", KOLOM_PESERTA, "Unit", "Jabatan", "Jenjang", "Alasan", "Pandangan atasan", "Cara masuk", "Sumber data",
];

/**
 * Baris berkas Excel dari daftar yang SUDAH disaring dan diurutkan di layar, jadi isi berkas
 * persis yang sedang dilihat. Tidak ada skor prioritas: angkanya internal dan tidak ikut keluar;
 * prioritas hanya terbaca dari urutan baris.
 */
export function barisEksporPegawai(daftar, { namaUnit = {}, asumsi } = {}) {
  return (daftar || []).map((o, i) => ({
    No: i + 1,
    Nama: o.nama,
    [KOLOM_PESERTA]: o.peserta ? "Ya" : "Tidak",
    Unit: namaUnit[o.unitId] || o.unitId || "",
    Jabatan: o.jabatan || "",
    Jenjang: o.jenjang || "-",
    Alasan: susunAlasan(o, asumsi).map((k) => ALASAN.find((a) => a.kunci === k)?.label || k).join(", "),
    "Pandangan atasan": labelPola(o.pola),
    "Cara masuk": o.peserta ? labelJalur(o.peserta.jalur) : "-",
    "Sumber data": LABEL_STATUS_DATA[statusData(o)],
  }));
}

/** Potongan nama berkas: huruf kecil, tanpa spasi atau tanda baca. */
function slug(teks) {
  return String(teks || "")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Nama berkas unduhan, mis. "daftar-pegawai_yayasan-athirah_asrama-athirah-baruga_2026-09.xlsx". */
export function namaBerkasEkspor({ lembaga, unitNama, periodeId }) {
  const bagian = ["daftar-pegawai", slug(lembaga), unitNama ? slug(unitNama) : "semua-unit", slug(periodeId)].filter(Boolean);
  return `${bagian.join("_")}.xlsx`;
}

// ── Penyaring data per peran ────────────────────────────────────────────────────────────────

/**
 * Potong dataset sesuai peran. Di produksi RLS Supabase sudah menyaring baris; fungsi ini
 * penjaga kedua di React dan satu-satunya penjaga pada halaman pratinjau yang memakai berkas
 * data contoh. `akses` = { peran, unitId, individuId }.
 */
export function siapkanDataUntukPeran(dataset, akses) {
  if (!dataset) return null;
  const { peran, unitId, unitIds, individuId } = akses || {};
  const asumsi = lengkapiAsumsi(dataset.asumsi);
  const base = { ...dataset, asumsi };

  if (peran === "hc") return base;

  if (peran === "pegawai") {
    const diri = (dataset.individu || []).filter((o) => o.id === individuId);
    const unitAsal = diri[0] ? (dataset.unit || []).find((u) => u.id === diri[0].unitId) : null;
    const unitDiri = unitAsal && !unitKecil(unitAsal, asumsi) ? [unitAsal] : [];
    return {
      ...base,
      individu: diri,
      unit: unitDiri,
      unitSendiri: unitAsal ? { id: unitAsal.id, nama: unitAsal.nama } : null,
      unitKecilMilikSendiri: Boolean(unitAsal) && unitKecil(unitAsal, asumsi),
      tema: null,
      ringkasanPimpinan: [],
      lembaga: ringkasLembagaUntukPegawai(dataset.lembaga),
    };
  }

  const tanpaNama = { ...base, individu: [], ringkasanPimpinan: dataset.ringkasanPimpinan || [] };

  if (peran === "yayasan") {
    return {
      ...tanpaNama,
      unit: (dataset.unit || []).map(tanpaQc),
      tema: dataset.tema,
    };
  }

  if (peran === "kepalaUnit") {
    // Pimpinan (Direktur/Wakil Direktur) punya beberapa unit binaan; kepala unit biasa satu.
    const boleh = new Set(unitIds?.length ? unitIds : [unitId]);
    const milik = (dataset.unit || [])
      .filter((u) => boleh.has(u.id))
      .sort((a, b) => (a.nama || "").localeCompare(b.nama || "", "id"))
      .map(tanpaQcDanPimpinan);
    return {
      ...tanpaNama,
      unit: milik,
      tema: temaUntukUnit(dataset.tema, milik.map((u) => u.id)),
      ringkasanPimpinan: [],
    };
  }

  return { ...base, individu: [], unit: [], tema: null, ringkasanPimpinan: [] };
}

function tanpaQc(unit) {
  if (!unit.pengamatan) return unit;
  const { qc: _qc, ...sisa } = unit.pengamatan;
  return { ...unit, pengamatan: sisa };
}

function tanpaQcDanPimpinan(unit) {
  if (!unit.pengamatan) return unit;
  const { qc: _qc, pimpinan: _p, ...sisa } = unit.pengamatan;
  return { ...unit, pengamatan: sisa };
}

function temaUntukUnit(tema, unitIds) {
  if (!tema) return null;
  const boleh = new Set(unitIds);
  const silang = tema.silangMenguras
    ? { ...tema.silangMenguras, baris: tema.silangMenguras.baris.filter((b) => boleh.has(b.unitId)) }
    : null;
  return { ...tema, silangMenguras: silang };
}

/** Pegawai cuma butuh angka pembanding lembaga, bukan rincian pengamatan atau peserta. */
function ringkasLembagaUntukPegawai(lembaga) {
  if (!lembaga) return null;
  const { indeks, skor, kondisi, kebutuhan, nPengisi } = lembaga;
  return { indeks, skor, kondisi, kebutuhan, nPengisi };
}

// ── Pembantu tampilan lain ──────────────────────────────────────────────────────────────────

/** Komposisi jalur dengan urutan tetap dan nol tetap ada. */
export function komposisiJalur(perJalur) {
  return JALUR.map((j) => ({ ...j, jumlah: perJalur?.[j.kunci] || 0 }));
}

/** Hitungan jumlah {kunci: n} jadi baris bar, dengan porsi terhadap `total`. */
export function barisHitungan(daftarMeta, hitungan, total) {
  return daftarMeta.map((m) => {
    const jumlah = hitungan?.[m.kunci] || 0;
    return { ...m, jumlah, porsi: porsi(jumlah, total) };
  });
}

/** Cari individu berdasarkan nama, tanpa peduli huruf besar dan gelar. */
export function cariIndividu(daftar, kata, batas = 12) {
  const q = (kata || "").trim().toLowerCase();
  if (q.length < 2) return [];
  return (daftar || []).filter((o) => o.nama.toLowerCase().includes(q)).slice(0, batas);
}

/**
 * Urutan daftar pegawai di pemilih Profil Pegawai (lihat URUTAN_PROFIL). Orang yang tidak punya
 * angka untuk kunci itu ditaruh paling bawah; seri diputus nama.
 */
export function urutIndividu(daftar, kunci = "nama") {
  const u = URUTAN_PROFIL.find((x) => x.kunci === kunci) || URUTAN_PROFIL.at(-1);
  const kali = u.arah === "turun" ? -1 : 1;
  return [...(daftar || [])].sort((a, b) => {
    const va = u.nilai(a);
    const vb = u.nilai(b);
    const adaA = typeof va === "number";
    const adaB = typeof vb === "number";
    if (adaA !== adaB) return adaA ? -1 : 1;
    if (adaA && va !== vb) return kali * (va - vb);
    return a.nama.localeCompare(b.nama, "id");
  });
}

/** Nilai yang sedang diurutkan untuk ditampilkan di samping nama. */
export function nilaiUrutan(individu, kunci) {
  const u = URUTAN_PROFIL.find((x) => x.kunci === kunci);
  if (!u || kunci === "nama") return null;
  const v = u.nilai(individu);
  return typeof v === "number" ? { nilai: v, satuan: u.satuan } : null;
}
