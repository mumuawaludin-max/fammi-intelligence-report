import { ArrowLeft, ArrowSquareOut, Info } from "@phosphor-icons/react";
import IkonSistem from "./IkonSistem";
import tokens from "../login/loginTokens.module.css";
import styles from "./DemoBilah.module.css";

export const CATATAN_DEMO = "Data contoh untuk demonstrasi. Nama dan angka di laporan ini karangan, bukan temuan nyata.";

/**
 * Bilah atas yang sama untuk SEMUA tampilan demo (instruksi pemilik produk 2026-11-11): tombol
 * "Kembali ke Intelligence Systems", modul dan tampilan yang sedang dibuka, lencana "Demo report",
 * logo Fammi, lalu catatan data contoh. Dipakai penampil laporan/tautan (DemoReportViewer) dan
 * di atas shell aplikasi saat pengunjung berada di tampilan akun demo (DemoModeBar).
 *
 * judulUtama: judul modul jadi h1 (penampil yang tidak punya judul halaman lain). Di atas shell
 * aplikasi judulnya paragraf biasa supaya tidak bersaing dengan judul halaman shell itu.
 */
export default function DemoBilah({ sistem, label, onKembali, kembaliRef, judulUtama = false, tautanLuar = null }) {
  const Judul = judulUtama ? "h1" : "p";
  return (
    <div
      className={`${tokens.scope} ${styles.wadah} ${sistem ? styles[`warna_${sistem.warna}`] : ""}`}
      role="region"
      aria-label="Mode demo Fammi Intelligence Report"
    >
      <div className={styles.bilah}>
        <button ref={kembaliRef} type="button" className={styles.kembali} onClick={onKembali}>
          <ArrowLeft size={17} weight="bold" aria-hidden="true" />
          <span className={styles.kembaliPanjang}>Kembali ke Intelligence Systems</span>
          <span className={styles.kembaliPendek}>Kembali</span>
        </button>

        <div className={styles.judulBlok}>
          {sistem && (
            <span className={styles.judulIkon}>
              <IkonSistem nama={sistem.ikon} size={20} />
            </span>
          )}
          <span className={styles.judulTeks}>
            <span className={styles.judulNomor}>
              {sistem ? `Module ${sistem.nomor} · ${label || "Intelligence System"}` : "Intelligence System"}
            </span>
            <Judul className={styles.judul}>{sistem ? sistem.judul : "Contoh laporan"}</Judul>
          </span>
          <span className={styles.lencana}>Demo report</span>
        </div>

        {tautanLuar && (
          <a className={styles.tautanLuar} href={tautanLuar} target="_blank" rel="noopener noreferrer">
            <ArrowSquareOut size={16} weight="bold" aria-hidden="true" />
            <span>Buka di tab baru</span>
          </a>
        )}

        <span className={styles.merek}>
          <img src="/favicon-512.png" alt="" width="34" height="34" />
          <span>Fammi</span>
        </span>
      </div>

      <p className={styles.catatan}>
        <Info size={15} weight="bold" aria-hidden="true" />
        {CATATAN_DEMO}
      </p>
    </div>
  );
}
