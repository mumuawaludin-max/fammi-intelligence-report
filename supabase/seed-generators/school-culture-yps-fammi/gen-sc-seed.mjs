// Generator seed dummy modul School Culture untuk Yayasan Pendidikan Sekolah Fammi.
// Menghasilkan satu berkas migration SQL + satu berkas daftar akun (markdown).
// Jalankan: node gen-sc-seed.mjs

import fs from "node:fs";
import path from "node:path";
import {
  mulberry32, makeUuidFactory, NAMA_DEPAN_L, NAMA_DEPAN_P, NAMA_BELAKANG, NAMA_BELAKANG_P, UNITS,
  TIPE_KODE, TIPE_LABEL, DIMENSI, ITEM_SUFFIX, B_ITEMS, KESEJAHTERAAN_LABEL,
  TARGET_G, TARGET_H, kategoriDariNilai, bulat2, mean, sd, clamp, likert,
} from "./gen-sc-seed-lib.mjs";
import {
  Q1, Q2, Q3, Q4, Q5, Q6, Q7, TEMA_ESAI_META,
  AKSI_BUDAYA, AKSI_KESEJAHTERAAN_RENDAH, AKSI_KESEJAHTERAAN_KUAT,
  LINGKAR_CONTROL, LINGKAR_INFLUENCE, LINGKAR_SYSTEM,
} from "./gen-sc-seed-text.mjs";
import { buildTindakLanjut, buildBriefing } from "./gen-sc-seed-tl.mjs";

const SEKOLAH_ID = "YPS-FAMMI";
const SEKOLAH_NAMA = "Yayasan Pendidikan Sekolah Fammi";
const PERIODE = "2026-07";
const KODE_STAF = "fammi2026";
const KODE_YAYASAN = "ypsfammi2026";
const DISCLAIMER_INDIVIDU =
  "Laporan ini adalah hasil pengolahan jawaban asesmen Anda dan bersifat rahasia. Gunakan sebagai bahan refleksi pribadi, bukan alat penilaian kinerja formal.";
const DISCLAIMER_AGREGAT =
  "Laporan ini adalah hasil pengolahan jawaban asesmen seluruh Tim yang mengisi pada periode berjalan dan bersifat rahasia. Gunakan sebagai bahan pengambilan keputusan sekolah, bukan alat evaluasi individu anggota Tim tertentu.";

const rand = mulberry32(20260826);
const uuid = makeUuidFactory(rand);
const n1 = (x) => (Math.round(x * 10) / 10).toString().replace(".", ",");

/** Pilih satu item dari daftar, bobot dihitung pemanggil. */
function pickWeighted(items, bobot) {
  const w = items.map((it, i) => Math.max(0.0001, bobot(it, i)));
  const total = w.reduce((a, b) => a + b, 0);
  let x = rand() * total;
  for (let i = 0; i < items.length; i++) {
    x -= w[i];
    if (x <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ── 1. Bangun 150 responden ─────────────────────────────────────────────────────────────────
const namaTerpakai = new Set();
function namaBaru(gender) {
  const depanPool = gender === "Laki-laki" ? NAMA_DEPAN_L : NAMA_DEPAN_P;
  // Nama belakang berciri perempuan cuma dipasangkan ke responden perempuan.
  const belakangPool = gender === "Laki-laki" ? NAMA_BELAKANG : [...NAMA_BELAKANG, ...NAMA_BELAKANG_P];
  for (let coba = 0; coba < 500; coba++) {
    const nama = `${depanPool[Math.floor(rand() * depanPool.length)]} ${belakangPool[Math.floor(rand() * belakangPool.length)]}`;
    if (!namaTerpakai.has(nama)) { namaTerpakai.add(nama); return nama; }
  }
  throw new Error("Kehabisan kombinasi nama unik.");
}

const LAMA_KERJA = ["Kurang dari 1 tahun", "1-3 tahun", "4-6 tahun", "7-10 tahun", "Lebih dari 10 tahun"];

const orang = [];
let urut = 0;
for (const unit of UNITS) {
  for (let i = 0; i < unit.jumlah; i++) {
    urut++;
    const gender = rand() < 0.62 ? "Perempuan" : "Laki-laki";
    const nama = namaBaru(gender);
    const isTU = unit.jenjang.startsWith("Non-Jenjang");
    const r = rand();
    const peranKerja = isTU
      ? (r < 0.8 ? "Tenaga Kependidikan" : "Pimpinan Unit")
      : (r < 0.78 ? "Guru" : r < 0.92 ? "Tenaga Kependidikan" : "Pimpinan Unit");

    // Kecenderungan pribadi: sebagian orang menilai segalanya lebih tinggi/rendah dari rekannya.
    // Dipakai bersama untuk budaya dan kesejahteraan supaya sebaran per orang tetap masuk akal.
    const skew = (rand() + rand() + rand() - 1.5) * 0.62;

    orang.push({
      urut, id: uuid(), nama, gender, unit: unit.unit, jenjang: unit.jenjang, unitCfg: unit,
      peran_kerja: peranKerja,
      usia: 24 + Math.floor(rand() * 34),
      lama_kerja: LAMA_KERJA[Math.floor(rand() * LAMA_KERJA.length)],
      no_whatsapp: `08${(Math.floor(rand() * 9) + 1)}${String(Math.floor(rand() * 100000000)).padStart(8, "0")}`,
      email: `${nama.toLowerCase().replace(/[^a-z]+/g, ".")}@fammi.sch.id`,
      bersedia: rand() < 0.86,
      username: `ypsstaf${String(urut).padStart(3, "0")}`,
      skew,
    });
  }
}

// ── 2. Jawaban Likert mentah, skor budaya/profil/kesejahteraan per orang ────────────────────
for (const p of orang) {
  const mentah = {};
  const gItems = {}; // [tipe][dimKode]
  const hItems = {};
  TIPE_KODE.forEach((t) => { gItems[t] = {}; hItems[t] = {}; });

  DIMENSI.forEach((d) => {
    TIPE_KODE.forEach((t) => {
      const g = likert(rand, TARGET_G[t] + p.unitCfg.biasG[t] + d.offset + p.skew);
      const h = likert(rand, TARGET_H[t] + p.unitCfg.biasH[t] + d.offset * 0.5 + p.skew * 0.55);
      const kolomG = `gambaran_${d.prefix}_${t}_${ITEM_SUFFIX[d.prefix][t]}`;
      const kolomH = `harapan_${d.prefix}_${t}_${ITEM_SUFFIX[d.prefix][t]}`;
      mentah[kolomG] = g;
      mentah[kolomH] = h;
      gItems[t][d.kode] = g;
      hItems[t][d.kode] = h;
    });
  });

  B_ITEMS.forEach((b) => {
    mentah[b.nama] = likert(rand, b.base + p.unitCfg.biasB + p.skew * 0.8);
  });

  p.jawaban_mentah = mentah;
  p.meanG = {}; p.meanH = {};
  TIPE_KODE.forEach((t) => {
    p.meanG[t] = bulat2(mean(DIMENSI.map((d) => gItems[t][d.kode])));
    p.meanH[t] = bulat2(mean(DIMENSI.map((d) => hItems[t][d.kode])));
  });

  // Profil organisasi: rata-rata 4 tipe per dimensi, dikonversi ke persen (skala 1-5 /5*100),
  // rumus yang sama dipakai pipeline hulu (lihat buildDimensiHarapan di scImporter.js).
  p.profil = DIMENSI.map((d) => {
    const nilai = bulat2(mean(TIPE_KODE.map((t) => gItems[t][d.kode])) / 5 * 100);
    const harapan = bulat2(mean(TIPE_KODE.map((t) => hItems[t][d.kode])) / 5 * 100);
    return { kode: d.kode, label: d.label, nilai, kategori: kategoriDariNilai(nilai), harapan, gap: bulat2(harapan - nilai) };
  });

  // Kesejahteraan: rata-rata butir b1-b13 per subdimensi, dikonversi ke persen.
  const byKode = {};
  B_ITEMS.forEach((b) => { (byKode[b.kode] ||= []).push(mentah[b.nama]); });
  p.kesejahteraan = Object.keys(KESEJAHTERAAN_LABEL).map((kode) => {
    const nilai = bulat2(mean(byKode[kode]) / 5 * 100);
    return { kode, label: KESEJAHTERAAN_LABEL[kode], nilai, kategori: kategoriDariNilai(nilai) };
  });
  p.indeks = Math.round(mean(p.kesejahteraan.map((k) => k.nilai)));
}

// T-score per tipe budaya, dihitung dari sebaran seluruh 150 responden. Harapan memakai
// mean/sd yang SAMA dengan gambaran supaya selisih T (gap) punya arti, bukan dua skala berbeda
// yang sama-sama berpusat di 50.
const norm = {};
TIPE_KODE.forEach((t) => {
  const arr = orang.map((p) => p.meanG[t]);
  norm[t] = { m: mean(arr), s: sd(arr) };
});
const tScore = (t, x) => bulat2(clamp(50 + 10 * (x - norm[t].m) / norm[t].s, 5, 95));

for (const p of orang) {
  p.budaya = TIPE_KODE.map((t) => {
    const tg = tScore(t, p.meanG[t]);
    const th = tScore(t, p.meanH[t]);
    const gap = bulat2(th - tg);
    return {
      tipe: TIPE_LABEL[t],
      mean_gambaran: p.meanG[t], mean_harapan: p.meanH[t],
      t_gambaran: tg, predikat_gambaran: kategoriDariNilai(tg),
      t_harapan: th, predikat_harapan: kategoriDariNilai(th),
      gap, predikat_gap: gap >= 1 ? "Naik" : gap <= -1 ? "Turun" : "Tetap",
    };
  });
  p.dominan = [...p.budaya].sort((a, b) => b.mean_gambaran - a.mean_gambaran)[0];
  p.gapTop = [...p.budaya].sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))[0];
  p.kesRendah = [...p.kesejahteraan].sort((a, b) => a.nilai - b.nilai)[0];
  p.kesTinggi = [...p.kesejahteraan].sort((a, b) => b.nilai - a.nilai)[0];
  p.profilRendah = [...p.profil].sort((a, b) => a.nilai - b.nilai)[0];
  p.profilTinggi = [...p.profil].sort((a, b) => b.nilai - a.nilai)[0];
}

// ── 3. Jawaban esai ─────────────────────────────────────────────────────────────────────────
for (const p of orang) {
  const mood = p.skew + p.unitCfg.biasB * 0.8;
  const cocokMood = (it) => 1 + Math.max(0, it.mood * mood * 3.2) + (it.mood === 0 ? 0.6 : 0);

  const q1 = pickWeighted(Q1, cocokMood);
  const q2 = pickWeighted(Q2, cocokMood);
  // Yang ingin diubah condong ke tema yang paling menekan orang itu.
  const temaDekat = p.kesRendah.kode === "work_life_balance" ? "waktu"
    : p.kesRendah.kode === "pengembangan_diri" ? "pengembangan"
    : p.kesRendah.kode === "kepuasan_kepemimpinan" ? "kepastian"
    : p.gapTop.tipe === "Inovasi" ? "inovasi" : "beban";
  const q3 = pickWeighted(Q3, (it) => (it.tema === temaDekat ? 3.4 : 1));
  const q4 = pickWeighted(Q4, (it) => (it.tema === "dukungan_rekan" ? 2.2 : 1));
  const q5 = pickWeighted(Q5, (it) => {
    if (p.kesRendah.kode === "work_life_balance" && it.tema === "waktu_pribadi") return 3;
    if (p.kesRendah.kode === "kepuasan_kepemimpinan" && it.tema === "kepastian_jadwal") return 3;
    return 1;
  });
  const q6 = pickWeighted(Q6, (it) => {
    if (p.kesRendah.kode === "pengembangan_diri" && it.tema === "pengembangan") return 3;
    if (p.kesRendah.kode === "ekspektasi" && it.tema === "pengembangan") return 2;
    return 1;
  });

  p.esai = { q1, q2, q3, q4, q5, q6, q7: rand() < 0.35 ? Q7[Math.floor(rand() * Q7.length)] : null };
  p.essayJson = {
    gambaran_lembaga: q1.teks,
    kejadian_kesaharian: q2.teks,
    yang_ingin_diubah: q3.teks,
    alasan_betah: q4.teks,
    hal_menguras_energi: q5.teks,
    yang_ingin_disampaikan: q6.teks,
    ...(p.esai.q7 ? { essay_bebas: p.esai.q7 } : {}),
  };
}

// ── 4. Agregat lembaga (seluruh sekolah + per unit) ─────────────────────────────────────────
function agregat(rows) {
  const budaya = TIPE_KODE.map((t) => {
    const g = bulat2(mean(rows.map((p) => p.meanG[t])) / 5 * 100);
    const h = bulat2(mean(rows.map((p) => p.meanH[t])) / 5 * 100);
    return {
      tipe: TIPE_LABEL[t], mean_gambaran: g, mean_harapan: h,
      t_gambaran: null, predikat_gambaran: kategoriDariNilai(g),
      t_harapan: null, predikat_harapan: kategoriDariNilai(h),
      gap: bulat2(h - g), predikat_gap: h - g >= 1 ? "Naik" : h - g <= -1 ? "Turun" : "Tetap",
    };
  });
  const profil = DIMENSI.map((d, i) => {
    const nilai = bulat2(mean(rows.map((p) => p.profil[i].nilai)));
    const harapan = bulat2(mean(rows.map((p) => p.profil[i].harapan)));
    return { kode: d.kode, label: d.label, nilai, kategori: kategoriDariNilai(nilai), harapan, gap: bulat2(harapan - nilai) };
  });
  const kesejahteraan = Object.keys(KESEJAHTERAAN_LABEL).map((kode, i) => {
    const nilai = bulat2(mean(rows.map((p) => p.kesejahteraan[i].nilai)));
    return { kode, label: KESEJAHTERAAN_LABEL[kode], nilai, kategori: kategoriDariNilai(nilai) };
  });
  return { jumlah: rows.length, budaya, profil, kesejahteraan };
}

const aggSekolah = agregat(orang);
const aggUnit = UNITS.map((u) => ({ unit: u.unit, ...agregat(orang.filter((p) => p.unit === u.unit)) }));

// ── 5. Laporan individu (sc_hasil.detail) ───────────────────────────────────────────────────
function arahDariGap(gap) {
  if (gap == null || gap === 0) return "tetap";
  return gap > 0 ? "naik" : "turun";
}

function narasiBudaya(p) {
  const arah = p.gapTop.gap > 0 ? "lebih besar" : "lebih kecil";
  return `Budaya yang paling Anda rasakan di ${p.unit} adalah ${p.dominan.tipe} (${n1(p.dominan.t_gambaran)} dari 100). `
    + `Jarak terbesar antara kondisi sekarang dan harapan Anda ada di ${p.gapTop.tipe}: Anda mengharapkan porsinya ${arah} sekitar ${n1(Math.abs(p.gapTop.gap))} poin dari yang Anda rasakan sekarang.`;
}

function narasiKesejahteraan(p) {
  return `Kondisi kesejahteraan Anda secara umum berada di angka ${p.indeks} dari 100, kategori ${kategoriDariNilai(p.indeks)}. `
    + `${p.kesTinggi.label} jadi sisi terkuat Anda (${n1(p.kesTinggi.nilai)}), sementara ${p.kesRendah.label} paling perlu dijaga (${n1(p.kesRendah.nilai)}).`;
}

function narasiProfil(p) {
  return `Dari enam dimensi profil organisasi, ${p.profilTinggi.label} paling kuat Anda rasakan (${n1(p.profilTinggi.nilai)}), `
    + `sedangkan ${p.profilRendah.label} paling rendah (${n1(p.profilRendah.nilai)}) dengan harapan ${n1(p.profilRendah.harapan)}.`;
}

function cerminKonteks(p) {
  return `Dua kalimat itu Anda tulis sendiri bulan ini. Keduanya menjelaskan kenapa ${p.dominan.tipe} jadi sisi budaya yang paling terasa di ${p.unit}, sekaligus di mana energinya paling banyak terpakai.`;
}

const REFLEKSI = {
  kepuasan_kepemimpinan: "Satu hal apa yang ingin Anda tanyakan langsung ke pimpinan unit bulan ini, yang selama ini cuma Anda simpan sendiri?",
  kenyamanan_bekerja: "Satu perubahan kecil apa di ruang kerja Anda yang bisa Anda kerjakan sendiri minggu ini?",
  pengembangan_diri: "Satu keterampilan apa yang ingin Anda kuasai tiga bulan ke depan, dan kapan waktunya Anda sisihkan?",
  ekspektasi: "Harapan apa yang Anda bawa saat pertama bergabung, dan bagian mana yang masih pantas diperjuangkan?",
  work_life_balance: "Jam berapa Anda ingin benar-benar berhenti bekerja hari ini, dan apa yang perlu disiapkan supaya itu terjadi?",
};

function rencanaAksi(p) {
  const arah = p.gapTop.gap > 0 ? "naik" : "turun";
  const aBudaya = AKSI_BUDAYA[p.gapTop.tipe][arah];
  const aRendah = AKSI_KESEJAHTERAAN_RENDAH[p.kesRendah.kode];
  const aKuat = AKSI_KESEJAHTERAAN_KUAT[p.kesTinggi.kode];
  return [
    { id: `${p.id}-aksi-1`, judul: aBudaya.judul, alasan: `${aBudaya.alasan} Selisihnya ${n1(Math.abs(p.gapTop.gap))} poin.`, terkait: aBudaya.terkait, jangka: aBudaya.jangka, ikon: aBudaya.ikon },
    { id: `${p.id}-aksi-2`, judul: aRendah.judul, alasan: `${aRendah.alasan} Angkanya sekarang ${n1(p.kesRendah.nilai)} dari 100.`, terkait: p.kesRendah.label, jangka: aRendah.jangka, ikon: aRendah.ikon },
    { id: `${p.id}-aksi-3`, judul: aKuat.judul, alasan: `${aKuat.alasan} Angkanya ${n1(p.kesTinggi.nilai)} dari 100.`, terkait: p.kesTinggi.label, jangka: aKuat.jangka, ikon: aKuat.ikon },
  ];
}

function lingkarKontribusi(p) {
  return [
    {
      locus: "control",
      mengapa_fokus: `${p.kesRendah.label} jadi sisi kesejahteraan terendah Anda (${n1(p.kesRendah.nilai)} dari 100), sementara ${p.kesTinggi.label} sudah kuat di ${n1(p.kesTinggi.nilai)}. Tiga langkah di bawah ini seluruhnya bisa Anda mulai sendiri.`,
      langkah: LINGKAR_CONTROL[p.kesRendah.kode],
    },
    {
      locus: "influence",
      mengapa_fokus: `Harapan Anda pada ${p.gapTop.tipe} terpaut ${n1(Math.abs(p.gapTop.gap))} poin dari kondisi sekarang, jarak terbesar di antara empat tipe budaya. Ini wilayah yang bergerak lewat percakapan dengan rekan dan koordinator, bukan sendirian.`,
      langkah: LINGKAR_INFLUENCE[p.gapTop.tipe],
    },
    {
      locus: "system",
      mengapa_fokus: `${p.profilRendah.label} jadi dimensi profil organisasi terendah menurut Anda (${n1(p.profilRendah.nilai)} dari 100, harapan ${n1(p.profilRendah.harapan)}). Perubahan di wilayah ini butuh keputusan lembaga, yang bisa Anda lakukan adalah memasok bahannya.`,
      langkah: LINGKAR_SYSTEM[p.profilRendah.kode],
    },
  ];
}

for (const p of orang) {
  p.detail = {
    meta: {
      responden_id: p.id, nama_responden: p.nama, peran_kerja: p.peran_kerja,
      unit: p.unit, jenjang: p.jenjang, jenis_kelamin: p.gender,
      organisasi_id: SEKOLAH_ID, periode_id: PERIODE, nama_lembaga: SEKOLAH_NAMA, sumber: "excel",
    },
    header: {
      hook: `Anda melihat ${SEKOLAH_NAMA} ini sebagai "${p.esai.q1.teks}"`,
      sub_hook: `Profil budaya Anda paling condong ke ${p.dominan.tipe}, dengan jarak terbesar ke harapan ada di ${p.gapTop.tipe}.`,
    },
    bagian_budaya: {
      narasi: narasiBudaya(p),
      chart_data: p.budaya.map((b) => ({ tipe: b.tipe, saat_ini: b.t_gambaran, harapan: b.t_harapan })),
      tabel_gap: p.budaya.map((b) => ({ label: b.tipe, arah: arahDariGap(b.gap), nilai_gap: b.gap })),
    },
    bagian_kesejahteraan: {
      narasi: narasiKesejahteraan(p),
      indeks: p.indeks, kategori: kategoriDariNilai(p.indeks), chart_data: p.kesejahteraan,
    },
    bagian_profil_organisasi: { narasi: narasiProfil(p), chart_data: p.profil },
    bagian_cermin: `"${p.esai.q4.teks}" "${p.esai.q5.teks}" ${cerminKonteks(p)}`,
    bagian_refleksi: REFLEKSI[p.kesRendah.kode],
    jawaban_survey: {
      betah: p.esai.q4.teks,
      hal_menguras_energi: p.esai.q5.teks,
      yang_ingin_disampaikan: p.esai.q6.teks,
      yang_ingin_diubah: p.esai.q3.teks,
      gambaran_lembaga: p.esai.q1.teks,
    },
    rencana_aksi: rencanaAksi(p),
    lingkar_kontribusi: lingkarKontribusi(p),
    footer: { disclaimer: DISCLAIMER_INDIVIDU },
  };
}

// ── 6. Briefing: tema esai + cerita pegawai, jumlah_mention dari pilihan yang benar-benar dibuat ─
function tallyFrasa(ambil) {
  const map = new Map();
  orang.forEach((p) => {
    const it = ambil(p);
    map.set(it.frasa, (map.get(it.frasa) || 0) + 1);
  });
  return [...map.entries()]
    .map(([frasa, jumlah_mention]) => ({ frasa, jumlah_mention }))
    .sort((a, b) => b.jumlah_mention - a.jumlah_mention);
}

const ceritaPegawai = {
  gambaran_lembaga: tallyFrasa((p) => p.esai.q1),
  saat_ini: tallyFrasa((p) => p.esai.q2),
  ingin_diubah: tallyFrasa((p) => p.esai.q3),
};

const temaCount = new Map();
orang.forEach((p) => {
  [p.esai.q4.tema, p.esai.q5.tema, p.esai.q6.tema].forEach((t) => temaCount.set(t, (temaCount.get(t) || 0) + 1));
});
const temaEsai = [...temaCount.entries()]
  .filter(([t]) => TEMA_ESAI_META[t])
  .sort((a, b) => b[1] - a[1])
  .map(([t, jumlah]) => ({ ...TEMA_ESAI_META[t], jumlah_mention: jumlah }));

const briefing = buildBriefing(aggSekolah);
const tindakLanjut = buildTindakLanjut(aggSekolah);


// ── 7. Tulis berkas ─────────────────────────────────────────────────────────────────────────
import { emit } from "./emitter.mjs";
const dirMigrations = process.argv[2];
const dirDocs = process.argv[3];
const berkas = emit({
  fs, path, orang, aggSekolah, aggUnit, briefing, temaEsai, ceritaPegawai, tindakLanjut,
  UNITS, kategoriDariNilai, mean,
  SEKOLAH_ID, SEKOLAH_NAMA, PERIODE, KODE_STAF, KODE_YAYASAN, dirMigrations, dirDocs,
});

console.log("Responden:", orang.length);
console.log("Budaya lembaga:", aggSekolah.budaya.map((b) => `${b.tipe} ${b.mean_gambaran}->${b.mean_harapan} (${b.gap})`).join(" | "));
console.log("Kesejahteraan:", aggSekolah.kesejahteraan.map((k) => `${k.kode} ${k.nilai} ${k.kategori}`).join(" | "));
console.log("Profil:", aggSekolah.profil.map((d) => `${d.kode} ${d.nilai} (gap ${d.gap})`).join(" | "));
console.log("Indeks kesejahteraan:", Math.round(mean(aggSekolah.kesejahteraan.map((k) => k.nilai))));
console.log("Berkas:", berkas.map((b) => `${b.nama} ${b.kb}KB`).join("\n         "));
