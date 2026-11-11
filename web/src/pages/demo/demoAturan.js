/**
 * Aturan sisi browser untuk akses demo di halaman masuk. Berkas ini sengaja tanpa React dan tanpa
 * Supabase supaya bisa diuji langsung dengan `node --test` (demoAturan.test.js).
 *
 * Keputusan akses SELALU di server (fungsi demo_* di migration 20261111100000). Yang ada di sini
 * cuma merapikan ketikan, menolak bentuk yang jelas salah sebelum membebani server, dan
 * menerjemahkan balasan server ke pesan layar. Tidak ada kode demo di berkas mana pun di React.
 *
 * Yang disimpan di browser hanya token sesi acak (sessionStorage, hilang saat tab ditutup),
 * BUKAN kode demonya. Server menyimpan hash token itu dan memeriksanya ulang setiap kali dipakai.
 */

import { cariSistem, cariTampilan, saringSistem } from "./demoSystems.js";

export const KUNCI_SESI = "fir_demo_sesi";
export const PANJANG_KODE = { min: 8, max: 32 };
const POLA_TOKEN = /^[0-9a-f]{64}$/;

/** Bentuk yang dikirim ke server: huruf besar, hanya huruf dan angka. "abcd efgh-jkmn" = "ABCDEFGHJKMN". */
export function normalisasiKode(masukan) {
  return String(masukan ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Merapikan isi kolom saat diketik: huruf besar, hanya huruf, angka, tanda hubung, dan spasi. */
export function rapikanKetikan(masukan) {
  return String(masukan ?? "").toUpperCase().replace(/[^A-Z0-9\- ]/g, "").slice(0, 40);
}

/** "kosong", "invalid", atau null kalau bentuknya layak dikirim ke server. */
export function periksaFormatKode(kodeNormal) {
  if (!kodeNormal) return "kosong";
  if (kodeNormal.length < PANJANG_KODE.min || kodeNormal.length > PANJANG_KODE.max) return "invalid";
  return null;
}

export const PESAN_VERIFIKASI = {
  kosong: "Kode demo wajib diisi.",
  invalid: "Kode demo tidak valid. Periksa kembali kode yang Anda masukkan.",
  expired: "Masa berlaku kode demo telah berakhir.",
  revoked: "Kode demo ini sudah tidak dapat digunakan.",
  exhausted: "Kode demo ini sudah mencapai batas penggunaan.",
  rate_limited: "Terlalu banyak percobaan. Silakan coba lagi dalam beberapa menit.",
  galat: "Terjadi kendala saat memverifikasi kode. Silakan coba kembali.",
};

export const PESAN_SESI = {
  expired: "Sesi demo telah berakhir. Masukkan kode demo untuk membuka kembali.",
  revoked: "Akses demo ini sudah dicabut. Hubungi tim Fammi untuk kode baru.",
  invalid: "Sesi demo tidak lagi berlaku. Masukkan kode demo kembali.",
  ended: "Sesi demo telah diakhiri.",
  galat: "Sesi demo belum bisa diperiksa. Periksa koneksi lalu muat ulang halaman.",
};

export const PESAN_AKTIF = "Akses demo aktif. Selamat menjelajah.";

/** Pesan saat tampilan berjenis akun gagal dibuka (balasan Edge Function demo-masuk). */
export const PESAN_TAMPILAN = {
  not_allowed: "Kode demo Anda tidak membuka tampilan ini.",
  belum_diatur: "Tampilan demo ini belum disiapkan tim Fammi.",
  akun_gagal: "Tampilan demo belum bisa dibuka. Hubungi tim Fammi.",
  galat: "Tampilan demo belum bisa dibuka. Periksa koneksi, lalu coba lagi.",
};

const STATUS_GAGAL_VERIFIKASI = ["invalid", "expired", "revoked", "exhausted", "rate_limited"];
const STATUS_SESI_MATI = ["expired", "revoked", "ended", "invalid"];
const STATUS_LAPORAN = [...STATUS_SESI_MATI, "not_allowed", "not_found"];

/** Status sesi yang berarti server sudah mematikan sesi itu (bukan gangguan jaringan). */
export function sesiMati(status) {
  return STATUS_SESI_MATI.includes(status);
}

function bacaWaktu(nilai) {
  const t = typeof nilai === "string" ? Date.parse(nilai) : NaN;
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

function bentukSesi(data, waktu) {
  const expiresAt = bacaWaktu(waktu);
  if (!expiresAt) return null;
  return {
    expiresAt,
    availableSystems: saringSistem(data.availableSystems),
    htmlReports: saringSistem(data.htmlReports),
  };
}

/** Balasan demo_verify ({ data, error } dari supabase.rpc) ke { status, pesan?, token?, sesi? }. */
export function tafsirkanVerifikasi(balasan) {
  const { data, error } = balasan || {};
  if (error || !data || typeof data !== "object") return { status: "galat", pesan: PESAN_VERIFIKASI.galat };

  if (data.success === true) {
    const token = data.session?.token;
    const sesi = bentukSesi(data, data.session?.expiresAt);
    if (typeof token !== "string" || !POLA_TOKEN.test(token) || !sesi) {
      return { status: "galat", pesan: PESAN_VERIFIKASI.galat };
    }
    return { status: "valid", token, sesi };
  }

  // Pesan selalu dari tabel di atas, bukan teks server, supaya layar tidak pernah menampilkan
  // rincian teknis apa pun.
  const status = STATUS_GAGAL_VERIFIKASI.includes(data.status) ? data.status : "galat";
  return { status, pesan: PESAN_VERIFIKASI[status] };
}

/** Balasan demo_session ke { status: "aktif", sesi } | { status: expired|revoked|ended|invalid|galat }. */
export function tafsirkanSesi(balasan) {
  const { data, error } = balasan || {};
  if (error || !data || typeof data !== "object") return { status: "galat" };
  if (data.valid === true) {
    const sesi = bentukSesi(data, data.expiresAt);
    return sesi ? { status: "aktif", sesi } : { status: "galat" };
  }
  return { status: STATUS_SESI_MATI.includes(data.status) ? data.status : "invalid" };
}

/** Balasan demo_report_html ke { status: "ok", judul, html } | { status }. */
export function tafsirkanLaporan(balasan) {
  const { data, error } = balasan || {};
  if (error || !data || typeof data !== "object") return { status: "galat" };
  if (data.ok === true && typeof data.html === "string" && data.html.length > 0) {
    return { status: "ok", judul: typeof data.title === "string" ? data.title : "", html: data.html };
  }
  return { status: STATUS_LAPORAN.includes(data.status) ? data.status : "galat" };
}

const STATUS_MASUK = [...STATUS_SESI_MATI, "not_allowed", "belum_diatur", "akun_gagal"];

/**
 * Balasan Edge Function demo-masuk ke { status: "ok", sesiAkun: { access_token, refresh_token } }
 * atau { status }. Tidak pernah ada kode khusus akun di balasan ini, hanya sesi.
 */
export function tafsirkanMasuk(balasan) {
  const { data, error } = balasan || {};
  if (error || !data || typeof data !== "object") return { status: "galat" };
  if (data.ok === true) {
    const s = data.session;
    if (typeof s?.access_token === "string" && s.access_token && typeof s?.refresh_token === "string" && s.refresh_token) {
      return { status: "ok", sesiAkun: { access_token: s.access_token, refresh_token: s.refresh_token } };
    }
    return { status: "galat" };
  }
  return { status: STATUS_MASUK.includes(data.status) ? data.status : "galat" };
}

/** "15.30" kalau hari ini, selain itu "12 Nov 15.30", waktu setempat. */
export function formatBerlaku(iso, { sekarang = new Date(), timeZone } = {}) {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "";
  const opsiTanggal = { timeZone, year: "numeric", month: "2-digit", day: "2-digit" };
  const tanggal = (d) => new Intl.DateTimeFormat("en-CA", opsiTanggal).format(d);
  const jam = new Intl.DateTimeFormat("id-ID", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(t);
  if (tanggal(t) === tanggal(sekarang)) return jam;
  const hari = new Intl.DateTimeFormat("id-ID", { timeZone, day: "numeric", month: "short" }).format(t);
  return `${hari} ${jam}`;
}

/**
 * Klien akses demo. `rpc(nama, argumen)` harus membalas seperti supabase.rpc: { data, error }.
 * `fungsi(nama, body)` memanggil Edge Function dan membalas { data, error }, dengan badan JSON
 * balasan non-2xx ikut di `data`. `penyimpanan` biasanya window.sessionStorage. Kalau penyimpanan
 * diblokir (mode privat lama, pratinjau), token tetap hidup di memori selama halaman terbuka.
 */
export function buatKlienDemo({ rpc, fungsi, penyimpanan }) {
  let memori = null;

  function bacaSesi() {
    try {
      const mentah = penyimpanan?.getItem(KUNCI_SESI);
      if (mentah) {
        const isi = JSON.parse(mentah);
        if (isi && typeof isi.token === "string" && POLA_TOKEN.test(isi.token)) {
          return { token: isi.token, expiresAt: bacaWaktu(isi.expiresAt) };
        }
      }
    } catch {
      // Penyimpanan tidak terbaca: pakai salinan di memori.
    }
    return memori;
  }

  function simpanSesi(token, expiresAt) {
    memori = { token, expiresAt };
    try {
      penyimpanan?.setItem(KUNCI_SESI, JSON.stringify(memori));
    } catch {
      // Diblokir: sesi tetap hidup di memori selama halaman terbuka.
    }
  }

  function lupakanSesi() {
    memori = null;
    try {
      penyimpanan?.removeItem(KUNCI_SESI);
    } catch {
      // Tidak ada yang perlu dibersihkan.
    }
  }

  async function panggil(nama, argumen) {
    try {
      const balasan = await rpc(nama, argumen);
      return balasan || { data: null, error: new Error("Balasan kosong") };
    } catch (e) {
      return { data: null, error: e || new Error("Gagal memanggil server") };
    }
  }

  /** Token tidak pernah ikut dikembalikan; ia hanya hidup di dalam klien ini. */
  async function verifikasi(masukan) {
    const kode = normalisasiKode(masukan);
    const masalah = periksaFormatKode(kode);
    if (masalah) return { status: masalah, pesan: PESAN_VERIFIKASI[masalah] };

    const hasil = tafsirkanVerifikasi(await panggil("demo_verify", { p_code: kode }));
    if (hasil.status !== "valid") return hasil;
    simpanSesi(hasil.token, hasil.sesi.expiresAt);
    return { status: "valid", sesi: hasil.sesi };
  }

  async function periksaSesi() {
    const tersimpan = bacaSesi();
    if (!tersimpan) return { status: "kosong" };
    const hasil = tafsirkanSesi(await panggil("demo_session", { p_token: tersimpan.token }));
    if (sesiMati(hasil.status)) lupakanSesi();
    return hasil;
  }

  /** Lupakan di browser lebih dulu, baru beri tahu server. Gagal jaringan tidak menahan keluar. */
  async function akhiriSesi() {
    const tersimpan = bacaSesi();
    lupakanSesi();
    if (tersimpan) await panggil("demo_logout", { p_token: tersimpan.token });
  }

  async function ambilLaporanHtml(idSistem) {
    const sistem = cariSistem(idSistem);
    if (!sistem) return { status: "not_allowed" };
    const tersimpan = bacaSesi();
    if (!tersimpan) return { status: "invalid" };
    const hasil = tafsirkanLaporan(
      await panggil("demo_report_html", { p_token: tersimpan.token, p_system: sistem.id }),
    );
    if (sesiMati(hasil.status)) lupakanSesi();
    return hasil;
  }

  /** Minta sesi akun demo untuk satu tampilan berjenis "akun". Token demo dikirim, sesi akun kembali. */
  async function masukTampilan(idTampilan) {
    const tampilan = cariTampilan(idTampilan);
    if (!tampilan || tampilan.jenis !== "akun") return { status: "not_allowed" };
    const tersimpan = bacaSesi();
    if (!tersimpan) return { status: "invalid" };
    if (typeof fungsi !== "function") return { status: "galat" };
    let balasan;
    try {
      balasan = await fungsi("demo-masuk", { token: tersimpan.token, tampilan: tampilan.id });
    } catch (e) {
      balasan = { data: null, error: e || new Error("Gagal memanggil server") };
    }
    const hasil = tafsirkanMasuk(balasan);
    if (sesiMati(hasil.status)) lupakanSesi();
    return hasil;
  }

  return {
    punyaSesi: () => bacaSesi() !== null,
    verifikasi,
    periksaSesi,
    akhiriSesi,
    ambilLaporanHtml,
    masukTampilan,
    lupakanSesi,
  };
}
