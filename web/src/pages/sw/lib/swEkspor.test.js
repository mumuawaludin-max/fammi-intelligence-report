// Uji tampilan "Semua pegawai" dan ekspor Excel-nya. Jalankan: npm test (dari folder web/).
import { test } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import {
  KOLOM_EKSPOR_PEGAWAI, KOLOM_PESERTA, barisEksporPegawai, labelPeriode, namaBerkasEkspor,
  opsiUnitPegawai, saringPegawai, urutPeserta,
} from "./swAturan.js";
import { WARNA_EKSPOR, susunBukuKerja } from "./swEkspor.js";

const UNIT = [
  { id: "u1", nama: "Asrama Athirah Baruga" },
  { id: "u2", nama: "SD Islam Athirah Bone" },
  { id: "u3", nama: "Unit Tanpa Pengisi" },
];
const NAMA_UNIT = Object.fromEntries(UNIT.map((u) => [u.id, u.nama]));

const PEGAWAI = [
  {
    id: "p1", nama: "Almar'Atu Sholihah, S.Ag", unitId: "u1", jabatan: "Guru Pembina Asrama", jenjang: "SMP",
    permintaan: "mungkin", pola: "tekanan", pengamatan: { indikator: [] }, peserta: { jalur: "kuota" }, spa: 71.2,
  },
  {
    id: "p2", nama: "Ani Dg. Ngintang", unitId: "u1", jabatan: "Kerumahtanggaan (Dapur)", jenjang: "Boarding",
    permintaan: "ya", pola: "selaras", pengamatan: { indikator: [] }, peserta: { jalur: "penanda" }, spa: 55,
  },
  {
    id: "p3", nama: "Budi", unitId: "u2", jabatan: "Guru", jenjang: null,
    permintaan: "belum", pola: null, pengamatan: null, peserta: null, spa: 12,
  },
];

test("saringPegawai memuat peserta maupun bukan, dan satu saringan unit", () => {
  assert.equal(saringPegawai(PEGAWAI).length, 3, "tanpa saringan: semua pegawai");
  assert.equal(saringPegawai(PEGAWAI, "").length, 3);
  assert.deepEqual(saringPegawai(PEGAWAI, "u1").map((o) => o.id), ["p1", "p2"]);
  assert.deepEqual(saringPegawai(PEGAWAI, "u2").map((o) => o.id), ["p3"], "bukan peserta tetap tampil");
  assert.deepEqual(saringPegawai(PEGAWAI, "tidak-ada"), []);
  assert.deepEqual(saringPegawai(null, "u1"), []);
});

test("opsi unit memuat jumlah pegawai, urut nama, dan melewatkan unit tanpa pengisi", () => {
  assert.deepEqual(opsiUnitPegawai(UNIT, PEGAWAI), [
    { nilai: "u1", label: "Asrama Athirah Baruga (2)" },
    { nilai: "u2", label: "SD Islam Athirah Bone (1)" },
  ]);
});

test("baris ekspor memuat kolom nama unit dan label yang sama dengan layar", () => {
  const baris = barisEksporPegawai(PEGAWAI, { namaUnit: NAMA_UNIT, asumsi: {} });
  assert.equal(baris.length, 3);
  for (const b of baris) assert.deepEqual(Object.keys(b), KOLOM_EKSPOR_PEGAWAI);
  assert.deepEqual(baris[0], {
    No: 1,
    Nama: "Almar'Atu Sholihah, S.Ag",
    [KOLOM_PESERTA]: "Ya",
    Unit: "Asrama Athirah Baruga",
    Jabatan: "Guru Pembina Asrama",
    Jenjang: "SMP",
    Alasan: "Masih ragu, Beban belum terlihat atasan, Perwakilan unit",
    "Pandangan atasan": "Beban belum terlihat atasan",
    "Cara masuk": "Kuota per unit",
    "Sumber data": "Diri + atasan",
  });
  assert.equal(baris[1].Alasan, "Minta dibantu");
  assert.equal(baris[2].Jenjang, "-");
  assert.equal(baris[2].Alasan, "");
  assert.equal(baris[2]["Pandangan atasan"], "Belum dinilai atasan");
  assert.equal(baris[2]["Cara masuk"], "-");
  assert.equal(baris[2][KOLOM_PESERTA], "Tidak");
  assert.equal(baris[2]["Sumber data"], "Isian diri saja");
});

test("ekspor tidak pernah memuat skor prioritas", () => {
  const baris = barisEksporPegawai(PEGAWAI, { namaUnit: NAMA_UNIT });
  for (const b of baris) {
    assert.ok(!("spa" in b) && !("Skor prioritas" in b));
    assert.ok(!Object.values(b).includes(71.2));
  }
});

test("baris ekspor mengikuti saringan dan urutan layar, nomor mulai dari 1", () => {
  const tampil = urutPeserta(saringPegawai(PEGAWAI, "u1"), { kunci: "nama", arah: "turun", namaUnit: NAMA_UNIT });
  const baris = barisEksporPegawai(tampil, { namaUnit: NAMA_UNIT });
  assert.deepEqual(baris.map((b) => [b.No, b.Nama]), [[1, "Ani Dg. Ngintang"], [2, "Almar'Atu Sholihah, S.Ag"]]);
  assert.ok(baris.every((b) => b.Unit === "Asrama Athirah Baruga"));
});

test("nama berkas memuat lembaga, unit atau semua unit, dan periode", () => {
  assert.equal(
    namaBerkasEkspor({ lembaga: "Yayasan Pendidikan Athirah", unitNama: "Asrama Athirah Baruga", periodeId: "2026-09" }),
    "daftar-pegawai_yayasan-pendidikan-athirah_asrama-athirah-baruga_2026-09.xlsx",
  );
  assert.equal(
    namaBerkasEkspor({ lembaga: "Yayasan Pendidikan Athirah", unitNama: "", periodeId: "2026-09" }),
    "daftar-pegawai_yayasan-pendidikan-athirah_semua-unit_2026-09.xlsx",
  );
  assert.equal(namaBerkasEkspor({ unitNama: "SMP (Putra/Putri) É" }), "daftar-pegawai_smp-putra-putri-e.xlsx");
});

test("labelPeriode menulis nama bulan", () => {
  assert.equal(labelPeriode("2026-09"), "September 2026");
  assert.equal(labelPeriode(""), "");
});

test("urutan prioritas: peserta di atas, lalu skor prioritas tertinggi, lalu unit dan nama", () => {
  const daftar = [
    { id: "a", nama: "Ani", unitId: "u1", peserta: null, spa: 90 },
    { id: "b", nama: "Budi", unitId: "u1", peserta: { jalur: "kuota" }, spa: 40 },
    { id: "c", nama: "Citra", unitId: "u1", peserta: { jalur: "penanda" }, spa: 75 },
    { id: "d", nama: "Dedi", unitId: "u1", peserta: null, spa: 20 },
    { id: "e", nama: "Eka", unitId: "u1", peserta: { jalur: "penanda" }, spa: 75 },
    { id: "f", nama: "Fajar", unitId: "u1", peserta: null },
  ];
  const urut = (arah) => urutPeserta(daftar, { kunci: "prioritas", arah, namaUnit: NAMA_UNIT }).map((o) => o.id);
  assert.deepEqual(urut("naik"), ["c", "e", "b", "a", "d", "f"], "seri skor diputus nama");
  assert.deepEqual(urut("turun").slice(0, 3), ["f", "d", "a"], "arah turun membalik");
});

test("pada satu unit, semua peserta unit itu ada di atas dan jumlahnya cocok", () => {
  const tampil = urutPeserta(saringPegawai(PEGAWAI, "u1"), { kunci: "prioritas", namaUnit: NAMA_UNIT });
  const baris = barisEksporPegawai(tampil, { namaUnit: NAMA_UNIT });
  const tanda = baris.map((b) => b[KOLOM_PESERTA]);
  const nYa = tanda.filter((t) => t === "Ya").length;
  assert.equal(nYa, tampil.filter((o) => o.peserta).length);
  assert.ok(tanda.slice(0, nYa).every((t) => t === "Ya") && tanda.slice(nYa).every((t) => t === "Tidak"));
  assert.deepEqual(baris.map((b) => b.No), baris.map((_, i) => i + 1));
});

/** Tulis buku kerja ke buffer lalu baca lagi, seperti membuka berkas yang diunduh. */
async function bacaBalik(wb) {
  const buffer = await wb.xlsx.writeBuffer();
  const balik = new ExcelJS.Workbook();
  await balik.xlsx.load(buffer);
  return balik;
}

const nilaiBaris = (ws, n) => ws.getRow(n).values.slice(1);
const warnaLatar = (sel) => sel.fill?.fgColor?.argb;

test("buku kerja Excel: kolom, isi, kepala beku, saringan otomatis", async () => {
  const PEGAWAI_U1_PLUS = [...PEGAWAI, { ...PEGAWAI[2], id: "p4", nama: "Cici", unitId: "u1" }];
  const tampil = urutPeserta(saringPegawai(PEGAWAI_U1_PLUS, "u1"), { kunci: "prioritas", namaUnit: NAMA_UNIT });
  const baris = barisEksporPegawai(tampil, { namaUnit: NAMA_UNIT });
  const balik = await bacaBalik(susunBukuKerja(ExcelJS, {
    baris, lembaga: "Yayasan Pendidikan Athirah", periode: "September 2026", unitNama: "Asrama Athirah Baruga",
    urutan: "Prioritas (peserta di atas)", dibuat: new Date("2026-09-23T10:00:00+08:00"),
  }));
  assert.deepEqual(balik.worksheets.map((w) => w.name), ["Daftar pegawai", "Keterangan"]);

  const ws = balik.getWorksheet("Daftar pegawai");
  assert.deepEqual(nilaiBaris(ws, 1), KOLOM_EKSPOR_PEGAWAI, "kolom Unit dan penanda peserta ada di berkas");
  assert.equal(ws.rowCount, baris.length + 1);
  baris.forEach((b, i) => assert.deepEqual(nilaiBaris(ws, i + 2), KOLOM_EKSPOR_PEGAWAI.map((k) => b[k])));
  assert.equal(ws.views[0].state, "frozen");
  assert.equal(ws.views[0].ySplit, 1);
  assert.ok(ws.autoFilter, "saringan otomatis terpasang");
  assert.equal(warnaLatar(ws.getCell("A1")), WARNA_EKSPOR.kepala);
});

test("buku kerja Excel: baris peserta berwarna, bukan peserta putih", async () => {
  const tampil = urutPeserta(saringPegawai(PEGAWAI, ""), { kunci: "prioritas", namaUnit: NAMA_UNIT });
  const baris = barisEksporPegawai(tampil, { namaUnit: NAMA_UNIT });
  const ws = (await bacaBalik(susunBukuKerja(ExcelJS, { baris, lembaga: "X" }))).getWorksheet("Daftar pegawai");
  const kolomPeserta = KOLOM_EKSPOR_PEGAWAI.indexOf(KOLOM_PESERTA) + 1;
  baris.forEach((b, i) => {
    const r = ws.getRow(i + 2);
    for (let c = 1; c <= KOLOM_EKSPOR_PEGAWAI.length; c += 1) {
      const warna = warnaLatar(r.getCell(c));
      if (b[KOLOM_PESERTA] === "Ya") assert.equal(warna, WARNA_EKSPOR.peserta, `${b.Nama} kolom ${c}`);
      else assert.equal(warna, undefined, `${b.Nama} kolom ${c}`);
    }
    assert.equal(Boolean(r.getCell(kolomPeserta).font?.bold), b[KOLOM_PESERTA] === "Ya");
  });
});

test("buku kerja Excel: keterangan memuat unit, urutan, jumlah peserta, dan legenda warna", async () => {
  const baris = barisEksporPegawai(saringPegawai(PEGAWAI, "u1"), { namaUnit: NAMA_UNIT });
  const balik = await bacaBalik(susunBukuKerja(ExcelJS, {
    baris, lembaga: "Yayasan Pendidikan Athirah", periode: "September 2026", unitNama: "Asrama Athirah Baruga",
    urutan: "Prioritas (peserta di atas)",
  }));
  const ket = balik.getWorksheet("Keterangan");
  const peta = {};
  ket.eachRow((r) => { peta[r.getCell(1).value] = r.getCell(2).value; });
  assert.equal(peta.Unit, "Asrama Athirah Baruga");
  assert.equal(peta.Urutan, "Prioritas (peserta di atas)");
  assert.equal(peta["Jumlah pegawai"], 2);
  assert.equal(peta["Peserta asesmen lanjutan"], "2 dari 2 pegawai masuk daftar 200 peserta");
  let barisLegenda = null;
  ket.eachRow((r, n) => { if (r.getCell(1).value === "Baris berwarna ungu muda") barisLegenda = n; });
  assert.equal(warnaLatar(ket.getCell(`A${barisLegenda}`)), WARNA_EKSPOR.peserta, "contoh warna di legenda");
});

test("buku kerja tanpa baris tetap valid dan berkepala kolom", async () => {
  const balik = await bacaBalik(susunBukuKerja(ExcelJS, { baris: [], lembaga: "X" }));
  assert.deepEqual(nilaiBaris(balik.getWorksheet("Daftar pegawai"), 1), KOLOM_EKSPOR_PEGAWAI);
  const peta = {};
  balik.getWorksheet("Keterangan").eachRow((r) => { peta[r.getCell(1).value] = r.getCell(2).value; });
  assert.equal(peta.Unit, "Semua unit");
});
