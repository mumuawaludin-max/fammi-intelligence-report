/**
 * Data contoh layar Ringkasan (sudut pandang Kepala Sekolah, Bu Hartini) prototipe Sekolah Proteksi,
 * versi ringkas 2026-11-11. Layar ini menampilkan kedua alur sekaligus:
 *   pencegahan : angka skrining dibaca dari bersama/heart.js (RINGKAS_SEKOLAH). Tindak lanjut anak
 *                Waspada sama dengan layar Skrining (13 dari 18, 5 menunggu disusun Guru BK) dan ikut
 *                bertambah saat Guru BK menyusun rencana di sana (rencanaBaru di konteks). Checklist
 *                kelas 2B dihitung hidup dari centang demo, ditambah angka tetap kelas lain.
 *   kejadian   : jumlah kasus per tahap sama dengan kasus contoh di kasusData.js (16 laporan sejak
 *                19 Okt: 1 triage, 1 penugasan, 3 penanganan, 3 dipantau, 8 selesai), termasuk aturan
 *                kasusAwal(): KS-015 pindah ke penanganan begitu respon pertamanya dicentang Bu Rina.
 * Semua nama, kelas, dan angka hanya contoh untuk demonstrasi.
 */
import { RINGKAS_SEKOLAH } from "../bersama/heart";
import { CHECKLIST } from "../bersama/tindakLanjut";

export const TANGGAL = "Rabu, 11 Nov 2026";

const persen = (bagian, total) => `${Math.round((bagian / total) * 100)}%`;

// Spasi tak terputus (U+00A0): angka dan labelnya tetap sebaris di kolom langkah yang sempit.
const NB = String.fromCharCode(160);

// ── Alur pencegahan ─────────────────────────────────────────────────────────────────────────────

/** Kelas yang formulir wali kelasnya belum lengkap. Jumlah `anak` = anak belum terpetakan. */
export const BELUM_TERPETAKAN = [
  { kelas: "1B", wali: "Pak Fajar", anak: 4 },
  { kelas: "2B", wali: "Bu Rina", anak: 2 },
  { kelas: "4A", wali: "Bu Fitri", anak: 6 },
];
const JUMLAH_BELUM = BELUM_TERPETAKAN.reduce((n, k) => n + k.anak, 0);
const KELAS_BELUM = BELUM_TERPETAKAN.map((k) => k.kelas).join(", ");

/** Anak Waspada yang sudah punya tindak lanjut saat demo dibuka (layar Skrining: 13, sisanya 5). */
const WASPADA_BERTINDAK_LANJUT = 13;

/**
 * Tindak lanjut anak Waspada. `rencanaBaru` = rencana yang disusun Guru BK selama demo (konteks),
 * tiap rencana mengurangi anak yang menunggu.
 */
export function hitungTindakLanjut(rencanaBaru = {}) {
  const total = RINGKAS_SEKOLAH.waspada;
  const awalMenunggu = total - WASPADA_BERTINDAK_LANJUT;
  const baru = Math.min(Object.keys(rencanaBaru).length, awalMenunggu);
  return { total, punya: WASPADA_BERTINDAK_LANJUT + baru, menunggu: awalMenunggu - baru };
}

/**
 * Checklist tindak lanjut minggu ini. Kelas 2B memakai butir demo (tanpa tugas kasus, yang milik
 * alur kejadian) ditambah butir dari rencana baru di layar Skrining, supaya centang di Ruang wali
 * kelas ikut mengubah angka di sini; kelas lain angka tetap. Keadaan awal: 41 dari 64 butir (64%).
 */
const KELAS_LAIN = { butir: 50, selesai: 37 };

export function hitungChecklist(centang, tambahan = []) {
  const butir2B = [...CHECKLIST, ...tambahan].filter((c) => c.alur !== "kejadian");
  const selesai2B = butir2B.filter((c) => centang[c.id]).length;
  return { butir: KELAS_LAIN.butir + butir2B.length, selesai: KELAS_LAIN.selesai + selesai2B };
}

/**
 * Isi tiap langkah alur pencegahan, kunci = id langkah di bersama/alur.js. `nilai` angka besar,
 * `satuan` kata kecil sesudahnya, `nada` warna angka (r merah, o jingga; kosong = ungu tua),
 * `ket` keterangan di bawahnya, `bacaan` kalimat utuhnya untuk pembaca layar.
 */
export function isiCegah(tindak, checklist) {
  const r = RINGKAS_SEKOLAH;
  return {
    skrining: {
      nilai: persen(r.terpetakan, r.total),
      ket: `${r.terpetakan} dari ${r.total} anak terpetakan`,
      bacaan: `${r.terpetakan} dari ${r.total} anak terpetakan`,
    },
    hasil: {
      nilai: String(r.waspada),
      satuan: "Waspada",
      nada: "r",
      ket: `${r.perhatian}${NB}Perlu${NB}Perhatian, ${r.baik}${NB}Baik`,
      bacaan: `${r.waspada} anak Waspada, ${r.perhatian} Perlu Perhatian, ${r.baik} Baik`,
    },
    tindak: {
      nilai: `${tindak.punya}/${tindak.total}`,
      satuan: "Waspada",
      nada: tindak.menunggu ? "o" : "",
      ket: tindak.menunggu ? `${tindak.menunggu}${NB}menunggu disusun Guru${NB}BK` : "semua sudah punya rencana",
      bacaan: `${tindak.punya} dari ${tindak.total} anak Waspada punya tindak lanjut${
        tindak.menunggu ? `, ${tindak.menunggu} menunggu disusun Guru BK` : ""
      }`,
    },
    checklist: {
      nilai: persen(checklist.selesai, checklist.butir),
      ket: `${checklist.selesai} dari ${checklist.butir} butir minggu ini`,
      bacaan: `${checklist.selesai} dari ${checklist.butir} butir checklist minggu ini selesai`,
    },
  };
}

// ── Alur kejadian ───────────────────────────────────────────────────────────────────────────────

// Butir checklist respon pertama KS-015 (milik Bu Rina). Sama dengan kasusAwal() di kasusData.js.
const BUTIR_KS015 = CHECKLIST.filter((b) => b.kasus === "KS-015").map((b) => b.id);

/** Isi tiap langkah alur kejadian. `tanda` = bagian keterangan yang ditulis merah. */
export function isiKejadian(centang) {
  const ks015Direspon = BUTIR_KS015.length > 0 && BUTIR_KS015.every((id) => centang[id]);
  const tugas = ks015Direspon ? 0 : 1;
  const tangani = ks015Direspon ? 4 : 3;
  return {
    lapor: {
      nilai: "16",
      satuan: "laporan",
      ket: `sejak 19${NB}Okt, 8${NB}di${NB}November`,
      bacaan: "16 laporan sejak 19 Oktober, 8 di bulan November",
    },
    triage: { nilai: "1", satuan: "menunggu", nada: "r", ket: "KS-016, Darurat", bacaan: "1 laporan Darurat menunggu triage" },
    tugas: {
      nilai: String(tugas),
      satuan: "menunggu",
      ket: tugas ? "respon pertama" : "semua sudah direspon",
      bacaan: tugas ? "1 kasus menunggu respon pertama penanggung jawab" : "Tidak ada kasus yang menunggu respon pertama",
    },
    tangani: {
      nilai: String(tangani),
      satuan: "berjalan",
      ket: `rencana${NB}tindak,`,
      tanda: "1 lewat SLA",
      bacaan: `${tangani} kasus dalam rencana tindak, 1 lewat SLA`,
    },
    pantau: { nilai: "3", satuan: "dipantau", ket: "8 kasus sudah ditutup", bacaan: "3 kasus dipantau, 8 kasus sudah ditutup" },
  };
}

/** Angka kaki panel kejadian, sama dengan kartu angka di layar Kasus. */
export const KINERJA_KASUS = { aktif: 8, ketepatanSla: "96%", responRata: "42 menit" };

// ── Perlu keputusan Anda ────────────────────────────────────────────────────────────────────────

/** Kalimat pembuka di bawah sapaan, mengikuti isi kartu Perlu keputusan Anda. */
export function kalimatPembuka(tindak) {
  return tindak.menunggu
    ? `Dua kasus dan ${tindak.menunggu} anak Waspada tanpa tindak lanjut menunggu keputusan Anda hari ini.`
    : "Dua kasus dan satu tenggat skrining menunggu keputusan Anda hari ini.";
}

/**
 * Tiga butir, tidak lebih. `pil` = nada pil penanda, `warna` = warna teks status (r merah,
 * o jingga), `tujuan` = layar dan aksi tombol Buka, `ingatkan` = butir yang bisa dikirimi
 * pengingat. Butir ketiga: anak Waspada tanpa tindak lanjut selama masih ada, lalu formulir
 * skrining yang belum lengkap.
 */
export function daftarKeputusan(tindak) {
  const skrining = tindak.menunggu
    ? {
        id: "skrining",
        penanda: "Skrining",
        pil: "mid",
        judul: `${tindak.menunggu} anak Waspada`,
        status: "belum punya tindak lanjut",
        warna: "o",
        meta: `Disusun Guru BK · ${JUMLAH_BELUM} anak lain belum terpetakan (${KELAS_BELUM})`,
        labelBuka: "Buka skrining HEART",
        tujuan: { layar: "skrining", aksi: { jenis: "gulir", id: "daftar-anak" } },
        ingatkan: true,
      }
    : {
        id: "skrining",
        penanda: "Skrining",
        pil: "mid",
        judul: `${JUMLAH_BELUM} anak`,
        status: "belum terpetakan",
        warna: "",
        meta: `Formulir wali kelas ${BELUM_TERPETAKAN.map((k) => `${k.kelas} (${k.anak})`).join(", ")} belum lengkap`,
        labelBuka: "Buka skrining HEART",
        tujuan: { layar: "skrining" },
        ingatkan: true,
      };
  return [
    {
      id: "ks-010",
      penanda: "Tinggi",
      pil: "bad",
      judul: "KS-010",
      status: "rencana tindak lewat 2 hari",
      warna: "r",
      meta: "Pemukulan di 4B · orang tua belum bisa dihubungi · dieskalasi ke Anda",
      labelBuka: "Buka kasus KS-010",
      tujuan: { layar: "kasus", aksi: { jenis: "kasus", id: "KS-010" } },
    },
    {
      id: "ks-016",
      penanda: "Darurat",
      pil: "crit",
      judul: "KS-016",
      status: "menunggu triage, sisa 15 menit",
      warna: "o",
      meta: "Dugaan pendekatan tidak wajar di 3A · rujukan ke UPTD PPA diputuskan Anda",
      labelBuka: "Buka kasus KS-016",
      tujuan: { layar: "kasus", aksi: { jenis: "kasus", id: "KS-016" } },
    },
    skrining,
  ];
}

const PENGINGAT_WALAS = {
  peran: "walas",
  ikon: "skrining",
  nada: "warn",
  judul: "Pengingat dari Bu Hartini",
  isi: "Lengkapi skrining HEART Bagas dan Putri sebelum Jumat, 13 Nov.",
  tujuan: { layar: "kelas", aksi: { jenis: "gulir", id: "checklist" } },
};

/**
 * Pengingat tombol Ingatkan: notifikasi lonceng Guru BK (selama ada anak Waspada tanpa tindak
 * lanjut) dan wali kelas (Bu Rina, satu-satunya wali kelas di demo), plus teks pemberitahuannya.
 */
export function pengingat(tindak) {
  const wali = BELUM_TERPETAKAN.map((k) => k.wali);
  if (!tindak.menunggu) {
    return {
      notifikasi: [PENGINGAT_WALAS],
      pesan: `Pengingat terkirim ke ${wali.slice(0, -1).join(", ")}, dan ${wali[wali.length - 1]}`,
      label: `Ingatkan wali kelas ${KELAS_BELUM}`,
    };
  }
  return {
    notifikasi: [
      {
        peran: "bk",
        ikon: "skrining",
        nada: "warn",
        judul: "Pengingat dari Bu Hartini",
        isi: `Susun tindak lanjut untuk ${tindak.menunggu} anak Waspada yang belum punya rencana.`,
        tujuan: { layar: "skrining", aksi: { jenis: "gulir", id: "daftar-anak" } },
      },
      PENGINGAT_WALAS,
    ],
    pesan: `Pengingat terkirim ke Bu Laras dan wali kelas ${KELAS_BELUM}`,
    label: `Ingatkan Guru BK dan wali kelas ${KELAS_BELUM}`,
  };
}

export const PESAN_UNDUH = "Laporan pimpinan (PDF) sedang disiapkan";
