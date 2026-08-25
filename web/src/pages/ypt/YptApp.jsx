import { useEffect, useState } from "react";
import { YPT_MENUS, YPT_TABS, periodeLabel } from "./yptMeta";
import { useYptPeriodes } from "./useYptPeriodes";
import StepTabs from "./components/StepTabs";
import RaporKarakterPage from "./rapor/RaporKarakterPage";
import CitraSekolahPage from "./citra/CitraSekolahPage";
import SurveyKepuasanPage from "./kepuasan/SurveyKepuasanPage";
import DokumentasiPage from "./dokumentasi/DokumentasiPage";
import tokens from "./yptTokens.module.css";
import styles from "./YptApp.module.css";

/**
 * Shell dashboard Yayasan Pendidikan Telkom -- menggantikan seluruh Header/NavBar FIR biasa,
 * bukan menumpang di atasnya. Gerbang masuknya di App.jsx: hanya akun peran Yayasan yang
 * cakupan[0]-nya YPT_ID yang sampai ke sini.
 *
 * Kenapa shell sendiri: instruksi eksplisit pemilik produk 2026-08-25 ("UI nya akan benar-benar
 * berbeda, khusus untuk yayasan pendidikan telkom saja"). Palet dan tipografinya ikut Figma
 * HaloMumu, di-scope lewat class tokens.scope supaya tidak menjalar ke modul lain.
 */
export default function YptApp({ session, onLogout }) {
  const [menu, setMenu] = useState("rapor");
  const [tab, setTab] = useState("rangkuman");
  const [periode, setPeriode] = useState(null);
  const periodes = useYptPeriodes(session);

  // Periode default = yang terbaru punya data. Tidak menimpa pilihan manual pengguna setelahnya:
  // begitu `periode` terisi dan masih ada di daftar, biarkan apa adanya.
  useEffect(() => {
    if (periodes.length === 0) return;
    setPeriode((prev) => (prev && periodes.includes(prev) ? prev : periodes[0]));
  }, [periodes]);

  function gantiMenu(id) {
    setMenu(id);
    const tabs = YPT_TABS[id] || [];
    setTab(tabs.length > 0 ? tabs[0].id : null);
  }

  const tabs = YPT_TABS[menu] || [];
  const sekolahList = session.schools || [];

  return (
    <div className={`${tokens.scope} ${styles.app}`}>
      <div className={styles.desktopOnly}>
        <h2>Buka di layar lebar</h2>
        <p>
          Dashboard Yayasan Pendidikan Telkom memuat tabel lintas sekolah dan peta wilayah yang
          butuh ruang. Silakan buka lewat komputer atau tablet dalam posisi mendatar.
        </p>
      </div>

      <div className={styles.shellBody}>
        <header className={styles.topbar}>
          <div className={styles.topbarInner}>
            {/* TODO pixel-perfect: ganti wordmark ini dengan logo resmi yang diekspor dari Figma
                (download_assets pada node 84-287) begitu kuota Figma MCP tersedia. Sengaja tidak
                menggambar ulang logonya di sini -- logo yang digambar tangan pasti salah. */}
            <div className={styles.logo}>
              <img
                src="/logo-ypt.svg"
                alt=""
                className={styles.logoMark}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
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

              <span className={styles.periodWrap}>
                <span className={styles.periodLabel}>Periode</span>
                <select
                  className={styles.periodSelect}
                  value={periode || ""}
                  onChange={(e) => setPeriode(e.target.value)}
                  disabled={periodes.length === 0}
                >
                  {periodes.length === 0 && <option value="">Belum ada data</option>}
                  {periodes.map((p) => (
                    <option key={p} value={p}>{periodeLabel(p)}</option>
                  ))}
                </select>
              </span>

              <button type="button" className={styles.logoutBtn} onClick={onLogout}>
                Keluar
              </button>
            </nav>
          </div>
        </header>

        <main className={styles.main}>
          <StepTabs items={tabs} activeId={tab} onChange={setTab} />

          {sekolahList.length === 0 ? (
            <div className={styles.state}>
              <p className={styles.stateTitle}>Belum ada sekolah di bawah yayasan ini</p>
              <p>
                Hubungi Admin Fammi untuk mendaftarkan sekolah ke Yayasan Pendidikan Telkom.
              </p>
            </div>
          ) : (
            <>
              {menu === "rapor" && (
                <RaporKarakterPage session={session} periode={periode} tab={tab} onTabChange={setTab} />
              )}
              {menu === "citra" && (
                <CitraSekolahPage session={session} periode={periode} tab={tab} />
              )}
              {menu === "kepuasan" && (
                <SurveyKepuasanPage session={session} periode={periode} tab={tab} />
              )}
              {menu === "dokumentasi" && (
                <DokumentasiPage session={session} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
