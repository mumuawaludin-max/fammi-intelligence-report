import { useState } from "react";
import ScPage from "./ScPage";
import styles from "./ScChartsPreview.module.css";

/**
 * ScPagePreview -- preview lepas-login untuk mengecek routing ScPage sisi PIMPINAN (dashboard
 * lembaga + sub-tab), dibuka lewat http://localhost:5173/?preview=sc-page
 *
 * Karyawan SENGAJA tidak ada di sini -- App.jsx sudah mengalihkannya ke ScKaryawanPage sebelum
 * ScPage ini pernah dirender. Untuk itu pakai ?preview=sc-karyawan.
 *
 * Session di sini objek palsu seadanya, cuma field `peran` yang dipakai ScPage -- BUKAN sesi
 * Supabase sungguhan, jadi tidak menyentuh auth/RLS sama sekali.
 */
const PERAN_UJI = ["Manajemen", "KepalaSekolah", "Yayasan", "WaliKelas"];
const SC_SUB_TABS_UJI = [
  { id: "dashboard", label: "Dashboard" },
  { id: "individu", label: "Laporan Individu" },
];

export default function ScPagePreview() {
  const [peran, setPeran] = useState("Manajemen");
  // Sub-tab dashboard/individu sekarang diangkat ke App.jsx (dirender menyatu di Header) --
  // preview ini mensimulasikan tombolnya sendiri supaya QA masih bisa uji coba kedua tampilan.
  const [tab, setTab] = useState("dashboard");

  return (
    <div className={styles.page}>
      <p className={styles.pageTitle}>SC Page Routing Preview</p>
      <p className={styles.pageNote}>
        Ganti peran untuk melihat tampilan mana yang dirender ScPage. Manajemen, Kepala Sekolah,
        &amp; Yayasan dapat dashboard lembaga + sub-tab; WaliKelas contoh fallback defensif
        (laporan individu tanpa jaminan shell mobile-only, lihat komentar di ScPage.jsx). Tombol
        Dashboard/Laporan Individu di bawah ini cuma simulasi -- di app sungguhan, tab ini
        dirender App.jsx menyatu di Header.
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

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {SC_SUB_TABS_UJI.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font-body)", borderRadius: 999,
              border: `1px solid ${tab === t.id ? "var(--purple-600)" : "var(--line)"}`,
              background: tab === t.id ? "var(--purple-050)" : "var(--surface)",
              color: tab === t.id ? "var(--purple-700)" : "var(--ink-3)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ScPage session={{ peran, school_id: "org-cendekia", nama: "Akun Uji" }} tab={tab} />
    </div>
  );
}
