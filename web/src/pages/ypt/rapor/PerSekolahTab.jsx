import { useEffect, useMemo, useState } from "react";
import { ProgressBar, SectionTitle, ArrowPair } from "../components/Bits";
import { JENJANG_GROUPS } from "../yptMeta";
import styles from "./Rapor.module.css";

const PER_HALAMAN = 15;

const URUTAN = [
  { id: "total-desc", label: "Total Tinggi ke Rendah" },
  { id: "total-asc", label: "Total Rendah ke Tinggi" },
  { id: "nama", label: "Nama Sekolah A-Z" },
];

/**
 * Tab Penilaian per Sekolah (Figma 84-2502): tabel semua sekolah dengan kolom per aspek karakter.
 *
 * Kolom aspek memakai NAMA aspek asli (Mandiri, Empati, ...), bukan "Karakter 1..6" seperti
 * mockup -- nama asli lebih berguna dan datanya memang ada. Jumlahnya dibatasi enam sesuai
 * lebar yang digambar; aspek di luar enam besar tetap ikut menghitung total sekolah.
 *
 * Sekolah tanpa data pada periode terpilih tetap ditampilkan (di urutan paling bawah) dengan
 * penanda "belum ada data", bukan 0% -- membedakan "nol" dari "belum diimpor" itu penting untuk
 * yayasan yang sedang memantau kelengkapan setoran sekolah.
 */
export default function PerSekolahTab({ data }) {
  const [filter, setFilter] = useState("semua");
  const [urutan, setUrutan] = useState("total-desc");
  const [halaman, setHalaman] = useState(0);

  const baris = useMemo(() => {
    const rows = filter === "semua"
      ? data.sekolahLengkap
      : data.sekolahLengkap.filter((s) => s.grup === filter);

    const berdata = rows.filter((s) => s.rata_total != null);
    const kosong = rows.filter((s) => s.rata_total == null);

    if (urutan === "nama") {
      return [...berdata, ...kosong].sort((a, b) => a.nama.localeCompare(b.nama));
    }
    const arah = urutan === "total-asc" ? 1 : -1;
    berdata.sort((a, b) => (a.rata_total - b.rata_total) * arah);
    // Sekolah tanpa data selalu di akhir, apa pun arah urutannya -- kalau ikut diurutkan sebagai
    // nol, mereka akan menyamar jadi "sekolah terburuk" pada urutan menaik.
    return [...berdata, ...kosong.sort((a, b) => a.nama.localeCompare(b.nama))];
  }, [data.sekolahLengkap, filter, urutan]);

  useEffect(() => { setHalaman(0); }, [filter, urutan]);

  const totalHalaman = Math.max(1, Math.ceil(baris.length / PER_HALAMAN));
  const mulai = halaman * PER_HALAMAN;
  const tampil = baris.slice(mulai, mulai + PER_HALAMAN);

  return (
    <>
      <SectionTitle>Tabel Pencapaian per Sekolah</SectionTitle>

      <div className={styles.tabelBar}>
        <div className={styles.chipRow}>
          <button
            type="button"
            className={`${styles.chip} ${filter === "semua" ? styles.chipActive : ""}`}
            onClick={() => setFilter("semua")}
          >
            Semua
          </button>
          {JENJANG_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`${styles.chip} ${filter === g.id ? styles.chipActive : ""}`}
              onClick={() => setFilter(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>

        <select
          className={styles.sortSelect}
          value={urutan}
          onChange={(e) => setUrutan(e.target.value)}
          aria-label="Urutkan tabel"
        >
          {URUTAN.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
        </select>
      </div>

      <div className={styles.tabelWrap}>
        <table className={styles.tabel}>
          <thead>
            <tr>
              <th colSpan={2}>Sekolah</th>
              <th>Total Pencapaian</th>
              {data.kolomAspek.map((k) => (
                <th key={k.kode} className={styles.thTengah}>{k.nama}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tampil.length === 0 && (
              <tr>
                <td colSpan={3 + data.kolomAspek.length} className={styles.tdNama}>
                  Tidak ada sekolah pada jenjang ini.
                </td>
              </tr>
            )}
            {tampil.map((s, i) => {
              const aspek = data.aspekPerSekolah[s.sekolah_id] || {};
              return (
                <tr key={s.sekolah_id}>
                  <td className={styles.tdNo}>
                    <span className={styles.noBadge}>{mulai + i + 1}</span>
                  </td>
                  <td className={styles.tdNama}>{s.nama}</td>
                  <td className={styles.tdTotal}>
                    <span className={styles.totalWrap}>
                      <span className={`${styles.totalBadge} ${s.rata_total == null ? styles.totalBadgeKosong : ""}`}>
                        {s.rata_total == null ? "belum ada" : `${s.rata_total}%`}
                      </span>
                      <span className={styles.totalBar}><ProgressBar value={s.rata_total} /></span>
                    </span>
                  </td>
                  {data.kolomAspek.map((k) => (
                    <td key={k.kode} className={styles.selNilai}>
                      <span className={`${styles.selBadge} ${aspek[k.kode] == null ? styles.selKosong : ""}`}>
                        {aspek[k.kode] == null ? "—" : `${aspek[k.kode]}%`}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.pagerRow}>
        <span className={styles.pagerInfo}>
          {Math.min(mulai + PER_HALAMAN, baris.length)} dari {baris.length} Sekolah
        </span>
        <ArrowPair
          onPrev={() => setHalaman((h) => Math.max(0, h - 1))}
          onNext={() => setHalaman((h) => Math.min(totalHalaman - 1, h + 1))}
          prevDisabled={halaman === 0}
          nextDisabled={halaman >= totalHalaman - 1}
        />
      </div>
    </>
  );
}
