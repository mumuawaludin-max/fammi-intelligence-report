import { PaReveal } from "./PaReveal";
import tokens from "./paTokens.module.css";
import styles from "./PaFooterNote.module.css";

const CATATAN = [
  {
    judul: "Sumber data",
    isi: "Asesmen siswa, survey kebiasaan, dan pencatatan tindak lanjut sekolah.",
  },
  {
    judul: "Kerahasiaan",
    isi: "Tampilan yayasan memakai agregat. Identitas hanya dibuka untuk petugas berwenang.",
  },
  {
    judul: "Saran pembacaan",
    isi: "Bandingkan periode, konteks usia, dan tindak lanjut. Hindari menyimpulkan dari satu skor.",
  },
];

/** PaFooterNote -- tiga catatan penutup yang berlaku untuk seluruh laporan, bukan per bagian. */
export function PaFooterNote() {
  return (
    <PaReveal className={`${tokens.scope} ${styles.strip}`} amount={0.1}>
      {CATATAN.map((c) => (
        <div className={styles.item} key={c.judul}>
          <p className={styles.judul}>{c.judul}</p>
          <p className={styles.isi}>{c.isi}</p>
        </div>
      ))}
    </PaReveal>
  );
}
