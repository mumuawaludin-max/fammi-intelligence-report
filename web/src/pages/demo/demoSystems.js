/**
 * Lima Intelligence System yang dipamerkan di halaman masuk, beserta tampilan demonya.
 *
 * Registri tunggal: ubin di panel kiri, status ketersediaan, dan pembuka tampilan semuanya membaca
 * dari sini. Id sistem dan urutannya WAJIB sama dengan public.demo_semua_sistem() di migration
 * 20261111100000, dan id tampilan berjenis "akun" WAJIB sama dengan TAMPILAN_AKUN di Edge Function
 * demo-masuk. demoAturan.test.js memeriksa keduanya.
 *
 * Jenis tampilan:
 *   "akun" -> tampilan produk sungguhan milik akun demo Fammi. Browser tidak pernah memegang kode
 *             khusus akun itu: Edge Function demo-masuk memeriksa sesi demo, masuk ke akun demo yang
 *             disimpan di secret DEMO_AKUN, lalu hanya mengembalikan sesinya.
 *   "html" -> laporan HTML yang disimpan server (tabel demo_reports), dibuka di iframe sandbox.
 *   "tautan" -> halaman Fammi lain yang terbuka untuk umum (url di sini, bukan rahasia), dibuka di
 *             penampil demo yang sama, mis. contoh cara input Rapor Karakter.
 * Tampilan html dan tautan punya alamat sendiri #demo/<id tampilan>. Hash tidak pernah dipakai
 * sebagai path: hanya id dari registri ini yang diterima.
 */

export const DEMO_SYSTEMS = [
  {
    id: "education-character",
    nomor: "01",
    judul: "Education & Character",
    deskripsi: "Memahami perkembangan belajar, capaian, dan karakter setiap anak untuk memberikan pendampingan yang lebih tepat.",
    ringkas: "Perkembangan belajar, capaian, dan karakter setiap anak.",
    ikon: "edukasi",
    warna: "ungu",
    tampilan: [
      { id: "karakter-kepsek", jenis: "akun", grup: "Rapor Karakter", label: "Kepala Sekolah" },
      { id: "karakter-walas", jenis: "akun", grup: "Rapor Karakter", label: "Wali Kelas" },
      {
        id: "contoh-input-karakter",
        jenis: "tautan",
        grup: "Rapor Karakter",
        label: "Contoh cara input",
        url: "https://app.fammi.ly/s/468c0f0681",
      },
    ],
  },
  {
    id: "safety-crisis",
    nomor: "02",
    judul: "Safety & Crisis Management",
    deskripsi: "Membangun lingkungan sekolah yang aman melalui pencegahan, deteksi dini, pelaporan, dan penanganan insiden.",
    ringkas: "Pencegahan, deteksi dini, pelaporan, dan penanganan insiden.",
    ikon: "aman",
    warna: "merah",
    tampilan: [
      { id: "kesehatan-mental-anak", jenis: "akun", grup: "Screening anak", label: "Kesehatan Mental Anak 4-10 tahun" },
    ],
  },
  {
    id: "talent-life-design",
    nomor: "03",
    judul: "Talent & Life Design",
    deskripsi: "Memetakan potensi anak, merancang misi pengembangan, dan mengarahkan potensi menuju masa depan.",
    ringkas: "Potensi anak, misi pengembangan, dan arah masa depan.",
    ikon: "bakat",
    warna: "biru",
    tampilan: [
      { id: "multiple-intelligence", jenis: "akun", grup: "Laporan bakat", label: "Multiple Intelligence" },
    ],
  },
  {
    id: "teacher-growth",
    nomor: "04",
    judul: "Teacher Growth & Support",
    deskripsi: "Memahami kondisi guru, mendukung kesejahteraan, dan mengembangkan potensi pendidik secara berkelanjutan.",
    ringkas: "Kondisi, kesejahteraan, dan pengembangan pendidik.",
    ikon: "guru",
    warna: "jingga",
    tampilan: [
      { id: "culture-kelompok", jenis: "akun", grup: "Culture", label: "Kelompok" },
      { id: "culture-perorangan", jenis: "akun", grup: "Culture", label: "Perorangan" },
    ],
  },
  {
    id: "finance-planning",
    nomor: "05",
    judul: "Finance & Planning",
    deskripsi: "Membantu sekolah mengelola keuangan, anggaran, dan perencanaan secara lebih transparan dan terukur.",
    ringkas: "Keuangan, anggaran, dan perencanaan yang terukur.",
    ikon: "keuangan",
    warna: "teal",
    tampilan: [
      { id: "dashboard-keuangan", jenis: "html", grup: "Finance & Planning", label: "Dashboard Keuangan" },
    ],
  },
];

export const DEMO_SYSTEM_IDS = DEMO_SYSTEMS.map((s) => s.id);

/** Semua tampilan, masing-masing membawa id sistemnya. */
export const DEMO_TAMPILAN = DEMO_SYSTEMS.flatMap((s) => s.tampilan.map((t) => ({ ...t, sistem: s.id })));

// Map, bukan objek biasa: "__proto__" atau "constructor" tidak pernah dianggap id yang sah.
const SISTEM_MENURUT_ID = new Map(DEMO_SYSTEMS.map((s) => [s.id, s]));
const TAMPILAN_MENURUT_ID = new Map(DEMO_TAMPILAN.map((t) => [t.id, t]));

/** Sistem untuk id ini, atau null kalau id tidak ada di registri. */
export function cariSistem(id) {
  return typeof id === "string" && SISTEM_MENURUT_ID.has(id) ? SISTEM_MENURUT_ID.get(id) : null;
}

/** Tampilan untuk id ini, atau null kalau id tidak ada di registri. */
export function cariTampilan(id) {
  return typeof id === "string" && TAMPILAN_MENURUT_ID.has(id) ? TAMPILAN_MENURUT_ID.get(id) : null;
}

/** Hanya id sistem yang dikenal, urut sesuai registri, tanpa duplikat. Masukan lain dibuang. */
export function saringSistem(daftar) {
  const ada = new Set(Array.isArray(daftar) ? daftar.filter((x) => typeof x === "string") : []);
  return DEMO_SYSTEM_IDS.filter((id) => ada.has(id));
}

/**
 * Status satu tampilan untuk sesi demo yang sedang berjalan.
 *   "tersedia" -> bisa dibuka
 *   "segera"   -> laporan HTML-nya belum disimpan di server (Coming soon)
 *   "terbatas" -> sistemnya tidak termasuk kode demo yang dipakai
 *   "terkunci" -> belum ada sesi demo
 * Tampilan berjenis "akun" selalu dianggap tersedia: kesiapan akunnya hanya diketahui server, dan
 * kalau belum diatur, pembukaannya membalas pesan yang jelas. "tautan" tersedia kalau url-nya ada.
 */
export function statusTampilan(tampilan, sesi) {
  if (!tampilan || !sesi) return "terkunci";
  if (!sesi.availableSystems?.includes(tampilan.sistem)) return "terbatas";
  if (tampilan.jenis === "html") return sesi.htmlReports?.includes(tampilan.sistem) ? "tersedia" : "segera";
  if (tampilan.jenis === "tautan") return tampilan.url ? "tersedia" : "segera";
  return tampilan.jenis === "akun" ? "tersedia" : "segera";
}

/** Tampilan yang dibuka di penampil demo (punya alamat #demo/<id>), bukan masuk ke akun. */
export function tampilanBerpenampil(tampilan) {
  return Boolean(tampilan) && (tampilan.jenis === "html" || tampilan.jenis === "tautan");
}

/** Status satu sistem: tersedia kalau minimal satu tampilannya tersedia. */
export function statusSistem(sistem, sesi) {
  if (!sistem || !sesi) return "terkunci";
  if (!sesi.availableSystems?.includes(sistem.id)) return "terbatas";
  const ada = sistem.tampilan.some((t) => statusTampilan({ ...t, sistem: sistem.id }, sesi) === "tersedia");
  return ada ? "tersedia" : "segera";
}

const POLA_HASH = /^#demo\/([a-z][a-z-]{2,39})$/;

/** Id tampilan berpenampil (html atau tautan) dari hash URL (#demo/<id>), hanya id registri. */
export function bacaHashDemo(hash) {
  const cocok = POLA_HASH.exec(typeof hash === "string" ? hash : "");
  const tampilan = cocok ? cariTampilan(cocok[1]) : null;
  return tampilanBerpenampil(tampilan) ? tampilan.id : null;
}

export function hashDemo(idTampilan) {
  return tampilanBerpenampil(cariTampilan(idTampilan)) ? `#demo/${idTampilan}` : "";
}

/**
 * Layar halaman masuk menurut hash URL:
 *   ""             -> { layar: "masuk" }    halaman masuk (informasi + form akun)
 *   "#demo"        -> { layar: "demo" }     layar demo, hanya terbuka selama sesi demo sah
 *   "#demo/<id>"   -> { layar: "laporan" }  penampil satu tampilan html atau tautan
 * Hash lain (termasuk yang berbentuk path) jatuh ke halaman masuk.
 */
export function bacaRuteDemo(hash) {
  if (hash === "#demo") return { layar: "demo", tampilan: null };
  const tampilan = bacaHashDemo(hash);
  return tampilan ? { layar: "laporan", tampilan } : { layar: "masuk", tampilan: null };
}

export function hashRuteDemo(rute) {
  if (rute?.layar === "demo") return "#demo";
  if (rute?.layar === "laporan") return hashDemo(rute.tampilan);
  return "";
}
