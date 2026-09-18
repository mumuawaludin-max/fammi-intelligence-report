// Uji aturan penyajian modul Screening Awal Wellbeing. Jalankan: npm test (dari folder web/).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bandingTigaLapis, bolehLihat, hitungAlasan, kalimatTanpaPeserta, kalimatTigaLapis, kategoriKondisi, penjelasNol,
  saringPeserta, saringUnitTampil, sebaranKategori, siapkanDataUntukPeran, susunAlasan,
  jumlahUnitKecil, unitBolehTampil, urutPeserta,
} from "./swAturan.js";
import { ALASAN, KATEGORI_BAWAAN } from "./swMeta.js";

const ASUMSI = { minPengisiUnit: 10 };

// ── Ambang penyajian unit ──

test("yayasan, Human Capital, dan kepala unit melihat unit kecil", () => {
  const kecil = { id: "u1", nPengisi: 3 };
  for (const peran of ["yayasan", "hc", "kepalaUnit"]) {
    assert.equal(unitBolehTampil(kecil, peran, ASUMSI), true, peran);
  }
});

test("ambang hanya berlaku untuk pembanding unit di laporan pegawai", () => {
  assert.equal(unitBolehTampil({ id: "u1", nPengisi: 9 }, "pegawai", ASUMSI), false);
  assert.equal(unitBolehTampil({ id: "u2", nPengisi: 10 }, "pegawai", ASUMSI), true);
});

test("ambang mengikuti asumsi dan unit kecil dihitung untuk catatan", () => {
  const units = [{ id: "a", nPengisi: 4 }, { id: "b", nPengisi: 6 }, { id: "c", nPengisi: 40 }];
  assert.deepEqual(saringUnitTampil(units, "pegawai", { minPengisiUnit: 5 }).map((u) => u.id), ["b", "c"]);
  assert.deepEqual(saringUnitTampil(units, "hc", { minPengisiUnit: 5 }).map((u) => u.id), ["a", "b", "c"]);
  assert.equal(jumlahUnitKecil(units, { minPengisiUnit: 5 }), 1);
  assert.equal(unitBolehTampil(null, "hc", ASUMSI), false);
});

test("siapkanDataUntukPeran membuang nama untuk yayasan dan kepala unit, unit kecil tetap ikut", () => {
  const dataset = {
    asumsi: ASUMSI,
    lembaga: { indeks: 70, skor: {}, kondisi: {}, kebutuhan: {}, nPengisi: 50, peserta: { total: 3 } },
    unit: [
      { id: "besar", nPengisi: 30, pengamatan: { pimpinan: ["Pak A"], qc: [{ pimpinan: "Pak A" }] } },
      { id: "kecil", nPengisi: 5, pengamatan: null },
    ],
    individu: [{ id: "p1", nama: "Ani", unitId: "besar" }, { id: "p2", nama: "Budi", unitId: "kecil" }],
    tema: { silangMenguras: { tema: ["x"], baris: [{ unitId: "besar" }, { unitId: "kecil" }] } },
    ringkasanPimpinan: [{ judul: "x", isi: [] }],
  };
  const y = siapkanDataUntukPeran(dataset, { peran: "yayasan" });
  assert.equal(y.individu.length, 0);
  assert.deepEqual(y.unit.map((u) => u.id), ["besar", "kecil"], "yayasan melihat semua unit");
  assert.equal(y.unit[0].pengamatan.qc, undefined, "kendali mutu hanya untuk Human Capital");
  assert.deepEqual(y.unit[0].pengamatan.pimpinan, ["Pak A"]);
  assert.deepEqual(y.tema.silangMenguras.baris.map((b) => b.unitId), ["besar", "kecil"]);

  const pimpinan = siapkanDataUntukPeran(dataset, { peran: "kepalaUnit", unitId: "kecil", unitIds: ["besar", "kecil"] });
  assert.deepEqual(pimpinan.unit.map((u) => u.id), ["besar", "kecil"], "pimpinan melihat semua unit binaan");
  assert.equal(pimpinan.unit[0].pengamatan.pimpinan, undefined, "tanpa nama atasan");
  assert.equal(pimpinan.individu.length, 0);

  const k = siapkanDataUntukPeran(dataset, { peran: "kepalaUnit", unitId: "kecil" });
  assert.deepEqual(k.unit.map((u) => u.id), ["kecil"], "kepala unit melihat unitnya walau kecil");
  assert.equal(k.individu.length, 0);

  const p = siapkanDataUntukPeran(dataset, { peran: "pegawai", individuId: "p2" });
  assert.deepEqual(p.individu.map((o) => o.id), ["p2"]);
  assert.equal(p.unit.length, 0, "pembanding unit kecil tidak dikirim ke pegawai");
  assert.equal(p.lembaga.peserta, undefined);

  const s = siapkanDataUntukPeran(dataset, { peran: "hc" });
  assert.equal(s.individu.length, 2);
  assert.equal(s.unit.length, 2);
});

test("hak lihat: nama dan ekspor hanya Human Capital, Tab 5 tidak untuk kepala unit", () => {
  assert.equal(bolehLihat("hc", "daftar.nama"), true);
  assert.equal(bolehLihat("yayasan", "daftar.nama"), false);
  assert.equal(bolehLihat("hc", "daftar.ekspor"), false, "ekspor CSV sengaja tidak ada");
  assert.equal(bolehLihat("yayasan", "tab.pimpinan"), true);
  assert.equal(bolehLihat("kepalaUnit", "tab.pimpinan"), false);
  assert.equal(bolehLihat("pegawai", "tab.ringkasan"), false);
  assert.equal(bolehLihat("pegawai", "tab.profil"), true);
  assert.equal(bolehLihat("yayasan", "pimpinan.qc"), false);
});

// ── Lencana alasan ──

const dasar = {
  permintaan: "belum", pengamatan: null, skor: { fungsi: 60 }, kondisi: 4, gapHarapan: 0, pola: null, peserta: { jalur: "penanda" },
};

test("susunAlasan mengembalikan lebih dari satu alasan dengan urutan tetap", () => {
  const orang = {
    ...dasar,
    permintaan: "ya",
    pengamatan: { indikator: ["K2", "K15"] },
    skor: { fungsi: 18.8 },
    kondisi: 2,
    gapHarapan: 1,
    pola: "tekanan",
    peserta: { jalur: "kuota" },
  };
  assert.deepEqual(susunAlasan(orang, {}), ["minta", "atasan", "fungsi", "datar", "tekanan", "wakil"]);
});

test("susunAlasan: ragu dan minta saling eksklusif karena berasal dari satu jawaban", () => {
  assert.deepEqual(susunAlasan({ ...dasar, permintaan: "mungkin" }, {}), ["ragu"]);
  assert.deepEqual(susunAlasan({ ...dasar }, {}), []);
  assert.deepEqual(susunAlasan(null, {}), []);
});

test("susunAlasan memakai ambang Fungsi dan harapan datar dari asumsi", () => {
  const orang = { ...dasar, skor: { fungsi: 25 }, kondisi: 3, gapHarapan: 0 };
  assert.deepEqual(susunAlasan(orang, { ambangFungsi: 25 }), [], "25 tidak di bawah 25");
  assert.deepEqual(susunAlasan(orang, { ambangFungsi: 30 }), ["fungsi"]);
  assert.deepEqual(susunAlasan(orang, { harapanDatar: { kondisiMaks: 3, gapMaks: 0 } }), ["datar"]);
});

test("susunAlasan: angka kondisi 5 tidak pernah dihitung harapan datar", () => {
  const orang = { ...dasar, kondisi: 5, gapHarapan: 0 };
  assert.deepEqual(susunAlasan(orang, {}), []);
});

test("hitungAlasan menghitung orang per alasan, alasan nol tetap ada, total boleh melebihi peserta", () => {
  const daftar = [
    { ...dasar, permintaan: "ya", pola: "tekanan" },
    { ...dasar, permintaan: "mungkin", peserta: { jalur: "kuota" } },
  ];
  const hasil = hitungAlasan(daftar, {});
  assert.deepEqual(Object.keys(hasil), ALASAN.map((a) => a.kunci));
  assert.equal(hasil.minta, 1);
  assert.equal(hasil.tekanan, 1);
  assert.equal(hasil.fungsi, 0);
  const total = Object.values(hasil).reduce((a, b) => a + b, 0);
  assert.ok(total > daftar.length);
});

test("penjelasNol memberi kalimat untuk setiap alasan dan menyebut ambang Fungsi", () => {
  for (const a of ALASAN) assert.ok(penjelasNol(a.kunci, {}).length > 10, a.kunci);
  assert.match(penjelasNol("fungsi", { asumsi: { ambangFungsi: 25 } }), /di bawah 25/);
});

test("unit tanpa peserta dijelaskan, bukan dibiarkan nol", () => {
  const unit = { nPengisi: 3, kuotaPeserta: 0 };
  assert.match(kalimatTanpaPeserta(unit), /3 pengisi/);
  assert.match(kalimatTanpaPeserta(unit), /tidak mendapat kursi perwakilan/);
  assert.doesNotMatch(kalimatTanpaPeserta({ nPengisi: 20, kuotaPeserta: 2 }), /kursi/);
  assert.equal(penjelasNol("wakil", { unit }), "Unit ini tidak mendapat kursi perwakilan.");
  assert.equal(penjelasNol("wakil", {}), "Semua unit sudah terwakili.");
});

// ── Perbandingan tiga lapis ──

const diri = { skor: { energi: 40, fungsi: 70, beban: 30, dukungan: 80, makna: 90 }, indeks: 62 };
const unit = { skor: { energi: 60, fungsi: 70, beban: 55, dukungan: 70, makna: 85 }, indeks: 68 };
const lembaga = { skor: { energi: 66.9, fungsi: 72.2, beban: 63.3, dukungan: 74.4, makna: 85.8 }, indeks: 62.4 };

test("bandingTigaLapis menghasilkan enam baris dengan selisih terhadap unit dan lembaga", () => {
  const baris = bandingTigaLapis(diri, unit, lembaga);
  assert.equal(baris.length, 6);
  assert.deepEqual(baris.map((b) => b.kunci), ["energi", "fungsi", "beban", "dukungan", "makna", "indeks"]);
  const beban = baris.find((b) => b.kunci === "beban");
  assert.equal(beban.selisihUnit, -25);
  assert.equal(beban.selisihLembaga, -33.3);
  assert.equal(baris.at(-1).diri, 62);
});

test("kalimatTigaLapis menyebut subskala paling jauh di bawah dan di atas unit tanpa kata peringkat", () => {
  const [bawah, atas, indeks] = kalimatTigaLapis(bandingTigaLapis(diri, unit, lembaga));
  assert.match(bawah, /Beban dan Kendali/);
  assert.match(atas, /Dukungan/);
  assert.match(indeks, /di bawah unit/);
  assert.match(indeks, /setara dengan lembaga/);
  for (const k of [bawah, atas, indeks]) assert.doesNotMatch(k, /peringkat|persentil/i);
});

test("kalimatTigaLapis membandingkan dengan lembaga kalau lapis unit kosong", () => {
  const baris = bandingTigaLapis(diri, null, lembaga);
  assert.ok(baris.every((b) => b.unit === null));
  const [bawah, , indeks] = kalimatTigaLapis(baris);
  assert.match(bawah, /rata-rata lembaga/);
  assert.doesNotMatch(indeks, /unit/);
});

test("kalimatTigaLapis menulis tidak ada bila tidak ada subskala di bawah pembanding", () => {
  const tinggi = { skor: { energi: 99, fungsi: 99, beban: 99, dukungan: 99, makna: 99 }, indeks: 99 };
  const [bawah] = kalimatTigaLapis(bandingTigaLapis(tinggi, unit, lembaga));
  assert.match(bawah, /Tidak ada aspek di bawah/);
});

// ── Kategori, daftar, dan kata terlarang ──

test("kategoriKondisi mengikuti lima batas, termasuk angka pecahan di antara batas", () => {
  assert.equal(kategoriKondisi(0).kunci, "sangat_kurang");
  assert.equal(kategoriKondisi(24.9).kunci, "sangat_kurang");
  assert.equal(kategoriKondisi(25).kunci, "kurang");
  assert.equal(kategoriKondisi(58.6).kunci, "cukup");
  assert.equal(kategoriKondisi(59).kunci, "menopang");
  assert.equal(kategoriKondisi(75).kunci, "sangat_menopang");
  assert.equal(kategoriKondisi(null), null);
  const s = sebaranKategori({ "10": 1, "50": 2, "80": 3 });
  assert.deepEqual(s, { sangat_kurang: 1, kurang: 0, cukup: 2, menopang: 0, sangat_menopang: 3 });
});

test("label kategori dan alasan tidak memakai kata terlarang", () => {
  const terlarang = /kesehatan mental|gangguan|\bsehat\b|tidak sehat|waspada/i;
  for (const k of KATEGORI_BAWAAN) assert.doesNotMatch(k.label, terlarang);
  for (const a of ALASAN) assert.doesNotMatch(`${a.label} ${a.penjelas}`, terlarang);
});

test("urutan bawaan daftar adalah unit lalu nama, bukan skor prioritas", () => {
  const daftar = [
    { nama: "Zaki", unitId: "a", spa: 90 },
    { nama: "Ani", unitId: "b", spa: 10 },
    { nama: "Budi", unitId: "a", spa: 50 },
  ];
  const namaUnit = { a: "SD", b: "SMA" };
  assert.deepEqual(urutPeserta(daftar, { namaUnit }).map((o) => o.nama), ["Budi", "Zaki", "Ani"]);
  assert.deepEqual(urutPeserta(daftar, { kunci: "spa", arah: "turun", namaUnit }).map((o) => o.nama), ["Zaki", "Budi", "Ani"]);
});

test("saringPeserta menggabungkan beberapa saringan", () => {
  const daftar = [
    { ...dasar, nama: "A", unitId: "u1", jenjang: "SD", permintaan: "ya", pengamatan: { indikator: [] } },
    { ...dasar, nama: "B", unitId: "u1", jenjang: "SD", permintaan: "ya" },
    { ...dasar, nama: "C", unitId: "u2", jenjang: null, permintaan: "ya" },
  ];
  const units = [{ id: "u1", kelompok: "sekolah" }, { id: "u2", kelompok: "layanan" }];
  assert.deepEqual(saringPeserta(daftar, { alasan: "minta", kelompok: "sekolah", status: "diri" }, { units }).map((o) => o.nama), ["B"]);
  assert.deepEqual(saringPeserta(daftar, { jenjang: "Tanpa jenjang" }, { units }).map((o) => o.nama), ["C"]);
});
