import { Component, lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowClockwise, ArrowLeft, HourglassMedium, WarningCircle } from "@phosphor-icons/react";
import { cariSistem, cariTampilan, statusTampilan } from "./demoSystems";
import { sesiMati } from "./demoAturan";
import DemoBilah from "./DemoBilah";
import IkonSistem from "./IkonSistem";
import tokens from "../login/loginTokens.module.css";
import styles from "./DemoReportViewer.module.css";

// Prototipe klik dimuat terpisah saat dibuka, supaya halaman masuk tidak ikut membawanya.
const PROTOTIPE = {
  "sekolah-proteksi": lazy(() => import("./proteksi/SekolahProteksi")),
};

/**
 * Penampil demo untuk tampilan yang tidak masuk ke akun, dibuka dari layar demo selama sesi demo
 * aktif (LoginPage, hash #demo/<id tampilan>):
 *   - "html":   laporan HTML dari server (demo_report_html, tabel demo_reports), untuk sesi demo yang
 *               sah dan sistem yang dibuka kodenya; tidak pernah dari path berkas. Iframe sandbox
 *               tanpa allow-same-origin: skrip laporan berjalan di origin kosong dan tidak bisa
 *               membaca token, sessionStorage, cookie, atau DOM aplikasi.
 *   - "tautan": halaman Fammi lain yang terbuka untuk umum (mis. contoh cara input Rapor
 *               Karakter). Origin-nya berbeda dari aplikasi ini, jadi allow-same-origin hanya
 *               memberinya origin miliknya sendiri, tidak pernah akses ke aplikasi ini.
 *   - "prototipe": komponen React berisi data contoh (mis. Sekolah Proteksi), dirender langsung di
 *               bingkai ini. Tidak memanggil server dan tidak menyentuh sesi demo.
 * Kalau laporannya belum ada, tampil keadaan "Report preview coming soon", bukan halaman kosong.
 */
// layarAwal: hanya dipakai pratinjau QA dev server (ProteksiPreview) untuk membuka layar prototipe
// tertentu; alur demo biasa memakai `layar` dari registri.
export default function DemoReportViewer({ tampilanId, layarAwal, sesi, onKembali, ambilLaporanHtml, onSesiMati }) {
  const tampilan = cariTampilan(tampilanId);
  const sistem = cariSistem(tampilan?.sistem);
  const status = statusTampilan(tampilan, sesi);
  const kembaliRef = useRef(null);

  useEffect(() => {
    kembaliRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [tampilanId]);

  useEffect(() => {
    const judulLama = document.title;
    document.title = `${sistem ? sistem.judul : "Demo"} · Demo Fammi Intelligence Report`;
    return () => {
      document.title = judulLama;
    };
  }, [sistem]);

  const bisaDibuka = Boolean(sistem && tampilan) && status === "tersedia";
  let isi;
  if (!bisaDibuka) {
    isi = <SegeraHadir sistem={sistem} terbatas={status === "terbatas"} onKembali={onKembali} />;
  } else if (tampilan.jenis === "tautan") {
    isi = <HalamanTautan tampilan={tampilan} sistem={sistem} />;
  } else if (tampilan.jenis === "prototipe") {
    isi = <HalamanPrototipe tampilan={tampilan} layarAwal={layarAwal} onKembali={onKembali} />;
  } else {
    isi = <LaporanHtml sistem={sistem} ambilLaporanHtml={ambilLaporanHtml} onSesiMati={onSesiMati} onKembali={onKembali} />;
  }

  return (
    <div className={`${tokens.scope} ${styles.penampil} ${sistem ? styles[`warna_${sistem.warna}`] : ""}`}>
      <DemoBilah
        sistem={sistem}
        // Di prototipe sudut pandang bisa diganti dari dalam, jadi bilah menyebut nama prototipenya.
        label={tampilan?.jenis === "prototipe" ? tampilan.grup : tampilan?.label}
        onKembali={onKembali}
        kembaliRef={kembaliRef}
        judulUtama
        tautanLuar={bisaDibuka && tampilan.jenis === "tautan" ? tampilan.url : null}
      />

      <main className={styles.bingkai}>
        <motion.div
          key={tampilanId}
          className={styles.gulir}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {isi}
        </motion.div>
      </main>
    </div>
  );
}

// Halaman Fammi di app.fammi.ly butuh beberapa detik sampai tampil (diukur 10-15 detik), jadi
// lapisan memuat menutup bingkai sampai halaman pertamanya selesai dimuat.
function HalamanTautan({ tampilan, sistem }) {
  const [dimuat, setDimuat] = useState(false);
  return (
    <>
      {!dimuat && (
        <div className={`${styles.keadaan} ${styles.lapisMuat}`} role="status">
          <span className={styles.putar} aria-hidden="true" />
          <p className={styles.keadaanTeks}>Memuat {tampilan.label.toLowerCase()}, mohon tunggu sebentar</p>
        </div>
      )}
      <iframe
        className={styles.iframe}
        title={`${tampilan.label} ${sistem.judul}`}
        src={tampilan.url}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        onLoad={() => setDimuat(true)}
      />
    </>
  );
}

// Prototipe menggulir di lapisannya sendiri. Laci dan toast di dalamnya (position: fixed) menempel
// ke bingkai, bukan ke isi yang digulir, karena bingkai memakai contain: layout paint.
function HalamanPrototipe({ tampilan, layarAwal, onKembali }) {
  const Prototipe = PROTOTIPE[tampilan.prototipe];
  if (!Prototipe) return <GagalMuat onKembali={onKembali} />;
  return (
    <div className={styles.gulirIsi}>
      <BatasGalat cadangan={<GagalMuat onUlang={() => window.location.reload()} onKembali={onKembali} />}>
        <Suspense
          fallback={
            <div className={styles.keadaan} role="status">
              <span className={styles.putar} aria-hidden="true" />
              <p className={styles.keadaanTeks}>Menyiapkan tampilan demo</p>
            </div>
          }
        >
          <Prototipe layarAwal={layarAwal || tampilan.layar} />
        </Suspense>
      </BatasGalat>
    </div>
  );
}

// Bagian prototipe yang gagal dimuat (mis. jaringan putus saat mengambil berkasnya) tidak boleh
// menjatuhkan seluruh halaman masuk.
class BatasGalat extends Component {
  constructor(props) {
    super(props);
    this.state = { galat: false };
  }

  static getDerivedStateFromError() {
    return { galat: true };
  }

  render() {
    return this.state.galat ? this.props.cadangan : this.props.children;
  }
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
        {onUlang && (
          <button type="button" className={styles.tombolUtama} onClick={onUlang}>
            <ArrowClockwise size={16} weight="bold" aria-hidden="true" />
            Coba lagi
          </button>
        )}
        <button type="button" className={styles.tombolKedua} onClick={onKembali}>
          Kembali ke Intelligence Systems
        </button>
      </div>
    </div>
  );
}
