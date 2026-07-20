import { useState } from "react";
import CwPage from "./CwPage";
import styles from "./CwChartsPreview.module.css";

/**
 * CwPagePreview -- preview lepas-login untuk mengecek routing CwPage per peran (Manajemen &
 * pimpinan lain dapat dashboard + sub-tab, peran lain dapat laporan pribadi), dibuka lewat
 * http://localhost:5173/?preview=cw-page
 *
 * Session di sini objek palsu seadanya, cuma field `peran` yang dipakai CwPage -- BUKAN sesi
 * Supabase sungguhan, jadi tidak menyentuh auth/RLS sama sekali.
 */
const PERAN_UJI = ["Manajemen", "KepalaSekolah", "WaliKelas"];

export default function CwPagePreview() {
  const [peran, setPeran] = useState("Manajemen");

  return (
    <div className={styles.page}>
      <p className={styles.pageTitle}>CW Page Routing Preview</p>
      <p className={styles.pageNote}>
        Ganti peran untuk melihat tampilan mana yang dirender CwPage. Manajemen &amp; Kepala
        Sekolah dapat dashboard lembaga + sub-tab, peran lain dapat laporan pribadi.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {PERAN_UJI.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeran(p)}
            style={{
              padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font-body)", borderRadius: 999,
              border: `1px solid ${peran === p ? "var(--purple-600)" : "var(--line)"}`,
              background: peran === p ? "var(--purple-050)" : "var(--surface)",
              color: peran === p ? "var(--purple-700)" : "var(--ink-3)",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <CwPage session={{ peran, school_id: "sch-istiqamah", nama: "Akun Uji" }} />
    </div>
  );
}
