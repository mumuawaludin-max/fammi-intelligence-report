// Fungsi kecil bersama prototipe Sekolah Proteksi. Dipisah dari komponen.jsx supaya berkas itu hanya
// berisi komponen (aturan react-refresh/only-export-components).

/** Inisial dari nama: "Raka Pratama" -> "RP". */
export function inisial(nama) {
  return String(nama || "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
