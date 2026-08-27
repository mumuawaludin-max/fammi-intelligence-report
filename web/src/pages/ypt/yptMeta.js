/**
 * Konstanta tampilan dashboard Yayasan Pendidikan Telkom: label menu/tab, pengelompokan jenjang,
 * koordinat kota untuk peta, daftar metrik Survey Kepuasan, dan pemetaan peran responden.
 *
 * Semua yang bisa berubah tanpa menyentuh logika ditaruh di sini, supaya menyesuaikan label
 * dengan Figma atau menambah kota baru tidak perlu membedah komponen.
 */

/** Id yayasan yang memakai tampilan khusus ini. Gerbangnya di App.jsx. */
export const YPT_ID = "YAY-PENDIDIKAN-TELKOM";

/** Empat menu utama di nav atas, urut sesuai Figma. */
export const YPT_MENUS = [
  { id: "rapor", label: "Rapor Karakter" },
  { id: "citra", label: "Citra Sekolah" },
  { id: "kepuasan", label: "Survey Kepuasan" },
  { id: "dokumentasi", label: "Dokumentasi Kegiatan" },
];

/** Sub-tab per menu (stepper berbentuk panah). */
export const YPT_TABS = {
  rapor: [
    { id: "rangkuman", label: "Rangkuman", icon: "◐" },
    { id: "jenjang", label: "Penilaian per Jenjang", icon: "▥" },
    { id: "karakter", label: "Penilaian per Karakter", icon: "☺" },
    { id: "sekolah", label: "Penilaian per Sekolah", icon: "▦" },
  ],
  citra: [
    { id: "keberhasilan", label: "Keberhasilan Sekolah", icon: "⌂" },
    { id: "dukungan", label: "Bentuk Dukungan", icon: "♡" },
    { id: "emosi", label: "Emosi Anak", icon: "☺" },
    { id: "testimoni", label: "Testimoni", icon: "❝" },
  ],
  kepuasan: [
    { id: "rangkuman", label: "Rangkuman", icon: "◐" },
    { id: "kualitatif", label: "Penilaian Kualitatif", icon: "❝" },
  ],
  dokumentasi: [],
};

/**
 * Pengelompokan jenjang untuk empat kartu ringkasan.
 * SMA dan SMK digabung jadi satu kartu "SMA/K" sesuai Figma -- YPT punya jauh lebih banyak SMK
 * daripada SMA, dan desainnya memang menyatukan keduanya.
 */
export const JENJANG_GROUPS = [
  { id: "TK", label: "TK", match: ["TK"] },
  { id: "SD", label: "SD", match: ["SD"] },
  { id: "SMP", label: "SMP", match: ["SMP"] },
  { id: "SMAK", label: "SMA/K", match: ["SMA", "SMK"] },
];

/** Kelompokkan satu nilai schools.jenjang ke id kartu jenjang. Null kalau tidak dikenali. */
export function groupJenjang(jenjang) {
  if (!jenjang) return null;
  const upper = String(jenjang).trim().toUpperCase();
  const found = JENJANG_GROUPS.find((g) => g.match.includes(upper));
  return found ? found.id : null;
}

/**
 * Ambang perubahan untuk panah tren di kartu jenjang: naik kalau selisih dengan periode
 * pembanding >= +2 poin persen, turun kalau <= -2, selain itu dianggap datar.
 * Dua poin dipilih supaya riak kecil antar bulan (yang wajar terjadi pada rata-rata ratusan
 * siswa) tidak terbaca sebagai perubahan arah.
 */
export const TREN_THRESHOLD = 2;

export function arahTren(sekarang, sebelumnya) {
  if (sekarang == null || sebelumnya == null) return "datar";
  const delta = sekarang - sebelumnya;
  if (delta >= TREN_THRESHOLD) return "naik";
  if (delta <= -TREN_THRESHOLD) return "turun";
  return "datar";
}

/**
 * Koordinat kota untuk peta titik Indonesia, dalam persen terhadap kotak peta (x dari kiri,
 * y dari atas). Nilainya HASIL PROYEKSI lon/lat asli kota lewat bingkai yang sama persis dengan
 * generator peta (lon 94..142, lat 7.5..-11.5) -- lihat scratchpad gen-peta.mjs. Karena
 * peta dasarnya (public/peta-indonesia-dots.svg) dibangkitkan dari bingkai itu juga, dan
 * DotMapIndonesia memakai aspect-ratio 48/19 yang sama, marker selalu menempel tepat di pulau.
 * JANGAN utak-atik angka ini manual; regenerasi lewat script kalau bingkainya berubah.
 *
 * Kota yang TIDAK ada di sini tetap tampil, sebagai daftar teks di bawah peta -- lihat
 * DotMapIndonesia. Jangan pernah membuang sekolah cuma karena kotanya belum dipetakan.
 */
export const KOTA_COORDS = {
  "Banda Aceh": { x: 2.7, y: 10.3 },
  Medan: { x: 9.7, y: 20.6 },
  Batam: { x: 20.9, y: 33.9 },
  Padang: { x: 13.2, y: 44.5 },
  Pekanbaru: { x: 15.5, y: 36.8 },
  Palembang: { x: 22.4, y: 55.2 },
  "Bandar Lampung": { x: 23.5, y: 68.1 },
  Jakarta: { x: 26.8, y: 72.2 },
  Bandung: { x: 28.4, y: 75.8 },
  Purwokerto: { x: 31.7, y: 78.5 },
  Semarang: { x: 34.2, y: 76.2 },
  Yogyakarta: { x: 34.1, y: 80.5 },
  Sidoarjo: { x: 39, y: 78.7 },
  Surabaya: { x: 39.1, y: 77.6 },
  Malang: { x: 38.8, y: 81.5 },
  Denpasar: { x: 44.2, y: 85.1 },
  Banjarbaru: { x: 43.4, y: 57.6 },
  Balikpapan: { x: 47.6, y: 46 },
  Pontianak: { x: 32, y: 39.6 },
  Makassar: { x: 53, y: 66.6 },
  Manado: { x: 64.3, y: 31.7 },
  Ternate: { x: 69.5, y: 35.3 },
  Ambon: { x: 71.2, y: 58.7 },
  Jayapura: { x: 97.3, y: 53.1 },
};

/** Rasio lebar:tinggi bingkai peta (48 derajat lon : 19 derajat lat). WAJIB sama dengan
 * aspect-ratio kanvas di DotMapIndonesia supaya persen KOTA_COORDS jatuh tepat di pulau. */
export const PETA_RASIO = "48 / 19";

/**
 * Kota di tabel sekolah -> nama PROVINSI di berkas geometri peta (peta-idn-adm1.json).
 *
 * Peta dashboard berhenti di level provinsi, bukan kabupaten/kota, atas instruksi pemilik produk
 * 2026-08-27. Alasannya kelihatan begitu dicoba: yang diwarnai adalah AREA wilayahnya, dan pada
 * lebar layar dashboard sebuah kota seperti Kota Makassar cuma selebar dua piksel, jadi warnanya
 * terbaca sebagai titik dan bukan sebagai wilayah. Satu provinsi cukup besar untuk benar-benar
 * terbaca hijau, kuning, atau merah sekali lihat.
 *
 * Nama di sisi kanan harus PERSIS sama dengan shapeName di peta-idn-adm1.json, termasuk
 * kapitalisasinya yang tidak biasa: berkas itu menulis "Dki Jakarta", bukan "DKI Jakarta".
 * Label yang enak dibaca ditangani terpisah lewat LABEL_PROVINSI.
 *
 * Kota yang tidak ada di tabel ini TIDAK dibuang; ia muncul sebagai daftar teks di bawah peta
 * supaya ketahuan dan bisa ditambahkan, bukan hilang diam-diam.
 */
export const KOTA_PROVINSI = {
  "Banda Aceh": "Aceh",
  Medan: "Sumatera Utara",
  Batam: "Kepulauan Riau",
  Padang: "Sumatera Barat",
  Pekanbaru: "Riau",
  Palembang: "Sumatera Selatan",
  "Bandar Lampung": "Lampung",
  Jakarta: "Dki Jakarta",
  Bandung: "Jawa Barat",
  Purwokerto: "Jawa Tengah",
  Semarang: "Jawa Tengah",
  Yogyakarta: "Daerah Istimewa Yogyakarta",
  Sidoarjo: "Jawa Timur",
  Surabaya: "Jawa Timur",
  Malang: "Jawa Timur",
  Denpasar: "Bali",
  Banjarbaru: "Kalimantan Selatan",
  Balikpapan: "Kalimantan Timur",
  Pontianak: "Kalimantan Barat",
  Makassar: "Sulawesi Selatan",
  Manado: "Sulawesi Utara",
  Ternate: "Maluku Utara",
  Ambon: "Maluku",
  Jayapura: "Papua",
};

/** Perbaikan ejaan nama provinsi untuk ditampilkan. Kunci = shapeName apa adanya di geometri. */
const LABEL_PROVINSI = {
  "Dki Jakarta": "DKI Jakarta",
  "Daerah Istimewa Yogyakarta": "DI Yogyakarta",
};

export function labelProvinsi(nama) {
  return LABEL_PROVINSI[nama] || nama;
}

/**
 * Gabungkan data per kota jadi data per provinsi.
 *
 * Nilainya rata-rata TERTIMBANG jumlah siswa lintas seluruh sekolah di provinsi itu, bukan
 * rata-rata dari rata-rata kota. Jawa Timur punya sekolah di Sidoarjo, Surabaya, dan Malang
 * dengan jumlah siswa yang jauh berbeda; merata-ratakan angka kotanya akan memberi bobot sama
 * kepada kota berisi 40 siswa dan kota berisi 800 siswa. Ini konsisten dengan cara seluruh
 * agregasi lain di modul ini dihitung, lihat rataTertimbang di bawah.
 *
 * Bentuk keluarannya sengaja sama dengan bentuk per-kota yang lama (nama, nilai, sekolah,
 * jumlahSekolah), supaya panel Detail Sekolah di RangkumanTab tidak perlu diubah isinya.
 */
export function agregatProvinsi(kota) {
  const peta = new Map();

  (kota || []).forEach((k) => {
    const provinsi = KOTA_PROVINSI[k.nama];
    if (!provinsi) return;
    let p = peta.get(provinsi);
    if (!p) {
      p = { nama: provinsi, label: labelProvinsi(provinsi), sekolah: [], kotaList: [] };
      peta.set(provinsi, p);
    }
    p.sekolah.push(...(k.sekolah || []));
    p.kotaList.push(k.nama);
  });

  return [...peta.values()]
    .map((p) => ({
      ...p,
      sekolah: p.sekolah.slice().sort((a, b) => (b.rata_total ?? -1) - (a.rata_total ?? -1)),
      kotaList: p.kotaList.slice().sort((a, b) => a.localeCompare(b, "id")),
      nilai: bulat(rataTertimbang(p.sekolah, (r) => r.rata_total, (r) => r.jumlah_siswa)),
      jumlahSekolah: p.sekolah.length,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "id"));
}

/** Kota yang belum punya pemetaan provinsi. Ditampilkan, bukan dibuang. */
export function kotaTanpaProvinsi(kota) {
  return (kota || []).filter((k) => !KOTA_PROVINSI[k.nama]);
}


/**
 * Legenda warna pencapaian per wilayah di peta (permintaan pemilik produk 2026-08-26:
 * ">90% hijau, dst" supaya perkembangan karakter tiap wilayah gampang di-capture sekilas).
 * Batasnya sejalan dengan cutoff karakter yang ada: >= 90 sangat baik, 75-89 cukup,
 * di bawah 75 perlu penguatan. Dicek berurutan dari atas.
 */
export const PETA_BINS = [
  { min: 90, label: "≥ 90%", warna: "#10b981" },
  { min: 75, label: "75–89%", warna: "#f5b921" },
  { min: 0, label: "< 75%", warna: "#ee2c3c" },
];

/** Warna marker peta untuk satu nilai persen; abu untuk wilayah tanpa data. */
export function warnaPeta(nilai) {
  if (nilai == null) return "#b6bccb";
  const bin = PETA_BINS.find((b) => nilai >= b.min);
  return bin ? bin.warna : "#b6bccb";
}

/** Enam metrik Survey Kepuasan, urut sesuai kolom di spreadsheet respons form. */
export const KP_METRIK = [
  { id: "mudah_dipahami", label: "Laporan mudah dipahami" },
  { id: "kelengkapan", label: "Kelengkapan data yang disajikan" },
  { id: "relevansi", label: "Relevansi indikator dengan kondisi kelas" },
  { id: "kejelasan_rekomendasi", label: "Kejelasan rekomendasi tindak lanjut" },
  { id: "ketepatan_waktu", label: "Ketepatan waktu pengiriman laporan" },
  { id: "komunikasi", label: "Kualitas komunikasi Tim Fammi" },
];

/** Lima kelompok peran responden, label mengikuti chip di Figma. */
export const KP_PERAN = [
  { id: "KepalaSekolah", label: "Kepala Sekolah" },
  { id: "Wakasek", label: "Wakasek & Kaur" },
  { id: "BK", label: "BK" },
  { id: "WaliKelas", label: "Wali Kelas" },
  { id: "GuruMapel", label: "Guru" },
];

/**
 * Kategori testimoni, urut dari nada paling apresiatif ke paling kritis.
 *
 * Lima, bukan empat, dan idnya beda dari versi pertama: verifikasi 14.754 baris spreadsheet
 * sumber (2026-08-27) menunjukkan label yang benar-benar dipakai form cuma lima ini. "Apresiasi"
 * dan "Kritik & Keluhan" pada versi lama tidak pernah ada di data, itu tebakan yang tidak pernah
 * dicek. Lihat migrasi 20260827100000 untuk sebaran jumlahnya.
 *
 * Warna diambil dari token yang sudah ada, tidak ada warna baru. Empat di antaranya token
 * sentimen, yang skalanya memang sepadan dari sangat positif ke sangat negatif.
 *
 * Saran & Masukan SENGAJA memakai --ypt-ink-3 (abu), bukan --ypt-sentimen-netral. Token netral
 * itu bernilai #111827 dan bersebelahan langsung dengan Harapan yang #172554; diperiksa di
 * layar pada bar bertumpuk per jenjang, keduanya terbaca sebagai satu blok gelap dan batasnya
 * hilang. Abu memisahkannya dengan jelas dan tetap membaca sebagai nada tengah.
 *
 * PENTING, kategorinya TUMPANG TINDIH: satu testimoni bisa membawa dua sampai empat label
 * sekaligus (39% baris begitu). Jadi jumlah kelima kategori LEBIH BESAR dari total testimoni, dan
 * persentasenya dihitung terhadap total testimoni, bukan terhadap jumlah seluruh label. Setiap
 * tampilan yang memperlakukan ini sebagai potongan pie yang saling meniadakan akan salah.
 */
/**
 * Tiga peran warna per kategori, dan ketiganya harus dipakai sesuai tempatnya:
 *   warna     -> ISIAN. Bar, segmen bertumpuk, titik legenda, garis atas kartu.
 *   warnaTeks -> TEKS DI ATAS PUTIH. Persentase tebal, pil label, kata di word cloud.
 *   warnaIsi  -> TEKS DI ATAS `warna` itu sendiri. Persentase di dalam segmen bertumpuk.
 *
 * Dipisah karena satu nilai tidak bisa memenuhi ketiganya. Diukur dengan rumus kontras WCAG:
 * hijau isian #10b981 cuma 2,5:1 sebagai teks di atas putih dan kuning #f5b921 cuma 1,8:1,
 * padahal keduanya benar sebagai isian; sebaliknya putih di atas kuning cuma 1,8:1 sedangkan
 * tinta gelap di atasnya mencapai 8,1:1.
 *
 * Kritik memakai --ypt-red-dark, bukan --ypt-sentimen-sangat-negatif. Merah terang #ee2c3c tidak
 * punya warna teks yang lolos di atasnya sama sekali: putih 4,2:1 dan tinta navy 3,5:1, keduanya
 * di bawah 4,5:1. Menggelapkannya satu tingkat ke #c8151c membuat putih mencapai 5,9:1 dan
 * sekaligus membuatnya lolos sebagai teks di atas putih (5,9:1, dari sebelumnya 4,0:1). Warnanya
 * tetap merah dan tetap jelas berbeda dari kuning Keluhan.
 */
export const CS_TESTIMONI_KATEGORI = [
  {
    id: "Terimakasih",
    label: "Ucapan Terimakasih",
    warna: "var(--ypt-sentimen-positif)",
    warnaTeks: "var(--ypt-sentimen-positif-teks)",
    warnaIsi: "var(--ypt-ink)",
  },
  {
    id: "Harapan",
    label: "Harapan",
    warna: "var(--ypt-sentimen-sangat-positif)",
    warnaTeks: "var(--ypt-sentimen-sangat-positif)",
    warnaIsi: "#fff",
  },
  {
    id: "SaranMasukan",
    label: "Saran & Masukan",
    warna: "var(--ypt-ink-3)",
    warnaTeks: "var(--ypt-ink-2)",
    warnaIsi: "var(--ypt-ink)",
  },
  {
    id: "Keluhan",
    label: "Keluhan",
    warna: "var(--ypt-sentimen-negatif)",
    warnaTeks: "var(--ypt-sentimen-negatif-teks)",
    warnaIsi: "var(--ypt-ink)",
  },
  {
    id: "Kritik",
    label: "Kritik",
    warna: "var(--ypt-red-dark)",
    warnaTeks: "var(--ypt-red-dark)",
    warnaIsi: "#fff",
  },
];

/**
 * Kategori yang dihitung sebagai suara yang menuntut tindakan. Dipakai untuk satu angka kunci
 * dan untuk mengurutkan daftar sekolah, supaya yayasan bisa langsung melihat sekolah mana yang
 * paling banyak dikeluhkan tanpa membaca 13 ribu testimoni satu per satu.
 */
export const CS_KATEGORI_PERLU_RESPONS = ["Keluhan", "Kritik"];

/**
 * Dua jenis penulis testimoni. Warnanya beda dari warna kategori supaya tidak tertukar.
 *
 * Siswa memakai --ypt-red-dark, bukan --ypt-red. Warnanya dipakai sebagai TEKS di atas putih
 * (judul kartu pembanding dan penanda kecil di kartu detail), dan merah terang #ed1c24 cuma
 * mencapai rasio kontras 4,0:1 di sana, sedangkan #c8151c mencapai 5,9:1.
 */
export const CS_SUMBER = [
  { id: "orangtua", label: "Orangtua", warna: "var(--ypt-navy)" },
  { id: "siswa", label: "Siswa", warna: "var(--ypt-red-dark)" },
];

/** Penanda awal nama yang berarti testimoni ditulis orang tua, bukan siswanya sendiri. */
const AWALAN_ORANGTUA = /^\s*(orang\s*tua|ortu|ayah|ibu|bunda|papa|mama|bapak|wali)\b/i;

/**
 * Siapa yang menulis satu testimoni, dibaca dari kolom Nama di spreadsheet.
 *
 * Konvensi pengisiannya konsisten dan diverifikasi terhadap 13.013 baris (2026-08-27): kalau
 * yang mengisi orang tua, namanya ditulis "Orangtua <nama anak>"; kalau siswanya sendiri yang
 * mengisi, yang tertulis namanya sendiri tanpa awalan apa pun, hampir selalu kapital semua
 * ("HANIF KHADAFI"). Hasilnya 5.376 orangtua dan 7.637 siswa, dan sebarannya masuk akal: seluruh
 * TK dan SD murni orang tua, SMP dan SMK sebagian besar siswa, beberapa sekolah campuran.
 *
 * Kapital semua TIDAK dipakai sebagai penanda walau 86% baris siswa ditulis begitu. Itu kebiasaan
 * mengetik, bukan aturan; 1.053 siswa menulis namanya dengan huruf biasa dan akan salah kelompok.
 * Keberadaan awalan adalah satu-satunya penanda yang benar-benar dipegang oleh pengisi form.
 *
 * Fungsi kembarannya ada di Edge Function sync-ypt-sheets (normalSumber). Kalau daftar awalan di
 * sini berubah, ubah juga di sana, kalau tidak baris lama dan baris baru akan dikelompokkan
 * dengan aturan berbeda.
 */
export function sumberDariNama(nama) {
  const t = (nama || "").trim();
  if (!t) return null;
  return AWALAN_ORANGTUA.test(t) ? "orangtua" : "siswa";
}

/** Label tampilan satu id sumber. */
export function labelSumber(id) {
  return CS_SUMBER.find((s) => s.id === id)?.label || "Tidak diketahui";
}

/**
 * Ketiga peran warna untuk satu id kategori. Label baru dari form yang belum punya warna jatuh ke
 * abu netral, dengan varian teks yang tetap lolos kontras.
 */
export function warnaKategoriTestimoni(id) {
  const k = CS_TESTIMONI_KATEGORI.find((x) => x.id === id);
  return {
    warna: k?.warna || "var(--ypt-ink-3)",
    warnaTeks: k?.warnaTeks || "var(--ypt-ink-2)",
    warnaIsi: k?.warnaIsi || "var(--ypt-ink)",
  };
}

/** Label tampilan satu id kategori; id apa adanya untuk label baru dari form. */
export function labelKategoriTestimoni(id) {
  return CS_TESTIMONI_KATEGORI.find((k) => k.id === id)?.label || id;
}

/**
 * Warna per label emosi, kunci PERSIS nilai yang dikembalikan countEmosi() di karakterMeta.js
 * (EMOSI_ORDER: "Sangat Positif" | "Positif" | "Netral" | "Negatif" | "Sangat Negatif") --
 * exact match, bukan lagi pencocokan fuzzy .includes(), karena countEmosi sudah menjamin label
 * yang keluar selalu salah satu dari lima ini persis.
 */
export const CS_EMOSI_WARNA = {
  "Sangat Positif": "var(--ypt-sentimen-sangat-positif)",
  "Positif": "var(--ypt-sentimen-positif)",
  "Netral": "var(--ypt-sentimen-netral)",
  "Negatif": "var(--ypt-sentimen-negatif)",
  "Sangat Negatif": "var(--ypt-sentimen-sangat-negatif)",
};

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus",
  "September", "Oktober", "November", "Desember"];

/** "2026-05" -> "Mei 2026". String kosong kalau tidak bisa diurai. */
export function periodeLabel(periodeId) {
  if (!periodeId) return "";
  const [y, m] = String(periodeId).split("-").map(Number);
  return `${BULAN[m - 1] || ""} ${y || ""}`.trim();
}

/** Bulatkan ke bilangan bulat, aman terhadap null. Dipakai semua tampilan persen. */
export function bulat(n) {
  return n == null || Number.isNaN(n) ? null : Math.round(n);
}

/**
 * Rata-rata tertimbang: dipakai di SEMUA agregasi antar sekolah (persen jenjang, persen yayasan,
 * persen aspek). Sengaja tertimbang jumlah siswa, bukan rata-rata dari rata-rata -- sekolah
 * dengan 800 siswa dan sekolah dengan 40 siswa tidak boleh berbobot sama pada angka yayasan.
 * Baris tanpa nilai atau tanpa bobot diabaikan, bukan dihitung sebagai nol.
 */
export function rataTertimbang(rows, ambilNilai, ambilBobot) {
  let totalNilai = 0;
  let totalBobot = 0;
  (rows || []).forEach((r) => {
    const nilai = ambilNilai(r);
    const bobot = ambilBobot(r);
    if (nilai == null || !bobot) return;
    totalNilai += nilai * bobot;
    totalBobot += bobot;
  });
  return totalBobot > 0 ? totalNilai / totalBobot : null;
}
