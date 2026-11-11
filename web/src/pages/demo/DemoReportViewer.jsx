import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowClockwise, ArrowLeft, HourglassMedium, Info, WarningCircle } from "@phosphor-icons/react";
import { cariSistem, statusSistem } from "./demoSystems";
import { sesiMati } from "./demoAturan";
import IkonSistem from "./IkonSistem";
import tokens from "../login/loginTokens.module.css";
import styles from "./DemoReportViewer.module.css";

/**
 * Penampil laporan HTML demo (saat ini Dashboard Keuangan untuk Finance & Planning), dibuka dari
 * layar demo selama sesi demo aktif (LoginPage, hash #demo/<id sistem>).
 *
 * Isi HTML hanya datang dari server (demo_report_html, tabel demo_reports), untuk sesi demo yang
 * sah dan sistem yang dibuka kodenya; tidak pernah dari path berkas. Iframe-nya sandbox tanpa
 * allow-same-origin: skrip laporan berjalan di origin kosong dan tidak bisa membaca token,
 * sessionStorage, cookie, atau DOM aplikasi. Kalau laporannya belum ada, tampil keadaan
 * "Report preview coming soon", bukan halaman kosong.
 */
export default function DemoReportViewer({ sistemId, sesi, onKembali, ambilLaporanHtml, onSesiMati }) {
  const sistem = cariSistem(sistemId);
  const status = statusSistem(sistem, sesi);
  const kembaliRef = useRef(null);
  const tampilan = sistem?.tampilan.find((t) => t.jenis === "html") || null;

  useEffect(() => {
    kembaliRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [sistemId]);

  useEffect(() => {
    const judulLama = document.title;
    document.title = `${sistem ? sistem.judul : "Demo"} · Demo Fammi Intelligence Report`;
    return () => {
      document.title = judulLama;
    };
  }, [sistem]);

  const bisaDibuka = sistem && tampilan && status === "tersedia";

  return (
    <div className={`${tokens.scope} ${styles.penampil} ${sistem ? styles[`warna_${sistem.warna}`] : ""}`}>
      <header className={styles.bilah}>
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
              {sistem ? `Module ${sistem.nomor} · ${tampilan?.label || "Intelligence System"}` : "Intelligence System"}
            </span>
            <h1 className={styles.judul}>{sistem ? sistem.judul : "Contoh laporan"}</h1>
          </span>
          <span className={styles.lencana}>Demo report</span>
        </div>

        <span className={styles.merek}>
          <img src="/favicon-512.png" alt="" width="34" height="34" />
          <span>Fammi</span>
        </span>
      </header>

      <p className={styles.catatan}>
        <Info size={15} weight="bold" aria-hidden="true" />
        Data contoh untuk demonstrasi. Nama dan angka di laporan ini karangan, bukan temuan nyata.
      </p>

      <main className={styles.bingkai}>
        <motion.div
          key={sistemId}
          className={styles.gulir}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {bisaDibuka ? (
            <LaporanHtml sistem={sistem} ambilLaporanHtml={ambilLaporanHtml} onSesiMati={onSesiMati} onKembali={onKembali} />
          ) : (
            <SegeraHadir sistem={sistem} terbatas={status === "terbatas"} onKembali={onKembali} />
          )}
        </motion.div>
      </main>
    </div>
  );
}

function LaporanHtml({ sistem, ambilLaporanHtml, onSesiMati, onKembali }) {
  const [percobaan, setPercobaan] = useState(0);
  // Kunci yang berubah tiap percobaan: hasil lama tidak pernah tampil untuk percobaan baru.
  const kunci = `${sistem.id}:${percobaan}`;
  const [hasil, setHasil] = useState({ kunci: null, status: "memuat" });

  useEffect(() => {
    let hidup = true;
    ambilLaporanHtml(sistem.id).then((h) => {
      if (!hidup) return;
      if (sesiMati(h.status)) {
        onSesiMati(h.status);
        return;
      }
      setHasil({ ...h, kunci });
    });
    return () => {
      hidup = false;
    };
  }, [sistem.id, kunci, ambilLaporanHtml, onSesiMati]);

  if (hasil.kunci !== kunci) {
    return (
      <div className={styles.keadaan} role="status">
        <span className={styles.putar} aria-hidden="true" />
        <p className={styles.keadaanTeks}>Menyiapkan contoh laporan</p>
      </div>
    );
  }
  if (hasil.status === "ok") {
    return (
      <iframe
        className={styles.iframe}
        title={`Contoh laporan ${sistem.judul}`}
        sandbox="allow-scripts allow-popups"
        referrerPolicy="no-referrer"
        srcDoc={hasil.html}
      />
    );
  }
  if (hasil.status === "not_found" || hasil.status === "not_allowed") {
    return <SegeraHadir sistem={sistem} terbatas={hasil.status === "not_allowed"} onKembali={onKembali} />;
  }
  return <GagalMuat onUlang={() => setPercobaan((n) => n + 1)} onKembali={onKembali} />;
}

function SegeraHadir({ sistem, terbatas, onKembali }) {
  return (
    <div className={styles.segera}>
      <div className={styles.segeraIsi}>
        <span className={styles.segeraIkon}>
          {sistem ? <IkonSistem nama={sistem.ikon} size={36} /> : <HourglassMedium size={36} weight="duotone" aria-hidden="true" />}
        </span>
        <p className={styles.segeraEyebrow}>{terbatas ? "Tidak termasuk akses demo ini" : "Report preview coming soon"}</p>
        <h2 className={styles.segeraJudul}>{sistem ? sistem.judul : "Contoh laporan"}</h2>
        <p className={styles.segeraDesk}>
          {terbatas
            ? "Kode demo yang Anda pakai tidak membuka modul ini. Hubungi tim Fammi untuk akses yang lebih lengkap."
            : "Contoh laporan untuk modul ini sedang dipersiapkan oleh tim Fammi."}
        </p>
        <button type="button" className={styles.segeraTombol} onClick={onKembali}>
          <ArrowLeft size={17} weight="bold" aria-hidden="true" />
          Kembali ke Intelligence Systems
        </button>
      </div>
    </div>
  );
}

function GagalMuat({ onUlang, onKembali }) {
  return (
    <div className={styles.keadaan} role="alert">
      <WarningCircle size={34} weight="duotone" aria-hidden="true" className={styles.keadaanIkon} />
      <p className={styles.keadaanTeks}>Contoh laporan belum bisa dimuat.</p>
      <div className={styles.keadaanAksi}>
        <button type="button" className={styles.tombolUtama} onClick={onUlang}>
          <ArrowClockwise size={16} weight="bold" aria-hidden="true" />
          Coba lagi
        </button>
        <button type="button" className={styles.tombolKedua} onClick={onKembali}>
          Kembali ke Intelligence Systems
        </button>
      </div>
    </div>
  );
}
