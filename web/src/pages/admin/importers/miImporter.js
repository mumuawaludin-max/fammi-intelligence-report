import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabase';
import { getField, parseBulan, normalizeNama } from './karakterImporter';

// Importer Multiple Intelligence. Beda dari Karakter dalam dua hal:
// 1. File MI berisi SATU sheet datar, satu baris = satu siswa (bukan enam sheet agregat).
// 2. File BOLEH mencampur banyak sekolah lewat kolom sekolah_id (nama bebas) -- tapi kalau admin
//    sudah memilih satu sekolah tujuan di langkah 1 (sekolahId diisi), kolom itu diabaikan sama
//    sekali dan semua baris langsung dianggap milik sekolah itu. Resolusi-by-nama hanya jalan
//    kalau admin sengaja masuk mode "banyak sekolah dari file".
//
// Importer ini HANYA memparse + memvalidasi + me-resolve identitas. Ia TIDAK memanggil Gemini
// dan tidak menulis mi_hasil. Hasil parse (baris mentah per siswa) dikirim ke Edge Function
// generate-mi satu per satu (lihat useAdminCmsData.runMiGenerate), yang menjalankan pipeline
// (5 panggilan Gemini) lalu menulis mi_hasil berstatus menunggu_persetujuan.

const SKOR_COLS = [
  'r_inter', 'r_intra', 'r_kines', 'r_linguistik',
  'r_logmat', 'r_musikal', 'r_naturalis', 'r_spasial',
];
const ESSAY_COLS = [
  'essay_kelebihan_cara_berpikir', 'essay_cara_belajar', 'essay_penggunaan_ai',
  'essay_citacita_profesi', 'essay_alasan_pilih_profesi', 'essay_cara_belajar_paling_berhasil',
];

/** Skor 0-100. Kosong/non-angka -> null (dianggap tidak terbaca, baris ditolak). */
function skor(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace('%', '').trim());
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** Beda dari normalizeNama (dipakai untuk nama siswa apa adanya): nama sekolah di file sering
 * beda tanda baca/singkatan dari nama resmi terdaftar (strip/titik/koma, "&" vs "dan", dst),
 * jadi tanda baca ikut diseragamkan supaya pencocokan tidak gagal cuma karena format penulisan. */
function normalizeSekolahKey(nama) {
  return String(nama || '')
    .trim()
    .toLowerCase()
    .replace(/[.,'"()/\\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Jarak edit dua string (Levenshtein), dipakai untuk menyarankan sekolah terdekat saat nama di
 * file tidak cocok persis -- murni dihitung dari daftar sekolah yang ada, tidak ada nama sekolah
 * mana pun yang di-hardcode di sini. */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Cari sekolah terdaftar paling mirip nama di file, sebagai saran default di dropdown
 * pencocokan manual -- bukan tebakan otomatis yang langsung dipakai, admin tetap yang memutuskan.
 * Ambang toleransi mengikuti panjang nama (bukan angka tetap) supaya adil untuk nama pendek/panjang. */
function findClosestSchool(namaFile, schools) {
  const key = normalizeSekolahKey(namaFile);
  let best = null;
  (schools || []).forEach((s) => {
    const skey = normalizeSekolahKey(s.nama);
    const dist = levenshtein(key, skey);
    const toleransi = Math.max(2, Math.round(skey.length * 0.25));
    if (dist <= toleransi && (!best || dist < best.dist)) best = { id: s.id, nama: s.nama, dist };
  });
  return best;
}

/** Bangun peta nama-sekolah-ternormalisasi -> sekolah_id dari daftar schools terdaftar. */
function buildSchoolResolver(schools) {
  const byNama = {};
  (schools || []).forEach((s) => {
    const key = normalizeSekolahKey(s.nama);
    if (key) byNama[key] = s.id;
  });
  return byNama;
}

/** murid_id harus konsisten dengan yang sudah ada di mi_hasil sekolah itu supaya tren per anak
 * tidak putus antar periode. Dicocokkan lewat nama ternormalisasi; nama baru dapat id baru.
 * Diekspor supaya resolveMiUnresolved bisa pakai peta murid yang sama tanpa duplikasi logika. */
export async function loadExistingMiMuridIds(sekolahId) {
  const { data, error } = await supabase
    .from('mi_hasil')
    .select('murid_id, nama_siswa:detail->>nama_siswa')
    .eq('sekolah_id', sekolahId);
  if (error) throw error;

  const byNama = {};
  let maxNum = 0;
  (data || []).forEach((r) => {
    const key = normalizeNama(r.nama_siswa);
    if (key && !byNama[key]) byNama[key] = r.murid_id;
    const n = parseInt(String(r.murid_id).replace(/\D/g, ''), 10);
    if (Number.isFinite(n) && n > maxNum) maxNum = n;
  });
  return { byNama, nextNum: maxNum + 1 };
}

/** seed: state alokasi dari sesi parse sebelumnya ({ [sekolahId]: { byNama, nextNum } }).
 * WAJIB diteruskan dari parse ke resolve -- tanpa ini, resolve membangun peta baru dari
 * mi_hasil yang BELUM berisi murid baru yang dialokasikan saat parse (baru ditulis nanti
 * saat generate), jadi nomor yang sama bisa terpakai dua kali untuk anak yang berbeda. */
function makeMuridPeta(seed) {
  const cache = seed || {};
  const fn = async function muridPeta(sekolahId) {
    if (!cache[sekolahId]) cache[sekolahId] = await loadExistingMiMuridIds(sekolahId);
    return cache[sekolahId];
  };
  fn.cache = cache;
  return fn;
}

function nextMuridId(peta, nama) {
  const key = normalizeNama(nama);
  let id = peta.byNama[key];
  if (!id) {
    id = 'M' + String(peta.nextNum++).padStart(3, '0');
    peta.byNama[key] = id;
  }
  return id;
}

/** Validasi + susun field yang TIDAK tergantung sekolah (kelas, periode, skor, esai). Sekolah
 * dan murid_id disusun belakangan, setelah sekolah_id diketahui (langsung dari admin atau lewat
 * resolusi nama). Return { error } atau { common }. */
function parseMiRowCommon(r, baris, nama) {
  const kelas = String(getField(r, 'kelas_id', 'kelas') || '').trim();
  if (!kelas) return { error: `baris ${baris} (kelas_id kosong untuk ${nama})` };

  const periode = parseBulan(getField(r, 'periode', 'periode_id', 'bulan'));
  if (!periode) return { error: `baris ${baris} (periode tidak terbaca untuk ${nama})` };

  const skorObj = {};
  for (const col of SKOR_COLS) {
    const val = skor(getField(r, col));
    if (val === null) return { error: `baris ${baris} (skor ${col} kosong/tidak terbaca untuk ${nama})` };
    skorObj[col] = val;
  }

  const common = {
    kelas_id: kelas, periode_id: periode, ...skorObj,
    mapel_sulit_1: String(getField(r, 'mapel_sulit_1') || '').trim(),
    mapel_sulit_2: String(getField(r, 'mapel_sulit_2') || '').trim(),
  };
  ESSAY_COLS.forEach((c) => { common[c] = String(getField(r, c) || '').trim(); });
  return { common };
}

function computePeriodeDetected(rows) {
  const set = new Set(rows.map((r) => r.periode_id));
  return [...set].sort().map((periode) => ({ periode, rows: rows.filter((x) => x.periode_id === periode).length }));
}

/**
 * Parse workbook MI (format Screening_MI__Personal: satu sheet, kolom nama_siswa, kelas_id,
 * sekolah_id, periode, r_inter..r_spasial, mapel_sulit_1/2, essay_*).
 *
 * @param {object} opts
 * @param {{id:string,nama:string}[]} opts.schools daftar sekolah terdaftar dari CMS.
 * @param {string|null} [opts.sekolahId] kalau diisi (admin sudah memilih satu sekolah tujuan di
 *   langkah 1), SEMUA baris langsung dianggap milik sekolah itu -- kolom sekolah_id di file tidak
 *   dibaca sama sekali, jadi nama sekolah di file tidak perlu cocok apa pun. Kalau kosong/null,
 *   dipakai mode "banyak sekolah dari file": tiap baris di-resolve sendiri lewat nama sekolahnya.
 *
 * Return { ok, preview, rows, unresolved? } atau { ok:false, error }.
 * `unresolved` (mode banyak-sekolah saja) berisi nama sekolah yang tidak cocok ke sekolah
 * terdaftar mana pun -- BUKAN kegagalan; baris-baris itu ditahan dan dilempar balik ke UI supaya
 * admin mencocokkannya manual satu per satu (lewat resolveMiUnresolved), bukan ditolak diam-diam
 * atau ditebak otomatis.
 */
export async function parseMiWorkbook(file, { schools, sekolahId: forcedSekolahId } = {}) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheetName = wb.SheetNames[0];
  const rawRows = sheetName ? XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' }) : [];

  const preview = { sheet: sheetName || null, rows: rawRows.length };
  if (rawRows.length === 0) {
    return { preview, ok: false, error: 'File MI kosong atau sheet pertama tidak punya baris data.' };
  }

  const header = rawRows[0];
  const kolomSkorAda = SKOR_COLS.filter((c) => getField(header, c) !== undefined);
  if (kolomSkorAda.length === 0) {
    return {
      preview, ok: false,
      error: `Tidak ada kolom skor kecerdasan (r_inter..r_spasial) di file. Kolom yang ada: ${Object.keys(header).join(', ')}. Kemungkinan format file berbeda.`,
    };
  }

  const schoolByNama = forcedSekolahId ? null : buildSchoolResolver(schools);
  const muridPeta = makeMuridPeta();

  const badRows = [];
  const outRows = [];
  const unresolvedByNama = new Map(); // namaFile asli -> { namaFile, suggestion, rows: [{nama, baris, common}] }

  for (let i = 0; i < rawRows.length; i++) {
    const r = rawRows[i];
    const baris = i + 2; // +2: header di baris 1, data mulai baris 2

    const nama = String(getField(r, 'nama_siswa', 'nama') || '').trim();
    if (!nama) { badRows.push(`baris ${baris} (nama_siswa kosong)`); continue; }

    const parsedCommon = parseMiRowCommon(r, baris, nama);
    if (parsedCommon.error) { badRows.push(parsedCommon.error); continue; }

    if (forcedSekolahId) {
      const peta = await muridPeta(forcedSekolahId);
      outRows.push({ murid_id: nextMuridId(peta, nama), nama_siswa: nama, sekolah_id: forcedSekolahId, ...parsedCommon.common });
      continue;
    }

    const sekolahNamaFile = String(getField(r, 'sekolah_id', 'sekolah', 'nama_sekolah') || '').trim();
    if (!sekolahNamaFile) { badRows.push(`baris ${baris} (sekolah_id kosong untuk ${nama})`); continue; }

    const resolvedId = schoolByNama[normalizeSekolahKey(sekolahNamaFile)];
    if (!resolvedId) {
      if (!unresolvedByNama.has(sekolahNamaFile)) {
        unresolvedByNama.set(sekolahNamaFile, { namaFile: sekolahNamaFile, suggestion: findClosestSchool(sekolahNamaFile, schools), rows: [] });
      }
      unresolvedByNama.get(sekolahNamaFile).rows.push({ nama, baris, common: parsedCommon.common });
      continue;
    }

    const peta = await muridPeta(resolvedId);
    outRows.push({ murid_id: nextMuridId(peta, nama), nama_siswa: nama, sekolah_id: resolvedId, ...parsedCommon.common });
  }

  if (badRows.length > 0) {
    return {
      preview, ok: false,
      error: `Data tidak terbaca di: ${badRows.slice(0, 6).join(', ')}${badRows.length > 6 ? ` (+${badRows.length - 6} baris lain)` : ''}. Tiap baris wajib punya nama_siswa, kelas_id, periode, dan 8 skor kecerdasan (r_inter..r_spasial) berisi angka${forcedSekolahId ? '' : ', dan sekolah_id'}.`,
    };
  }

  const unresolved = [...unresolvedByNama.values()].map((u) => ({
    namaFile: u.namaFile, count: u.rows.length, suggestion: u.suggestion, rows: u.rows,
  }));

  preview.periodeDetected = computePeriodeDetected(outRows);
  preview.sekolahCount = new Set(outRows.map((x) => x.sekolah_id)).size;

  return {
    ok: true, preview, rows: outRows,
    unresolved: unresolved.length > 0 ? unresolved : undefined,
    // State alokasi murid_id sesi parse ini (plain object, aman disimpan di state React).
    // resolveMiUnresolved WAJIB menerimanya lagi supaya nomor murid baru yang dialokasikan di
    // sini tidak terpakai ulang untuk anak lain (murid baru belum ada di mi_hasil sampai generate).
    muridState: unresolved.length > 0 ? muridPeta.cache : undefined,
  };
}

/**
 * Selesaikan baris-baris yang nama sekolahnya belum cocok (parseMiWorkbook -> unresolved), setelah
 * admin memetakan tiap nama file ke sekolah terdaftar (atau memilih lewati) lewat UI. Tidak perlu
 * baca ulang file -- baris mentahnya sudah tersimpan di tiap grup `unresolved`.
 *
 * @param {ReturnType<typeof parseMiWorkbook>['unresolved']} unresolvedGroups
 * @param {Record<string,string|null>} mapping namaFile -> sekolah_id, atau null/undefined = lewati grup itu
 * @param {object} [muridState] state alokasi murid_id dari parseMiWorkbook (field muridState di
 *   hasil parse). Tanpa ini, murid baru dari sesi parse bisa tabrakan nomor dengan murid baru
 *   dari sesi resolve (lihat komentar makeMuridPeta).
 * @returns {{ rows: object[] }}
 */
export async function resolveMiUnresolved(unresolvedGroups, mapping, muridState) {
  const muridPeta = makeMuridPeta(muridState);
  const rows = [];
  for (const group of unresolvedGroups || []) {
    const sekolahId = mapping?.[group.namaFile];
    if (!sekolahId) continue; // admin memilih lewati grup nama sekolah ini
    const peta = await muridPeta(sekolahId);
    for (const item of group.rows) {
      rows.push({ murid_id: nextMuridId(peta, item.nama), nama_siswa: item.nama, sekolah_id: sekolahId, ...item.common });
    }
  }
  return { rows };
}

export { computePeriodeDetected };
