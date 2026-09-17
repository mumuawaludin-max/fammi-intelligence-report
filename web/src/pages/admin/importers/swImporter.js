// Pengimpor akun modul Screening Awal Wellbeing dari CSV/Excel, dua jenis berkas:
//   - kepala unit : satu baris per unit, dicocokkan ke sw_unit (kolom Unit).
//   - pegawai     : satu baris per orang, dicocokkan ke sw_individu (kolom Nama, plus Unit
//                   kalau ada nama yang sama di dua unit).
// Kolom Username/Email boleh kosong: username dibuat dari nama (dua kata pertama tanpa gelar,
// huruf kecil, dipisah titik) dan dijaga unik terhadap akun yang sudah ada maupun sesama baris.
// Baris yang tidak cocok ditandai supaya admin memilih manual di pratinjau, bukan ditebak.
// Template berisi seluruh unit/pegawai dari data yang sudah di-seed, jadi admin tinggal mengisi
// kolom Username kalau ingin menentukan sendiri.

import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabase';

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

const HEADER_ALIASES = {
  nama: ['namalengkap', 'nama', 'namapegawai', 'namakepalaunit'],
  unit: ['unit', 'namaunit', 'unitkerja'],
  username: ['username', 'usernameatauemail', 'email', 'alamatemail', 'emailusername'],
};

function pickCol(row, aliases) {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const k = keys.find((key) => normalize(key) === alias);
    if (k !== undefined) return row[k];
  }
  return '';
}

// Gelar yang lazim di nama pegawai sekolah, dibuang saat membentuk username.
const GELAR = /^(h|hj|dr|drs|dra|ir|prof|ust|ustadz|ustadzah|st|ss|sag|spd|spdi|skom|se|si|mpd|ma|mm|msi|mkom|lc|ns|amd|ama|akep|skep|spt|sth)$/;

/** "Fatmawaty Syam, S.Pd." -> "fatmawaty.syam". */
export function usernameDariNama(nama) {
  const kata = String(nama || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[\s,]+/)
    .map((k) => k.replace(/[^a-z0-9]/g, ''))
    .filter((k) => k && !GELAR.test(k));
  return kata.slice(0, 2).join('.') || 'pegawai';
}

/** Data unit dan pegawai dari dataset sw yang aktif untuk satu sekolah. */
export async function muatDataSw(sekolahId) {
  const { data: ds, error: e1 } = await supabase.from('sw_dataset').select('id')
    .eq('sekolah_id', sekolahId).eq('aktif', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (e1) throw new Error(e1.message);
  if (!ds) return { datasetId: null, unit: [], individu: [] };
  const [u, o] = await Promise.all([
    supabase.from('sw_unit').select('unit_id, n_pengisi, data').eq('dataset_id', ds.id).order('unit_id'),
    supabase.from('sw_individu').select('individu_id, nama, unit_id, data').eq('dataset_id', ds.id).order('nama').range(0, 4999),
  ]);
  if (u.error) throw new Error(u.error.message);
  if (o.error) throw new Error(o.error.message);
  const unit = (u.data || []).map((r) => ({ id: r.unit_id, nama: r.data?.nama || r.unit_id, n: r.n_pengisi }));
  const namaUnit = Object.fromEntries(unit.map((x) => [x.id, x.nama]));
  const individu = (o.data || []).map((r) => ({ id: r.individu_id, nama: r.nama, unitId: r.unit_id, unitNama: namaUnit[r.unit_id] || r.unit_id, jabatan: r.data?.jabatan || '' }));
  return { datasetId: ds.id, unit, individu };
}

function cocokkanUnit(teks, unit) {
  const q = normalize(teks);
  if (!q) return { unit: null, confidence: 'unmatched' };
  const tepat = unit.find((x) => normalize(x.nama) === q || normalize(x.id) === q);
  if (tepat) return { unit: tepat, confidence: 'exact' };
  const muat = unit.filter((x) => normalize(x.nama).includes(q) || q.includes(normalize(x.nama)));
  if (muat.length === 1) return { unit: muat[0], confidence: 'exact' };
  let best = null; let bestDist = Infinity;
  for (const x of unit) {
    const d = levenshtein(normalize(x.nama), q);
    if (d < bestDist) { bestDist = d; best = x; }
  }
  if (best && bestDist <= 3) return { unit: best, confidence: 'fuzzy' };
  return { unit: null, confidence: 'unmatched' };
}

function cocokkanPegawai(nama, unitTeks, individu, unit) {
  const q = normalize(nama);
  if (!q) return { orang: null, confidence: 'unmatched' };
  let kandidat = individu.filter((x) => normalize(x.nama) === q);
  let confidence = 'exact';
  if (kandidat.length === 0) {
    kandidat = individu.filter((x) => levenshtein(normalize(x.nama), q) <= 2);
    confidence = 'fuzzy';
  }
  if (kandidat.length > 1 && unitTeks) {
    const { unit: u } = cocokkanUnit(unitTeks, unit);
    if (u) kandidat = kandidat.filter((x) => x.unitId === u.id);
  }
  if (kandidat.length === 1) return { orang: kandidat[0], confidence };
  if (kandidat.length > 1) return { orang: null, confidence: 'ambigu', kandidat };
  return { orang: null, confidence: 'unmatched' };
}

/**
 * Parse berkas jadi baris siap create-user. `jenis` = 'kunit' | 'pegawai'.
 * `usernameAda` = username akun yang sudah ada (untuk menjaga keunikan).
 */
export async function parseSwFile(file, { sekolahId, jenis, usernameAda = new Set() }) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sw = await muatDataSw(sekolahId);
  if (!sw.datasetId) throw new Error(`Belum ada data Screening Awal Wellbeing untuk ${sekolahId}. Jalankan seed dulu.`);

  const rows = [];
  const terpakai = new Set([...usernameAda].map((u) => String(u).toLowerCase()));
  let sheetCount = 0;
  let dupCount = 0;
  const dipakaiId = new Set();

  const usernameUnik = (dasar) => {
    let u = dasar; let n = 2;
    while (terpakai.has(u)) { u = `${dasar}${n}`; n += 1; }
    terpakai.add(u);
    return u;
  };

  for (const sheetName of wb.SheetNames) {
    const sheetRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
    if (sheetRows.length === 0) continue;
    sheetCount += 1;
    for (const r of sheetRows) {
      const nama = String(pickCol(r, HEADER_ALIASES.nama) || '').trim();
      const unitTeks = String(pickCol(r, HEADER_ALIASES.unit) || '').trim();
      const usernameKolom = String(pickCol(r, HEADER_ALIASES.username) || '').trim().toLowerCase();
      if (jenis === 'kunit' && !unitTeks && !nama) continue;
      if (jenis === 'pegawai' && !nama) continue;

      if (jenis === 'kunit') {
        const { unit, confidence } = cocokkanUnit(unitTeks, sw.unit);
        if (unit && dipakaiId.has(unit.id)) { dupCount += 1; continue; }
        if (unit) dipakaiId.add(unit.id);
        const namaAkun = nama || (unit ? `Kepala ${unit.nama}` : '');
        rows.push({
          rowIndex: rows.length, sheetName,
          nama: namaAkun,
          username: usernameUnik(usernameKolom || usernameDariNama(namaAkun || unitTeks)),
          peran: 'KepalaUnit',
          cakupan: [],
          sw_unit_id: unit?.id || '',
          unitTeks,
          confidence,
        });
      } else {
        const hasil = cocokkanPegawai(nama, unitTeks, sw.individu, sw.unit);
        if (hasil.orang && dipakaiId.has(hasil.orang.id)) { dupCount += 1; continue; }
        if (hasil.orang) dipakaiId.add(hasil.orang.id);
        rows.push({
          rowIndex: rows.length, sheetName,
          nama,
          username: usernameUnik(usernameKolom || usernameDariNama(nama)),
          peran: 'Pegawai',
          cakupan: [],
          sw_individu_id: hasil.orang?.id || '',
          unitTeks,
          confidence: hasil.confidence,
          kandidat: hasil.kandidat || [],
        });
      }
    }
  }
  return { rows, sheetCount, dupCount, unit: sw.unit, individu: sw.individu };
}

/** Unduh template berisi seluruh unit atau pegawai sekolah itu; kolom Username dibiarkan kosong. */
export async function unduhTemplateSw(sekolahId, jenis) {
  const sw = await muatDataSw(sekolahId);
  if (!sw.datasetId) throw new Error(`Belum ada data Screening Awal Wellbeing untuk ${sekolahId}. Jalankan seed dulu.`);
  const rows = jenis === 'kunit'
    ? sw.unit.map((u) => ({ 'Unit': u.nama, 'Nama Lengkap': '', 'Username': '', 'Jumlah pengisi': u.n }))
    : sw.individu.map((o) => ({ 'Nama Lengkap': o.nama, 'Unit': o.unitNama, 'Jabatan': o.jabatan, 'Username': '' }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, jenis === 'kunit' ? 'Kepala Unit' : 'Pegawai');
  XLSX.writeFile(wb, `template-akun-${jenis === 'kunit' ? 'kepala-unit' : 'pegawai'}-${sekolahId}.xlsx`);
}
