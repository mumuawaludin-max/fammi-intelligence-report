/**
 * Pantau sesudah skrining: tiap aspek yang belum Baik punya satu pertanyaan cek mingguan, supaya
 * terlihat apakah kondisi anak membaik sesudah tindak lanjut dijalankan (delta skor dari skrining).
 * Skor 0-10 seperti HEART: makin rendah makin baik. Titik pertama selalu hasil skrining.
 *
 * Prototipe: cek mingguan hanya menggeser skor contoh (jawaban "jarang" turun 1, "kadang" tetap,
 * "sering" naik 1) untuk memperlihatkan konsepnya. Skor sungguhan dihitung tim Fammi di hulu.
 */
import { cariAspek, statusDariSkor } from "./heart.js";

/** Pilihan jawaban cek mingguan, urut dari yang paling baik. */
export const JAWABAN_PANTAU = ["Jarang", "Kadang", "Sering"];

/** Perkembangan Raka (orang tua mengisi cek mingguan). */
export const PANTAU_RAKA = {
  relasi: {
    tanya: "Minggu ini, seberapa sering Raka bermain sendiri atau diganggu teman?",
    riwayat: [
      { label: "Screening", tanggal: "3 Nov", skor: 7 },
      { label: "Minggu 1", tanggal: "10 Nov", skor: 6 },
      { label: "Minggu 2", tanggal: "17 Nov", skor: 5 },
    ],
  },
  emosional: {
    tanya: "Minggu ini, seberapa sering Raka mengeluh sakit perut atau tampak cemas?",
    riwayat: [
      { label: "Screening", tanggal: "3 Nov", skor: 6 },
      { label: "Minggu 1", tanggal: "10 Nov", skor: 6 },
      { label: "Minggu 2", tanggal: "17 Nov", skor: 5 },
    ],
  },
};

/** Titik baru dari jawaban cek mingguan (lihat catatan prototipe di atas). */
export function titikBaru(riwayat, jawaban) {
  const akhir = riwayat[riwayat.length - 1].skor;
  const skor = Math.min(10, Math.max(0, akhir + (jawaban - 1)));
  return { label: `Minggu ${riwayat.length}`, tanggal: "Minggu ini", skor };
}

/**
 * Ringkasan perkembangan satu aspek: skor awal, skor terakhir, selisih (positif = membaik), status
 * sekarang menurut ambang aspek, dan arah: "membaik", "tetap", atau "memburuk".
 */
export function perkembangan(idAspek, riwayat) {
  const aspek = cariAspek(idAspek);
  const awal = riwayat[0].skor;
  const akhir = riwayat[riwayat.length - 1].skor;
  const selisih = awal - akhir;
  return {
    awal,
    akhir,
    selisih,
    arah: selisih > 0 ? "membaik" : selisih < 0 ? "memburuk" : "tetap",
    statusAwal: statusDariSkor(aspek, awal),
    statusSekarang: statusDariSkor(aspek, akhir),
  };
}
