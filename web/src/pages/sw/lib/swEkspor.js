// Ekspor Excel tampilan "Semua pegawai" (hanya Human Capital). Berkas dibuat di browser dari
// baris yang sudah lolos RLS dan sedang tampil di layar; tidak ada yang dikirim ke server.
// Memakai exceljs (bukan xlsx seperti importer admin) karena hanya exceljs yang bisa menulis
// warna sel: baris peserta asesmen lanjutan diberi latar ungu muda supaya langsung terlihat.
// exceljs dimuat saat tombol ditekan, jadi tidak ikut muatan awal modul.

import { KOLOM_EKSPOR_PEGAWAI, KOLOM_PESERTA, namaBerkasEkspor } from "./swAturan.js";

/** Warna ARGB, diturunkan dari token --fm-* modul sw. */
export const WARNA_EKSPOR = {
  kepala: "FF342060", // --fm-ungu-tua
  kepalaTeks: "FFFFFFFF",
  peserta: "FFE9E0FA", // --fm-ungu 14% di atas putih, sama dengan latar baris di layar
  pesertaTeks: "FF342060",
};

const JENIS_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Lebar kolom (jumlah karakter) mengikuti isi terpanjang, dibatasi supaya tetap terbaca. */
function lebarKolom(baris, kolom) {
  const terpanjang = baris.reduce((m, b) => Math.max(m, String(b[kolom] ?? "").length), kolom.length);
  return Math.min(Math.max(terpanjang + 2, 6), kolom === "Alasan" ? 48 : 40);
}

function isi(warna) {
  return { type: "pattern", pattern: "solid", fgColor: { argb: warna } };
}

/**
 * Susun buku kerja. Sheet "Daftar pegawai": kepala kolom beku dan bersaringan, baris peserta
 * berlatar ungu muda dengan "Ya" tebal di kolom penanda. Sheet "Keterangan": lembaga, periode,
 * unit, urutan, jumlah, dan legenda warna. `ExcelJS` dioper dari luar supaya bisa diuji di Node.
 */
export function susunBukuKerja(ExcelJS, { baris, lembaga, periode, unitNama, urutan, dibuat = new Date() }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Fammi Intelligence Report";
  wb.created = dibuat;

  const ws = wb.addWorksheet("Daftar pegawai", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = KOLOM_EKSPOR_PEGAWAI.map((k) => ({ header: k, key: k, width: lebarKolom(baris, k) }));

  const kepala = ws.getRow(1);
  kepala.height = 22;
  kepala.eachCell((sel) => {
    sel.font = { bold: true, color: { argb: WARNA_EKSPOR.kepalaTeks } };
    sel.fill = isi(WARNA_EKSPOR.kepala);
    sel.alignment = { vertical: "middle" };
  });

  for (const b of baris) {
    const r = ws.addRow(b);
    r.alignment = { vertical: "top", wrapText: true };
    if (b[KOLOM_PESERTA] !== "Ya") continue;
    for (let i = 1; i <= KOLOM_EKSPOR_PEGAWAI.length; i += 1) r.getCell(i).fill = isi(WARNA_EKSPOR.peserta);
    r.getCell(KOLOM_PESERTA).font = { bold: true, color: { argb: WARNA_EKSPOR.pesertaTeks } };
    r.getCell("Nama").font = { bold: true };
  }
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: KOLOM_EKSPOR_PEGAWAI.length } };

  const nPeserta = baris.filter((b) => b[KOLOM_PESERTA] === "Ya").length;
  const ket = wb.addWorksheet("Keterangan");
  ket.columns = [{ width: 26 }, { width: 84 }];
  ket.addRows([
    ["Lembaga", lembaga || "-"],
    ["Periode", periode || "-"],
    ["Unit", unitNama || "Semua unit"],
    ["Urutan", urutan || "-"],
    ["Jumlah pegawai", baris.length],
    ["Peserta asesmen lanjutan", `${nPeserta} dari ${baris.length} pegawai masuk daftar 200 peserta`],
    ["Diunduh", dibuat.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })],
    ["Catatan", "Berisi nama pegawai. Simpan di tempat yang hanya bisa dibuka tim Human Capital."],
    [],
    ["Legenda", ""],
    ["Baris berwarna ungu muda", "Masuk daftar 200 peserta asesmen lanjutan (kolom \"Peserta asesmen lanjutan\" = Ya)"],
    ["Baris putih", "Tidak masuk daftar 200 peserta"],
  ]);
  ket.getColumn(1).font = { bold: true };
  ket.getCell("A11").fill = isi(WARNA_EKSPOR.peserta);
  ket.getCell("B11").fill = isi(WARNA_EKSPOR.peserta);
  return wb;
}

/** Buat dan unduh berkas di browser. Mengembalikan nama berkas yang diunduh. */
export async function unduhDaftarPegawai({ baris, lembaga, periodeId, periode, unitNama, urutan }) {
  const modul = await import("exceljs");
  const ExcelJS = modul.default ?? modul;
  const wb = susunBukuKerja(ExcelJS, { baris, lembaga, periode, unitNama, urutan });
  const buffer = await wb.xlsx.writeBuffer();
  const nama = namaBerkasEkspor({ lembaga, unitNama, periodeId });
  const url = URL.createObjectURL(new Blob([buffer], { type: JENIS_XLSX }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nama;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return nama;
}
