import { useState } from "react";
import MuridDetailPanel from "./MuridDetailPanel";
import { SiswaKelasList } from "./KarakterViewParts";
import styles from "./KarakterViews.module.css";

/**
 * Preview lepas-login panel detail per anak (?preview=karakter-anak), pola yang sama dengan
 * preview CW/SC di main.jsx. Ada supaya tampilan bar berwarna, bintang, rincian indikator, dan
 * baris "belum dinilai" bisa diperiksa tanpa akun sekolah sungguhan.
 *
 * Angkanya karangan dan memang cuma untuk pemeriksaan tampilan; halaman ini tidak pernah
 * tersambung ke alur produk (default main.jsx tetap <App/>). Grafik progres di dalamnya akan
 * menulis "Memuat riwayat…" karena tanpa sesi login tidak ada baris yang boleh dibaca RLS.
 */

const ASPEK = [
  { aspek_kode: "karakter1", aspek_label: "Beriman dan Bertakwa" },
  { aspek_kode: "karakter2", aspek_label: "Mandiri" },
  { aspek_kode: "karakter3", aspek_label: "Bergotong Royong" },
  { aspek_kode: "karakter4", aspek_label: "Bernalar Kritis" },
  { aspek_kode: "karakter5", aspek_label: "Kreatif" },
];

const MURID = {
  murid_id: "preview-1",
  nama: "Ahmad Fauzi",
  kelas_id: "5B",
  jenjang: "SD",
  rata: 68,
  // karakter5 sengaja 0: di modul Karakter itu berarti guru tidak menilai, bukan nilai nol.
  skorByAspek: { karakter1: 100, karakter2: 45, karakter3: 75, karakter4: 78, karakter5: 0 },
};

const LABEL = {
  karakter1_indikator1: "Salat tepat waktu",
  karakter1_indikator2: "Jujur saat ditanya",
  karakter1_indikator3: "Menghormati guru",
  karakter2_indikator1: "Merapikan alat belajar sendiri",
  karakter2_indikator2: "Menyelesaikan tugas tanpa diingatkan",
  karakter2_indikator3: "Berani mencoba hal baru",
  karakter3_indikator1: "Membantu teman tanpa diminta",
  karakter3_indikator2: "Ikut piket kelas sampai selesai",
  karakter3_indikator3: "Mau bergantian saat bermain",
  karakter4_indikator1: "Bertanya saat belum paham",
  karakter4_indikator2: "Membandingkan dua pendapat",
  karakter4_indikator3: "Menyimpulkan bacaan sendiri",
};

const SKOR_INDIKATOR = [
  { murid_id: "preview-1", jenjang: "SD", aspek_kode: "karakter1", indikator_kode: "indikator1", skor: 100 },
  { murid_id: "preview-1", jenjang: "SD", aspek_kode: "karakter1", indikator_kode: "indikator2", skor: 100 },
  { murid_id: "preview-1", jenjang: "SD", aspek_kode: "karakter1", indikator_kode: "indikator3", skor: 100 },
  { murid_id: "preview-1", jenjang: "SD", aspek_kode: "karakter2", indikator_kode: "indikator1", skor: 25 },
  { murid_id: "preview-1", jenjang: "SD", aspek_kode: "karakter2", indikator_kode: "indikator2", skor: 25 },
  { murid_id: "preview-1", jenjang: "SD", aspek_kode: "karakter2", indikator_kode: "indikator3", skor: 0 },
  { murid_id: "preview-1", jenjang: "SD", aspek_kode: "karakter3", indikator_kode: "indikator1", skor: 100 },
  { murid_id: "preview-1", jenjang: "SD", aspek_kode: "karakter3", indikator_kode: "indikator2", skor: 75 },
  { murid_id: "preview-1", jenjang: "SD", aspek_kode: "karakter3", indikator_kode: "indikator3", skor: 50 },
  { murid_id: "preview-1", jenjang: "SD", aspek_kode: "karakter4", indikator_kode: "indikator1", skor: 78 },
  { murid_id: "preview-1", jenjang: "SD", aspek_kode: "karakter4", indikator_kode: "indikator2", skor: 90 },
  { murid_id: "preview-1", jenjang: "SD", aspek_kode: "karakter4", indikator_kode: "indikator3", skor: 65 },
];

const PERNYATAAN = {
  orangtua: [{
    murid_id: "preview-1",
    pernyataan: "Di rumah Ahmad sudah mulai salat tanpa diingatkan, tapi kamarnya masih sering berantakan dan baru dirapikan kalau disuruh.",
    kategori_pernyataan: "Kemandirian",
  }],
};

// Keadaan tiruan hasil useKarakterKelasMurid, untuk memeriksa lapis kedua (daftar siswa kelas)
// milik Kepala Sekolah tanpa data sungguhan.
const STATE_KELAS = {
  loading: false,
  error: null,
  skorIndikator: SKOR_INDIKATOR,
  muridList: [
    { ...MURID },
    // Empat karakter di atas 80: dipakai memeriksa deret bintang yang lebih dari satu.
    {
      murid_id: "preview-2", nama: "Siti Nurhaliza", kelas_id: "5B", jenjang: "SD", rata: 88,
      skorByAspek: { karakter1: 100, karakter2: 85, karakter3: 90, karakter4: 80, karakter5: 65 },
    },
    // Tidak ada karakter yang tembus 80: dipakai memeriksa empty-state "belum ada bintang".
    {
      murid_id: "preview-3", nama: "Budi Santoso", kelas_id: "5B", jenjang: "SD", rata: 54,
      skorByAspek: { karakter1: 65, karakter2: 45, karakter3: 55, karakter4: 50, karakter5: 0 },
    },
    { murid_id: "preview-4", nama: "Dewi Lestari", kelas_id: "5B", jenjang: "SD", rata: null, skorByAspek: {} },
  ],
};

export default function MuridDetailPreview() {
  const [muridId, setMuridId] = useState(null);
  const murid = STATE_KELAS.muridList.find((m) => m.murid_id === muridId) || null;

  return (
    <div className={`${styles.page} ${styles.pageFullBleed}`} style={{ padding: 24 }}>
      <div className={styles.masterDetailPanel} style={{ marginBottom: 24 }}>
        {murid ? (
          <>
            <div className={styles.breadcrumbRow}>
              <button type="button" className={styles.breadcrumbBack} onClick={() => setMuridId(null)}>
                ← Kembali ke 5B
              </button>
              <span className={styles.breadcrumbTrail}>Sekolah › 5B › {murid.nama}</span>
            </div>
            <MuridDetailPanel
              sekolahId="preview"
              murid={murid}
              aspek={ASPEK}
              skorIndikatorRows={SKOR_INDIKATOR.filter((r) => r.murid_id === murid.murid_id)}
              labelIndikator={(r) => LABEL[`${r.aspek_kode}_${r.indikator_kode}`] || `${r.aspek_kode} ${r.indikator_kode}`}
              pernyataanBySumber={PERNYATAAN}
              sumberRefleksi={["orangtua"]}
              periode="2026-09"
            />
          </>
        ) : (
          <section>
            <p className={styles.dialogSectionTitle}>👥 Siswa kelas ini (lapis Kepala Sekolah)</p>
            <SiswaKelasList state={STATE_KELAS} onSelect={setMuridId} />
          </section>
        )}
      </div>

      <div className={styles.masterDetailPanel}>
        <MuridDetailPanel
          sekolahId="preview"
          murid={MURID}
          aspek={ASPEK}
          skorIndikatorRows={SKOR_INDIKATOR}
          labelIndikator={(r) => LABEL[`${r.aspek_kode}_${r.indikator_kode}`] || `${r.aspek_kode} ${r.indikator_kode}`}
          pernyataanBySumber={PERNYATAAN}
          sumberRefleksi={["orangtua"]}
          periode="2026-09"
        />
      </div>
    </div>
  );
}
