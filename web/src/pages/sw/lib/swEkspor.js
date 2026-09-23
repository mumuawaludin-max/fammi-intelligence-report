// Ekspor Excel tampilan "Semua pegawai" (hanya Human Capital). Berkas dibuat di browser dari
// baris yang sudah lolos RLS dan sedang tampil di layar; tidak ada yang dikirim ke server.
// Pustaka xlsx yang sama dengan importer Admin Fammi.

import * as XLSX from "xlsx";
import { KOLOM_EKSPOR_PEGAWAI, namaBerkasEkspor } from "./swAturan.js";

/** Lebar kolom (jumlah karakter) mengikuti isi terpanjang, dibatasi supaya tetap terbaca. */
function lebarKolom(baris, kolom) {
  return kolom.map((k) => {
    const terpanjang = baris.reduce((m, b) => Math.max(m, String(b[k] ?? "").length), k.length);
    return { wch: Math.min(Math.max(terpanjang + 2, 6), 60) };
  });
}

/**
 * Susun buku kerja: sheet "Daftar pegawai" berisi baris, sheet "Keterangan" berisi lembaga,
 * periode, saringan unit, dan jumlah baris. `XLSX` dioper dari luar supaya bisa diuji di Node.
 */
export function susunBukuKerja(XLSX, { baris, lembaga, periode, unitNama, dibuat = new Date() }) {
  const ws = XLSX.utils.json_to_sheet(baris, { header: KOLOM_EKSPOR_PEGAWAI });
  ws["!cols"] = lebarKolom(baris, KOLOM_EKSPOR_PEGAWAI);
  if (ws["!ref"]) ws["!autofilter"] = { ref: ws["!ref"] };

  const keterangan = XLSX.utils.aoa_to_sheet([
    ["Lembaga", lembaga || "-"],
    ["Periode", periode || "-"],
    ["Unit", unitNama || "Semua unit"],
    ["Jumlah pegawai", baris.length],
    ["Diunduh", dibuat.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })],
    ["Catatan", "Berisi nama pegawai. Simpan di tempat yang hanya bisa dibuka tim Human Capital."],
  ]);
  keterangan["!cols"] = [{ wch: 16 }, { wch: 80 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Daftar pegawai");
  XLSX.utils.book_append_sheet(wb, keterangan, "Keterangan");
  return wb;
}

/** Buat dan unduh berkas di browser. Mengembalikan nama berkas yang diunduh. */
export function unduhDaftarPegawai({ baris, lembaga, periodeId, periode, unitNama }) {
  const wb = susunBukuKerja(XLSX, { baris, lembaga, periode, unitNama });
  const nama = namaBerkasEkspor({ lembaga, unitNama, periodeId });
  XLSX.writeFile(wb, nama);
  return nama;
}
