import CwKaryawanPage from "./CwKaryawanPage";

/**
 * CwKaryawanPreview -- preview lepas-login untuk shell mandiri Karyawan (CwKaryawanPage),
 * dibuka lewat http://localhost:5173/?preview=cw-karyawan
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
