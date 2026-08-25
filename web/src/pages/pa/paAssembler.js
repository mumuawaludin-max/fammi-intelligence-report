/**
 * Perakit laporan Perilaku Anak dari baris Supabase asli (pa_lembaga/pa_siswa/pa_esai) menjadi
 * bentuk `laporan` yang dipakai komponen tampilan -- padanan `paLaporanContoh` di pa.mock.js,
 * tapi membaca data sungguhan, bukan mengarang. pa.mock.js TIDAK dihapus/diubah, tetap dipakai
 * `PaPreview.jsx` untuk pratinjau lepas-login; berkas ini berdiri sendiri (salinan konsep, bukan
 * impor lintas), pola yang sama seperti ScDetailDialog.jsx menyalin dari CwDetailDialog.jsx.
 *
 * KETERBATASAN DATA ASLI yang wajib diketahui sebelum mengubah berkas ini:
 * - Sebaran jenis kelamin (laki/perempuan) HANYA ada di baris agregat (unit=null). File sumber
 *   Excel tidak memecahnya per unit sekolah. Jangan tampilkan gender di scope unit spesifik.
 * - Lima indikator teratas per domain (`indikator` di pa_lembaga) HANYA ada di baris agregat,
 *   tidak dipecah per unit. Saat scope unit dipilih, daftar indikatornya tetap dari baris
 *   agregat (dengan catatan tampilan yang jelas), sedangkan jumlah/persen kartu domain tetap
 *   dari baris unit itu sendiri (yang memang tersedia).
 * - Pertanyaan survei tertutup (`survey` di pa_lembaga) juga hanya ada di baris agregat.
 */

export const PA_DOMAIN_META = [
  { kode: "hiperaktivitas", huruf: "H", label: "Hiperaktivitas" },
  { kode: "emosional", huruf: "E", label: "Emosional" },
  { kode: "agresi", huruf: "A", label: "Agresi" },
  { kode: "relasi", huruf: "R", label: "Relasi" },
  { kode: "tolong_menolong", huruf: "T", label: "Tolong Menolong" },
];

/** Empat domain "kesulitan" yang masuk hitungan gabungan bagian 03 (perlu_telaah/rasio/lintas
 * domain/keparahan/insight utama). Tolong Menolong SENGAJA dikeluarkan dari perhitungan
 * gabungan ini -- domain itu skala kekuatan (prososial), jadi dicampur ke metrik "butuh
 * ditelaah segera" akan mencampur dua makna berbeda. Kartunya sendiri tetap tampil di bagian
 * 03 (beda dari desain pertama modul ini), cuma dengan status "butuh penguatan" yang tetap,
 * bukan ranking prioritas seperti 4 domain lain.
 */
const DOMAIN_GABUNGAN = ["hiperaktivitas", "emosional", "agresi", "relasi"];

const STATUS_URUTAN = ["prioritas tertinggi", "perlu ditelaah", "pantau berkala", "pantau ringan"];

/**
 * Kamus istilah lima domain HEART -- penjelasan konstruk psikologi yang diukur, tetap (bukan
 * per periode), jadi disimpan sebagai konstanta kode, bukan kolom Supabase. Isinya identik
 * dengan PA_GLOSARIUM di pa.mock.js, disalin (bukan diimpor) supaya jalur mock dan jalur asli
 * tetap berdiri sendiri.
 */
export const PA_GLOSARIUM = {
  hiperaktivitas: {
    definisi: "Mengukur seberapa sering anak kesulitan memusatkan perhatian, duduk tenang, atau menahan dorongan bertindak sebelum berpikir. Subskala SDQ, bukan alat diagnosis ADHD.",
    ciri_umum: ["Sulit duduk diam dalam waktu lama", "Perhatian mudah teralihkan", "Bertindak dulu, berpikir belakangan"],
    catatan: "Skor tinggi berarti perlu ditelaah lebih lanjut oleh guru BK, bukan tanda anak mengalami gangguan tertentu.",
  },
  emosional: {
    definisi: "Mengukur gejala cemas, khawatir, dan sedih yang tampak pada keseharian anak. Subskala SDQ yang memotret keadaan emosi yang teramati, bukan riwayat klinis.",
    ciri_umum: ["Sering tampak khawatir atau cemas", "Mudah takut pada situasi baru", "Kesulitan menenangkan diri saat sedih"],
    catatan: "Skor tinggi menandakan area yang perlu dipantau, bukan label kondisi kesehatan mental tertentu.",
  },
  agresi: {
    definisi: "Mengukur perilaku menentang, mudah marah, dan berselisih dengan orang lain. Disebut skala 'masalah perilaku' pada SDQ.",
    ciri_umum: ["Cepat tersulut emosi", "Sering berselisih dengan teman", "Sulit menerima aturan atau instruksi"],
    catatan: "Fokus tindak lanjutnya pada pola dan pemicu perilaku, bukan mencap anak sebagai 'nakal'.",
  },
  relasi: {
    definisi: "Mengukur kesulitan menjalin dan menjaga pertemanan, termasuk rasa diterima di lingkungan sekolah. Disebut skala hubungan teman sebaya pada SDQ.",
    ciri_umum: ["Lebih sering menyendiri", "Sulit memulai interaksi dengan teman", "Merasa tidak diterima kelompok"],
    catatan: "Skor tinggi mengarahkan perhatian ke kondisi lingkungan kelas, bukan menyalahkan anak yang menyendiri.",
  },
  tolong_menolong: {
    definisi: "Satu-satunya subskala 'kekuatan' pada SDQ, bukan subskala kesulitan seperti empat lainnya: mengukur kesediaan berbagi, menolong, dan berempati. Karena itu arah bacanya kebalikan dari empat domain lain, skor **rendah** yang perlu diperhatikan, bukan skor tinggi.",
    ciri_umum: ["Bersedia berbagi dengan orang lain", "Peka pada perasaan teman", "Menawarkan bantuan tanpa diminta"],
    catatan: "Karena arah skalanya kebalikan, domain ini dibaca sebagai bahan penguatan, bukan kasus yang perlu diwaspadai.",
  },
};

const EMOSI_LEVELS = [
  ["sangat_positif", "Sangat Positif"],
  ["positif", "Positif"],
  ["netral", "Netral"],
  ["negatif", "Negatif"],
  ["sangat_negatif", "Sangat Negatif"],
  ["kosong", "Tidak Menjawab"],
];

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

/** Timestamp impor (pa_lembaga.created_at) -> "28 Juli 2026", dipakai caption "Diperbarui" di
 * PaFilterBar. Kalau baris ini pernah diimpor ulang (unggah tahap 2), tanggalnya otomatis ikut
 * baris terbaru -- created_at ditulis ulang setiap delete-then-insert. */
function formatTanggalIndo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

/** periode_id "2026-05" -> "Bulan Mei Tahun 2026", dipakai label dropdown "Periode asesmen" di
 * PaFilterBar supaya pembaca tidak perlu menerjemahkan sendiri kode YYYY-MM. */
export function formatPeriodeBulanTahun(periodeId) {
  const m = /^(\d{4})-(\d{2})$/.exec(periodeId || "");
  if (!m) return periodeId;
  const [, tahun, bulan] = m;
  const nama = BULAN[parseInt(bulan, 10) - 1];
  return nama ? `Bulan ${nama} Tahun ${tahun}` : periodeId;
}

function persenSatuDesimal(bagian, total) {
  if (!total) return "0";
  return ((bagian / total) * 100).toFixed(1).replace(".", ",");
}

// ── Kalimat insight, dihitung dari angka nyata (bukan ditulis lepas) ─────────────────────────

function insightUtamaAsesmen(ringkasan, perUnit, unitScope) {
  const tertinggi = ringkasan.reduce((acc, d) => (!acc || (d.perhatian + d.diwaspadai) > (acc.perhatian + acc.diwaspadai) ? d : acc), null);
  if (!tertinggi) return "";
  const gabungan = Math.round((tertinggi.perhatian + tertinggi.diwaspadai) * 10) / 10;
  let kalimat = `${tertinggi.label} adalah domain dengan porsi "perlu perhatian" dan "perlu diwaspadai" tertinggi periode ini, ${gabungan.toFixed(1).replace(".", ",")}% dari siswa yang diases.`;
  if (unitScope === "semua" && perUnit.length > 1) {
    const unitTertinggi = unitPalingMenonjol(perUnit, tertinggi.kode);
    if (unitTertinggi) kalimat += ` Paling menonjol di ${unitTertinggi.label} (${unitTertinggi.v}%).`;
  }
  return kalimat;
}

function unitPalingMenonjol(perUnit, domainKode) {
  return perUnit.reduce((acc, u) => {
    const d = u.dimensi.find((x) => x.kode === domainKode);
    const v = d ? Math.round((d.perhatian + d.diwaspadai) * 10) / 10 : 0;
    return !acc || v > acc.v ? { label: u.label, v } : acc;
  }, null);
}

function insightAsesmenDomain(d, ringkasan, perUnit, unitScope) {
  const gabungan = Math.round((d.perhatian + d.diwaspadai) * 10) / 10;
  const rataRata = ringkasan.reduce((s, r) => s + r.perhatian + r.diwaspadai, 0) / ringkasan.length;
  const selisih = Math.round((gabungan - rataRata) * 10) / 10;
  const arah = selisih > 0.4 ? "di atas" : selisih < -0.4 ? "di bawah" : "setara dengan";
  let kalimat = `Porsi "perlu perhatian" + "perlu diwaspadai" domain ini ${gabungan.toFixed(1).replace(".", ",")}%, ${arah} rata-rata lima domain (${rataRata.toFixed(1).replace(".", ",")}%).`;
  if (unitScope === "semua" && perUnit.length > 1) {
    const unitTertinggi = unitPalingMenonjol(perUnit, d.kode);
    if (unitTertinggi && unitTertinggi.v > 0) kalimat += ` Paling menonjol di ${unitTertinggi.label} (${unitTertinggi.v}%).`;
  }
  return kalimat;
}

function insightUtamaPerhatian(domainGabunganTerurut) {
  if (domainGabunganTerurut.length < 2 || domainGabunganTerurut[0].jumlah === 0) return "";
  const top = domainGabunganTerurut[0];
  const bawah = domainGabunganTerurut[domainGabunganTerurut.length - 1];
  let kalimat = `${top.label} adalah domain paling mendesak periode ini, ${top.jumlah} siswa perlu ditelaah.`;
  if (bawah.jumlah > 0) {
    const rasio = Math.round((top.jumlah / bawah.jumlah) * 10) / 10;
    if (rasio >= 1.3) kalimat += ` Jumlahnya ${rasio.toString().replace(".", ",")}x lipat dibanding domain paling ringan, ${bawah.label}.`;
  }
  return kalimat;
}

// ── Perakit utama ─────────────────────────────────────────────────────────────────────────

/**
 * @param raw   hasil usePaData: { periode, availablePeriods, lembagaAtPeriode, siswaAtPeriode, esaiAtPeriode }
 * @param unitScope "semua" atau salah satu nilai `unit` asli (mis. "SD Kajaolalido")
 * @returns bentuk `laporan` yang sama dipakai PaStatistikSiswa/PaHasilAsesmen/dst, atau null
 *          kalau belum ada data lembaga untuk periode ini sama sekali.
 */
export function rakitLaporanPa(raw, unitScope = "semua") {
  if (!raw) return null;
  const { lembagaAtPeriode, siswaAtPeriode, esaiAtPeriode, periode } = raw;

  const agregat = lembagaAtPeriode.find((r) => r.unit === null);
  if (!agregat) return null;

  const unitRows = lembagaAtPeriode.filter((r) => r.unit !== null);
  const current = unitScope === "semua" ? agregat : (unitRows.find((r) => r.unit === unitScope) || agregat);
  const unitLabelAktif = unitScope === "semua" ? "Semua unit sekolah" : (current.unit || "Semua unit sekolah");
  const totalSiswaScope = current.jumlah_siswa || 0;

  const siswaScope = unitScope === "semua"
    ? siswaAtPeriode
    : siswaAtPeriode.filter((s) => s.unit === unitScope);
  const esaiScope = esaiAtPeriode; // pa_esai tidak dipecah per unit di sumbernya, lihat catatan importer

  // ── Bagian 01: Statistik Siswa ──────────────────────────────────────────────────────────
  const statistikSumber = current.statistik || {};
  const statistik = {
    total: totalSiswaScope,
    // laki/perempuan HANYA ada di baris agregat -- lihat catatan kepala berkas.
    laki: statistikSumber.laki || null,
    perempuan: statistikSumber.perempuan || null,
    sebaran: unitScope === "semua" ? (statistikSumber.sebaran || []).map((s) => ({
      kode: s.unit, label: s.unit, persen: s.persen ?? 0, total: s.jumlah ?? 0,
    })) : null,
    emosi: (current.emosi || []).map((e) => ({
      kode: e.unit,
      label: e.unit,
      segmen: EMOSI_LEVELS.map(([kode, label]) => {
        const found = (e.segmen || []).find((s) => s.kode === kode);
        return { kode, label, persen: found?.persen ?? 0 };
      }),
    })),
  };

  // ── Bagian 02: Hasil Asesmen ─────────────────────────────────────────────────────────────
  const heartSumber = current.heart || {};
  const asesmenRingkasan = PA_DOMAIN_META.map((d) => {
    const h = heartSumber[d.kode] || {};
    return {
      ...d,
      aman: h.aman?.persen ?? 0,
      perhatian: h.perhatian?.persen ?? 0,
      diwaspadai: h.diwaspadai?.persen ?? 0,
      ...PA_GLOSARIUM[d.kode],
    };
  });
  // Blok per-unit di bagian 02 mengikuti filter: seluruh unit kalau scope "semua", cuma satu
  // blok kalau sudah difilter ke unit tertentu (tidak perlu menampilkan 3 unit sekaligus saat
  // pembaca sudah memilih fokus ke satu unit).
  const unitRowsUntukPerUnit = unitScope === "semua" ? unitRows : unitRows.filter((r) => r.unit === unitScope);
  const asesmenPerUnit = unitRowsUntukPerUnit.map((u) => ({
    kode: u.unit,
    label: u.unit,
    dimensi: PA_DOMAIN_META.map((d) => {
      const h = (u.heart || {})[d.kode] || {};
      return { ...d, aman: h.aman?.persen ?? 0, perhatian: h.perhatian?.persen ?? 0, diwaspadai: h.diwaspadai?.persen ?? 0 };
    }),
  }));

  // ── Bagian 03: Perlu Perhatian ───────────────────────────────────────────────────────────
  // jumlah/persen kartu SENGAJA dihitung dari anggotaSiswa.length (daftar nama per-siswa di
  // pa_siswa, sama seperti dialog "Lihat Daftar Nama Prioritas Perlu Perhatian"), BUKAN dari
  // agregat pa_lembaga.heart. Pernah ada selisih antara keduanya (agregat lembaga sempat
  // menghitung siswa yang ternyata tidak mengisi asesmen sama sekali, sehingga tidak muncul di
  // daftar nama per-siswa) -- kalau angka pojok kartu dan isi dialog beda sumber, pimpinan
  // melihat "234 siswa" di kartu tapi dialog cuma menampilkan sebagian, dan itu yang bikin
  // bingung. Konsekuensinya: dialog TIDAK memotong daftar (tidak ada slice cap lagi), supaya
  // jumlah yang tampil di kartu selalu persis sama dengan banyaknya baris di dialog.
  const indikatorSumber = agregat.indikator || {};

  // `nilai` indikator TERNYATA tidak konsisten antar-unggahan -- satu berkas contoh pernah
  // memakai rata-rata mentah skala 0-2 (konvensi SDQ per-item), unggahan lain memakai
  // persentase 0-100. Dideteksi SEKALI per laporan dari nilai maksimum yang benar-benar ada,
  // bukan diasumsikan tetap -- supaya label skalanya selalu jujur mengikuti data yang sedang
  // ditampilkan, apa pun konvensi yang dipakai pipeline hulu untuk unggahan itu.
  const semuaNilaiIndikator = Object.values(indikatorSumber)
    .flat()
    .map((it) => it?.nilai)
    .filter((v) => typeof v === "number" && Number.isFinite(v));
  const skalaNilaiIndikator = semuaNilaiIndikator.length > 0 && Math.max(...semuaNilaiIndikator) > 2.5
    ? { maks: 100, label: "dari 100" }
    : { maks: 2, label: "skala 0–2" };

  const domainDenganAngka = PA_DOMAIN_META.map((d) => {
    const anggotaSiswa = siswaScope
      .filter((s) => s.domain === d.kode && (s.status === "Perlu Perhatian" || s.status === "Perlu Diwaspadai"))
      .sort((a, b) => (b.skor || 0) - (a.skor || 0));
    const jumlah = anggotaSiswa.length;
    const indikatorList = indikatorSumber[d.kode] || [];
    return {
      ...d,
      jumlah,
      persen: persenSatuDesimal(jumlah, totalSiswaScope),
      perilaku: indikatorList.map((it, i) => ({
        rank: i + 1, label: it.indikator, nilai: it.nilai, skalaLabel: skalaNilaiIndikator.label, jumlah: it.siswa, persen: it.persentase,
      })),
      indikatorLintasUnit: unitScope !== "semua" && indikatorList.length > 0,
      // `status` ikut disalin (bukan cuma skor) -- ambang skor "Perlu Perhatian" vs "Perlu
      // Diwaspadai" BEDA per domain (SDQ per subskala), lihat catatan di PaPerluPerhatian.jsx.
      // Tampilan tidak boleh menebak tingkat dari skor mentah pakai satu ambang universal.
      siswa: anggotaSiswa.map((s) => ({ nama: s.nama, unit: s.unit, kelas: s.kelas, skor: s.skor, status: s.status })),
      ...PA_GLOSARIUM[d.kode],
      analisis: current.narasi?.analisis_03_domain?.[d.kode] || agregat.narasi?.analisis_03_domain?.[d.kode] || null,
    };
  });

  // Status: 4 domain "kesulitan" diberi label berjenjang menurut rangking jumlah gabungan
  // (bukan ditulis tetap per nama domain -- supaya jujur berubah kalau ranking berubah antar
  // periode/unit). Tolong Menolong selalu "butuh penguatan", terlepas dari rangkingnya, karena
  // maknanya beda (kekuatan yang perlu ditumbuhkan, bukan masalah yang perlu ditelaah).
  const gabunganTerurut = domainDenganAngka
    .filter((d) => DOMAIN_GABUNGAN.includes(d.kode))
    .sort((a, b) => b.jumlah - a.jumlah);
  const statusByKode = {};
  gabunganTerurut.forEach((d, i) => { statusByKode[d.kode] = STATUS_URUTAN[i] || STATUS_URUTAN[STATUS_URUTAN.length - 1]; });
  statusByKode.tolong_menolong = "butuh penguatan";

  const perhatianDomain = domainDenganAngka
    .map((d) => ({ ...d, status: statusByKode[d.kode] }))
    .sort((a, b) => b.jumlah - a.jumlah);

  // ── Bagian 04: Survey, dikelompokkan per domain ─────────────────────────────────────────
  // Sama seperti indikator, pertanyaan survei tertutup cuma ada di baris agregat pa_lembaga.
  const surveySumber = agregat.survey || [];
  const surveyPerDomain = PA_DOMAIN_META.map((d) => {
    const pertanyaan = surveySumber.filter((s) => klasifikasiPertanyaan(s.pertanyaan_kode) === d.kode);
    return {
      ...d,
      pertanyaan: pertanyaan.map((s) => ({
        kode: s.pertanyaan_kode,
        judul: PA_SURVEI_JUDUL[s.pertanyaan_kode] || humanisasiKode(s.pertanyaan_kode),
        opsi: (s.opsi || []).map((o, i) => ({
          ...o,
          rank: i + 1,
          muted: /^tidak menjawab$/i.test(o.label || ""),
        })),
        interpretasi: agregat.narasi?.interpretasi_04?.[normSurveiKode(s.pertanyaan_kode)] || null,
      })),
    };
  }).filter((d) => d.pertanyaan.length > 0);

  const esaiStatistik = [
    { kode: "terkumpul", nilai: String(esaiScope.length), label: "Jawaban esai terkumpul", detail: `Dari ${totalSiswaScope} siswa yang diases periode ini.` },
  ];

  return {
    meta: {
      unit_label: unitLabelAktif,
      unit_scope: unitScope,
      periode_id: periode,
      diperbarui: formatTanggalIndo(agregat.created_at),
      responden: totalSiswaScope,
    },

    statistik,

    asesmen: {
      insight_utama: agregat.narasi?.insight_02_utama || insightUtamaAsesmen(asesmenRingkasan, asesmenPerUnit, unitScope),
      ringkasan: asesmenRingkasan.map((d) => ({
        ...d,
        insight: current.narasi?.insight_02_domain?.[d.kode] || agregat.narasi?.insight_02_domain?.[d.kode]
          || insightAsesmenDomain(d, asesmenRingkasan, asesmenPerUnit, unitScope),
      })),
      per_unit: asesmenPerUnit,
    },

    perhatian: {
      insight_utama: agregat.narasi?.insight_03_utama || insightUtamaPerhatian(gabunganTerurut),
      domain: perhatianDomain,
    },

    survey: {
      insight_utama: agregat.narasi?.insight_04_utama || "",
      per_domain: surveyPerDomain,
      top_prioritas: hitungTopPrioritasSurvey(surveyPerDomain),
    },

    esai: {
      statistik: esaiStatistik,
      entri: esaiScope.map((e) => ({
        id: e.kode_anonim,
        unit: e.unit || null,
        domain: e.domain,
        pertanyaan_kode: e.pertanyaan_kode,
        jawaban_pilihan: e.jawaban_pilihan,
        jawaban: e.jawaban_teks,
        tema: e.anotasi?.tema || [],
        sinyal: e.anotasi?.sinyal || null,
        saran: e.anotasi?.saran || null,
        prioritas: e.anotasi?.prioritas || null,
      })),
    },
  };
}

// ── Top prioritas bagian 04 ──────────────────────────────────────────────────────────────────
//
// TIDAK ada penanda "opsi mana yang layak diperhatikan" di data survei tertutup asli (beda dari
// jawaban esai yang punya anotasi.prioritas dari sheet NARASI) -- jadi ini HEURISTIK kata kunci
// + ambang durasi, bukan klasifikasi ahli. Angka yang ditampilkan (jumlah/persen) tetap 100%
// data asli, cuma PEMILIHAN opsi mana yang ditonjolkan yang otomatis. Kalau tim narasi nanti
// menulis penanda prioritas sungguhan untuk survei tertutup (pola sama seperti esai), ganti
// fungsi ini untuk membaca itu dulu, heuristik ini jadi fallback saja.
// Kata kunci SPESIFIK (frasa, bukan kata umum satuan seperti "tidak"/"sendiri"/"diam" sendirian
// -- itu memicu salah tangkap: "Sendiri dalam ruangan tenang" bukan kekhawatiran, itu kebiasaan
// belajar yang justru baik; "Tidak pasti" pada pertanyaan durasi bukan sinyal apa pun, cuma
// jawaban tidak spesifik). Setiap frasa di sini sengaja panjang/khusus supaya cuma cocok pada
// jawaban yang MEMANG menggambarkan pola mengkhawatirkan, diverifikasi satu per satu terhadap
// data asli sebelum dipakai.
const KATA_KUNCI_PERHATIAN = [
  "menyendiri", "diam sendiri", "menghindar", "menolak", "mengeluh", "berbohong", "memaksa",
  "berselisih", "dibully", "kesulitan", "sulit menghentikan", "khawatir", "takut", "cemas",
  "menangis", "kabur", "malas", "menunda", "memendam", "belum tahu", "tidak cerita",
  "tidak tahu harus", "menyalahkan",
];

function adaKataKunciPerhatian(label) {
  const l = String(label || "").toLowerCase();
  return KATA_KUNCI_PERHATIAN.some((k) => l.includes(k));
}

/** Opsi durasi ("2-4 jam per hari") -> jam tertinggi yang disebut di label itu. */
function jamDariLabel(label) {
  const m = /(\d+)\s*[-–]\s*(\d+)\s*jam|(\d+)\s*jam/i.exec(String(label || ""));
  if (!m) return null;
  if (m[2]) return parseInt(m[2], 10);
  return parseInt(m[3], 10);
}

const CTA_PER_DOMAIN = {
  hiperaktivitas: "Bahas pola ini di rapat wali kelas berkala, dan sepakati satu rutinitas kelas untuk mengimbanginya.",
  emosional: "Sediakan waktu check-in ringan dengan wali kelas atau guru BK untuk siswa yang termasuk kelompok ini.",
  agresi: "Telaah bersama wali kelas pola pemicunya, lalu sepakati konsekuensi yang konsisten antarguru.",
  relasi: "Rancang kegiatan kelompok yang mendorong interaksi lintas lingkaran pertemanan.",
  tolong_menolong: "Perkuat lewat contoh dan apresiasi terbuka setiap kali muncul perilaku menolong.",
};

/**
 * Pilih sampai 3 (pertanyaan, opsi) paling layak disorot lintas SELURUH survei tertutup --
 * maksimal SATU opsi per pertanyaan, diurutkan dari persen tertinggi.
 *
 * Dua jalur kandidat yang SENGAJA saling eksklusif per pertanyaan:
 * 1. Pertanyaan durasi (ada opsi berformat "N jam"): HANYA opsi durasi TERPANJANG yang jadi
 *    kandidat. Opsi lain di pertanyaan yang sama (termasuk "Tidak pasti") tidak pernah dicoba
 *    lewat kata kunci -- kalau tidak, "Tidak pasti" bisa menang cuma karena memuat kata "tidak"
 *    padahal itu bukan sinyal apa pun untuk pertanyaan durasi.
 * 2. Pertanyaan non-durasi: opsi dengan kata kunci perhatian (lihat KATA_KUNCI_PERHATIAN),
 *    persen tertinggi di antara yang cocok.
 */
function hitungTopPrioritasSurvey(surveyPerDomain) {
  const terbaikPerPertanyaan = new Map();
  for (const d of surveyPerDomain) {
    for (const p of d.pertanyaan) {
      const opsiValid = (p.opsi || []).filter((o) => !o.muted);
      if (opsiValid.length === 0) continue;
      const jamOpsi = opsiValid.map((o) => jamDariLabel(o.label));
      const adaJam = jamOpsi.some((v) => v != null);

      let terpilih = null;
      if (adaJam) {
        const jamMaks = Math.max(...jamOpsi.filter((v) => v != null));
        if (jamMaks >= 2) terpilih = opsiValid[jamOpsi.findIndex((v) => v === jamMaks)];
      } else {
        const berKataKunci = opsiValid.filter((o) => adaKataKunciPerhatian(o.label));
        terpilih = berKataKunci.reduce((acc, o) => (!acc || (o.persen ?? 0) > (acc.persen ?? 0) ? o : acc), null);
      }
      if (!terpilih) continue;

      terbaikPerPertanyaan.set(p.kode, {
        domainKode: d.kode, domainLabel: d.label, domainHuruf: d.huruf,
        pertanyaanKode: p.kode, pertanyaanJudul: p.judul,
        opsiLabel: terpilih.label, jumlah: terpilih.jumlah, persen: terpilih.persen,
      });
    }
  }
  return [...terbaikPerPertanyaan.values()]
    .sort((a, b) => (b.persen ?? 0) - (a.persen ?? 0))
    .slice(0, 3)
    .map((k, i) => ({ ...k, rank: i + 1, cta: CTA_PER_DOMAIN[k.domainKode] || "Diskusikan pola ini bersama wali kelas dan orang tua pada pertemuan berkala." }));
}

/** Kode kolom sheet survei asli -> judul tampilan, dipakai heading tiap pertanyaan di bagian 04. */
const PA_SURVEI_JUDUL = {
  kebiasaan_belajar: "Kebiasaan Belajar",
  penyelesaian_tugas: "Penyelesaian Tugas",
  penggunaan_gadget: "Penggunaan Gadget",
  respon_di_situasi_baru: "Respon di Situasi Baru",
  tempat_yang_nyaman: "Tempat yang Nyaman",
  respon_saat_gagal: "Respon Saat Gagal",
  respon_saat_marah: "Respon Saat Marah",
  sikap_saat_beda_pandapat: "Sikap Saat Beda Pendapat",
  orang_yang_nyaman_diajak_ngobrol: "Orang yang Nyaman Diajak Ngobrol",
  // Kode kolom asli punya underscore ganda ("dalam__3_6") -- verified langsung dari hasil parse
  // bundle Excel nyata, bukan salah ketik di sini.
  dibully_dalam__3_6_bulan_terakhir: "Dibully dalam 3-6 Bulan Terakhir",
  orang_yang_paling_dipercaya: "Orang yang Paling Dipercaya",
  orang_yang_dipercaya_untuk_cerita: "Tempat Bercerita",
  saat_teman_sedih: "Saat Teman Sedih",
  saat_teman_kesulitan: "Saat Teman Kesulitan",
  saat_punya_bekal: "Saat Punya Bekal Lebih",
  saat_ada_teman_baru: "Saat Ada Teman Baru",
  saat_adik_kelas_kesulitan: "Saat Adik Kelas Kesulitan",
  saat_orangtua_atau_guru_minta_bantuan: "Saat Diminta Bantuan Orang Tua atau Guru",
};

/** Jatuh balik kalau ada kode kolom baru di Excel yang belum masuk kamus di atas. */
function humanisasiKode(kode) {
  return String(kode || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Kode kolom pertama sheet survei asli -> domain HEART, dipakai mengelompokkan bagian 04. */
function klasifikasiPertanyaan(kode) {
  const k = String(kode || "").toLowerCase();
  if (["kebiasaan_belajar", "penyelesaian_tugas", "penggunaan_gadget"].includes(k)) return "hiperaktivitas";
  if (["respon_di_situasi_baru", "tempat_yang_nyaman", "respon_saat_gagal"].includes(k)) return "emosional";
  if (["respon_saat_marah", "sikap_saat_beda_pandapat"].includes(k)) return "agresi";
  if (["orang_yang_nyaman_diajak_ngobrol", "dibully_dalam__3_6_bulan_terakhir", "orang_yang_paling_dipercaya", "orang_yang_dipercaya_untuk_cerita"].includes(k)) return "relasi";
  if (["saat_teman_sedih", "saat_teman_kesulitan", "saat_punya_bekal", "saat_ada_teman_baru", "saat_adik_kelas_kesulitan", "saat_orangtua_atau_guru_minta_bantuan"].includes(k)) return "tolong_menolong";
  return "relasi";
}

function normSurveiKode(kode) {
  return String(kode || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

/** Pertanyaan esai terbuka -> teks tampilan, dipakai Ruang Baca Esai. Dua kode pertama untuk
 * jenjang SD/SMP/SMA (anak menjawab sendiri), dua kode terakhir untuk jenjang TK (guru/orang tua
 * yang mengisi sebagai pengamat, lihat catatan informant-report di kepala pa.mock.js). */
export const PA_ESAI_PERTANYAAN = {
  orang_yang_dipercaya_untuk_cerita: "Siapa orang yang paling kamu percaya untuk bercerita, dan kenapa?",
  kenapa_penting_peduli: "Menurutmu, kenapa penting untuk peduli pada orang lain?",
  observasi_perilaku_menonjol: "Menurut guru/orang tua, perilaku apa yang paling menonjol dari anak ini pada periode ini, dan bagaimana konteksnya?",
  cara_anak_menunjukkan_kepedulian: "Menurut guru/orang tua, bagaimana anak ini biasanya menunjukkan kepedulian atau membantu orang lain?",
};
