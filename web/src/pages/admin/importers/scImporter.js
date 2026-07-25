import * as XLSX from 'xlsx';
import { supabase, edgeErrorDetail } from '../../../lib/supabase';
import { getField, normalizeNama } from './karakterImporter';

// Importer School Culture (SC). Format: sheet "Personal" (satu baris per staf responden) +
// sheet "Lembaga" (satu baris agregat, opsional per unit kerja kalau pipeline hulu mulai
// mengekspor begitu -- lihat catatan di migration 20260722100000). BEDA dari Karakter/MI: file
// ini TIDAK punya kolom bulan/periode sama sekali (sudah dicek langsung ke contoh file asli),
// jadi periode_id WAJIB diketik admin di layar Upload, bukan dibaca dari file.
//
// Semua angka budaya (mean, t-score, gap, predikat/kategori) sudah FINAL dari pipeline hulu --
// importer ini cuma memetakan nama kolom ke bentuk jsonb yang dipakai sc_personal/sc_lembaga,
// tidak menghitung ulang (CLAUDE.md butir 3). SATU pengecualian sengaja: profil_organisasi.harapan
// (lihat buildDimensiHarapan) -- sheet Personal tidak punya kolom ringkasan siap pakai untuk ini
// (beda dari budaya yang punya mean_harapan_* eksplisit), tapi item mentahnya tersimpan penuh,
// jadi dirata-ratakan di sini murni sebagai pelengkap tampilan yang sebelumnya kosong sama
// sekali, bukan mengoreksi angka yang sudah final.

/** parseFloat aman koma-desimal + tanda persen, sama seperti pct() di karakterImporter.js
 * (duplikat kecil sengaja, bukan diimpor -- pola sama dengan skor() lokal di miImporter.js). */
function pct(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace('%', '').replace(',', '.').trim());
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/** Kolom "bersedia" (izin tampil di drill-down individu pimpinan): sengaja dicocokkan lewat
 * prefix "ya" (bukan menyamakan persis "Ya, saya bersedia") supaya tetap kebaca kalau sekolah
 * lain sedikit beda redaksi jawabannya -- default FALSE kalau kosong/tidak jelas, privasi lebih
 * diutamakan daripada menganggap bersedia padahal tidak jelas. */
function parseBersedia(v) {
  const teks = String(v || '').trim().toLowerCase();
  return teks.startsWith('ya');
}

/**
 * Parser JSON siap-pakai TOLERAN, dipakai tiga kolom pregen SC sekaligus (laporan_json di sheet
 * Personal, briefing_json dan tindak_lanjut_json di sheet Lembaga) -- konten yang SUDAH
 * dirumuskan di hulu, di luar FIR, dipakai apa adanya tanpa memanggil Gemini kalau valid (lihat
 * migration 20260728100000 dan 20260729100000 untuk latar belakangnya: jendela 503 Gemini yang
 * berjam-jam berkali-kali menggagalkan generate massal sepanjang 2026-07).
 *
 * Sengaja TOLERAN, tiga alasan konkret dari perilaku nyata model saat menulis JSON ke Excel:
 * (1) keluaran kadang terbungkus pagar markdown ```json ... ``` walau diminta polos, jadi pagar
 * itu dilucuti dulu daripada seluruh sel dianggap rusak; (2) Excel bisa mengembalikan sel
 * sebagai objek, bukan string, jadi objek yang sudah berbentuk benar diterima apa adanya;
 * (3) satu sel rusak TIDAK boleh menggagalkan import -- baris/aspek itu cukup jatuh kembali ke
 * jalur Gemini dan diberi peringatan yang menyebut konteksnya.
 *
 * `validasi` dipasok pemanggil supaya tiap kolom bisa punya aturan bentuk sendiri (laporan
 * individu vs briefing vs tindak_lanjut per role) tanpa menduplikasi logika toleransi ini tiga
 * kali. Validasi bentuk sengaja MINIMAL dan sama persis dengan yang dipakai
 * generateAndInsertDraftSc (_shared/geminiPromptSc.ts) -- kalau ditambah di sini tapi tidak di
 * sana (atau sebaliknya), dua lapis itu bisa diam-diam beda pendapat soal apa yang "valid".
 */
/** Excel membatasi satu sel maksimal 32.767 karakter -- tindak_lanjut_json (27 objek rekomendasi
 * lengkap: 9 dimensi x 3 role) rutin melewati batas itu begitu skema diperluas dengan
 * indikator_keberhasilan/hal_diwaspadai (migration 20260731100000). Solusinya BUKAN memaksa
 * Claude memadatkan isi (itu akan mengorbankan kualitas narasi), tapi menyambung isinya lewat
 * kolom lanjutan bernama sama plus akhiran "_2", "_3", dst -- Claude diminta melakukan ini di
 * docs/Prompt_Laporan_Lembaga_SC_Excel.md kalau satu kolom kepanjangan. Fungsi ini menyambung
 * semua bagian jadi satu string sebelum di-parse, berhenti begitu satu nomor lanjutan kosong. */
function getFieldConcat(row, baseKey) {
  let hasil = String(getField(row, baseKey) ?? '');
  for (let i = 2; i <= 20; i++) {
    const lanjutan = getField(row, `${baseKey}_${i}`);
    if (lanjutan === undefined || lanjutan === null || String(lanjutan).trim() === '') break;
    hasil += String(lanjutan);
  }
  return hasil;
}

function parsePregenJson(v, validasi) {
  if (v && typeof v === 'object' && !Array.isArray(v)) return validasi(v);

  const teks = String(v ?? '').trim();
  if (!teks) return { value: null };

  const bersih = teks.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(bersih);
  } catch {
    return { value: null, error: 'isinya bukan JSON yang valid' };
  }
  return validasi(parsed);
}

function validasiBentukLaporan(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { value: null, error: 'JSON-nya bukan objek' };
  }
  if (!obj.header || !Array.isArray(obj.rencana_aksi)) {
    return { value: null, error: 'tidak ada field "header" atau "rencana_aksi" (harus array)' };
  }
  return { value: obj };
}

/** Bentuk minimal briefing agregat -- padanan keluaran SYSTEM_INSTRUCTION_SC_BRIEFING
 * (_shared/geminiPromptSc.ts): field wajib cuma "gambaran", sisanya (tema_esai/cerita_pegawai)
 * opsional persis seperti Gemini boleh mengembalikan array kosong untuk keduanya. */
function validasiBentukBriefing(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { value: null, error: 'JSON-nya bukan objek' };
  }
  if (!obj.gambaran || typeof obj.gambaran !== 'string') {
    return { value: null, error: 'tidak ada field "gambaran" (wajib teks)' };
  }
  return { value: obj };
}

/** Bentuk minimal tindak lanjut agregat, dikelompokkan per target_role -- generate-tindak-lanjut
 * dipicu SATU role per panggilan (manajemen/kepala_sekolah/yayasan), jadi bentuknya objek
 * {role: [...]}, BUKAN array datar seperti rencana_aksi individu. Tiap item per role divalidasi
 * minimal sama seperti Gemini (title + type + fokus + term + konkret non-kosong). */
const ROLE_TINDAK_LANJUT_VALID = ['manajemen', 'kepala_sekolah', 'yayasan'];
function validasiBentukTindakLanjutAgregat(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { value: null, error: 'JSON-nya bukan objek (harus dikelompokkan per role: manajemen/kepala_sekolah/yayasan)' };
  }
  const hasil = {};
  let adaIsi = false;
  for (const role of ROLE_TINDAK_LANJUT_VALID) {
    const arr = obj[role];
    if (arr === undefined) continue;
    if (!Array.isArray(arr)) {
      return { value: null, error: `field "${role}" harus array` };
    }
    const validItems = arr.filter((r) => r && r.title && r.type && r.fokus && r.term && Array.isArray(r.konkret) && r.konkret.length > 0);
    if (validItems.length > 0) { hasil[role] = validItems; adaIsi = true; }
  }
  if (!adaIsi) {
    return { value: null, error: 'tidak ada item tindak lanjut valid untuk role manajemen/kepala_sekolah/yayasan' };
  }
  return { value: hasil };
}

/** Kunci tipe budaya di kolom xlsx (huruf kecil) -> label produk yang dipakai UI (scMeta.js).
 * Label ini SUDAH bukan istilah OCAI mentah (Klan/Adhokrasi/Pasar/Hierarki) -- sesuai instruksi
 * pemilik produk, label yang dipakai persis yang ada di data olahan sekolah sendiri. */
const TIPE_LABEL = {
  kekeluargaan: 'Kekeluargaan',
  inovasi: 'Inovasi',
  orientasi: 'Orientasi',
  aturan: 'Aturan',
};
const TIPE_KODE = Object.keys(TIPE_LABEL);

/** kode dimensi profil organisasi (6, rata-rata lintas 4 tipe budaya) -> label tampil. */
const DIMENSI_LABEL = {
  karakter_lembaga: 'Karakter Lembaga',
  kepemimpinan: 'Kepemimpinan',
  management: 'Manajemen',
  sinergi: 'Sinergi Tim',
  fokus: 'Fokus Strategis',
  performance: 'Kinerja/Performa',
};
const DIMENSI_KODE = Object.keys(DIMENSI_LABEL);

/** kode subdimensi kesejahteraan (5) -> label tampil, persis nama kolom di sheet Personal/Lembaga. */
const KESEJAHTERAAN_LABEL = {
  kepuasan_kepemimpinan: 'Kepuasan pada Kepemimpinan',
  kenyamanan_bekerja: 'Kenyamanan Bekerja',
  pengembangan_diri: 'Pengembangan Diri',
  ekspektasi: 'Ekspektasi Terpenuhi',
  work_life_balance: 'Work-Life Balance',
};
const KESEJAHTERAAN_KODE = Object.keys(KESEJAHTERAAN_LABEL);

/** 6 dimensi x 4 tipe budaya = kolom jawaban Likert 1-5 mentah di sheet Personal, disimpan
 * ke jawaban_mentah untuk audit/regenerasi, tidak pernah ditampilkan langsung. Nama kolom
 * aslinya dicari lewat prefix (findRawItemCol di bawah), bukan daftar tetap, karena akhiran
 * tiap kolom berisi deskripsi butir yang beda-beda. */
const DIMENSI_ITEM_PREFIX = ['karakter', 'leadership', 'manajemen', 'sinergi', 'fokus', 'performance'];

/** Cari SEMUA kolom yang diawali "gambaran_<dimensi>_<tipe>" atau "harapan_<dimensi>_<tipe>"
 * apa pun akhiran deskripsinya (mis. "gambaran_karakter_kekeluargaan_seperti_keluarga") --
 * BUKAN dicocokkan persis, karena akhiran itu beda-beda per kolom (deskripsi butir), bukan
 * bagian kunci. Pola pencarian sama semangatnya dengan detectAspekKode() di karakterImporter.js:
 * cari lewat prefix, bukan daftar nama kolom tetap. */
function findRawItemCol(headerKeys, prefix, dim, tipe) {
  const re = new RegExp(`^${prefix}_${dim}_${tipe}(_|$)`, 'i');
  return headerKeys.find((k) => re.test(k.trim()));
}

/** Bangun jsonb jawaban_mentah: satu entri per kolom Likert 1-5 mentah yang benar-benar
 * ditemukan di header (gambaran_ dan harapan_ x 6 dimensi x 4 tipe, plus B1-B13 kesejahteraan). */
function buildJawabanMentah(row, headerKeys) {
  const out = {};
  ['gambaran', 'harapan'].forEach((prefix) => {
    DIMENSI_ITEM_PREFIX.forEach((dim) => {
      TIPE_KODE.forEach((tipe) => {
        const col = findRawItemCol(headerKeys, prefix, dim, tipe);
        if (col) out[col] = row[col];
      });
    });
  });
  // B1-B13 kesejahteraan mentah: kolom "survey_bN_..." apa pun akhirannya.
  headerKeys.forEach((k) => {
    if (/^survey_b\d+_/i.test(k.trim())) out[k] = row[k];
  });
  return out;
}

const ESSAY_COLS = [
  ['survey_q1_gambaran_lembaga', 'gambaran_lembaga'],
  ['survey_q2_kejadian_kesaharian', 'kejadian_kesaharian'],
  ['survey_q3_yang_ingin_diubah', 'yang_ingin_diubah'],
  ['survey_q4_alasan_betah', 'alasan_betah'],
  ['survey_q5_hal_menguras_energi', 'hal_menguras_energi'],
  ['survey_q6_yang_ingin_disampaikan', 'yang_ingin_disampaikan'],
  ['survey_q7_essay_bebas', 'essay_bebas'],
];

function buildEssay(row) {
  const out = {};
  ESSAY_COLS.forEach(([col, key]) => {
    const v = getField(row, col);
    if (v !== undefined && String(v).trim() !== '') out[key] = v;
  });
  return out;
}

/** Bangun 4 entri budaya {tipe, mean_gambaran, mean_harapan, t_gambaran, predikat_gambaran,
 * t_harapan, predikat_harapan, gap, predikat_gap} dari kolom mean_, t_konversi_, dan gap_ --
 * dipakai baik untuk baris Personal (per staf) maupun Lembaga (agregat, kolom beda nama
 * sedikit -- lihat buildBudayaLembaga di bawah). */
function buildBudayaPersonal(row) {
  return TIPE_KODE.map((tipe) => ({
    tipe: TIPE_LABEL[tipe],
    mean_gambaran: pct(getField(row, `mean_gambaran_${tipe}`)),
    mean_harapan: pct(getField(row, `mean_harapan_${tipe}`)),
    t_gambaran: pct(getField(row, `t_konversi_gambaran_${tipe}`)),
    predikat_gambaran: getField(row, `predikat_t_konversi_gambaran_${tipe}`) || null,
    t_harapan: pct(getField(row, `t_konversi_harapan_${tipe}`)),
    predikat_harapan: getField(row, `predikat_t_konversi_harapan_${tipe}`) || null,
    gap: pct(getField(row, `gap_${tipe}`)),
    predikat_gap: getField(row, `predikat_gap_${tipe}`) || null,
  }));
}

/** Sheet Lembaga pakai nama kolom gambaran_ dan harapan_ langsung (bukan mean_gambaran_ /
 * t_konversi_gambaran_ seperti sheet Personal) -- lihat header asli yang sudah dicek:
 * gambaran_kekeluargaan, predikat_gambaran_kekeluargaan, harapan_kekeluargaan,
 * predikat_harapan_kekeluargaan, gap_kekeluargaan, predikat_gap_kekeluargaan. */
function buildBudayaLembaga(row) {
  return TIPE_KODE.map((tipe) => ({
    tipe: TIPE_LABEL[tipe],
    mean_gambaran: pct(getField(row, `gambaran_${tipe}`)),
    mean_harapan: pct(getField(row, `harapan_${tipe}`)),
    t_gambaran: null,
    predikat_gambaran: getField(row, `predikat_gambaran_${tipe}`) || null,
    t_harapan: null,
    predikat_harapan: getField(row, `predikat_harapan_${tipe}`) || null,
    gap: pct(getField(row, `gap_${tipe}`)),
    predikat_gap: getField(row, `predikat_gap_${tipe}`) || null,
  }));
}

/** Profil organisasi (6 dimensi) dan kesejahteraan (5 subdimensi): kategori/predikat HANYA
 * diisi kalau kolom predikat_* benar-benar ada di baris ini -- TIDAK PERNAH ditebak dari angka
 * (lihat catatan "parameter terbuka" di migration 20260722100000 dan CLAUDE.md butir "parameter
 * yang masih terbuka"). Sheet Personal tidak punya kolom predikat untuk blok ini, sheet Lembaga
 * punya -- fungsi yang sama dipakai untuk keduanya, hasilnya otomatis beda karena kolomnya beda. */
function buildKodeLabelNilai(row, kodeList, labelMap, nilaiPrefix) {
  return kodeList.map((kode) => {
    const nilaiCol = `${nilaiPrefix}${kode}`;
    const predikatCol = `predikat_${nilaiPrefix}${kode}`;
    const predikat = getField(row, predikatCol);
    return {
      kode,
      label: labelMap[kode],
      nilai: pct(getField(row, nilaiCol)),
      kategori: predikat !== undefined && String(predikat).trim() !== '' ? predikat : null,
    };
  });
}

/**
 * Rata-rata 4 item mentah harapan_<dimensi>_<tipe> per dimensi, dikonversi ke skala persen
 * (skala 1-5 dibagi 5 dikali 100) -- PERSIS rumus yang sudah dipakai hulu untuk kolom
 * nilai_karakter_lembaga dkk (diverifikasi: mean 4 item gambaran 5,5,4,3 -> 4.25 -> 85%,
 * cocok dengan nilai_karakter_lembaga="85 %" di sheet Personal contoh).
 *
 * Sheet Personal TIDAK punya kolom ringkasan "harapan_nilai_<dimensi>" siap pakai (beda dari
 * budaya yang punya mean_harapan_* eksplisit) -- tapi item mentahnya ADA (harapan_karakter_*
 * dst, 24 kolom, struktur sama persis dengan gambaran_*). Fungsi ini mengisi kekosongan itu
 * dengan rata-rata sederhana dari item yang SUDAH tersimpan, bukan menghitung ulang angka yang
 * sudah final (nilai gambaran/mean_gambaran budaya tetap dipakai apa adanya) -- cuma menambah
 * satu angka yang sebelumnya tidak pernah dirangkum sama sekali.
 */
function buildDimensiHarapan(row, headerKeys) {
  const out = {};
  DIMENSI_ITEM_PREFIX.forEach((dim, i) => {
    const kode = DIMENSI_KODE[i];
    const nilai = TIPE_KODE
      .map((tipe) => {
        const col = findRawItemCol(headerKeys, 'harapan', dim, tipe);
        if (!col) return null;
        const n = parseFloat(String(row[col]).replace(',', '.').trim());
        return Number.isFinite(n) ? n : null;
      })
      .filter((n) => n != null);
    if (nilai.length === 0) { out[kode] = null; return; }
    const mean = nilai.reduce((a, b) => a + b, 0) / nilai.length;
    out[kode] = Math.round((mean / 5) * 100 * 100) / 100;
  });
  return out;
}

/** Tempel field harapan/gap (opsional) ke hasil buildKodeLabelNilai untuk profil organisasi --
 * fungsi terpisah dari buildKodeLabelNilai supaya kesejahteraan (yang memang tidak punya item
 * harapan sama sekali, B1-B13 cuma satu arah) tidak ikut disentuh. */
function withDimensiHarapan(profilOrganisasi, row, headerKeys) {
  const harapanByKode = buildDimensiHarapan(row, headerKeys);
  return profilOrganisasi.map((d) => {
    const harapan = harapanByKode[d.kode];
    if (harapan == null || d.nilai == null) return d;
    return { ...d, harapan, gap: Math.round((harapan - d.nilai) * 100) / 100 };
  });
}

/**
 * Baca workbook Excel School Culture (sheet "Personal" + "Lembaga"). periodeId WAJIB dipasok
 * pemanggil (diketik admin di layar Upload) karena file ini tidak punya kolom bulan sama sekali.
 */
export async function parseScWorkbook(file, { sekolahId, periodeId }) {
  if (!periodeId) {
    return {
      ok: false,
      preview: { sheets: [] },
      error: 'Periode wajib diisi untuk modul School Culture -- file ini tidak punya kolom bulan/periode sendiri.',
    };
  }

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheet = (name) => (wb.Sheets[name] ? XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' }) : []);

  const personalRaw = sheet('Personal');
  const lembagaRaw = sheet('Lembaga');

  const preview = {
    sheets: [
      { name: 'Personal', rows: personalRaw.length, found: personalRaw.length > 0 },
      { name: 'Lembaga', rows: lembagaRaw.length, found: lembagaRaw.length > 0 },
    ],
    periodeDetected: [{ periode: periodeId, rows: personalRaw.length }],
  };

  if (personalRaw.length === 0) {
    return { preview, ok: false, error: 'Sheet "Personal" tidak ditemukan atau kosong.' };
  }
  if (getField(personalRaw[0], 'identitas_nama') === undefined) {
    return {
      preview, ok: false,
      error: `Kolom "identitas_nama" tidak ditemukan di sheet Personal. Kolom yang benar-benar ada di file: ${Object.keys(personalRaw[0]).join(', ')}. Kemungkinan file ini pakai template yang berbeda, importer perlu disesuaikan.`,
    };
  }

  const headerKeys = Object.keys(personalRaw[0]);
  const badRows = [];
  // Peringatan laporan_json TERPISAH dari badRows: badRows menggagalkan import (data inti tidak
  // terbaca), sedangkan laporan_json yang rusak cuma membuat baris itu jatuh ke jalur Gemini --
  // import tetap boleh jalan. Dibedakan supaya satu sel JSON salah ketik tidak memblokir seluruh
  // data asesmen yang sebenarnya sudah benar.
  const pregenWarnings = [];
  let pregenCount = 0;

  const personalRows = personalRaw.map((r, i) => {
    const nama = getField(r, 'identitas_nama');
    if (!String(nama || '').trim()) {
      badRows.push(`Personal baris ${i + 2} (identitas_nama kosong)`);
      return null;
    }
    const pregen = parsePregenJson(getField(r, 'laporan_json'), validasiBentukLaporan);
    if (pregen.error) {
      pregenWarnings.push(`${String(nama).trim()} (baris ${i + 2}): ${pregen.error}`);
    } else if (pregen.value) {
      pregenCount++;
    }
    return {
      sekolah_id: sekolahId,
      periode_id: periodeId,
      nama_responden: nama,
      no_whatsapp: getField(r, 'identitas_no_whatsapp') || null,
      email: getField(r, 'identitas_email') || null,
      usia: Number.isFinite(parseInt(getField(r, 'demografi_usia'), 10)) ? parseInt(getField(r, 'demografi_usia'), 10) : null,
      jenis_kelamin: getField(r, 'demografi_jenis_kelamin') || null,
      unit: getField(r, 'demografi_unit') || null,
      jenjang: getField(r, 'demografi_jenjang') || null,
      peran_kerja: getField(r, 'demografi_peran') || null,
      lama_kerja: getField(r, 'demografi_lama_kerja') || null,
      bersedia: parseBersedia(getField(r, 'bersedia')),
      jawaban_mentah: buildJawabanMentah(r, headerKeys),
      budaya: buildBudayaPersonal(r),
      profil_organisasi: withDimensiHarapan(
        buildKodeLabelNilai(r, DIMENSI_KODE, DIMENSI_LABEL, 'nilai_'), r, headerKeys
      ),
      kesejahteraan: buildKodeLabelNilai(r, KESEJAHTERAAN_KODE, KESEJAHTERAAN_LABEL, ''),
      essay: buildEssay(r),
      pregen_laporan: pregen.value,
    };
  }).filter(Boolean);

  if (badRows.length > 0) {
    return {
      preview, ok: false,
      error: `Data tidak terbaca di: ${badRows.slice(0, 5).join(', ')}${badRows.length > 5 ? ` (+${badRows.length - 5} baris lain)` : ''}. Kolom "identitas_nama" wajib terisi untuk tiap responden.`,
    };
  }

  // Lembaga: satu baris agregat (opsional per unit kalau kolom "unit" ada di sheet-nya --
  // lihat catatan di migration 20260722100000). jumlah_responden BUKAN dibaca dari file
  // (sheet Lembaga tidak punya kolom itu), tapi dihitung dari jumlah baris Personal yang
  // baru saja diparse -- ini bookkeeping (menghitung baris), bukan menghitung skor.
  //
  // briefing_json/tindak_lanjut_json (opsional): konten agregat siap pakai dari hulu, padanan
  // laporan_json di sheet Personal tapi untuk briefing + tindak lanjut pimpinan (lihat migration
  // 20260729100000). Peringatan digabung ke pregenWarnings/pregenCount yang sama seperti
  // laporan_json -- satu ringkasan untuk admin, bukan tiga blok terpisah yang membingungkan.
  const lembagaRows = lembagaRaw.map((r, i) => {
    const briefingPregen = parsePregenJson(getFieldConcat(r, 'briefing_json'), validasiBentukBriefing);
    if (briefingPregen.error) {
      pregenWarnings.push(`Lembaga baris ${i + 2}, briefing_json: ${briefingPregen.error}`);
    } else if (briefingPregen.value) {
      pregenCount++;
    }
    const tindakLanjutPregen = parsePregenJson(getFieldConcat(r, 'tindak_lanjut_json'), validasiBentukTindakLanjutAgregat);
    if (tindakLanjutPregen.error) {
      pregenWarnings.push(`Lembaga baris ${i + 2}, tindak_lanjut_json: ${tindakLanjutPregen.error}`);
    } else if (tindakLanjutPregen.value) {
      pregenCount++;
    }
    return {
      sekolah_id: sekolahId,
      periode_id: periodeId,
      unit: getField(r, 'unit') || null,
      jumlah_responden: personalRows.length,
      budaya: buildBudayaLembaga(r),
      profil_organisasi: buildKodeLabelNilai(r, DIMENSI_KODE, DIMENSI_LABEL, 'nilai_'),
      kesejahteraan: buildKodeLabelNilai(r, KESEJAHTERAAN_KODE, KESEJAHTERAAN_LABEL, ''),
      pregen_briefing: briefingPregen.value,
      pregen_tindak_lanjut: tindakLanjutPregen.value,
    };
  });

  return {
    ok: true,
    // pregen* dilaporkan ke UI (Upload.jsx) supaya admin tahu SEBELUM konfirmasi: berapa yang
    // sudah siap pakai dari Excel (tidak perlu Gemini), dan baris/aspek mana yang JSON-nya
    // tidak terbaca sehingga akan jatuh kembali ke Gemini.
    preview: { ...preview, pregenCount, pregenWarnings },
    rows: { personalRows, lembagaRows },
  };
}

/**
 * Tulis hasil parse ke Supabase lewat Edge Function admin-actions (action "import-sc"), yang
 * memanggil RPC import_sc_periode (migration 20260722100000) pakai service_role -- satu
 * panggilan RPC, DELETE lalu INSERT sc_personal+sc_lembaga dalam satu transaksi. Pola identik
 * importKarakterWorkbook() di karakterImporter.js.
 */
export async function importScWorkbook(parsed) {
  const { personalRows, lembagaRows } = parsed.rows;
  const sekolahId = personalRows[0]?.sekolah_id;
  const periodeId = personalRows[0]?.periode_id;
  if (!sekolahId || !periodeId) return { ok: true, rowsWritten: 0 };

  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: {
      action: 'import-sc',
      payload: { sekolah_id: sekolahId, periode_id: periodeId, personal: personalRows, lembaga: lembagaRows },
    },
  });
  if (error) {
    const detail = await edgeErrorDetail(error, 'Edge Function admin-actions gagal dipanggil.');
    return { ok: false, rowsWritten: 0, error: detail };
  }
  if (!data?.ok) {
    return { ok: false, rowsWritten: 0, error: data?.error || 'Import gagal tanpa keterangan.' };
  }
  return { ok: true, rowsWritten: (data?.personal || 0) + (data?.lembaga || 0) };
}

export { normalizeNama };
