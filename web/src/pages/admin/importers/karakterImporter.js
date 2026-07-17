import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabase';

// parseFloat berhenti diam-diam di karakter koma ("84,67" -> 84, bukan 84.67) -- kalau ada
// sekolah yang sel skornya berformat Indonesia (koma desimal) alih-alih titik, skor yang
// ditulis ke karakter_skor/karakter_skor_indikator bisa salah 1 poin tanpa error apa pun.
// Verifikasi nyata: ringkasan jenjang KB TK Istiqamah menyimpan "84,12 %" dkk untuk
// rata_pencapaian_orangtua -- ganti koma ke titik dulu sebelum parseFloat.
function pct(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace('%', '').replace(',', '.').trim());
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
  let m = s.match(/^(\d{4})[-/](\d{1,2})/);
  if (m) return `${m[1]}-${String(parseInt(m[2], 10)).padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[-/](\d{4})$/);
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

const ASPEK_KODE = ['karakter1', 'karakter2', 'karakter3', 'karakter4', 'karakter5', 'karakter6'];

/**
 * Cari kolom skor aspek karakter di header lewat prefix "karakterN_", bebas apa pun akhirannya.
 * Tiap sekolah bisa pakai istilah Indonesia berbeda untuk aspek yang sama (mis. sekolah A pakai
 * "karakter1_berpikir_positif", sekolah B pakai "karakter1_optimis") -- akhiran itu cuma label,
 * yang disimpan ke DB tetap kode pendeknya ("karakter1"). Kolom indikator ("karakterN_indikatorM_...")
 * sengaja dikecualikan supaya tidak salah tertangkap sebagai skor aspek.
 */
function resolveAspekCol(headerRow, kode) {
  const n = kode.replace('karakter', '');
  const re = new RegExp(`^karakter${n}_(?!indikator)`, 'i');
  return Object.keys(headerRow).find((k) => re.test(k.trim()));
}

/**
 * Cari semua kolom skor indikator di header lewat pola "karakterN_indikatorM_...", apa pun
 * teks setelah "indikatorM_". Beda dari aspek, teks itu justru DIPAKAI APA ADANYA sebagai
 * bagian indikator_kode yang disimpan ke DB (bukan cuma label tampilan) -- karena tiap
 * sekolah bisa punya indikator yang beda secara isi, bukan cuma beda istilah untuk hal yang
 * sama. Kode yang disimpan otomatis konsisten dengan nama kolom sekolah itu sendiri, tidak
 * dicocokkan ke daftar tetap SDIP Al Madani. Sekolah baru butuh baris karakter_indikator_config
 * sendiri yang kode-nya cocok dengan hasil fungsi ini supaya labelnya tampil di FIR.
 */
function resolveIndikatorCols(headerRow) {
  const out = [];
  Object.keys(headerRow).forEach((k) => {
    const m = k.trim().match(/^karakter([1-6])_(indikator[12]_.+)$/i);
    if (m) out.push({ aspek: `karakter${m[1]}`, kode: m[2].toLowerCase(), col: k });
  });
  return out;
}

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

  // Resolusi kolom aspek dilakukan sekali di sini lewat prefix "karakterN_" (lihat resolveAspekCol),
  // bukan nama kolom tetap, supaya akhiran istilah beda-beda antar sekolah tidak perlu dipetakan
  // manual tiap kali sekolah baru onboarding. Kalau tidak satu pun dari 6 aspek ketemu, kemungkinan
  // sekolah ini malah tidak pakai konvensi "karakterN_..." sama sekali -- gagal cepat dan tunjukkan
  // header asli file, daripada membanjiri pesan error per baris per murid.
  const aspekColMap = {};
  ASPEK_KODE.forEach((kode) => {
    const col = resolveAspekCol(dk[0], kode);
    if (col) aspekColMap[kode] = col;
  });
  if (Object.keys(aspekColMap).length === 0) {
    return {
      preview, ok: false,
      error: `Tidak ada satu pun kolom skor karakter yang dikenali di sheet detail_persentase_karakter (dicari lewat prefix karakter1_ sampai karakter6_). Kolom yang benar-benar ada di file: ${Object.keys(dk[0]).join(', ')}. Kemungkinan file ini pakai konvensi nama kolom yang sama sekali berbeda, importer perlu disesuaikan dulu untuk sekolah ini.`,
    };
  }
  let indikatorCols = [];
  if (di.length > 0) {
    indikatorCols = resolveIndikatorCols(di[0]);
    if (indikatorCols.length === 0) {
      return {
        preview, ok: false,
        error: `Tidak ada satu pun kolom skor indikator yang dikenali di sheet detail_persentase_indikator (dicari lewat pola karakterN_indikatorM_...). Kolom yang benar-benar ada di file: ${Object.keys(di[0]).join(', ')}. Kemungkinan file ini pakai konvensi nama kolom yang sama sekali berbeda, importer perlu disesuaikan dulu untuk sekolah ini.`,
      };
    }
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
    ASPEK_KODE.forEach((aspek) => {
      const col = aspekColMap[aspek];
      const skor = col ? pct(r[col]) : null;
      if (skor === null) { badRows.push(`detail_persentase_karakter baris ${i + 2} (kolom skor ${aspek}${col ? ` "${col}"` : ''} kosong/tidak ditemukan untuk ${nama || 'baris ini'})`); return; }
      skorRows.push({
        sekolah_id: sekolahId, kelas_id: kelas, murid_id: mid, nama_murid: nama,
        periode_id: periode, aspek_kode: aspek, skor, sumber: 'guru', status: 'disetujui',
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
    indikatorCols.forEach(({ aspek, kode, col }) => {
      const skor = pct(r[col]);
      if (skor === null) { badRows.push(`detail_persentase_indikator baris ${i + 2} (kolom "${col}" kosong/tidak terbaca untuk ${nama || 'baris ini'})`); return; }
      skorIndikatorRows.push({
        sekolah_id: sekolahId, kelas_id: kelas, murid_id: mid, nama_murid: nama,
        periode_id: periode, aspek_kode: aspek, indikator_kode: kode, skor,
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
    // Dulu 6 kolom di bawah dibaca lewat properti langsung (r.pernyataan_orangtua dst),
    // beda dari nama/kelas/bulan yang sudah lebih dulu case/spasi-toleran lewat getField().
    // Bahaya nyatanya: kalau SATU SAJA kolom di header file beda kapitalisasi/spasi dari
    // yang persis diharapkan, baris tetap ikut ter-insert (tidak masuk badRows sama sekali,
    // karena kelas/bulan/nama-nya tetap lengkap) tapi kolom itu diam-diam jadi NULL untuk
    // SEMUA baris -- persis yang terjadi di KB TK Istiqamah: 573/573 baris punya kolom
    // "pernyataan" (testimoni orangtua) kosong padahal 6 kolom lain di sheet yang sama
    // terisi penuh, ternyata cuma beda kapitalisasi/spasi di satu nama kolom itu saja.
    // getField() sama-sama case/spasi-toleran seperti nama/kelas/bulan, jadi sekarang aman
    // dari kelas bug yang sama untuk keenam kolom ini.
    pernyataanRows.push({
      sekolah_id: sekolahId, kelas_id: kelas, murid_id: muridId(nama), nama_murid: nama,
      periode_id: periode,
      kategori_pernyataan: getField(r, 'kategori_pernyataan'), pernyataan: getField(r, 'pernyataan_orangtua'),
      emosi_anak: getField(r, 'emosi_anak'), alasan_emosi: getField(r, 'alasan_emosi_anak'),
      dukungan_dibutuhkan: getField(r, 'dukungan_yang_dibutuhkan_orangtua'), dukungan_lainnya: getField(r, 'dukungan_lainya', 'dukungan_lainnya'),
      hal_disyukuri: getField(r, 'hal_yang_disyukuri_orangtua'), status: 'disetujui',
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
    if (Object.values(r).every((v) => v === '')) return; // baris kosong beneran, bukan error
    const kelas = getField(r, 'kelas');
    // Dulu di-skip diam-diam kalau kolom "kelas" tidak ketemu -- baris summary_kelas hilang
    // tanpa jejak dan import tetap dilaporkan "sukses", padahal karakter_summary scope=kelas
    // jadi kosong untuk sekolah itu (kelas baru tidak pernah muncul di Rekomendasi/Antrian).
    // Sekarang gagal cepat dan kelihatan, sama seperti pengecekan periode di baris sebelahnya.
    if (!kelas) { badRows.push(`summary_kelas baris ${i + 2} (kolom kelas kosong/tidak ditemukan, header yang ada: ${Object.keys(r).join(', ')})`); return; }
    const periode = ownBulan(r) || periodeDominan;
    if (!periode) { badRows.push(`summary_kelas baris ${i + 2} (bulan)`); return; }
    const { bulan, Kelas, kelas: kelasLower, ...rest } = r;
    pushSummary('kelas', kelas, periode, rest);
  });
  sj.forEach((r, i) => {
    if (Object.values(r).every((v) => v === '')) return;
    const jenjang = getField(r, 'jenjang');
    if (!jenjang) { badRows.push(`summary_jenjang baris ${i + 2} (kolom jenjang kosong/tidak ditemukan, header yang ada: ${Object.keys(r).join(', ')})`); return; }
    const periode = ownBulan(r) || periodeDominan;
    if (!periode) { badRows.push(`summary_jenjang baris ${i + 2} (bulan)`); return; }
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
      error: `Data tidak terbaca di: ${badRows.slice(0, 5).join(', ')}${badRows.length > 5 ? ` (+${badRows.length - 5} baris lain)` : ''}. Kolom "bulan" dan "kelas" di detail_persentase_karakter wajib terisi untuk tiap murid (bulan boleh format tanggal Excel, "2026-07", "07/2026", "Juli 2026", atau "October 2025"), dan tiap kolom skor karakter/indikator wajib berisi angka, bukan kosong; sheet lain boleh kosong asal nama muridnya cocok persis dengan detail_persentase_karakter.`,
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
