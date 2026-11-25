// Uji data dan aturan layar Kasus & penugasan (prototipe Sekolah Proteksi): tahap kasus mengikuti
// alur kejadian, angka antrean cocok dengan registri layar, kasus yang disebut notifikasi dan
// checklist bersama memang ada, perpindahan tahap berjalan urut, dan teksnya mematuhi aturan
// penulisan. Semua data contoh.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TAHAP_KASUS } from "../bersama/alur.js";
import { CHECKLIST, PEMILIK } from "../bersama/tindakLanjut.js";
import { NOTIFIKASI_AWAL } from "../bersama/notifikasi.js";
import { LAYAR, ORANG } from "../layarProteksi.js";
import {
  JAM_AWAL,
  KASUS_AWAL,
  TAHAP,
  TINGKAT,
  catatRespon,
  kasusAwal,
  kasusDariLapor,
  kasusMendesak,
  kePantau,
  laporKosong,
  orangKasus,
  slaKasus,
  tetapkanTingkat,
  tugasSaya,
  tugaskan,
  tutupKasus,
  usulanTugas,
} from "./kasusData.js";

/** Terapkan hasil fungsi perpindahan tahap ke satu kasus, seperti ubahKasus di layar. */
const terapkan = (c, langkah) => ({ ...c, ...langkah.ubah(c) });
const cari = (id) => KASUS_AWAL.find((c) => c.id === id);

test("kasus: id unik, tahap dari TAHAP_KASUS, penugasan menunjuk orang yang dikenal", () => {
  const id = KASUS_AWAL.map((c) => c.id);
  assert.equal(new Set(id).size, id.length);
  for (const c of KASUS_AWAL) {
    assert.ok(TAHAP_KASUS.includes(c.tahap), `${c.id}: tahap ${c.tahap} tidak dikenal`);
    assert.ok(TAHAP[c.tahap], `${c.id}: label tahap hilang`);
    assert.ok(TINGKAT.includes(c.tingkat), `${c.id}: tingkat ${c.tingkat}`);
    if (c.tahap === "triage") assert.equal(c.tugas, null, `${c.id}: triage belum boleh punya penugasan`);
    else {
      assert.ok(c.tugas && orangKasus(c.tugas.utama), `${c.id}: penanggung jawab utama tidak dikenal`);
      for (const p of c.tugas.pendukung) assert.ok(orangKasus(p), `${c.id}: pendukung ${p} tidak dikenal`);
    }
  }
});

test("daftar awal: 1 cek awal, 1 bagi tugas, 3 tangani, 3 pantau; aktif sama dengan lencana registri", () => {
  const n = (t) => KASUS_AWAL.filter((c) => c.tahap === t).length;
  assert.deepEqual([n("triage"), n("tugas"), n("tangani"), n("pantau"), n("selesai")], [1, 1, 3, 3, 8]);
  const aktif = KASUS_AWAL.filter((c) => c.tahap !== "selesai").length;
  assert.equal(aktif, LAYAR.find((l) => l.id === "kasus").hitung);
  assert.equal(KASUS_AWAL.filter(tugasSaya).length, 6);
});

test("notifikasi dan checklist bersama menunjuk kasus yang ada, KS-015 dipegang Bu Rina dan Bu Laras", () => {
  for (const n of NOTIFIKASI_AWAL) {
    if (n.tujuan.layar === "kasus" && n.tujuan.aksi?.jenis === "kasus") assert.ok(cari(n.tujuan.aksi.id), `${n.id}: ${n.tujuan.aksi.id} tidak ada`);
    if (n.tujuan.aksi?.jenis === "tahap") assert.ok(TAHAP_KASUS.includes(n.tujuan.aksi.id));
  }
  for (const b of CHECKLIST.filter((x) => x.kasus)) {
    const c = cari(b.kasus);
    assert.ok(c, `${b.id}: kasus ${b.kasus} tidak ada`);
    const nama = [c.tugas.utama, ...c.tugas.pendukung].map((p) => orangKasus(p).nama);
    assert.ok(nama.includes(PEMILIK[b.oleh].orang), `${b.id}: ${PEMILIK[b.oleh].orang} tidak ditugaskan di ${c.id}`);
  }
  const ks015 = cari("KS-015");
  assert.equal(ks015.tahap, "tugas");
  assert.equal(orangKasus(ks015.tugas.utama).nama, "Bu Rina");
  assert.deepEqual(ks015.tugas.pendukung.map((p) => orangKasus(p).nama), ["Bu Laras"]);
  assert.equal(orangKasus(ks015.tugas.utama).sudut, "walas");
});

test("kasus dari skrining HEART ditandai, batas waktu awal sesuai notifikasi", () => {
  assert.ok(cari("KS-012").dariSkrining);
  assert.ok(cari("KS-007").dariSkrining);
  const sla016 = slaKasus(cari("KS-016"), JAM_AWAL);
  assert.equal(sla016.label, "Sisa 15 menit");
  assert.equal(slaKasus(cari("KS-015"), JAM_AWAL).label, "Sisa 1 j 42 m");
  assert.ok(slaKasus(cari("KS-010"), JAM_AWAL).telat);
  assert.match(slaKasus(cari("KS-010"), JAM_AWAL).label, /^Terlambat /);
});

test("perlu tindakan sekarang: Darurat dulu, lalu terlambat, lalu batas hari ini; tanpa kasus terbatas, dipantau, atau selesai", () => {
  assert.deepEqual(kasusMendesak(KASUS_AWAL, JAM_AWAL).map((c) => c.id), ["KS-016", "KS-010", "KS-015"]);
  // KS-015 sudah ditangani dan tanggapan pertamanya tercatat: batas berikutnya bukan hari ini, jadi keluar.
  const ks015 = terapkan(cari("KS-015"), tugaskan(cari("KS-015"), JAM_AWAL, { utama: "wk:2B", pendukung: ["laras"] }));
  const ditangani = terapkan(ks015, catatRespon(ks015, JAM_AWAL + 2));
  assert.ok(!kasusMendesak([ditangani], JAM_AWAL + 2).length);
  // Laporan Darurat baru langsung masuk bagian paling atas.
  const baru = kasusDariLapor({ ...laporKosong(), jenis: "Lainnya", jawaban: [2, 0, 0, 0, 0, 0] }, "KS-017", JAM_AWAL);
  assert.equal(kasusMendesak([...KASUS_AWAL, baru], JAM_AWAL)[0].id, "KS-016");
  assert.ok(kasusMendesak([baru], JAM_AWAL).some((c) => c.id === "KS-017"));
});

test("alur satu kasus: cek awal -> bagi tugas -> tangani -> pantau -> selesai", () => {
  let c = cari("KS-016");
  c = terapkan(c, tetapkanTingkat(c, JAM_AWAL, "Darurat", c.jawaban));
  assert.equal(c.tahap, "tugas");
  assert.equal(c.tingkat, "Darurat");
  assert.ok(c.waktu.triage);

  const usul = usulanTugas(c.tingkat, c.jawaban, c.kelas);
  const tugas = tugaskan(c, JAM_AWAL + 2, usul);
  assert.equal(tugas.notifikasi.judul, "Anda ditugaskan di KS-016");
  assert.deepEqual(tugas.notifikasi.peran.sort(), ["bk", "kepsek"]);
  assert.deepEqual(tugas.notifikasi.tujuan, { layar: "kasus", aksi: { jenis: "kasus", id: "KS-016" } });
  c = terapkan(c, tugas);
  assert.equal(c.tahap, "tangani");

  const respon = catatRespon(c, JAM_AWAL + 4);
  c = terapkan(c, respon);
  assert.equal(c.tRespon, JAM_AWAL + 4);
  assert.equal(kePantau(c, JAM_AWAL + 6).ubah, undefined, "pemantauan butuh separuh rencana penanganan");

  c = { ...c, rencana: c.rencana.map((p, i) => (i < 3 ? [p[0], p[1], p[2], true] : p)) };
  c = terapkan(c, kePantau(c, JAM_AWAL + 6));
  assert.equal(c.tahap, "pantau");
  c = terapkan(c, tutupKasus(c, JAM_AWAL + 8, { ringkas: "tertangani, anak merasa aman" }));
  assert.equal(c.tahap, "selesai");
  assert.equal(c.riwayat[0][1], "Kasus selesai: tertangani, anak merasa aman.");
});

test("tanggapan pertama KS-015 ikut mencentang butir checklist Bu Rina, dan sebaliknya", () => {
  const ks015 = cari("KS-015");
  const ditugaskan = terapkan(ks015, tugaskan(ks015, JAM_AWAL, { utama: "wk:2B", pendukung: ["laras", "joko"] }));
  assert.deepEqual(tugaskan(ks015, JAM_AWAL, { utama: "wk:2B", pendukung: ["laras"] }).notifikasi.peran.sort(), ["bk", "walas"]);
  assert.deepEqual(catatRespon(ditugaskan, JAM_AWAL + 2).centang, ["ks015-respon"]);

  const awal = kasusAwal({ "ks015-respon": true }).find((c) => c.id === "KS-015");
  assert.equal(awal.tahap, "tangani");
  assert.equal(awal.tRespon, JAM_AWAL);
  assert.equal(kasusAwal({}).find((c) => c.id === "KS-015").tahap, "tugas");
});

test("laporan baru masuk cek awal dengan usulan tingkat dari penilaian awal", () => {
  const lapor = { ...laporKosong(), jenis: "Perundungan fisik", jawaban: [0, 0, 2, 0, 0, 0] };
  const c = kasusDariLapor(lapor, "KS-017", JAM_AWAL);
  assert.equal(c.tahap, "triage");
  assert.equal(c.tingkat, "Tinggi");
  assert.equal(c.tugas, null);
  assert.ok(tugasSaya(c));
  // Tingkat ditetapkan lebih rendah: rencana bawaan ikut tingkat baru selama belum dicentang.
  const turun = terapkan(c, tetapkanTingkat(c, JAM_AWAL + 2, "Sedang", c.jawaban));
  assert.equal(turun.rencana.length, 3);
});

test("teks layar: tanpa tanda pisah panjang, kata terlarang, atau istilah skrining lama", () => {
  const teks = ["./Kasus.jsx", "./kasusData.js", "./Kasus.module.css"].map((p) => readFileSync(new URL(p, import.meta.url), "utf8")).join("\n");
  assert.ok(!teks.includes(String.fromCharCode(0x2014)), "ada em-dash");
  const terlarang = [
    "sangat penting", "perlu dicatat", "pada dasarnya", "sesungguhnya", "tentu saja", "dengan demikian", "merupakan",
    "terdapat", "komprehensif", "holistik", "robust", "seamless", "synergy", "leverage", "utilize", "delve",
    "sesuai tahap", "perlu dipantau", "perlu dukungan", "tanda keamanan", "fokus & energi",
  ];
  for (const k of terlarang) assert.ok(!teks.toLowerCase().includes(k), `kata terlarang: ${k}`);
  // Nama aspek lama ditulis berhuruf kapital; "kartu perasaan" atau "perilaku anak" biasa tetap boleh.
  for (const aspek of ["Perasaan", "Perilaku", "Kepedulian"]) assert.ok(!new RegExp(`\\b${aspek}\\b`).test(teks), `${aspek} sebagai nama aspek`);
  assert.ok(!/(?<!Relasi )Pertemanan/.test(teks), "Pertemanan sebagai nama aspek");
  // Peran sudut pandang yang menerima notifikasi memang ada di prototipe.
  for (const id of ["wk:2B", "laras", "hartini"]) assert.ok(ORANG[orangKasus(id).sudut], `${id}: sudut pandang tidak dikenal`);
});

test("teks tampilan memakai istilah sehari-hari: tanpa triage, SLA, eskalasi, respon, rencana tindak, atau buddy", () => {
  const src = ["./Kasus.jsx", "./kasusData.js"].map((p) => readFileSync(new URL(p, import.meta.url), "utf8"));
  // Teks tampilan = isi string (tanpa id seperti "triage" atau "ks015-respon") dan baris teks JSX
  // (baris tanpa tanda kode, bukan kunci objek). Komentar dan nama variabel tidak ikut diperiksa.
  const literal = src.flatMap((t) => [...t.matchAll(/"([^"\n]*)"|`([^`]*)`/g)].map((m) => m[1] ?? m[2]));
  const barisJsx = src.flatMap((t) => t.split("\n").map((b) => b.trim())).filter((b) => /^[A-Za-z][^=<>{}();"`]*$/.test(b) && !/^w+s*:|,$/.test(b));
  const tampil = [...literal.filter((s) => !/^[a-z0-9:_-]*$/.test(s)), ...barisJsx];
  const lama = [
    /triage/i, /\bSLA\b/, /eskalasi/i, /\brespon\b/i, /rencana tindak/i, /buddy/i, /\bPenugasan\b/, /tutup kasus/i, /kasus ditutup/i,
    /observasi/i, /intervensi/i,
  ];
  for (const t of tampil) for (const r of lama) assert.ok(!r.test(t), `istilah lama ${r} di: ${t}`);
  // Kelima langkah alur tampil dengan label baru.
  assert.deepEqual(
    ["triage", "tugas", "tangani", "pantau", "selesai"].map((id) => TAHAP[id].label),
    ["Cek awal", "Bagi tugas", "Tangani", "Pantau & selesai", "Selesai"],
  );
});

test("gaya layar tanpa garis tepi: tidak ada border pada bentuk, aksen garis, atau cincin inset", () => {
  const gaya = readFileSync(new URL("./Kasus.module.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  // Yang boleh: border: 0, dan garis pemisah 1px antarbaris (border-top) di daftar dan tabel.
  for (const m of gaya.matchAll(/border(-left|-right|-bottom)?\s*:\s*([^;]+);/g)) assert.equal(m[2].trim(), "0", `border${m[1] || ""}: ${m[2]}`);
  for (const m of gaya.matchAll(/border-top\s*:\s*([^;]+);/g)) assert.match(m[1].trim(), /^(0|1px solid var\(--sp-garis-3\))$/, `border-top: ${m[1]}`);
  assert.ok(!/box-shadow\s*:[^;]*inset/.test(gaya), "box-shadow inset");
  assert.ok(!/border-color/.test(gaya), "border-color");
  // Outline hanya untuk cincin fokus keyboard (atau dimatikan untuk elemen yang difokus lewat skrip).
  for (const m of gaya.matchAll(/outline\s*:\s*([^;]+);/g)) assert.match(m[1].trim(), /^(var\(--sp-fokus\)|none)$/, `outline: ${m[1]}`);
});
