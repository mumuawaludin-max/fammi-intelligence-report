// Uji aturan akses demo halaman masuk. Jalankan: npm test (dari folder web).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DEMO_SYSTEMS, DEMO_SYSTEM_IDS, DEMO_TAMPILAN, bacaHashDemo, bacaRuteDemo, cariSistem, cariTampilan,
  hashDemo, hashRuteDemo, saringSistem, statusSistem, statusTampilan,
} from "./demoSystems.js";
import {
  KUNCI_SESI, PESAN_SESI, PESAN_TAMPILAN, PESAN_VERIFIKASI, buatKlienDemo, formatBerlaku,
  normalisasiKode, periksaFormatKode, rapikanKetikan, sesiMati, tafsirkanLaporan, tafsirkanMasuk,
  tafsirkanSesi, tafsirkanVerifikasi,
} from "./demoAturan.js";

const TOKEN = "a".repeat(64);
const NANTI = "2030-01-01T10:00:00.000Z";
const SESI_PENUH = { availableSystems: DEMO_SYSTEM_IDS, htmlReports: [] };

function penyimpananPalsu() {
  const isi = new Map();
  return {
    isi,
    getItem: (k) => (isi.has(k) ? isi.get(k) : null),
    setItem: (k, v) => isi.set(k, String(v)),
    removeItem: (k) => isi.delete(k),
  };
}

function rpcPalsu(balasan) {
  const panggilan = [];
  const rpc = async (nama, argumen) => {
    panggilan.push({ nama, argumen });
    const b = typeof balasan === "function" ? balasan(nama, argumen) : balasan[nama];
    if (b instanceof Error) throw b;
    return b;
  };
  return { rpc, panggilan };
}

// ── Registri dan keselarasan dengan server ───────────────────────────────────────────────────

test("id sistem sama persis dengan daftar di migration", () => {
  const sql = readFileSync(new URL("../../../../supabase/migrations/20261111100000_demo_access.sql", import.meta.url), "utf8");
  const cocok = /create or replace function public\.demo_semua_sistem\(\)[\s\S]*?array\[([^\]]+)\]/.exec(sql);
  assert.ok(cocok, "fungsi demo_semua_sistem tidak ditemukan di migration");
  const dariSql = cocok[1].split(",").map((s) => s.trim().replace(/^'|'$/g, ""));
  assert.deepEqual(DEMO_SYSTEM_IDS, dariSql);
});

test("tampilan berjenis akun sama persis dengan daftar Edge Function demo-masuk", () => {
  const ts = readFileSync(new URL("../../../../supabase/functions/demo-masuk/index.ts", import.meta.url), "utf8");
  const blok = /const TAMPILAN_AKUN[^=]*=\s*\{([\s\S]*?)\};/.exec(ts);
  assert.ok(blok, "TAMPILAN_AKUN tidak ditemukan di Edge Function");
  const dariFungsi = Object.fromEntries([...blok[1].matchAll(/"([a-z-]+)":\s*"([a-z-]+)"/g)].map((m) => [m[1], m[2]]));
  const dariKlien = Object.fromEntries(DEMO_TAMPILAN.filter((t) => t.jenis === "akun").map((t) => [t.id, t.sistem]));
  assert.deepEqual(dariKlien, dariFungsi);
});

test("demo-masuk tanpa kata sandi: akun dipastikan ada sebelum tautan masuk dibuat", () => {
  const ts = readFileSync(new URL("../../../../supabase/functions/demo-masuk/index.ts", import.meta.url), "utf8");
  const kode = ts.replace(/^\s*\/\/.*$/gm, "");
  assert.ok(!/signInWithPassword|password/i.test(kode), "demo-masuk tidak boleh memakai kata sandi");
  // generateLink tipe magiclink membuat akun baru untuk email yang belum terdaftar.
  const periksaAkun = kode.indexOf('rpc("demo_akun_email"');
  const buatTautan = kode.indexOf("generateLink(");
  assert.ok(periksaAkun > 0 && buatTautan > periksaAkun, "demo_akun_email wajib dipanggil sebelum generateLink");
});

test("lima sistem, nomor urut 01-05, tiap sistem punya tampilan", () => {
  assert.equal(DEMO_SYSTEMS.length, 5);
  DEMO_SYSTEMS.forEach((s, i) => {
    assert.equal(s.nomor, String(i + 1).padStart(2, "0"));
    for (const k of ["id", "judul", "deskripsi", "ringkas", "ikon", "warna"]) assert.ok(s[k], `${s.id}.${k} kosong`);
    assert.ok(s.tampilan.length > 0, `${s.id} tanpa tampilan`);
  });
});

test("tampilan sesuai permintaan: dua untuk Karakter dan Culture, HTML untuk keuangan", () => {
  const per = (id) => cariSistem(id).tampilan.map((t) => `${t.jenis}:${t.id}`);
  assert.deepEqual(per("education-character"), ["akun:karakter-kepsek", "akun:karakter-walas"]);
  assert.deepEqual(per("safety-crisis"), ["akun:kesehatan-mental-anak"]);
  assert.deepEqual(per("talent-life-design"), ["akun:multiple-intelligence"]);
  assert.deepEqual(per("teacher-growth"), ["akun:culture-kelompok", "akun:culture-perorangan"]);
  assert.deepEqual(per("finance-planning"), ["html:dashboard-keuangan"]);
  assert.equal(new Set(DEMO_TAMPILAN.map((t) => t.id)).size, DEMO_TAMPILAN.length, "id tampilan harus unik");
});

test("tidak ada kredensial akun di registri", () => {
  const teks = readFileSync(new URL("./demoSystems.js", import.meta.url), "utf8");
  assert.ok(!/password|kode_khusus|@gmail|@fammi\.internal/i.test(teks), "registri tidak boleh memuat kredensial");
});

test("teks tidak memakai em-dash", () => {
  const EM_DASH = String.fromCharCode(0x2014);
  const semuaTeks = [
    ...DEMO_SYSTEMS.flatMap((s) => [s.judul, s.deskripsi, s.ringkas, ...s.tampilan.flatMap((t) => [t.grup, t.label])]),
    ...Object.values(PESAN_VERIFIKASI), ...Object.values(PESAN_SESI), ...Object.values(PESAN_TAMPILAN),
  ];
  for (const t of semuaTeks) assert.ok(!t.includes(EM_DASH), `em-dash di: ${t}`);
});

test("cariSistem dan cariTampilan hanya menerima id registri", () => {
  assert.equal(cariSistem("education-character").nomor, "01");
  assert.equal(cariTampilan("karakter-walas").sistem, "education-character");
  for (const asing of ["__proto__", "constructor", "toString", "../etc/passwd", "", null, undefined, 5, "EDUCATION-CHARACTER"]) {
    assert.equal(cariSistem(asing), null, `sistem diterima: ${String(asing)}`);
    assert.equal(cariTampilan(asing), null, `tampilan diterima: ${String(asing)}`);
  }
});

test("saringSistem membuang id asing dan mengikuti urutan registri", () => {
  assert.deepEqual(
    saringSistem(["finance-planning", "../x", "education-character", "__proto__", "education-character", 7]),
    ["education-character", "finance-planning"],
  );
  assert.deepEqual(saringSistem(null), []);
});

test("hash URL hanya membuka id sistem registri", () => {
  assert.equal(bacaHashDemo("#demo/finance-planning"), "finance-planning");
  assert.equal(hashDemo("finance-planning"), "#demo/finance-planning");
  for (const asing of ["#demo/../../etc/passwd", "#demo/__proto__", "#demo/Finance-Planning", "#demo/finance-planning/x",
    "#demo/", "#demo", "", null, "#demo/finance-planning?x=1", "#demo/karakter-kepsek"]) {
    assert.equal(bacaHashDemo(asing), null, `diterima: ${String(asing)}`);
  }
  assert.equal(hashDemo("../x"), "");
});

test("rute layar: halaman masuk, layar demo, laporan; hash lain jatuh ke halaman masuk", () => {
  assert.deepEqual(bacaRuteDemo(""), { layar: "masuk", sistem: null });
  assert.deepEqual(bacaRuteDemo("#demo"), { layar: "demo", sistem: null });
  assert.deepEqual(bacaRuteDemo("#demo/finance-planning"), { layar: "laporan", sistem: "finance-planning" });
  for (const asing of ["#demo/", "#Demo", "#demo/x", "#demo/__proto__", "#demo?x=1", "#form-masuk", null, undefined, 7]) {
    assert.deepEqual(bacaRuteDemo(asing), { layar: "masuk", sistem: null }, `bukan halaman masuk: ${String(asing)}`);
  }
  for (const rute of [{ layar: "masuk" }, { layar: "demo" }, { layar: "laporan", sistem: "finance-planning" }]) {
    assert.deepEqual(bacaRuteDemo(hashRuteDemo(rute)), { sistem: null, ...rute });
  }
  assert.equal(hashRuteDemo({ layar: "laporan", sistem: "../x" }), "");
  assert.equal(hashRuteDemo(null), "");
});

test("status tampilan: akun tersedia, HTML menunggu laporan server, sistem di luar kode terbatas", () => {
  const kepsek = cariTampilan("karakter-kepsek");
  const keuangan = cariTampilan("dashboard-keuangan");
  assert.equal(statusTampilan(kepsek, SESI_PENUH), "tersedia");
  assert.equal(statusTampilan(keuangan, SESI_PENUH), "segera");
  assert.equal(statusTampilan(keuangan, { ...SESI_PENUH, htmlReports: ["finance-planning"] }), "tersedia");
  assert.equal(statusTampilan(kepsek, { availableSystems: ["finance-planning"], htmlReports: [] }), "terbatas");
  assert.equal(statusTampilan(kepsek, null), "terkunci");

  assert.equal(statusSistem(cariSistem("finance-planning"), SESI_PENUH), "segera");
  assert.equal(statusSistem(cariSistem("teacher-growth"), SESI_PENUH), "tersedia");
  assert.equal(statusSistem(cariSistem("teacher-growth"), { availableSystems: ["safety-crisis"] }), "terbatas");
});

// ── Ketikan dan format ───────────────────────────────────────────────────────────────────────

test("normalisasi kode: huruf besar, hanya huruf dan angka", () => {
  assert.equal(normalisasiKode(" abcd-efgh jkmn "), "ABCDEFGHJKMN");
  assert.equal(normalisasiKode("ÀBC!@#123"), "BC123");
  assert.equal(normalisasiKode(null), "");
});

test("ketikan dirapikan saat diisi", () => {
  assert.equal(rapikanKetikan("abcd-efgh jkmn<script>"), "ABCD-EFGH JKMNSCRIPT");
  assert.equal(rapikanKetikan("x".repeat(60)).length, 40);
});

test("format kode: kosong, terlalu pendek, terlalu panjang, layak", () => {
  assert.equal(periksaFormatKode(""), "kosong");
  assert.equal(periksaFormatKode("ABC"), "invalid");
  assert.equal(periksaFormatKode("A".repeat(33)), "invalid");
  assert.equal(periksaFormatKode("ABCDEFGHJKMN"), null);
});

// ── Tafsir balasan server ────────────────────────────────────────────────────────────────────

test("verifikasi berhasil: token, waktu, dan sistem disaring", () => {
  const h = tafsirkanVerifikasi({
    data: {
      success: true, status: "valid",
      session: { token: TOKEN, expiresAt: "2030-01-01T10:00:00+00:00" },
      availableSystems: ["talent-life-design", "<img onerror=x>", "education-character"],
      htmlReports: ["finance-planning"],
    },
  });
  assert.equal(h.status, "valid");
  assert.equal(h.token, TOKEN);
  assert.equal(h.sesi.expiresAt, NANTI);
  assert.deepEqual(h.sesi.availableSystems, ["education-character", "talent-life-design"]);
  assert.deepEqual(h.sesi.htmlReports, ["finance-planning"]);
});

test("verifikasi gagal memakai pesan layar sendiri, bukan teks server", () => {
  for (const status of ["invalid", "expired", "revoked", "exhausted", "rate_limited"]) {
    const h = tafsirkanVerifikasi({ data: { success: false, status, message: "detail internal server" } });
    assert.equal(h.status, status);
    assert.equal(h.pesan, PESAN_VERIFIKASI[status]);
  }
  assert.equal(tafsirkanVerifikasi({ data: { success: false, status: "aneh" } }).status, "galat");
});

test("balasan rusak atau error jaringan jadi galat, tidak pernah valid", () => {
  const rusak = [
    { error: { message: "Could not find the function public.demo_verify" } },
    { data: null },
    { data: "ok" },
    { data: { success: true, session: { token: "pendek", expiresAt: NANTI } } },
    { data: { success: true, session: { token: TOKEN, expiresAt: "bukan-waktu" } } },
    { data: { success: "true", session: { token: TOKEN, expiresAt: NANTI } } },
    undefined,
  ];
  for (const b of rusak) assert.equal(tafsirkanVerifikasi(b).status, "galat", JSON.stringify(b));
});

test("tafsir sesi dan laporan", () => {
  assert.equal(tafsirkanSesi({ data: { valid: true, expiresAt: NANTI, availableSystems: DEMO_SYSTEM_IDS } }).status, "aktif");
  assert.equal(tafsirkanSesi({ data: { valid: false, status: "revoked" } }).status, "revoked");
  assert.equal(tafsirkanSesi({ data: { valid: false, status: "lain" } }).status, "invalid");
  assert.equal(tafsirkanSesi({ error: new Error("x") }).status, "galat");
  assert.ok(sesiMati("expired") && sesiMati("ended") && !sesiMati("galat") && !sesiMati("aktif"));

  assert.deepEqual(tafsirkanLaporan({ data: { ok: true, title: "Contoh", html: "<p>x</p>" } }), { status: "ok", judul: "Contoh", html: "<p>x</p>" });
  assert.equal(tafsirkanLaporan({ data: { ok: false, status: "not_found" } }).status, "not_found");
  assert.equal(tafsirkanLaporan({ data: { ok: true, html: "" } }).status, "galat");
});

test("tafsir masuk akun demo: hanya sesi yang lengkap yang diterima", () => {
  assert.deepEqual(
    tafsirkanMasuk({ data: { ok: true, session: { access_token: "a.b.c", refresh_token: "r1", expires_in: 3600 } } }),
    { status: "ok", sesiAkun: { access_token: "a.b.c", refresh_token: "r1" } },
  );
  assert.equal(tafsirkanMasuk({ data: { ok: true, session: { access_token: "a.b.c" } } }).status, "galat");
  assert.equal(tafsirkanMasuk({ data: { ok: false, status: "belum_diatur" } }).status, "belum_diatur");
  assert.equal(tafsirkanMasuk({ data: { ok: false, status: "revoked" } }).status, "revoked");
  assert.equal(tafsirkanMasuk({ data: { ok: false, status: "rahasia server" } }).status, "galat");
  assert.equal(tafsirkanMasuk({ error: new Error("offline") }).status, "galat");
});

test("format waktu berlaku", () => {
  const sekarang = new Date("2026-11-11T05:00:00Z");
  assert.equal(formatBerlaku("2026-11-11T08:30:00Z", { sekarang, timeZone: "Asia/Jakarta" }), "15.30");
  assert.equal(formatBerlaku("2026-11-12T08:30:00Z", { sekarang, timeZone: "Asia/Jakarta" }), "12 Nov 15.30");
  assert.equal(formatBerlaku("bukan", { sekarang }), "");
});

// ── Klien ────────────────────────────────────────────────────────────────────────────────────

test("kode yang jelas salah tidak dikirim ke server", async () => {
  const { rpc, panggilan } = rpcPalsu({});
  const klien = buatKlienDemo({ rpc, penyimpanan: penyimpananPalsu() });
  assert.equal((await klien.verifikasi("   ")).status, "kosong");
  assert.equal((await klien.verifikasi("ab-1")).status, "invalid");
  assert.equal(panggilan.length, 0);
});

test("verifikasi berhasil menyimpan token, bukan kode", async () => {
  const penyimpanan = penyimpananPalsu();
  const { rpc, panggilan } = rpcPalsu({
    demo_verify: { data: { success: true, session: { token: TOKEN, expiresAt: NANTI }, availableSystems: DEMO_SYSTEM_IDS, htmlReports: [] } },
  });
  const klien = buatKlienDemo({ rpc, penyimpanan });
  const h = await klien.verifikasi("abcd efgh-jkmn");

  assert.equal(h.status, "valid");
  assert.equal(h.token, undefined, "token tidak boleh keluar dari klien");
  assert.deepEqual(panggilan[0], { nama: "demo_verify", argumen: { p_code: "ABCDEFGHJKMN" } });
  const disimpan = penyimpanan.getItem(KUNCI_SESI);
  assert.ok(disimpan.includes(TOKEN));
  assert.ok(!disimpan.includes("ABCDEFGHJKMN") && !disimpan.toLowerCase().includes("abcd"), "kode tidak boleh tersimpan");
  assert.ok(klien.punyaSesi());
});

test("verifikasi gagal tidak menyimpan apa pun", async () => {
  const penyimpanan = penyimpananPalsu();
  for (const balasan of [{ data: { success: false, status: "invalid" } }, new Error("offline")]) {
    const { rpc } = rpcPalsu({ demo_verify: balasan });
    const klien = buatKlienDemo({ rpc, penyimpanan });
    assert.notEqual((await klien.verifikasi("ABCD-EFGH-JKMN")).status, "valid");
    assert.equal(penyimpanan.isi.size, 0);
  }
});

test("pemeriksaan sesi: kosong tanpa memanggil server, mati menghapus token, galat jaringan menyimpannya", async () => {
  const penyimpanan = penyimpananPalsu();
  let balasanSesi = { data: { valid: true, expiresAt: NANTI, availableSystems: DEMO_SYSTEM_IDS, htmlReports: [] } };
  const { rpc, panggilan } = rpcPalsu((nama) => (nama === "demo_session" ? balasanSesi : null));
  const klien = buatKlienDemo({ rpc, penyimpanan });

  assert.equal((await klien.periksaSesi()).status, "kosong");
  assert.equal(panggilan.length, 0);

  penyimpanan.setItem(KUNCI_SESI, JSON.stringify({ token: TOKEN, expiresAt: NANTI }));
  assert.equal((await klien.periksaSesi()).status, "aktif");

  balasanSesi = new Error("offline");
  assert.equal((await klien.periksaSesi()).status, "galat");
  assert.ok(klien.punyaSesi(), "gangguan jaringan tidak boleh menghapus sesi");

  balasanSesi = { data: { valid: false, status: "revoked" } };
  assert.equal((await klien.periksaSesi()).status, "revoked");
  assert.equal(klien.punyaSesi(), false);
});

test("token rusak di penyimpanan diabaikan", async () => {
  const penyimpanan = penyimpananPalsu();
  penyimpanan.setItem(KUNCI_SESI, JSON.stringify({ token: "../../x", expiresAt: NANTI }));
  const { rpc, panggilan } = rpcPalsu({});
  const klien = buatKlienDemo({ rpc, penyimpanan });
  assert.equal((await klien.periksaSesi()).status, "kosong");
  assert.equal(panggilan.length, 0);
});

test("akhiri sesi tetap keluar walau server tidak terjangkau", async () => {
  const penyimpanan = penyimpananPalsu();
  penyimpanan.setItem(KUNCI_SESI, JSON.stringify({ token: TOKEN, expiresAt: NANTI }));
  const { rpc, panggilan } = rpcPalsu({ demo_logout: new Error("offline") });
  const klien = buatKlienDemo({ rpc, penyimpanan });
  await klien.akhiriSesi();
  assert.equal(klien.punyaSesi(), false);
  assert.deepEqual(panggilan[0], { nama: "demo_logout", argumen: { p_token: TOKEN } });
});

test("laporan HTML: id asing ditolak tanpa memanggil server", async () => {
  const penyimpanan = penyimpananPalsu();
  penyimpanan.setItem(KUNCI_SESI, JSON.stringify({ token: TOKEN, expiresAt: NANTI }));
  const { rpc, panggilan } = rpcPalsu({ demo_report_html: { data: { ok: true, title: "F", html: "<p>F</p>" } } });
  const klien = buatKlienDemo({ rpc, penyimpanan });
  assert.equal((await klien.ambilLaporanHtml("../../index.html")).status, "not_allowed");
  assert.equal(panggilan.length, 0);
  assert.equal((await klien.ambilLaporanHtml("finance-planning")).status, "ok");
  assert.deepEqual(panggilan[0].argumen, { p_token: TOKEN, p_system: "finance-planning" });
});

test("masuk tampilan akun: hanya token demo dan id tampilan yang dikirim", async () => {
  const penyimpanan = penyimpananPalsu();
  penyimpanan.setItem(KUNCI_SESI, JSON.stringify({ token: TOKEN, expiresAt: NANTI }));
  const kiriman = [];
  const fungsi = async (nama, body) => {
    kiriman.push({ nama, body });
    return { data: { ok: true, session: { access_token: "a.b.c", refresh_token: "r1" } }, error: null };
  };
  const klien = buatKlienDemo({ rpc: async () => ({}), fungsi, penyimpanan });

  assert.equal((await klien.masukTampilan("dashboard-keuangan")).status, "not_allowed", "tampilan HTML tidak lewat Edge Function");
  assert.equal((await klien.masukTampilan("__proto__")).status, "not_allowed");
  assert.equal(kiriman.length, 0);

  const h = await klien.masukTampilan("karakter-kepsek");
  assert.equal(h.status, "ok");
  assert.deepEqual(kiriman, [{ nama: "demo-masuk", body: { token: TOKEN, tampilan: "karakter-kepsek" } }]);
});

test("masuk tampilan akun: sesi demo mati menghapus token, akun belum diatur tidak", async () => {
  const penyimpanan = penyimpananPalsu();
  penyimpanan.setItem(KUNCI_SESI, JSON.stringify({ token: TOKEN, expiresAt: NANTI }));
  let balasan = { data: { ok: false, status: "belum_diatur" }, error: null };
  const klien = buatKlienDemo({ rpc: async () => ({}), fungsi: async () => balasan, penyimpanan });

  assert.equal((await klien.masukTampilan("culture-kelompok")).status, "belum_diatur");
  assert.ok(klien.punyaSesi());

  balasan = { data: { ok: false, status: "expired" }, error: null };
  assert.equal((await klien.masukTampilan("culture-kelompok")).status, "expired");
  assert.equal(klien.punyaSesi(), false);

  assert.equal((await klien.masukTampilan("culture-kelompok")).status, "invalid", "tanpa token tidak memanggil server");
});

test("penyimpanan diblokir: sesi tetap hidup di memori", async () => {
  const diblokir = {
    getItem: () => { throw new Error("SecurityError"); },
    setItem: () => { throw new Error("SecurityError"); },
    removeItem: () => { throw new Error("SecurityError"); },
  };
  const { rpc } = rpcPalsu({
    demo_verify: { data: { success: true, session: { token: TOKEN, expiresAt: NANTI }, availableSystems: DEMO_SYSTEM_IDS } },
    demo_session: { data: { valid: true, expiresAt: NANTI, availableSystems: DEMO_SYSTEM_IDS } },
  });
  const klien = buatKlienDemo({ rpc, penyimpanan: diblokir });
  assert.equal((await klien.verifikasi("ABCD-EFGH-JKMN")).status, "valid");
  assert.equal((await klien.periksaSesi()).status, "aktif");
  await klien.akhiriSesi();
  assert.equal(klien.punyaSesi(), false);
});
