import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { latestPeriode } from "../karakter/karakterMeta";

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
function periodeLabel(periodeId) {
  if (!periodeId) return "";
  const [y, m] = String(periodeId).split("-").map(Number);
  return `${BULAN[m - 1] || ""} ${y}`.trim();
}

/** Rata-rata sederhana, bulat -- dipakai HANYA untuk angka "indeks" ringkasan tampilan (bukan
 * kategori/status baru), sama prinsipnya dengan rataRata() di generate-sc-individu/index.ts.
 * Kategori kualitatif untuk angka gabungan ini SENGAJA tidak dihitung di sini -- lihat
 * "parameter terbuka" #2 di docs/Kerangka_School_Culture_FIR.md. */
function rataRata(nilai) {
  const valid = (nilai || []).filter((n) => Number.isFinite(n));
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

/** Tipe budaya dengan mean_gambaran tertinggi dari satu baris sc_lembaga/sc_personal.budaya. */
function budayaDominan(budaya) {
  return (budaya || []).reduce((acc, b) => (acc == null || (b.mean_gambaran ?? 0) > (acc.mean_gambaran ?? 0) ? b : acc), null);
}

/** Gap dengan selisih absolut terbesar. */
function gapTerbesar(budaya) {
  return [...(budaya || [])].sort((a, b) => Math.abs(b.gap ?? 0) - Math.abs(a.gap ?? 0))[0] || null;
}

function ekstrem(items) {
  const list = items || [];
  if (list.length === 0) return { terendah: null, tertinggi: null };
  const sorted = [...list].sort((a, b) => (a.nilai ?? 0) - (b.nilai ?? 0));
  return { terendah: sorted[0], tertinggi: sorted[sorted.length - 1] };
}

function arahDariGap(gap) {
  if (gap == null || gap === 0) return "tetap";
  return gap > 0 ? "naik" : "turun";
}

/** Ambang tampilan (T-score 0-100, dari blueprint School Culture v2 bagian 0.1: 0-24 Sangat
 * Rendah / 25-41 Rendah / 42-58 Sedang / 59-74 Tinggi / 75-100 Sangat Tinggi) -- dipakai HANYA
 * untuk mengisi kategori kualitatif level individu yang selama ini null (sheet Personal tidak
 * menyediakan predikat untuk profil_organisasi/kesejahteraan per orang, beda dari sheet
 * Lembaga). Tidak mengubah nilai yang sudah final, cuma memberi label pada angka yang sudah ada
 * -- lihat "parameter terbuka" #1/#2 di docs/Kerangka_School_Culture_FIR.md. */
function kategoriDariNilai(nilai) {
  if (nilai == null) return null;
  if (nilai <= 24) return "Sangat Rendah";
  if (nilai <= 41) return "Rendah";
  if (nilai <= 58) return "Sedang";
  if (nilai <= 74) return "Tinggi";
  return "Sangat Tinggi";
}

/** kode dimensi (padanan DIMENSI_ITEM_PREFIX/DIMENSI_KODE di scImporter.js) -- duplikat kecil
 * sengaja, modul SC berdiri sendiri dari Admin CMS (lihat sc.types.ts), bukan impor lintas. */
const DIMENSI_ITEM_PREFIX = ["karakter", "leadership", "manajemen", "sinergi", "fokus", "performance"];
const DIMENSI_KODE_LABEL = {
  karakter_lembaga: "Karakter Lembaga", kepemimpinan: "Kepemimpinan", management: "Manajemen",
  sinergi: "Sinergi Tim", fokus: "Fokus Strategis", performance: "Kinerja/Performa",
};
const DIMENSI_KODE_LIST = Object.keys(DIMENSI_KODE_LABEL);
const TIPE_KODE_LIST = ["kekeluargaan", "inovasi", "orientasi", "aturan"];
const TIPE_LABEL_LIST = ["Kekeluargaan", "Inovasi", "Orientasi", "Aturan"];

/** Cari nilai item Likert 1-5 mentah di jawaban_mentah (kunci-nya nama kolom ASLI Excel,
 * mis. "gambaran_karakter_kekeluargaan_seperti_keluarga") -- pola pencarian sama persis
 * findRawItemCol() di scImporter.js, cuma dijalankan di sisi baca (client), bukan saat impor. */
function cariItemMentah(jawabanMentah, prefix, dim, tipe) {
  if (!jawabanMentah) return null;
  const re = new RegExp(`^${prefix}_${dim}_${tipe}(_|$)`, "i");
  const key = Object.keys(jawabanMentah).find((k) => re.test(k.trim()));
  if (key === undefined) return null;
  const n = parseFloat(String(jawabanMentah[key]).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Lima fungsi analisis di bawah ini (tallyDominan..heatmapDimensiTipe) SEMUANYA cuma menghitung
 * SEBARAN/TALLY dari angka yang sudah final per orang (sc_personal.budaya/kesejahteraan/
 * jawaban_mentah) -- tidak ada skor budaya/kesejahteraan/dimensi yang dihitung ULANG di sini,
 * cuma dirangkum jadi persentase/rata-rata sederhana untuk visual sebaran yang sebelumnya tidak
 * ada sama sekali (Blueprint School Culture v2 bagian 3, Level 2/3/4/5).
 */

/** % responden per tipe budaya dominan -- menjawab "seragam atau terbelah". */
function tallyDominan(personalRows) {
  const counts = Object.fromEntries(TIPE_LABEL_LIST.map((t) => [t, 0]));
  let total = 0;
  personalRows.forEach((p) => {
    const d = budayaDominan(p.budaya);
    if (!d?.tipe) return;
    counts[d.tipe] = (counts[d.tipe] || 0) + 1;
    total++;
  });
  return TIPE_LABEL_LIST.map((tipe) => ({
    tipe, jumlah: counts[tipe] || 0, persen: total > 0 ? Math.round(((counts[tipe] || 0) / total) * 100) : 0,
  }));
}

/** % responden per tipe yang arahnya naik/tetap/turun -- membongkar polarisasi yang tersembunyi
 * di rata-rata gap sekolah. */
function tallyDistribusiArah(personalRows) {
  const byTipe = Object.fromEntries(TIPE_LABEL_LIST.map((t) => [t, { naik: 0, tetap: 0, turun: 0, total: 0 }]));
  personalRows.forEach((p) => {
    (p.budaya || []).forEach((b) => {
      const bucket = byTipe[b.tipe];
      if (!bucket) return;
      bucket[arahDariGap(b.gap)]++;
      bucket.total++;
    });
  });
  return TIPE_LABEL_LIST.map((tipe) => {
    const c = byTipe[tipe];
    return {
      tipe,
      naik: c.total > 0 ? Math.round((c.naik / c.total) * 100) : 0,
      tetap: c.total > 0 ? Math.round((c.tetap / c.total) * 100) : 0,
      turun: c.total > 0 ? Math.round((c.turun / c.total) * 100) : 0,
    };
  });
}

/** Sebaran nilai per subdimensi kesejahteraan, satu angka per responden (anonim, tanpa nama) --
 * bahan strip/dot plot supaya outlier (mis. satu responden datar di angka rendah) tidak
 * tersembunyi di balik rata-rata. */
function sebaranWellbeing(personalRows) {
  const bySubdimensi = new Map();
  personalRows.forEach((p) => {
    (p.kesejahteraan || []).forEach((k) => {
      if (!bySubdimensi.has(k.kode)) bySubdimensi.set(k.kode, { kode: k.kode, label: k.label, nilai: [] });
      if (Number.isFinite(k.nilai)) bySubdimensi.get(k.kode).nilai.push(k.nilai);
    });
  });
  return [...bySubdimensi.values()];
}

/** % responden per kategori indeks kesejahteraan gabungan (kategori dihitung dari nilai lewat
 * kategoriDariNilai -- lihat catatan di atasnya). */
function donutKategoriWellbeing(personalRows) {
  const urutan = ["Sangat Rendah", "Rendah", "Sedang", "Tinggi", "Sangat Tinggi"];
  const counts = Object.fromEntries(urutan.map((k) => [k, 0]));
  let total = 0;
  personalRows.forEach((p) => {
    const indeks = rataRata((p.kesejahteraan || []).map((k) => k.nilai));
    const kat = kategoriDariNilai(indeks);
    if (!kat) return;
    counts[kat]++;
    total++;
  });
  return urutan.map((kategori) => ({
    kategori, jumlah: counts[kategori], persen: total > 0 ? Math.round((counts[kategori] / total) * 100) : 0,
  }));
}

/** Rata-rata item mentah gambaran_<dimensi>_<tipe> lintas seluruh responden -- matriks 6
 * dimensi x 4 tipe untuk heatmap, sumber sama dengan buildDimensiHarapan di scImporter.js
 * (Fase A), cuma level agregat sekolah, bukan individu, dan pakai item "gambaran" bukan
 * "harapan". */
function heatmapDimensiTipe(personalRows) {
  const cells = [];
  DIMENSI_ITEM_PREFIX.forEach((dim, i) => {
    const dimKode = DIMENSI_KODE_LIST[i];
    TIPE_KODE_LIST.forEach((tipe, j) => {
      const nilai = personalRows
        .map((p) => cariItemMentah(p.jawaban_mentah, "gambaran", dim, tipe))
        .filter((n) => n != null);
      const mean = nilai.length > 0 ? nilai.reduce((a, b) => a + b, 0) / nilai.length : null;
      cells.push({
        dimensi: DIMENSI_KODE_LABEL[dimKode], tipe: TIPE_LABEL_LIST[j],
        nilai: mean != null ? Math.round((mean / 5) * 100) : null,
      });
    });
  });
  return cells;
}

/**
 * Fase D, item 11 (Blueprint School Culture v2 bagian 3, Level 6): satu titik per staf (anonim)
 * -- tipe budaya dominannya vs indeks kesejahteraan gabungannya. INDIKATIF saja, bukan
 * kesimpulan statistik (n biasanya kecil per sekolah) -- ScScatterChart WAJIB selalu
 * menampilkan label "indikatif"/"n kecil" berdampingan, jangan pernah dilepas cuma karena
 * datanya kebetulan banyak di satu sekolah tertentu.
 */
function scatterBudayaWellbeing(personalRows) {
  return personalRows
    .map((p) => {
      const d = budayaDominan(p.budaya);
      const indeks = rataRata((p.kesejahteraan || []).map((k) => k.nilai));
      if (!d?.tipe || indeks == null) return null;
      return { tipe_dominan: d.tipe, indeks };
    })
    .filter(Boolean);
}

/** Proteksi privasi: unit dengan responden < ambang digabung jadi satu baris "Unit lain" supaya
 * tidak pernah membocorkan identitas satu orang (kasus nyata: unit dengan n=1) -- budaya_dominan
 * gabungan cuma ditampilkan kalau semua unit kecil itu kebetulan sama, kalau beda ditulis
 * "Beragam" daripada memilih salah satu secara sewenang-wenang. indeks_kesejahteraan gabungan
 * dihitung sebagai rata-rata TERTIMBANG (bobot jumlah responden) dari angka yang sudah final
 * tiap unit -- bukan skor baru, cuma agregasi angka yang sudah ada. */
const N_MIN_UNIT = 3;
function terapkanPrivasiUnit(rows) {
  const cukup = rows.filter((r) => r.jumlah_responden >= N_MIN_UNIT);
  const kecil = rows.filter((r) => r.jumlah_responden > 0 && r.jumlah_responden < N_MIN_UNIT);
  if (kecil.length === 0) return cukup;

  const totalN = kecil.reduce((s, r) => s + r.jumlah_responden, 0);
  const indeksGabungan = totalN > 0
    ? Math.round(kecil.reduce((s, r) => s + (r.indeks_kesejahteraan || 0) * r.jumlah_responden, 0) / totalN)
    : null;
  const tipeSet = new Set(kecil.map((r) => r.budaya_dominan));
  return [...cukup, {
    unit: `Unit lain (${kecil.length} unit digabung, n<${N_MIN_UNIT} demi privasi)`,
    jumlah_responden: totalN,
    budaya_dominan: tipeSet.size === 1 ? [...tipeSet][0] : "Beragam",
    indeks_kesejahteraan: indeksGabungan,
    kategori_kesejahteraan: kategoriDariNilai(indeksGabungan),
  }];
}

/** peran FIR (PascalCase) -> target_role tindak_lanjut/briefing (snake_case) yang dipakai
 * generate-tindak-lanjut/geminiPromptSc.ts. WakilKepalaSekolah dan AdminFammi ikut
 * kepala_sekolah (cakupannya identik/superset per CLAUDE.md). */
function targetRoleForPeran(peran) {
  if (peran === "Manajemen") return "manajemen";
  if (peran === "Yayasan") return "yayasan";
  return "kepala_sekolah";
}

/**
 * Laporan agregat School Culture untuk pimpinan (Manajemen/KepalaSekolah/WakilKepalaSekolah/
 * Yayasan/AdminFammi) satu sekolah. Bentuk hasil disamakan persis dengan LaporanAgregatSC
 * (sc.types.ts) supaya ScLaporanAgregatPage.jsx bisa dipakai apa adanya, baik untuk data mock
 * maupun data asli ini -- tidak ada perubahan di sisi komponen tampilan.
 *
 * Narasi (bagian_budaya.narasi dkk) SENGAJA dirakit lewat template kalimat dari angka yang
 * sudah final (dominan/gap terbesar/dst), BUKAN field baru dari Gemini -- draf Gemini (tabel
 * briefing) cuma punya satu blok teks bebas (`teks`), dipakai apa adanya untuk header.hook.
 * Ini konsisten dengan CLAUDE.md butir 3 (FIR tidak menghitung apa pun): merakit kalimat dari
 * angka final lewat template tetap bukan menghitung skor/status baru, sama seperti arahTeks()/
 * implikasiBudaya() di scMeta.js yang sudah lebih dulu melakukan ini di sisi tampilan.
 */
export function useScAgregat(session, periodeId) {
  const [state, setState] = useState({ loading: true, error: null, raw: null });
  const sekolahId = session.school_id;
  const targetRole = targetRoleForPeran(session.peran);

  useEffect(() => {
    let alive = true;

    async function run() {
      setState((s) => ({ ...s, loading: true, error: null }));

      const [sekolahRes, lembagaRes, briefingRes, tlRes, personalRes] = await Promise.all([
        supabase.from("schools").select("nama").eq("id", sekolahId).maybeSingle(),
        supabase
          .from("sc_lembaga")
          .select("unit, periode_id, jumlah_responden, budaya, profil_organisasi, kesejahteraan")
          .eq("sekolah_id", sekolahId),
        supabase
          .from("briefing")
          .select("teks, tema_esai, periode_id")
          .eq("sekolah_id", sekolahId)
          .eq("modul", "sc")
          .eq("scope", "sekolah")
          .eq("scope_id", sekolahId)
          .eq("status", "disetujui"),
        supabase
          .from("tindak_lanjut")
          .select("id, periode_id, type, fokus, icon, title, teaser, mengapa_data, mengapa_perspektif, dasar_teori, manfaat, konkret")
          .eq("sekolah_id", sekolahId)
          .eq("modul", "sc")
          .eq("scope", "sekolah")
          .eq("scope_id", sekolahId)
          .eq("target_role", targetRole)
          .eq("status", "disetujui"),
        // Baris per-staf, dibaca di sini untuk sebaran/tally (pie dominan, distribusi arah,
        // strip plot wellbeing, heatmap dimensi x tipe) -- bukan untuk menghitung ulang skor
        // budaya/kesejahteraan/dimensi (itu tetap dari sc_lembaga di atas), cuma untuk melihat
        // SEBARAN angka yang sudah final per orang. RLS sc_personal sudah membatasi ini ke
        // pimpinan sekolah sendiri (lihat migration 20260722100000).
        supabase
          .from("sc_personal")
          .select("periode_id, budaya, kesejahteraan, jawaban_mentah")
          .eq("sekolah_id", sekolahId),
      ]);

      if (!alive) return;
      const err = sekolahRes.error || lembagaRes.error || briefingRes.error || tlRes.error || personalRes.error;
      if (err) { setState({ loading: false, error: err.message, raw: null }); return; }

      setState({
        loading: false,
        error: null,
        raw: {
          sekolahNama: sekolahRes.data?.nama || sekolahId,
          lembagaRows: lembagaRes.data || [],
          briefingRows: briefingRes.data || [],
          tlRows: tlRes.data || [],
          personalRows: personalRes.data || [],
        },
      });
    }

    run();
    return () => { alive = false; };
  }, [sekolahId, targetRole]);

  const data = useMemo(() => {
    if (!state.raw) return null;
    const { sekolahNama, lembagaRows, briefingRows, tlRows, personalRows } = state.raw;

    const periodeSet = new Set([
      ...lembagaRows.map((r) => r.periode_id),
      ...briefingRows.map((r) => r.periode_id),
      ...tlRows.map((r) => r.periode_id),
    ]);
    if (periodeSet.size === 0) return null; // belum ada data SC sama sekali untuk sekolah ini

    const availablePeriods = Array.from(periodeSet).sort((a, b) => (a > b ? -1 : 1));
    const periode = periodeId && periodeSet.has(periodeId)
      ? periodeId
      : (latestPeriode(lembagaRows) || latestPeriode(briefingRows) || latestPeriode(tlRows));

    const lembagaAtPeriode = lembagaRows.filter((r) => r.periode_id === periode);
    const sekolah = lembagaAtPeriode.find((r) => !r.unit) || lembagaAtPeriode[0] || null;
    if (!sekolah) return null; // sc_lembaga belum diimpor untuk periode ini

    const unitRows = lembagaAtPeriode.filter((r) => r.unit);
    const briefingAtPeriode = briefingRows.find((r) => r.periode_id === periode) || null;
    const tlAtPeriode = tlRows.filter((r) => r.periode_id === periode);
    const personalAtPeriode = personalRows.filter((r) => r.periode_id === periode);

    const dominan = budayaDominan(sekolah.budaya);
    const gapTop = gapTerbesar(sekolah.budaya);
    const { terendah: kesTerendah, tertinggi: kesTertinggi } = ekstrem(sekolah.kesejahteraan);
    const { terendah: dimTerendah, tertinggi: dimTertinggi } = ekstrem(sekolah.profil_organisasi);
    const indeksKesejahteraan = rataRata((sekolah.kesejahteraan || []).map((k) => k.nilai));

    const chartBudaya = (sekolah.budaya || []).map((b) => ({ tipe: b.tipe, saat_ini: b.mean_gambaran, harapan: b.mean_harapan }));
    const tabelGap = (sekolah.budaya || []).map((b) => ({ label: b.tipe, arah: arahDariGap(b.gap), nilai_gap: b.gap }));

    const prioritasPerbaikan = tlAtPeriode
      .sort((a, b) => (a.type === "perlu_perhatian" ? -1 : 1) - (b.type === "perlu_perhatian" ? -1 : 1))
      .slice(0, 3)
      .map((r, i) => ({
        peringkat: i + 1,
        action: r.title,
        trigger_desc: r.teaser || r.mengapa_data || r.title,
        area: r.fokus === "budaya" ? "Budaya Kerja" : "Kesejahteraan Staf",
        // Fase E item 13: waktu (jangka per langkah, mis. "Minggu ini"/"Bulan ini") dulu
        // dibuang di sini (cuma k.aksi diambil) -- sekarang dipertahankan supaya ScTimeline
        // di ScLaporanAgregatPage.jsx bisa menampilkan visual 30-60-90 per langkah, bukan
        // cuma daftar bernomor tanpa jangka waktu.
        langkah: (r.konkret || []).map((k) => ({ aksi: k.aksi, waktu: k.waktu || null })).filter((k) => k.aksi),
        dampak: r.manfaat?.sekolah || r.manfaat?.pimpinan || null,
      }));

    return {
      meta: {
        organisasi_id: sekolahId, organisasi_nama: sekolahNama,
        periode_id: periode, jumlah_responden: sekolah.jumlah_responden || 0,
      },
      header: {
        hook: briefingAtPeriode?.teks
          || `Budaya kerja sekolah Anda paling condong ke ${dominan?.tipe || "—"} periode ini.`,
        sub_hook: `Ringkasan dari ${sekolah.jumlah_responden || 0} staf pada periode ${periodeLabel(periode)}.`,
      },
      bagian_budaya: {
        narasi: gapTop
          ? `Budaya yang paling terasa saat ini adalah ${dominan?.tipe} (${dominan?.mean_gambaran}%). Selisih terbesar antara kondisi sekarang dan harapan staf ada pada ${gapTop.tipe} (${gapTop.gap > 0 ? "+" : ""}${gapTop.gap} poin).`
          : "",
        chart_data: chartBudaya,
        tabel_gap: tabelGap,
      },
      bagian_kesejahteraan: {
        narasi: kesTertinggi && kesTerendah
          ? `Indeks kesejahteraan gabungan staf berada di sekitar ${indeksKesejahteraan}%. ${kesTertinggi.label} jadi subdimensi terkuat (${kesTertinggi.nilai}%), sementara ${kesTerendah.label} paling perlu diperhatikan (${kesTerendah.nilai}%).`
          : "",
        indeks: indeksKesejahteraan,
        kategori: kategoriDariNilai(indeksKesejahteraan),
        chart_data: sekolah.kesejahteraan || [],
      },
      bagian_profil_organisasi: {
        narasi: dimTertinggi && dimTerendah
          ? `${dimTertinggi.label} jadi dimensi profil organisasi tertinggi (${dimTertinggi.nilai}%), sementara ${dimTerendah.label} relatif paling rendah (${dimTerendah.nilai}%).`
          : "",
        chart_data: sekolah.profil_organisasi || [],
      },
      perbandingan_antarunit: {
        narasi: unitRows.length > 0
          ? "Perbandingan antarunit di bawah ini dari baris agregat per unit yang tersedia periode ini. Unit dengan responden terlalu sedikit digabung demi privasi."
          : "Belum ada data agregat per unit kerja untuk periode ini -- baru tersedia ringkasan seluruh sekolah.",
        rows: terapkanPrivasiUnit(unitRows.map((u) => {
          const d = budayaDominan(u.budaya);
          const indeks = rataRata((u.kesejahteraan || []).map((k) => k.nilai));
          return {
            unit: u.unit,
            jumlah_responden: u.jumlah_responden || 0,
            budaya_dominan: d?.tipe || "—",
            indeks_kesejahteraan: indeks,
            kategori_kesejahteraan: kategoriDariNilai(indeks),
          };
        })),
      },
      prioritas_perbaikan: prioritasPerbaikan,
      // Insight baru (Blueprint School Culture v2 bagian 3): sebaran/tally dari sc_personal,
      // bukan bagian skema LaporanAgregatSC asli -- ScLaporanAgregatPage.jsx menganggap ini
      // opsional (undefined kalau dipanggil dengan data mock lama), render section-nya cuma
      // kalau ada isinya.
      analisis: {
        pie_dominan: tallyDominan(personalAtPeriode),
        distribusi_arah: tallyDistribusiArah(personalAtPeriode),
        sebaran_wellbeing: sebaranWellbeing(personalAtPeriode),
        donut_kategori_wellbeing: donutKategoriWellbeing(personalAtPeriode),
        heatmap: heatmapDimensiTipe(personalAtPeriode),
        scatter_budaya_wellbeing: scatterBudayaWellbeing(personalAtPeriode),
        jumlah_responden_dianalisis: personalAtPeriode.length,
      },
      footer: {
        disclaimer: "Laporan ini adalah hasil pengolahan jawaban asesmen seluruh staf yang mengisi pada periode berjalan dan bersifat rahasia. Gunakan sebagai bahan pengambilan keputusan sekolah, bukan alat evaluasi individu staf tertentu.",
      },
      tema_esai: briefingAtPeriode?.tema_esai || [],
      // Fase E item 14: tren indeks kesejahteraan lintas SEMUA periode yang punya sc_lembaga
      // level sekolah (bukan per unit) -- data ini sudah kebaca lengkap di lembagaRows (query di
      // atas TIDAK difilter periode), cuma belum pernah dirangkum jadi seri waktu. Kalau baru
      // ada 1 periode, ScTrenLineChart menampilkan placeholder "menunggu periode kedua" sendiri.
      tren_kesejahteraan: lembagaRows
        .filter((r) => !r.unit)
        .map((r) => ({ periode_id: r.periode_id, indeks: rataRata((r.kesejahteraan || []).map((k) => k.nilai)) }))
        .sort((a, b) => (a.periode_id > b.periode_id ? 1 : -1)),
      availablePeriods,
    };
  }, [state.raw, periodeId, sekolahId]);

  return { loading: state.loading, error: state.error, data };
}

/**
 * Laporan individu School Culture untuk staf (peran Karyawan) sendiri. `detail` di sc_hasil
 * SUDAH persis bentuk LaporanIndividuSC (dirakit generate-sc-individu/index.ts), jadi tidak ada
 * pemetaan ulang di sini -- beda dari useScAgregat yang memang perlu merakit ulang dari
 * sc_lembaga/tindak_lanjut/briefing.
 */
export function useScIndividu(session) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const scRespondenId = session.sc_responden_id;

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!scRespondenId) {
        setState({ loading: false, error: "Akun ini belum ditautkan ke responden School Culture manapun (profiles.sc_responden_id kosong).", data: null });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));

      const { data, error } = await supabase
        .from("sc_hasil")
        .select("detail, periode_id")
        .eq("sc_personal_id", scRespondenId)
        .eq("status", "disetujui")
        .order("periode_id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!alive) return;
      if (error) { setState({ loading: false, error: error.message, data: null }); return; }
      setState({ loading: false, error: null, data: data?.detail || null });
    }

    run();
    return () => { alive = false; };
  }, [scRespondenId]);

  return state;
}

/**
 * Daftar laporan individu SC yang sudah disetujui, satu sekolah, dipakai ScRespondenListPage.jsx
 * (tab "Laporan Individu" sisi pimpinan) untuk drill-down per staf. `detail` sudah persis bentuk
 * LaporanIndividuSC (lihat useScIndividu), jadi array ini bisa langsung dipakai sebagai
 * respondenList apa adanya.
 */
export function useScRespondenList(session, periodeId) {
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const sekolahId = session.school_id;

  useEffect(() => {
    let alive = true;

    async function run() {
      setState((s) => ({ ...s, loading: true, error: null }));
      const { data, error } = await supabase
        .from("sc_hasil")
        .select("detail, periode_id")
        .eq("sekolah_id", sekolahId)
        .eq("status", "disetujui");

      if (!alive) return;
      if (error) { setState({ loading: false, error: error.message, rows: [] }); return; }
      setState({ loading: false, error: null, rows: data || [] });
    }

    run();
    return () => { alive = false; };
  }, [sekolahId]);

  const respondenList = useMemo(() => {
    const periodeSet = new Set(state.rows.map((r) => r.periode_id));
    const periode = periodeId && periodeSet.has(periodeId)
      ? periodeId
      : latestPeriode(state.rows);
    return state.rows.filter((r) => r.periode_id === periode).map((r) => r.detail);
  }, [state.rows, periodeId]);

  return { loading: state.loading, error: state.error, respondenList };
}
