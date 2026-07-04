import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabase';

function pct(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace('%', '').trim());
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** Tiap indeks: [nama Indonesia lengkap, singkatan Indonesia, nama Inggris lengkap, singkatan Inggris]. */
const NAMA_BULAN = [
  ['januari', 'jan', 'january', 'jan'],
  ['februari', 'feb', 'february', 'feb'],
  ['maret', 'mar', 'march', 'mar'],
  ['april', 'apr', 'april', 'apr'],
  ['mei', 'mei', 'may', 'may'],
  ['juni', 'jun', 'june', 'jun'],
  ['juli', 'jul', 'july', 'jul'],
  ['agustus', 'agu', 'august', 'aug'],
  ['september', 'sep', 'september', 'sep'],
  ['oktober', 'okt', 'october', 'oct'],
  ['november', 'nov', 'november', 'nov'],
  ['desember', 'des', 'december', 'dec'],
];

/** Cari indeks bulan (0-11) dari kata apa pun (Indonesia/Inggris, lengkap/singkatan). */
function bulanIndex(word) {
  return NAMA_BULAN.findIndex((names) => names.includes(word));
}

/** Cari kolom di baris tanpa peduli besar/kecil huruf, karena header sumber tidak konsisten. */
function getField(row, ...names) {
  const wanted = names.map((n) => n.toLowerCase());
  const key = Object.keys(row).find((k) => wanted.includes(k.toLowerCase().trim()));
  return key ? row[key] : undefined;
}

/** Serial tanggal Excel (basis 1899-12-30) diubah ke Date. */
function excelSerialToDate(n) {
  return new Date(Math.round((n - 25569) * 86400 * 1000));
}

/**
 * Ubah nilai kolom "bulan" jadi periode_id "YYYY-MM". Null kalau tidak terbaca.
 * Dukung: Date/serial Excel, "2026-07", "07/2026", nama bulan Indonesia atau Inggris
 * lengkap/singkatan dalam urutan apa pun ("Juli 2026", "October, 2025", "Oct 2025", "2025 October").
 */
function parseBulan(raw) {
  if (raw === '' || raw === null || raw === undefined) return null;
  if (raw instanceof Date) {
    return `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, '0')}`;
  }
  if (typeof raw === 'number') {
    const d = excelSerialToDate(raw);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  const s = String(raw).trim();
  let m = s.match(/^(\d{4})[-\/](\d{1,2})/);
  if (m) return `${m[1]}-${String(parseInt(m[2], 10)).padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[-\/](\d{4})$/);
  if (m) return `${m[2]}-${String(parseInt(m[1], 10)).padStart(2, '0')}`;
  const parts = s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    let idx = bulanIndex(parts[0]);
    if (idx >= 0 && /^\d{4}$/.test(parts[1])) return `${parts[1]}-${String(idx + 1).padStart(2, '0')}`;
    idx = bulanIndex(parts[1]);
    if (idx >= 0 && /^\d{4}$/.test(parts[0])) return `${parts[0]}-${String(idx + 1).padStart(2, '0')}`;
  }
  return null;
}

const ASPEK_COLS = [
  ['karakter1', 'karakter1_berpikir_positif'],
  ['karakter2', 'karakter2_bicara_baik'],
  ['karakter3', 'karakter3_bertindak_bermanfaat'],
  ['karakter4', 'karakter4_magic_word_maaf'],
  ['karakter5', 'karakter5_magic_word_terima_kasih'],
  ['karakter6', 'karakter6_fiqih_wudhu'],
];

const INDIKATOR_COLS = [
  ['karakter1', 'indikator2_percaya_diri'],
  ['karakter1', 'indikator2_melihat_sisi_baik'],
  ['karakter2', 'indikator1_berkata_sopan'],
  ['karakter2', 'indikator2_pendapat_jelas'],
  ['karakter3', 'indikator1_menjaga_kedisiplinan'],
  ['karakter3', 'indikator2_mendatangkan_kebaikan'],
  ['karakter4', 'indikator1_terbiasa_minta_maaf'],
  ['karakter4', 'indikator2_bersikap_tulus'],
  ['karakter5', 'indikator1_sopan_berterima_kasih'],
  ['karakter5', 'indikator2_menunjukkan_syukur'],
  ['karakter6', 'indikator1_benar_gerakan_wudhu'],
  ['karakter6', 'indikator2_niat_wudhu'],
];

/** murid_id harus konsisten antar periode (bulan) supaya grafik tren per anak tidak putus. */
async function loadExistingMuridIds(sekolahId) {
  const { data, error } = await supabase
    .from('karakter_skor')
    .select('murid_id, nama_murid')
    .eq('sekolah_id', sekolahId);
  if (error) throw error;

  const byNama = {};
  let maxNum = 0;
  (data || []).forEach((r) => {
    if (!byNama[r.nama_murid]) byNama[r.nama_murid] = r.murid_id;
    const n = parseInt(String(r.murid_id).replace(/\D/g, ''), 10);
    if (Number.isFinite(n) && n > maxNum) maxNum = n;
  });
  return { byNama, nextNum: maxNum + 1 };
}

/**
 * Baca workbook Excel (format sama seperti yang dipakai SDIP Al Madani: sheet
 * detail_persentase_karakter / detail_persentase_indikator / detail_pernyataan_orangtua /
 * summary_kelas / summary_jenjang / summary_sekolah) dan siapkan baris siap-insert.
 * murid_id di-resolve terhadap data yang sudah ada di sekolah itu, bukan digenerate ulang
 * dari nol, supaya konsisten dipakai lintas periode. periode_id TIDAK diketik admin, tapi
 * dibaca per baris dari kolom "bulan" di sheet itu sendiri, karena satu file bisa memuat
 * beberapa bulan sekaligus.
 */
export async function parseKarakterWorkbook(file, { sekolahId }) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheet = (name) => (wb.Sheets[name] ? XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' }) : []);

  const dk = sheet('detail_persentase_karakter');
  const di = sheet('detail_persentase_indikator');
  const po = sheet('detail_pernyataan_orangtua');
  const sk = sheet('summary_kelas');
  const sj = sheet('summary_jenjang');
  const ss = sheet('summary_sekolah');

  const preview = {
    sheets: [
      { name: 'detail_persentase_karakter', rows: dk.length, found: dk.length > 0 },
      { name: 'detail_persentase_indikator', rows: di.length, found: di.length > 0 },
      { name: 'detail_pernyataan_orangtua', rows: po.length, found: po.length > 0 },
      { name: 'summary_kelas', rows: sk.length, found: sk.length > 0 },
      { name: 'summary_jenjang', rows: sj.length, found: sj.length > 0 },
      { name: 'summary_sekolah', rows: ss.length, found: ss.length > 0 },
    ],
  };

  if (dk.length === 0) {
    return { preview, ok: false, error: 'Sheet "detail_persentase_karakter" tidak ditemukan atau kosong.' };
  }

  const periodeCount = {};
  const badRows = [];
  function ownBulan(r) {
    return parseBulan(getField(r, 'bulan', 'periode', 'periode_id'));
  }
  function countPeriode(periode) {
    if (periode) periodeCount[periode] = (periodeCount[periode] || 0) + 1;
  }

  const { byNama, nextNum } = await loadExistingMuridIds(sekolahId);
  let seq = nextNum;
  function muridId(nama) {
    if (byNama[nama]) return byNama[nama];
    const id = 'M' + String(seq++).padStart(3, '0');
    byNama[nama] = id;
    return id;
  }

  // detail_persentase_karakter wajib punya kolom bulan & kelas sendiri, jadi ini yang jadi acuan.
  // Nama/kelas dibaca case-insensitive ("nama"/"Nama"/"NAMA") karena header sumber tidak konsisten.
  const namaPeriode = {};
  const namaKelas = {};
  const skorRows = [];
  dk.forEach((r, i) => {
    const periode = ownBulan(r);
    if (!periode) { badRows.push(`detail_persentase_karakter baris ${i + 2} (bulan)`); return; }
    const nama = getField(r, 'nama');
    const kelas = getField(r, 'kelas');
    if (!kelas) { badRows.push(`detail_persentase_karakter baris ${i + 2} (kelas)`); return; }
    countPeriode(periode);
    if (nama) { namaPeriode[nama] = periode; namaKelas[nama] = kelas; }
    const mid = muridId(nama);
    ASPEK_COLS.forEach(([aspek, col]) => {
      skorRows.push({
        sekolah_id: sekolahId, kelas_id: kelas, murid_id: mid, nama_murid: nama,
        periode_id: periode, aspek_kode: aspek, skor: pct(r[col]), sumber: 'guru', status: 'disetujui',
      });
    });
  });

  // Sheet lain sering tidak punya kolom bulan/kelas sendiri: fallback ke data murid yang sama
  // dari detail_persentase_karakter (dicocokkan lewat nama), baru dianggap gagal kalau
  // benar-benar tidak ada cara menentukan nilainya.
  const skorIndikatorRows = [];
  di.forEach((r, i) => {
    const nama = getField(r, 'nama');
    const kelas = getField(r, 'kelas') || namaKelas[nama];
    const periode = ownBulan(r) || namaPeriode[nama];
    if (!periode) { badRows.push(`detail_persentase_indikator baris ${i + 2} (bulan)`); return; }
    if (!kelas) { badRows.push(`detail_persentase_indikator baris ${i + 2} (kelas)`); return; }
    countPeriode(periode);
    const mid = muridId(nama);
    INDIKATOR_COLS.forEach(([aspek, kode]) => {
      const col = `${aspek}_${kode}`;
      skorIndikatorRows.push({
        sekolah_id: sekolahId, kelas_id: kelas, murid_id: mid, nama_murid: nama,
        periode_id: periode, aspek_kode: aspek, indikator_kode: kode, skor: pct(r[col]),
        sumber: 'guru', status: 'disetujui',
      });
    });
  });

  const pernyataanRows = [];
  po.forEach((r, i) => {
    const nama = getField(r, 'nama');
    const kelas = getField(r, 'kelas') || namaKelas[nama];
    const periode = ownBulan(r) || namaPeriode[nama];
    if (!periode) { badRows.push(`detail_pernyataan_orangtua baris ${i + 2} (bulan)`); return; }
    if (!kelas) { badRows.push(`detail_pernyataan_orangtua baris ${i + 2} (kelas)`); return; }
    countPeriode(periode);
    pernyataanRows.push({
      sekolah_id: sekolahId, kelas_id: kelas, murid_id: muridId(nama), nama_murid: nama,
      periode_id: periode,
      kategori_pernyataan: r.kategori_pernyataan, pernyataan: r.pernyataan_orangtua,
      emosi_anak: r.emosi_anak, alasan_emosi: r.alasan_emosi_anak,
      dukungan_dibutuhkan: r.dukungan_yang_dibutuhkan_orangtua, dukungan_lainnya: r.dukungan_lainya,
      hal_disyukuri: r.hal_yang_disyukuri_orangtua, status: 'disetujui',
    });
  });

  // Ringkasan per kelas/jenjang/sekolah tidak punya nama murid untuk dicocokkan; kalau
  // barisnya sendiri tidak punya bulan, pakai periode dominan dari detail_persentase_karakter
  // (aman selama file itu memang cuma cakup satu bulan dominan, yang jadi kasus umum).
  const periodeDominan = Object.entries(periodeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const summaryByKey = new Map();
  function pushSummary(scope, scopeId, periode, ringkasan) {
    // Kalau ada tabrakan periode+scope (mis. periode dominan salah tebak karena bulan sheet
    // ringkasan tidak terbaca), baris terakhir menang, bukan error duplikat ke Supabase.
    summaryByKey.set(`${scope}|${scopeId}|${periode}`, { sekolah_id: sekolahId, scope, scope_id: scopeId, periode_id: periode, ringkasan, status: 'disetujui' });
  }
  sk.forEach((r, i) => {
    const kelas = getField(r, 'kelas');
    if (!kelas) return;
    const periode = ownBulan(r) || periodeDominan;
    if (!periode) { badRows.push(`summary_kelas baris ${i + 2}`); return; }
    const { bulan, Kelas, kelas: kelasLower, ...rest } = r;
    pushSummary('kelas', kelas, periode, rest);
  });
  sj.forEach((r, i) => {
    const jenjang = getField(r, 'jenjang');
    if (!jenjang) return;
    const periode = ownBulan(r) || periodeDominan;
    if (!periode) { badRows.push(`summary_jenjang baris ${i + 2}`); return; }
    const { bulan, jenjang: jenjangLower, Jenjang, ...rest } = r;
    pushSummary('jenjang', jenjang, periode, rest);
  });
  ss.forEach((r, i) => {
    const { bulan, ...rest } = r;
    if (Object.values(rest).every((v) => v === '')) return;
    const periode = ownBulan(r) || periodeDominan;
    if (!periode) { badRows.push(`summary_sekolah baris ${i + 2}`); return; }
    pushSummary('sekolah', sekolahId, periode, rest);
  });
  const summaryRows = [...summaryByKey.values()];

  if (badRows.length > 0) {
    return {
      preview, ok: false,
      error: `Bulan/kelas tidak terbaca di: ${badRows.slice(0, 5).join(', ')}${badRows.length > 5 ? ` (+${badRows.length - 5} baris lain)` : ''}. Kolom "bulan" dan "kelas" di detail_persentase_karakter wajib terisi untuk tiap murid (bulan boleh format tanggal Excel, "2026-07", "07/2026", "Juli 2026", atau "October 2025"); sheet lain boleh kosong asal nama muridnya cocok persis dengan detail_persentase_karakter.`,
    };
  }

  preview.periodeDetected = Object.entries(periodeCount)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periode, rows]) => ({ periode, rows }));

  return {
    ok: true,
    preview,
    muridBaru: seq - nextNum,
    rows: { skorRows, skorIndikatorRows, pernyataanRows, summaryRows },
  };
}

/** Tulis hasil parse ke Supabase, kembalikan jumlah baris + error kalau ada. */
export async function importKarakterWorkbook(parsed) {
  const { skorRows, skorIndikatorRows, pernyataanRows, summaryRows } = parsed.rows;
  let totalRows = 0;

  // karakter_summary punya unique constraint (sekolah_id, scope, scope_id, periode_id):
  // upsert supaya re-import periode yang sama (atau sisa data dari upload gagal sebelumnya)
  // menimpa baris lama, bukan gagal dengan error duplicate key.
  for (const [table, rows, upsertOn] of [
    ['karakter_skor', skorRows, null],
    ['karakter_skor_indikator', skorIndikatorRows, null],
    ['karakter_pernyataan_ortu', pernyataanRows, null],
    ['karakter_summary', summaryRows, 'sekolah_id,scope,scope_id,periode_id'],
  ]) {
    if (rows.length === 0) continue;
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const query = upsertOn
        ? supabase.from(table).upsert(chunk, { onConflict: upsertOn })
        : supabase.from(table).insert(chunk);
      const { error } = await query;
      if (error) return { ok: false, rowsWritten: totalRows, error: `${table}: ${error.message}` };
      totalRows += chunk.length;
    }
  }
  return { ok: true, rowsWritten: totalRows };
}
