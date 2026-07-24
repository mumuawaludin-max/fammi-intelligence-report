import ScKaryawanPage from "./ScKaryawanPage";

/**
 * ScKaryawanPreview -- preview lepas-login untuk shell mandiri staf sekolah (ScKaryawanPage),
 * dibuka lewat http://localhost:5173/?preview=sc-karyawan
 *
 * Dirender POLOS tanpa pembungkus apa pun (beda dari preview SC lain) karena ScKaryawanPage
 * sendiri sudah position:fixed ambil-alih seluruh viewport -- pola sama dengan
 * CwKaryawanPreview.jsx.
 */
export default function ScKaryawanPreview() {
  return (
    <ScKaryawanPage
      session={{ peran: "Karyawan", nama: "Akun Uji" }}
      onLogout={() => window.alert("Logout ditekan (preview, tidak benar-benar keluar).")}
    />
  );
}
