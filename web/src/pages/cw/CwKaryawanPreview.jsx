import CwKaryawanPage from "./CwKaryawanPage";

/**
 * CwKaryawanPreview -- preview lepas-login untuk shell mandiri Karyawan (CwKaryawanPage),
 * dibuka lewat http://localhost:5173/?preview=cw-karyawan
 *
 * Sejak CwKaryawanPage membaca data asli (useCwIndividu), halaman ini cuma memperlihatkan
 * kerangka shell-nya: isinya akan berbunyi "belum ditautkan ke responden manapun" karena sesi
 * di sini palsu dan tidak punya sc_responden_id. Untuk mengecek TAMPILAN laporannya, pakai
 * ?preview=cw-individu yang merender data contoh langsung.
 *
 * Dirender POLOS tanpa pembungkus apa pun (beda dari preview CW lain) karena CwKaryawanPage
 * sendiri sudah position:fixed ambil-alih seluruh viewport -- pola sama dengan SiswaPage,
 * "mobile view only" beneran, bukan cuma responsive. Menambah wrapper di sini cuma akan
 * tertimpa dan tidak kelihatan.
 */
export default function CwKaryawanPreview() {
  return (
    <CwKaryawanPage
      session={{ peran: "Karyawan", nama: "Akun Uji" }}
      onLogout={() => window.alert("Logout ditekan (preview, tidak benar-benar keluar).")}
    />
  );
}
