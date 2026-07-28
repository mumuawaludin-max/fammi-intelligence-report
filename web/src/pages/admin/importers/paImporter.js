import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabase';

/**
 * Importer modul Perilaku Anak (pa).
 *
 * Sumbernya workbook gabungan "Kesehatan Mental Athirah v2 + Narasi.xlsx": 31 sheet data hasil
 * pipeline asesmen + 8 sheet NARASI berawalan "NARASI" berisi kalimat insight/analisis yang
 * ditulis manusia.
 *
 * PENTING -- sheet dikenali dari BENTUK HEADER-nya, bukan dari namanya. Alasannya konkret: di file
 * sumber, 13 dari 18 sheet survei bernama generik "Sheet25".."Sheet34" (Excel memotong nama sheet
 * di 31 karakter dan sisanya tidak pernah dinamai ulang), dan satu sheet punya spasi ganda
 * ("PAGE 1  Emosi per Sekolah"). Mencocokkan nama akan rapuh dan diam-diam melewatkan data.
 * Pengenalan berbasis header juga membuat importer ini tidak terikat penamaan satu sekolah,
 * sejalan dengan pelajaran importer Karakter/MI sebelumnya.
 *
 * Kolom "sekolah" di file (SD Kajaolalido / SMP Islam Athirah Bone / SMA Islam Athirah Bone)
 * dipetakan ke kolom `unit` di tabel pa_*, BUKAN ke schools.id -- ketiganya satu lembaga yang
 * sama di FIR, dan filter "Unit sekolah" di tampilan memang membaca kolom ini. `unit IS NULL`
 * berarti baris agregat seluruh unit, pola sama dengan sc_lembaga.unit.
 */

const DOMAINS = ['hiperaktivitas', 'emosional', 'agresi', 'relasi', 'tolong_menolong'];
const STATUS_VALID = ['Aman', 'Perlu Perhatian', 'Perlu Diwaspadai'];
const SCOPE_SEMUA = 'Semua Unit';

/** Samakan bentuk header supaya "Total Siswa", "total_siswa", dan "total-siswa" dianggap sama. */
function norm(s) {
  return String(s ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/** "50,62 %" -> 50.62 · "" -> null. Toleran koma desimal dan tanda persen. */
function num(v) {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = parseFloat(String(v).replace('%', '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function int(v) {
  const n = num(v);
  return n === null ? null : Math.round(n);
}

function teks(v) {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
}

/**
 * Sel JSON di sheet "PAGE 3 Top 3 Perlu Perhatian" (indikator per domain). Isinya string JSON,
 * kadang dibungkus pagar markdown kalau pernah lewat chat -- dibersihkan dulu, pola sama dengan
 * parsePregenJson di scImporter.
 */
function parseJsonSel(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'object') return v;
  const s = String(v).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/** Ambil semua sheet jadi { name, header[], rows[] } dengan header sudah dinormalisasi. */
function bacaSemuaSheet(wb) {
  return wb.SheetNames.map((name) => {
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '', raw: false });
    let last = aoa.length - 1;
    while (last >= 0 && aoa[last].every((c) => String(c).trim() === '')) last--;
    const trimmed = aoa.slice(0, last + 1);
    const header = (trimmed[0] || []).map(norm);
    const rows = trimmed.slice(1).map((r) => {
      const o = {};
      header.forEach((h, i) => { if (h) o[h] = r[i] ?? ''; });
      return o;
    });
    return { name, header, rows };
  });
}

function cariSheet(sheets, cocok) {
  return sheets.find(cocok) || null;
}

/** Sheet survei tertutup: header persis [<kode_pertanyaan>, keyword, total_siswa, persentase_siswa]. */
function isSheetSurvei(s) {
  return s.header.length >= 4
    && s.header[1] === 'keyword'
    && s.header[2] === 'total_siswa'
    && s.header[3] === 'persentase_siswa';
}

/** Sheet siswa per domain: header [nama, kelas, sekolah, <domain>, <domain>_total]. */
function isSheetSiswa(s) {
  return s.header.length >= 5
    && s.header[0] === 'nama'
    && s.header[1] === 'kelas'
    && s.header[2] === 'sekolah'
    && DOMAINS.includes(s.header[3]);
}

/** Sheet esai mentah: 3 kolom, [nama, <domain>_survey_*, <domain>_survey_*]. */
function isSheetEsaiMentah(s) {
  return s.header.length === 3
    && s.header[0] === 'nama'
    && /_survey_/.test(s.header[1] || '')
    && /_survey_/.test(s.header[2] || '');
}

/** "tolong" (prefix di file) -> "tolong_menolong" (kode domain baku). */
function normDomain(prefix) {
  const p = norm(prefix);
  if (p === 'tolong') return 'tolong_menolong';
  return DOMAINS.includes(p) ? p : null;
}

// ── Perakit bagian per-unit ────────────────────────────────────────────────────────────────

/** heart[domain] = { aman: {jumlah, persen}, perhatian: {...}, diwaspadai: {...} } */
function bangunHeart(rows) {
  const out = {};
  for (const d of DOMAINS) out[d] = {};
  for (const r of rows) {
    const hasil = teks(r.hasil);
    const key = hasil === 'Aman' ? 'aman'
      : hasil === 'Perlu Perhatian' ? 'perhatian'
        : hasil === 'Perlu Diwaspadai' ? 'diwaspadai' : null;
    if (!key) continue;
    for (const d of DOMAINS) {
      out[d][key] = { jumlah: int(r[d]), persen: num(r['persentase_' + d]) };
    }
  }
  return out;
}

const EMOSI_LEVELS = [
  ['sangat_positif', 'Sangat Positif'],
  ['positif', 'Positif'],
  ['netral', 'Netral'],
  ['negatif', 'Negatif'],
  ['sangat_negatif', 'Sangat Negatif'],
  ['kosong', 'Tidak Menjawab'],
];

function bangunEmosiRow(r) {
  return EMOSI_LEVELS.map(([kode, label]) => ({
    kode,
    label,
    jumlah: int(r['emosi_' + kode]),
    persen: num(r['persentase_' + kode]),
  }));
}

// ── Perakit narasi ────────────────────────────────────────────────────────────────────────

/** Kumpulkan kolom ISI_x_1..3 jadi array, buang yang kosong. */
function kumpulkanIsi(r, prefix) {
  return [1, 2, 3].map((i) => teks(r['isi_' + prefix + '_' + i])).filter(Boolean);
}

/**
 * Rakit objek narasi per unit_scope dari tujuh sheet NARASI. Kembaliannya map:
 *   { "Semua Unit": {...}, "SD Kajaolalido": {...}, ... }
 * Baris yang kolom ISI_-nya masih kosong sengaja TIDAK menghasilkan key apa pun (bukan string
 * kosong) supaya tampilan bisa membedakan "belum ditulis" dari "sengaja kosong" dan tidak
 * merender blok kosong.
 */
function bangunNarasi(sheets) {
  const per = {};
  const bucket = (scope) => {
    const k = teks(scope) || SCOPE_SEMUA;
    if (!per[k]) per[k] = {};
    return per[k];
  };

  const s02d = cariSheet(sheets, (s) => s.header.includes('isi_insight_kalimat') && s.header.includes('domain'));
  if (s02d) {
    for (const r of s02d.rows) {
      const v = teks(r.isi_insight_kalimat);
      const d = normDomain(r.domain);
      if (!v || !d) continue;
      const b = bucket(r.unit_scope);
      b.insight_02_domain = b.insight_02_domain || {};
      b.insight_02_domain[d] = v;
    }
  }

  const s03a = cariSheet(sheets, (s) => s.header.includes('isi_interpretasi'));
  if (s03a) {
    for (const r of s03a.rows) {
      const d = normDomain(r.domain);
      if (!d) continue;
      const isi = {
        status_label: teks(r.isi_status_label),
        interpretasi: teks(r.isi_interpretasi),
        kemungkinan_penyebab: kumpulkanIsi(r, 'kemungkinan_penyebab'),
        rekomendasi: kumpulkanIsi(r, 'rekomendasi'),
        tanda_keberhasilan: kumpulkanIsi(r, 'tanda_keberhasilan'),
      };
      const adaIsi = isi.status_label || isi.interpretasi
        || isi.kemungkinan_penyebab.length || isi.rekomendasi.length || isi.tanda_keberhasilan.length;
      if (!adaIsi) continue;
      const b = bucket(r.unit_scope);
      b.analisis_03_domain = b.analisis_03_domain || {};
      b.analisis_03_domain[d] = isi;
    }
  }

  const s04i = cariSheet(sheets, (s) => s.header.includes('isi_interpretasi_kalimat'));
  if (s04i) {
    for (const r of s04i.rows) {
      const v = teks(r.isi_interpretasi_kalimat);
      const kode = teks(r.pertanyaan_kode);
      if (!v || !kode) continue;
      const b = bucket(SCOPE_SEMUA); // survei di file sumber tidak dipecah per unit
      b.interpretasi_04 = b.interpretasi_04 || {};
      b.interpretasi_04[norm(kode)] = v;
    }
  }

  // Tiga sheet "Insight Utama" (02/03/04) punya header identik, dibedakan lewat urutan
  // kemunculannya di workbook -- itu sebabnya di-filter jadi daftar dulu, bukan cariSheet biasa.
  const utamaSheets = sheets.filter((s) => s.header.includes('isi_insight_utama_kalimat'));
  const utamaKeys = ['insight_02_utama', 'insight_03_utama', 'insight_04_utama'];
  utamaSheets.forEach((s, i) => {
    const key = utamaKeys[i];
    if (!key) return;
    for (const r of s.rows) {
      const v = teks(r.isi_insight_utama_kalimat);
      if (!v) continue;
      bucket(r.unit_scope)[key] = v;
    }
  });

  return per;
}

// ── Parser utama ──────────────────────────────────────────────────────────────────────────

export async function parsePaWorkbook(file, { sekolahId, periodeId } = {}) {
  if (!periodeId || !/^\d{4}-\d{2}$/.test(periodeId)) {
    return { ok: false, error: 'Periode wajib diisi dengan format YYYY-MM (contoh: 2026-07).' };
  }
  if (!sekolahId) return { ok: false, error: 'Sekolah belum dipilih.' };

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheets = bacaSemuaSheet(wb);

  // ── Data wajib ──
  const shTotal = cariSheet(sheets, (s) => s.header.includes('total_siswa') && s.header.includes('laki_laki'));
  const shPerUnit = cariSheet(sheets, (s) => s.header[0] === 'sekolah' && s.header.includes('total_siswa') && s.header.includes('persentase'));
  const shEmosi = cariSheet(sheets, (s) => s.header[0] === 'sekolah' && s.header.includes('emosi_netral'));
  const shHeartTotal = cariSheet(sheets, (s) => s.header[0] === 'hasil' && DOMAINS.every((d) => s.header.includes(d)));
  const shHeartUnit = cariSheet(sheets, (s) => s.header[0] === 'sekolah' && s.header[1] === 'hasil');
  const shIndikator = cariSheet(sheets, (s) => s.header.some((h) => h.startsWith('top3_')));

  const kurang = [];
  if (!shTotal) kurang.push('total siswa (kolom total_siswa + laki_laki)');
  if (!shPerUnit) kurang.push('siswa per sekolah (kolom sekolah + total_siswa + persentase)');
  if (!shEmosi) kurang.push('emosi per sekolah (kolom sekolah + emosi_netral)');
  if (!shHeartTotal) kurang.push('total HEART (kolom hasil + lima domain)');
  if (!shHeartUnit) kurang.push('HEART per sekolah (kolom sekolah + hasil)');
  if (kurang.length > 0) {
    return {
      ok: false,
      error: 'Sheet berikut tidak ditemukan di file: ' + kurang.join('; ')
        + '. Sheet dikenali dari nama kolomnya, jadi pastikan baris header tidak diubah.',
    };
  }

  const shSiswa = sheets.filter(isSheetSiswa);
  const shSurvei = sheets.filter(isSheetSurvei);
  const shEsaiMentah = sheets.filter(isSheetEsaiMentah);
  const shAnotasi = cariSheet(sheets, (s) => s.header.includes('kode_anonim') && s.header.includes('isi_sinyal_pembacaan'));

  // ── Unit yang benar-benar ada di file ──
  const unitList = shPerUnit.rows.map((r) => teks(r.sekolah)).filter(Boolean);
  if (unitList.length === 0) {
    return { ok: false, error: 'Sheet "siswa per sekolah" tidak berisi baris unit satu pun.' };
  }

  const narasiPerScope = bangunNarasi(sheets);

  // ── pa_lembaga: satu baris agregat (unit null) + satu baris per unit ──
  const totalRow = shTotal.rows[0] || {};
  const emosiByUnit = Object.fromEntries(shEmosi.rows.map((r) => [teks(r.sekolah), r]));
  const heartUnitRows = {};
  for (const r of shHeartUnit.rows) {
    const u = teks(r.sekolah);
    if (!u) continue;
    (heartUnitRows[u] = heartUnitRows[u] || []).push(r);
  }

  const indikator = {};
  if (shIndikator) {
    const r = shIndikator.rows[0] || {};
    for (const d of DOMAINS) {
      // Header aslinya "top3_tolong" untuk tolong_menolong, jadi dicoba dua bentuk.
      const raw = r['top3_' + d] ?? r['top3_' + d.split('_')[0]];
      const parsed = parseJsonSel(raw);
      if (Array.isArray(parsed)) {
        indikator[d] = parsed.map((it) => ({
          indikator: teks(it.indikator),
          nilai: num(it.nilai),
          siswa: int(it.siswa),
          persentase: num(it.persentase),
        }));
      }
    }
  }

  const survey = shSurvei.map((s) => {
    const kode = s.header[0];
    return {
      pertanyaan_kode: kode,
      opsi: s.rows
        .map((r) => ({
          label: teks(r[kode]),
          jumlah: int(r.total_siswa),
          persen: num(r.persentase_siswa),
        }))
        .filter((o) => o.label),
    };
  }).filter((s) => s.opsi.length > 0);

  const lembagaRows = [];

  lembagaRows.push({
    sekolah_id: sekolahId,
    periode_id: periodeId,
    unit: null,
    jumlah_siswa: int(totalRow.total_siswa) || 0,
    statistik: {
      total: int(totalRow.total_siswa),
      laki: { jumlah: int(totalRow.laki_laki), persen: num(totalRow.persen_laki_laki) },
      perempuan: { jumlah: int(totalRow.perempuan), persen: num(totalRow.persen_perempuan) },
      sebaran: shPerUnit.rows.map((r) => ({
        unit: teks(r.sekolah),
        jumlah: int(r.total_siswa),
        persen: num(r.persentase),
      })).filter((x) => x.unit),
    },
    emosi: unitList.map((u) => ({
      unit: u,
      segmen: emosiByUnit[u] ? bangunEmosiRow(emosiByUnit[u]) : [],
    })),
    heart: bangunHeart(shHeartTotal.rows),
    indikator: Object.keys(indikator).length > 0 ? indikator : null,
    survey: survey.length > 0 ? survey : null,
    narasi: narasiPerScope[SCOPE_SEMUA] || null,
  });

  for (const u of unitList) {
    const perUnitRow = shPerUnit.rows.find((r) => teks(r.sekolah) === u) || {};
    lembagaRows.push({
      sekolah_id: sekolahId,
      periode_id: periodeId,
      unit: u,
      jumlah_siswa: int(perUnitRow.total_siswa) || 0,
      statistik: {
        total: int(perUnitRow.total_siswa),
        persen_dari_lembaga: num(perUnitRow.persentase),
      },
      emosi: emosiByUnit[u] ? [{ unit: u, segmen: bangunEmosiRow(emosiByUnit[u]) }] : null,
      heart: heartUnitRows[u] ? bangunHeart(heartUnitRows[u]) : null,
      indikator: null,   // file sumber tidak memecah indikator per unit
      survey: null,      // file sumber tidak memecah survei per unit
      narasi: narasiPerScope[u] || null,
    });
  }

  // ── pa_siswa ──
  const siswaRows = [];
  const statusAsing = new Set();
  for (const s of shSiswa) {
    const domain = s.header[3];
    const kolomSkor = s.header[4];
    for (const r of s.rows) {
      const nama = teks(r.nama);
      if (!nama) continue;
      const status = teks(r[domain]);
      if (status && !STATUS_VALID.includes(status)) statusAsing.add(status);
      siswaRows.push({
        sekolah_id: sekolahId,
        periode_id: periodeId,
        nama,
        kelas: teks(r.kelas),
        unit: teks(r.sekolah),
        domain,
        status: status || 'Aman',
        skor: int(r[kolomSkor]),
      });
    }
  }

  // ── pa_esai ──
  // unit/kelas siswa TIDAK ada di sheet esai (mentah maupun NARASI anotasi) -- dicari lewat nama,
  // dari siswaRows yang sudah dibangun di atas (satu siswa muncul di 5 baris, satu per domain,
  // tapi unit/kelasnya sama di semua barisnya, jadi cukup ambil kemunculan pertama).
  const unitKelasByNama = new Map();
  for (const s of siswaRows) {
    if (!unitKelasByNama.has(s.nama)) unitKelasByNama.set(s.nama, { unit: s.unit, kelas: s.kelas });
  }
  function unitKelasUntuk(nama) {
    return unitKelasByNama.get(nama) || { unit: null, kelas: null };
  }

  // Jalur utama: sheet "NARASI RuangBaca Anotasi" -- di situ jawaban mentah DAN kode anonim sudah
  // sebaris dengan kolom anotasi. Jalur cadangan: dua sheet esai mentah, dipakai kalau file yang
  // diunggah masih versi asli tanpa sheet NARASI (kode anonim dibuat di sini, urut kemunculan).
  const esaiRows = [];
  if (shAnotasi) {
    for (const r of shAnotasi.rows) {
      const kode = teks(r.kode_anonim);
      if (!kode) continue;
      const tema = [1, 2, 3].map((i) => teks(r['isi_tema_tag_' + i])).filter(Boolean);
      const sinyal = teks(r.isi_sinyal_pembacaan);
      const saran = teks(r.isi_saran_tindak_lanjut);
      const prioritas = teks(r.isi_prioritas_label);
      const adaAnotasi = tema.length > 0 || sinyal || saran || prioritas;
      const namaEsai = teks(r.nama);
      const { unit: unitEsai, kelas: kelasEsai } = unitKelasUntuk(namaEsai);
      esaiRows.push({
        sekolah_id: sekolahId,
        periode_id: periodeId,
        kode_anonim: kode,
        nama: namaEsai,
        kelas: kelasEsai,
        unit: unitEsai,
        domain: normDomain(r.domain) || teks(r.domain) || 'relasi',
        pertanyaan_kode: teks(r.pertanyaan_kode) || 'esai',
        jawaban_pilihan: teks(r.ref_jawaban_pilihan),
        jawaban_teks: teks(r.ref_jawaban_teks),
        anotasi: adaAnotasi ? { tema, sinyal, saran, prioritas } : null,
      });
    }
  } else {
    const kodeByNama = new Map();
    const kodeUntuk = (nama) => {
      if (!kodeByNama.has(nama)) kodeByNama.set(nama, 'ESAI-' + String(kodeByNama.size + 1).padStart(3, '0'));
      return kodeByNama.get(nama);
    };
    for (const s of shEsaiMentah) {
      const kolPilihan = s.header[1];
      const kolTeks = s.header[2];
      const domain = normDomain((kolTeks.split('_survey_')[0]) || '') || 'relasi';
      const pertanyaanKode = kolTeks.split('_survey_')[1] || kolTeks;
      for (const r of s.rows) {
        const nama = teks(r.nama);
        if (!nama) continue;
        const { unit: unitEsai, kelas: kelasEsai } = unitKelasUntuk(nama);
        esaiRows.push({
          sekolah_id: sekolahId,
          periode_id: periodeId,
          kode_anonim: kodeUntuk(nama),
          nama,
          kelas: kelasEsai,
          unit: unitEsai,
          domain,
          pertanyaan_kode: pertanyaanKode,
          jawaban_pilihan: teks(r[kolPilihan]),
          jawaban_teks: teks(r[kolTeks]),
          anotasi: null,
        });
      }
    }
  }

  // ── Kelengkapan narasi, untuk ditampilkan sebagai peringatan (bukan penggagal import) ──
  const narasiTerisi = Object.values(narasiPerScope).filter((v) => v && Object.keys(v).length > 0).length;
  const anotasiTerisi = esaiRows.filter((r) => r.anotasi).length;
  const peringatan = [];

  // Silang-cek jumlah agregat vs jumlah baris nama. Kalau dua angka ini beda, tampilan akan
  // memberi tahu "63 siswa" di kartu domain tapi cuma sanggup menampilkan 59 nama saat dibuka --
  // selisih yang pasti ditanyakan Yayasan. Lebih baik ketahuan saat unggah daripada saat dibaca.
  const heartAgg = lembagaRows[0].heart || {};
  const selisih = [];
  for (const d of DOMAINS) {
    const agg = heartAgg[d];
    if (!agg) continue;
    for (const [key, label] of [['perhatian', 'Perlu Perhatian'], ['diwaspadai', 'Perlu Diwaspadai']]) {
      const dariAgregat = agg[key]?.jumlah;
      if (dariAgregat === null || dariAgregat === undefined) continue;
      const dariNama = siswaRows.filter((r) => r.domain === d && r.status === label).length;
      if (dariNama !== dariAgregat) {
        selisih.push(`${d}/${label}: agregat ${dariAgregat} vs daftar nama ${dariNama}`);
      }
    }
  }
  if (selisih.length > 0) {
    peringatan.push(
      'Jumlah di sheet agregat tidak sama dengan jumlah baris nama di sheet siswa (' + selisih.join('; ')
      + '). Angka agregat tetap dipakai untuk kartu domain, jadi daftar nama akan tampil lebih sedikit dari angka yang tertera.'
    );
  }

  if (narasiTerisi === 0) {
    peringatan.push('Belum ada satu pun kolom ISI_ di sheet NARASI yang terisi. Data tetap bisa diimpor sekarang, lalu unggah ulang file yang sama setelah narasinya diisi.');
  }
  if (esaiRows.length > 0 && anotasiTerisi === 0) {
    peringatan.push('Jawaban esai terbaca ' + esaiRows.length + ' baris, tapi kolom anotasinya (tema/sinyal/saran) masih kosong semua.');
  }
  if (statusAsing.size > 0) {
    peringatan.push('Ada nilai status di luar tiga yang dikenal (Aman / Perlu Perhatian / Perlu Diwaspadai): ' + [...statusAsing].join(', ') + '.');
  }

  return {
    ok: true,
    preview: {
      sheets: [
        { name: 'Agregat lembaga', rows: lembagaRows.length, found: true },
        { name: 'Siswa per domain', rows: siswaRows.length, found: shSiswa.length > 0 },
        { name: 'Jawaban esai', rows: esaiRows.length, found: esaiRows.length > 0 },
        { name: 'Pertanyaan survei', rows: survey.length, found: survey.length > 0 },
      ],
      periodeDetected: [{ periode: periodeId, rows: siswaRows.length }],
      unitTerdeteksi: unitList,
      narasiScopeTerisi: narasiTerisi,
      anotasiEsaiTerisi: anotasiTerisi,
      pregenWarnings: peringatan,
    },
    rows: { lembagaRows, siswaRows, esaiRows },
  };
}

export async function importPaWorkbook(parsed) {
  const { lembagaRows, siswaRows, esaiRows } = parsed.rows;
  const sekolahId = lembagaRows[0]?.sekolah_id;
  const periodeId = lembagaRows[0]?.periode_id;

  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: {
      action: 'import-pa',
      payload: {
        sekolah_id: sekolahId,
        periode_id: periodeId,
        lembaga: lembagaRows,
        siswa: siswaRows,
        esai: esaiRows,
      },
    },
  });

  if (error) return { ok: false, rowsWritten: 0, error: error.message || 'Edge Function admin-actions gagal dipanggil.' };
  if (!data?.ok) return { ok: false, rowsWritten: 0, error: data?.error || 'Import gagal tanpa keterangan.' };

  return {
    ok: true,
    rowsWritten: (data.lembaga || 0) + (data.siswa || 0) + (data.esai || 0),
  };
}
