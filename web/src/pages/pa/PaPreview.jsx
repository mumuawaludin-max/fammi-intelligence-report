import { useState } from "react";
import PaPage from "./PaPage";

/**
 * PaPreview -- preview lepas-login modul Perilaku Anak, dibuka lewat
 * http://localhost:5173/?preview=pa
 *
 * Session di sini objek palsu seadanya (cuma `peran` yang dipakai PaPage), BUKAN sesi Supabase
 * sungguhan, jadi tidak menyentuh auth/RLS sama sekali. Pola sama dengan ScPagePreview.jsx.
 *
 * Peran uji mencakup Yayasan (dapat laporan penuh) dan tiga peran lain yang bisa menjangkau tab
 * "pa" tapi belum jadi target tahap ini (lihat PaComingSoon.jsx) -- supaya kedua jalur bisa
 * dicoba dari satu preview tanpa perlu akun sungguhan.
 */
const PERAN_UJI = ["Yayasan", "KepalaSekolah", "WaliKelas", "Manajemen"];

export default function PaPreview() {
  const [peran, setPeran] = useState("Yayasan");

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: 16 }}>
        {PERAN_UJI.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeran(p)}
            style={{
              padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font-body)", borderRadius: 999,
              border: `1px solid ${peran === p ? "#6c2bd9" : "#e6e2da"}`,
              background: peran === p ? "#f1eaff" : "#ffffff",
              color: peran === p ? "#6c2bd9" : "#675f71",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <PaPage session={{ peran, school_name: "Sekolah Islam Athirah" }} />
    </div>
  );
}
