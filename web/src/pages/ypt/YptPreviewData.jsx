import { useState } from "react";
import { YPT_MENUS, YPT_TABS } from "./yptMeta";
import { MOCK_RAPOR, MOCK_CITRA, MOCK_KEPUASAN, MOCK_DOKUMENTASI } from "./ypt.mock";
import { DokumentasiIsi } from "./dokumentasi/DokumentasiPage";
import StepTabs from "./components/StepTabs";
import RangkumanTab from "./rapor/RangkumanTab";
import PerJenjangTab from "./rapor/PerJenjangTab";
import PerKarakterTab from "./rapor/PerKarakterTab";
import PerSekolahTab from "./rapor/PerSekolahTab";
import { statusPanel, ProgressBar, SectionTitle } from "./components/Bits";
import TestimoniTab from "./citra/TestimoniTab";
import citra from "./citra/Citra.module.css";
import tokens from "./yptTokens.module.css";
import styles from "./YptApp.module.css";

/**
 * Pratinjau dashboard YPT DENGAN DATA CONTOH (?preview=ypt-data), untuk membandingkan tata letak
 * berdampingan dengan Figma tanpa akun produksi.
 *
 * Beda dengan YptPreview (?preview=ypt) yang memakai data asli Supabase dan karena itu selalu
 * menampilkan status kosong saat belum login: yang ini merender komponen tampilan langsung dengan
 * MOCK dari ypt.mock.js. Tidak pernah menyentuh jalur produk.
 *
 * Tab Citra/Kepuasan di sini dirender ringkas (bukan seluruh halaman) karena keduanya butuh hook
 * data; yang perlu diperiksa dari keduanya adalah kartu dan esainya, dan itu sudah terwakili.
 */
export default function YptPreviewData() {
  const [menu, setMenu] = useState("rapor");
  const [tab, setTab] = useState("rangkuman");

  function gantiMenu(id) {
    setMenu(id);
    const tabs = YPT_TABS[id] || [];
    setTab(tabs.length > 0 ? tabs[0].id : null);
  }

  const tabs = YPT_TABS[menu] || [];

  return (
    <div className={`${tokens.scope} ${styles.app}`}>
      <div className={styles.shellBody}>
        <header className={styles.topbar}>
          <div className={styles.topbarInner}>
            <div className={styles.logo}>
              <span className={styles.logoText}>
                <span className={styles.logoTop}>Yayasan Pendidikan</span>
                <span className={styles.logoBottom}>Telkom</span>
              </span>
            </div>
            <nav className={styles.menuNav}>
              {YPT_MENUS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`${styles.menuBtn} ${menu === m.id ? styles.menuBtnActive : ""}`}
                  onClick={() => gantiMenu(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className={styles.main}>
          <StepTabs items={tabs} activeId={tab} onChange={setTab} />

          {menu === "rapor" && tab === "rangkuman" && (
            <RangkumanTab data={MOCK_RAPOR} onLihatSekolah={() => setTab("sekolah")} />
          )}
          {menu === "rapor" && tab === "jenjang" && <PerJenjangTab data={MOCK_RAPOR} />}
          {menu === "rapor" && tab === "karakter" && <PerKarakterTab data={MOCK_RAPOR} />}
          {menu === "rapor" && tab === "sekolah" && <PerSekolahTab data={MOCK_RAPOR} />}

          {menu === "citra" && <CitraContoh tab={tab} />}
          {menu === "kepuasan" && <KepuasanContoh tab={tab} />}
          {menu === "dokumentasi" && <DokumentasiIsi items={MOCK_DOKUMENTASI} />}
        </main>
      </div>
    </div>
  );
}

function CitraContoh({ tab }) {
  const daftarKategori = tab === "dukungan" ? MOCK_CITRA.dukungan
    : tab === "emosi" ? MOCK_CITRA.emosi
      : MOCK_CITRA.keberhasilan;

  // Tab Testimoni dirender lewat komponen ASLI, bukan salinan ringkas seperti tab lain. Tab ini
  // punya saringan bertingkat dan word cloud yang saling terhubung; menyalinnya di sini berarti
  // pratinjau memeriksa kode yang bukan kode produksi.
  if (tab === "testimoni") {
    return <TestimoniTab data={MOCK_CITRA} jumlahSekolahNaungan={26} />;
  }

  const judul = tab === "dukungan" ? "Bentuk Dukungan"
    : tab === "emosi" ? "Total Responden Penilaian Kualitatif"
      : "Keberhasilan Sekolah di Mata Orangtua";

  return (
    <>
      <SectionTitle>{judul}</SectionTitle>
      <div className={tab === "keberhasilan" ? citra.grid3 : tab === "emosi" ? citra.grid5 : citra.grid4}>
        {daftarKategori.map((k) => (
          <div key={k.nama} className={citra.kartu}>
            <div className={citra.kartuIkon} aria-hidden="true">◈</div>
            <p className={citra.kartuNama}>{k.nama}</p>
            <p className={citra.kartuAngka}>
              <span className={citra.kartuPersen}>{k.persen}%</span>
              <span className={citra.kartuDot}>•</span>
              {k.jumlah.toLocaleString("id-ID")} siswa
            </p>
            {k.perJenjang.map((j) => (
              <div key={j.id} className={citra.jenjangBaris}>
                <div className={citra.jenjangBarisTop}>
                  <span>{j.label}</span>
                  <span>{j.persen}%</span>
                </div>
                <ProgressBar value={j.persen} varian="red" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function KepuasanContoh({ tab }) {
  const data = MOCK_KEPUASAN;
  const peran = data.perPeran[0];

  if (tab === "kualitatif") {
    return (
      <>
        <SectionTitle>Total Responden Penilaian Kualitatif</SectionTitle>
        <div className={citra.grid5}>
          {data.perPeran.map((p) => (
            <div key={p.id} className={citra.kartu}>
              <p className={citra.kartuNama} style={{ color: "var(--ypt-red)", fontWeight: 400, fontSize: 13 }}>
                {p.label}
              </p>
              <p className={citra.kartuNama} style={{ fontSize: 20 }}>{p.jumlah} orang</p>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <SectionTitle>Perbandingan Skala Kepuasan Keseluruhan</SectionTitle>
      <div className={citra.kartu}>
        {data.perPeran.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0" }}>
            <span style={{ width: 210, fontWeight: 700, color: "var(--ypt-navy)", fontSize: 14 }}>{p.label}</span>
            <span style={{ width: 90, fontSize: 13 }}>{p.jumlah} orang</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ypt-red)" }}>
              {p.skorTotal.toFixed(2).replace(".", ",")}
            </span>
            <span style={{ fontSize: 13, color: "var(--ypt-ink-3)" }}>dari 10 merasa puas</span>
            <span style={{ flex: 1, display: "flex", maxWidth: 260, marginLeft: "auto" }}>
              <ProgressBar value={p.skorTotal * 10} />
            </span>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 16, fontSize: 13, color: "var(--ypt-ink-3)" }}>
        Kartu skor besar dan daftar metrik memakai hook data asli; buka ?preview=ypt setelah
        sinkronisasi untuk memeriksa keduanya. Peran teratas contoh: {peran.label}.
      </p>
    </>
  );
}
