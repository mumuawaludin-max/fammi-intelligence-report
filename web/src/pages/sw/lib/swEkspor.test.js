// Uji tampilan "Semua pegawai" dan ekspor Excel-nya. Jalankan: npm test (dari folder web/).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import {
  KOLOM_EKSPOR_PEGAWAI, LABEL_BUKAN_PESERTA, barisEksporPegawai, labelPeriode, namaBerkasEkspor,
  opsiUnitPegawai, saringPegawai, urutPeserta,
} from "./swAturan.js";
import { susunBukuKerja } from "./swEkspor.js";

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
  assert.equal(baris[2]["Cara masuk"], LABEL_BUKAN_PESERTA);
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

test("buku kerja Excel bisa dibaca balik dengan isi dan kolom yang sama", () => {
  const baris = barisEksporPegawai(saringPegawai(PEGAWAI, "u1"), { namaUnit: NAMA_UNIT });
  const wb = susunBukuKerja(XLSX, {
    baris, lembaga: "Yayasan Pendidikan Athirah", periode: "September 2026", unitNama: "Asrama Athirah Baruga",
    dibuat: new Date("2026-09-23T10:00:00+08:00"),
  });
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const balik = XLSX.read(buffer, { type: "buffer" });
  assert.deepEqual(balik.SheetNames, ["Daftar pegawai", "Keterangan"]);

  const lembar = balik.Sheets["Daftar pegawai"];
  const kepala = XLSX.utils.sheet_to_json(lembar, { header: 1 })[0];
  assert.deepEqual(kepala, KOLOM_EKSPOR_PEGAWAI, "kolom Unit ada di berkas");
  assert.deepEqual(XLSX.utils.sheet_to_json(lembar), baris);
  assert.equal(lembar["!autofilter"]?.ref, "A1:I3");

  const ket = Object.fromEntries(XLSX.utils.sheet_to_json(balik.Sheets.Keterangan, { header: 1 }));
  assert.equal(ket.Unit, "Asrama Athirah Baruga");
  assert.equal(ket["Jumlah pegawai"], 2);
  assert.equal(ket.Periode, "September 2026");
});

test("buku kerja tanpa baris tetap valid dan berkepala kolom", () => {
  const wb = susunBukuKerja(XLSX, { baris: [], lembaga: "X" });
  const balik = XLSX.read(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }), { type: "buffer" });
  assert.deepEqual(XLSX.utils.sheet_to_json(balik.Sheets["Daftar pegawai"], { header: 1 })[0], KOLOM_EKSPOR_PEGAWAI);
  const ket = Object.fromEntries(XLSX.utils.sheet_to_json(balik.Sheets.Keterangan, { header: 1 }));
  assert.equal(ket.Unit, "Semua unit");
});
