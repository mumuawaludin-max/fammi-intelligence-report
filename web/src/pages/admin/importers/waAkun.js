// Penyusun rencana tautan akun Pegawai ke isian Wellbeing Assessment (fungsi murni, diuji di
// waAkun.test.js). Untuk tiap orang di wa_individu sekolah itu:
//   - "sudah"   akun Pegawai yang sudah memegang wa_individu_id ini.
//   - "tautkan" tepat satu akun Pegawai sekolah itu bernama sama (setelah gelar dibuang) dan belum
//               bertaut ke isian wa lain: cukup tambahkan wa_individu_id ke akun itu. Biasanya akun
//               yang dibuat untuk Screening Awal Wellbeing, jadi satu orang tetap satu akun.
//   - "ragu"    lebih dari satu akun bernama sama, atau satu-satunya akun bernama sama sudah
//               bertaut ke isian wa lain. Admin memilih sendiri; tidak pernah ditebak.
//   - "buat"    belum ada akun: buat akun Pegawai baru dengan username dari nama.
// Pencocokan sengaja hanya nama persis (bukan mirip), karena salah tautan berarti seseorang membaca
// laporan pribadi orang lain.

// Gelar yang lazim di nama pegawai sekolah. Salinan dari swImporter (yang tidak bisa diimpor di uji
// Node karena ikut memuat klien Supabase).
const GELAR = /^(h|hj|dr|drs|dra|ir|prof|ust|ustadz|ustadzah|st|ss|sag|spd|spdi|skom|se|si|mpd|ma|mm|msi|mkom|lc|ns|amd|ama|akep|skep|spt|sth|kep|pd|psi|ag|kom|sos|ikom|ak|apt|sh|mh|ked)$/;

function kataNama(nama) {
  return String(nama || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/,.*$/, '')
    .split(/[\s.]+/)
    .map((k) => k.replace(/[^a-z0-9]/g, ''))
    // Potongan satu huruf ("S.Pd.I" jadi s, pd, i; inisial "A.") dibuang; kedua sisi diperlakukan sama.
    .filter((k) => k.length > 1 && !GELAR.test(k));
}

/** "Mutmainnah, S.Pd" dan "mutmainnah" jadi kunci yang sama. */
export function kunciNama(nama) {
  return kataNama(nama).join(' ');
}

/** "Fatmawaty Syam, S.Pd." -> "fatmawaty.syam" (sama dengan aturan username modul sw). */
export function usernameDariNama(nama) {
  return kataNama(nama).slice(0, 2).join('.') || 'pegawai';
}

/** Satu isian wa yang namanya persis sama dengan nama akun; null kalau tidak ada atau lebih dari satu. */
export function cocokkanNamaWa(nama, individu) {
  const k = kunciNama(nama);
  if (!k) return null;
  const cocok = (individu || []).filter((x) => kunciNama(x.nama) === k);
  return cocok.length === 1 ? cocok[0] : null;
}

/**
 * @param individu  [{ id, nama, unit, jabatan }] isian wa sekolah itu
 * @param akun      [{ id, nama, username, peran, wa_individu_id, sw_individu_id }] akun sekolah itu
 * @param usernameTerpakai  semua username yang sudah ada (lintas sekolah), untuk menjaga keunikan
 * @returns [{ orang, status, akun?, kandidat?, usernameBaru? }]
 */
export function susunTautanWa({ individu, akun, usernameTerpakai = [] }) {
  const pegawai = (akun || []).filter((a) => a.peran === 'Pegawai');
  const olehWa = new Map(pegawai.filter((a) => a.wa_individu_id).map((a) => [a.wa_individu_id, a]));
  const perNama = new Map();
  for (const a of pegawai) {
    const k = kunciNama(a.nama);
    if (!k) continue;
    if (!perNama.has(k)) perNama.set(k, []);
    perNama.get(k).push(a);
  }
  const terpakai = new Set(usernameTerpakai.map((u) => String(u).toLowerCase()));

  return (individu || []).map((orang) => {
    const sudah = olehWa.get(orang.id);
    if (sudah) return { orang, status: 'sudah', akun: sudah };
    const kandidat = perNama.get(kunciNama(orang.nama)) || [];
    if (kandidat.length === 1 && !kandidat[0].wa_individu_id) return { orang, status: 'tautkan', akun: kandidat[0] };
    if (kandidat.length >= 1) return { orang, status: 'ragu', kandidat };
    const dasar = usernameDariNama(orang.nama);
    let usernameBaru = dasar;
    for (let i = 2; terpakai.has(usernameBaru); i++) usernameBaru = `${dasar}${i}`;
    terpakai.add(usernameBaru);
    return { orang, status: 'buat', usernameBaru };
  });
}
