// Pembaca kolom laporan_json berkas MI: narasi laporan individu yang sudah dirumuskan di luar FIR
// lewat prompt docs/Prompt_Laporan_Individu_MI_Excel.md. Padanan parsePregenJson di
// scImporter.js, tapi MI butuh lebih dari validasi bentuk: JSON dipecah di sini ke nama kolom
// detail lama (cara_belajar_1_title, top_1_profesi_detail, dst) supaya BakatView tidak berubah
// sama sekali, dan Top di JSON wajib sama dengan Top hitungan sistem.
//
// Modul ini sengaja tanpa import supaya bisa diuji dengan node --test.
//
// Lapis kedua ada di supabase/functions/_shared/miPipeline.ts (pakaiPregen_): memeriksa ulang
// Top dan kelengkapan kolom, lalu mencocokkan nama profesi dengan kamus MASTER_MI. Daftar kolom
// wajib di dua tempat itu harus sama; kalau satu diubah, ubah yang lain.

export const PENANDA_TIDAK_DINILAI = 'TIDAK_DINILAI';

// Urutan ini juga penentu saat skor seri, sama persis dengan MI_CODES di miPipeline.ts.
const URUTAN_KECERDASAN = [
  ['r_musikal', 'Musikal'],
  ['r_spasial', 'Spasial'],
  ['r_linguistik', 'Linguistik'],
  ['r_logmat', 'Logika-Matematika'],
  ['r_kines', 'Kinestetik'],
  ['r_inter', 'Interpersonal'],
  ['r_intra', 'Intrapersonal'],
  ['r_naturalis', 'Naturalis'],
];

/** true kalau kedelapan skor 0: siswa belum ikut tes, tidak dibuatkan laporan. */
export function semuaSkorNol(row) {
  return URUTAN_KECERDASAN.every(([kunci]) => Number(row[kunci]) === 0);
}

/** Top 1-3 dengan aturan yang sama dengan buildOutputRow_: urut skor turun, seri dipecah oleh
 * URUTAN_KECERDASAN (Array.prototype.sort stabil). */
export function hitungTop(row) {
  return URUTAN_KECERDASAN
    .map(([kunci, nama]) => ({ nama, skor: parseFloat(row[kunci]) || 0 }))
    .sort((a, b) => b.skor - a.skor)
    .slice(0, 3)
    .map((x) => x.nama);
}

const samaNama = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

function teks(v, jalur) {
  if (typeof v !== 'string' || !v.trim()) throw new Error(`${jalur} kosong atau bukan teks`);
  if (v.includes('|')) throw new Error(`${jalur} memuat karakter |`);
  return v.trim();
}

function daftar(v, jalur, min, max) {
  if (!Array.isArray(v)) throw new Error(`${jalur} harus berupa daftar`);
  if (v.length < min || v.length > max) {
    throw new Error(`${jalur} berisi ${v.length} butir, seharusnya ${min === max ? min : `${min}-${max}`}`);
  }
  return v;
}

/** Butir daftar yang nanti digabung dengan koma (jurusan, figur, mapel_kuasai), dan dipecah lagi
 * oleh parseCommaList di miTransform.js yang memisah pada koma, titik koma, dan pipa. */
function butirKoma(v, jalur) {
  const t = teks(v, jalur);
  if (/[,;]/.test(t)) throw new Error(`${jalur} memuat koma atau titik koma`);
  return t;
}

function objek(v, jalur) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error(`${jalur} harus berupa objek`);
  return v;
}

/** Pecah JSON laporan ke kolom detail. Melempar Error berisi alasan yang bisa dibaca admin. */
function keKolom(obj) {
  const k = {};
  k.narasi_cover = teks(obj.narasi_cover, 'narasi_cover');

  const cb = objek(obj.cara_belajar, 'cara_belajar');
  k.cara_belajar_summary = teks(cb.ringkasan, 'cara_belajar.ringkasan');
  daftar(cb.langkah, 'cara_belajar.langkah', 5, 5).forEach((l, i) => {
    objek(l, `cara_belajar.langkah ke-${i + 1}`);
    k[`cara_belajar_${i + 1}_title`] = teks(l.judul, `cara_belajar.langkah ke-${i + 1} judul`);
    k[`cara_belajar_${i + 1}_body`] = teks(l.isi, `cara_belajar.langkah ke-${i + 1} isi`);
  });

  daftar(obj.ciri_khas, 'ciri_khas', 4, 4).forEach((c, i) => { k[`ciri_khas_${i + 1}`] = teks(c, `ciri_khas ke-${i + 1}`); });
  k.mapel_kuasai = daftar(obj.mapel_kuasai, 'mapel_kuasai', 5, 6).map((m, i) => butirKoma(m, `mapel_kuasai ke-${i + 1}`)).join(', ');

  const smart = objek(obj.smart, 'smart');
  ['s', 'm', 'a', 'r', 't'].forEach((h) => { k[`smart_${h}`] = teks(smart[h], `smart.${h}`); });

  daftar(obj.hari, 'hari', 7, 7).forEach((h, i) => { k[`hari_${i + 1}`] = teks(h, `hari ke-${i + 1}`); });

  const kom = objek(obj.komunikasi, 'komunikasi');
  daftar(kom.lakukan, 'komunikasi.lakukan', 4, 4).forEach((x, i) => { k[`gaya_kom_positif_${i + 1}`] = teks(x, `komunikasi.lakukan ke-${i + 1}`); });
  daftar(kom.hindari, 'komunikasi.hindari', 3, 3).forEach((x, i) => { k[`gaya_kom_hindari_${i + 1}`] = teks(x, `komunikasi.hindari ke-${i + 1}`); });
  daftar(kom.kalimat_siswa, 'komunikasi.kalimat_siswa', 3, 3).forEach((x, i) => {
    objek(x, `komunikasi.kalimat_siswa ke-${i + 1}`);
    k[`gaya_kom_siswa_${i + 1}_situasi`] = teks(x.situasi, `komunikasi.kalimat_siswa ke-${i + 1} situasi`);
    k[`gaya_kom_siswa_${i + 1}_script`] = teks(x.kalimat, `komunikasi.kalimat_siswa ke-${i + 1} kalimat`);
  });

  daftar(obj.sinyal_ortu, 'sinyal_ortu', 5, 5).forEach((s, i) => {
    objek(s, `sinyal_ortu ke-${i + 1}`);
    const ikon = teks(s.ikon, `sinyal_ortu ke-${i + 1} ikon`);
    // miTransform menganggap ikon lebih dari 4 karakter sebagai judul yang tergeser.
    if (ikon.length > 4) throw new Error(`sinyal_ortu ke-${i + 1} ikon harus satu emoji`);
    k[`sinyal_${i + 1}_icon`] = ikon;
    k[`sinyal_${i + 1}_title`] = teks(s.judul, `sinyal_ortu ke-${i + 1} judul`);
    k[`sinyal_${i + 1}_body`] = teks(s.isi, `sinyal_ortu ke-${i + 1} isi`);
  });

  daftar(obj.refleksi, 'refleksi', 4, 4).forEach((x, i) => { k[`refleksi_${i + 1}`] = teks(x, `refleksi ke-${i + 1}`); });
  daftar(obj.diskusi, 'diskusi', 4, 4).forEach((x, i) => { k[`diskusi_${i + 1}`] = teks(x, `diskusi ke-${i + 1}`); });

  daftar(obj.jalur, 'jalur', 3, 3).forEach((j, i) => {
    const n = i + 1;
    const p = `jalur ke-${n}`;
    objek(j, p);
    if (!samaNama(j.kecerdasan, obj.top[i])) throw new Error(`${p} kecerdasan "${j.kecerdasan}" tidak sama dengan top ke-${n} "${obj.top[i]}"`);
    k[`top_${n}_jurusan`] = daftar(j.jurusan, `${p} jurusan`, 3, 5).map((x, m) => butirKoma(x, `${p} jurusan ke-${m + 1}`)).join(', ');
    k[`top_${n}_parenttip`] = teks(j.tip_ortu, `${p} tip_ortu`);

    const s = objek(j.profesi_sorot, `${p} profesi_sorot`);
    k[`top_${n}_profesi_sorot`] = teks(s.nama, `${p} profesi_sorot nama`);
    k[`top_${n}_profesi_sorot_desc`] = teks(s.deskripsi, `${p} profesi_sorot deskripsi`);
    daftar(s.skill, `${p} profesi_sorot skill`, 3, 3).forEach((x, m) => {
      k[`top_${n}_profesi_sorot_skill_${m + 1}`] = teks(x, `${p} profesi_sorot skill ke-${m + 1}`);
    });
    k[`top_${n}_profesi_sorot_jalur`] = teks(s.jalur, `${p} profesi_sorot jalur`);
    k[`top_${n}_profesi_sorot_figur`] = daftar(s.figur, `${p} profesi_sorot figur`, 1, 3).map((x, m) => butirKoma(x, `${p} figur ke-${m + 1}`)).join(', ');

    // Format lama yang dibaca parseProfesiDetailRaw: satu profesi per baris, enam bagian dipisah pipa.
    k[`top_${n}_profesi_detail`] = daftar(j.profesi_detail, `${p} profesi_detail`, 1, 12).map((d, m) => {
      const q = `${p} profesi_detail ke-${m + 1}`;
      objek(d, q);
      const skill = daftar(d.skill, `${q} skill`, 3, 3).map((x, z) => teks(x, `${q} skill ke-${z + 1}`));
      return [teks(d.nama, `${q} nama`), teks(d.deskripsi, `${q} deskripsi`), ...skill, teks(d.jalur, `${q} jalur`)].join('|');
    }).join('\n');
  });

  return k;
}

/**
 * Baca sel laporan_json satu baris.
 *
 * @param {unknown} sel isi sel apa adanya
 * @param {object} row baris yang skornya sudah dibulatkan importer (r_inter..r_spasial)
 * @returns {{ pregen: null } | { pregen: null, tidakDinilai: true } | { pregen: null, error: string }
 *   | { pregen: { top: string[], kolom: object } }}
 */
export function bacaLaporanJsonMi(sel, row) {
  const mentah = sel && typeof sel === 'object' ? sel : String(sel ?? '').trim();
  if (mentah === '') return { pregen: null };
  if (mentah === PENANDA_TIDAK_DINILAI) return { pregen: null, tidakDinilai: true };

  let obj = mentah;
  if (typeof mentah === 'string') {
    // Model kadang tetap membungkus JSON dengan pagar markdown walau diminta polos.
    const bersih = mentah.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try {
      obj = JSON.parse(bersih);
    } catch {
      return { pregen: null, error: 'isinya bukan JSON yang valid' };
    }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { pregen: null, error: 'JSON-nya bukan objek' };

  const topSistem = hitungTop(row);
  if (!Array.isArray(obj.top) || obj.top.length !== 3) return { pregen: null, error: 'kunci "top" harus berisi 3 nama kecerdasan' };
  if (!obj.top.every((t, i) => samaNama(t, topSistem[i]))) {
    return { pregen: null, error: `top di JSON (${obj.top.join(', ')}) tidak sama dengan hitungan sistem (${topSistem.join(', ')})` };
  }

  try {
    return { pregen: { top: topSistem, kolom: keKolom(obj) } };
  } catch (e) {
    return { pregen: null, error: e.message };
  }
}
