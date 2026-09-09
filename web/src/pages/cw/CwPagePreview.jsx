import { useState } from "react";
import CwPage from "./CwPage";
import styles from "./CwChartsPreview.module.css";

/**
 * CwPagePreview -- preview lepas-login untuk mengecek routing CwPage sisi PIMPINAN, dibuka
 * lewat http://localhost:5173/?preview=cw-page. Sejak CwPage membaca Supabase sungguhan
 * (useCwData.js), yang terlihat di sini status kosong atau pesan galat, bukan angka: sesi di
 * bawah palsu dan tidak punya school_id yang terdaftar. Untuk mengecek TAMPILAN dashboard dan
 * daftar responden dengan data contoh, pakai ?preview=cw-agregat dan ?preview=cw-list.
 *
 * Sub-tab Dashboard/Laporan Individu hidup di
 * App.jsx (prop `tab`), jadi preview ini yang menyediakan togglenya supaya kedua tampilan
 * tetap bisa dicek tanpa login.
 *
 * Karyawan SENGAJA tidak ada di sini -- App.jsx sudah mengalihkannya ke CwKaryawanPage sebelum
 * CwPage ini pernah dirender (shell mobile mandiri, position:fixed ambil-alih viewport penuh,
 * tidak cocok ditumpuk dalam UI switcher seperti ini). Untuk itu pakai ?preview=cw-karyawan.
 *
 * Session di sini objek palsu seadanya, cuma field `peran` yang dipakai CwPage -- BUKAN sesi
 * Supabase sungguhan, jadi tidak menyentuh auth/RLS sama sekali.
 */
const PERAN_UJI = ["Manajemen", "AdminFammi", "Karyawan"];
const TAB_UJI = ["dashboard", "individu"];

export default function CwPagePreview() {
  const [peran, setPeran] = useState("Manajemen");
  const [tab, setTab] = useState("dashboard");

  return (
    <div className={styles.page}>
      <p className={styles.pageTitle}>CW Page Routing Preview</p>
      <p className={styles.pageNote}>
        Ganti peran untuk melihat tampilan mana yang dirender CwPage. Manajemen (satu-satunya
        level pimpinan di korporat) dan AdminFammi dapat dashboard agregat serta daftar
        responden. Karyawan di sini cuma memperlihatkan fallback defensif: di produk dia sudah
        dialihkan App.jsx ke CwKaryawanPage sebelum CwPage sempat dirender, lihat komentar di
        CwPage.jsx.
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
        {TAB_UJI.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font-body)", borderRadius: 999,
              border: `1px solid ${tab === id ? "var(--purple-600)" : "var(--line)"}`,
              background: tab === id ? "var(--purple-050)" : "var(--surface)",
              color: tab === id ? "var(--purple-700)" : "var(--ink-3)",
            }}
          >
            {id === "dashboard" ? "Dashboard" : "Laporan Individu"}
          </button>
        ))}
      </div>

      <CwPage session={{ peran, school_id: "org-phe", nama: "Akun Uji" }} tab={tab} />
    </div>
  );
}
