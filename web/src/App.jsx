import { useEffect, useState } from "react";
import { getSession, logoutSupabase, refreshSession, saveSession, clearSession } from "./lib/auth";
import { useOverviewBriefing } from "./hooks/useOverviewBriefing";
import { useAvailablePeriods } from "./hooks/useAvailablePeriods";
import LoginPage from "./pages/LoginPage";
import Header from "./components/Header";
import NavBar from "./components/NavBar";
import PeriodPicker from "./components/PeriodPicker";
import BriefingHero from "./components/BriefingHero";
import FollowupRibbon from "./components/FollowupRibbon";
import MIPage from "./pages/mi/MIPage";
import KarakterPage from "./pages/karakter/KarakterPage";
import CwPage from "./pages/cw/CwPage";
import SiswaPage from "./pages/siswa/SiswaPage";
import AdminCmsPage from "./pages/admin/AdminCmsPage";
import styles from "./App.module.css";

function periodeLabel(periodeId) {
  if (!periodeId) return "";
  const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const [y, m] = periodeId.split("-").map(Number);
  return `${BULAN[m - 1] || ""} ${y}`.trim();
}

function OverviewTab({ overview, period }) {
  const { loading, error, schoolName, briefing, tindakLanjut, periode } = overview;

  if (loading) {
    return <p className={styles.placeholderNote}>Memuat ringkasan…</p>;
  }
  if (error) {
    return <p className={styles.placeholderNote}>Gagal memuat ringkasan: {error}</p>;
  }
  if (!briefing && tindakLanjut.length === 0) {
    return <p className={styles.placeholderNote}>Belum ada briefing atau tindak lanjut yang disetujui untuk {schoolName || "sekolah ini"} pada periode ini.</p>;
  }

  return (
    <>
      {briefing && (
        <BriefingHero
          teks={briefing.teks}
          periode={periodeLabel(periode) || period.period}
          tipePeriode={period.type}
          sumber={Array.isArray(briefing.sumber) ? briefing.sumber : [briefing.sumber].filter(Boolean)}
        />
      )}
      {tindakLanjut.length > 0 && (
        <FollowupRibbon
          items={tindakLanjut.map((r) => ({
            id: r.id, action: r.action, trigger: r.trigger_desc, module: r.modul, priority: r.priority,
          }))}
        />
      )}
    </>
  );
}

// Peran yang memakai shell "satu modul, periode di topbar, tanpa tab Ringkasan".
// Wali Kelas & Yayasan ikut shell ini karena modul yang dilihat cuma Rapor Karakter, sama seperti Kepsek.
// Manajemen (peran modul CW) juga single-module, cuma modul defaultnya "cw", bukan "karakter".
function isSingleModuleShellPeran(peran) {
  return peran === "KepalaSekolah" || peran === "WakilKepalaSekolah" || peran === "WaliKelas"
    || peran === "Yayasan" || peran === "Manajemen";
}

/** Modul default kalau session.modules kosong -- Manajemen ke CW, peran lain ke Karakter. */
function defaultModuleForPeran(peran) {
  return peran === "Manajemen" ? "cw" : "karakter";
}

export default function App() {
  const [session, setSession]     = useState(() => getSession());
  const [activeTab, setActiveTab] = useState(() => {
    const peran = getSession()?.peran;
    return isSingleModuleShellPeran(peran) ? defaultModuleForPeran(peran) : "overview";
  });
  const [period, setPeriod]       = useState({ type: "bulanan", period: "Juni 2026" });
  const [loginNotice, setLoginNotice] = useState("");
  const overview = useOverviewBriefing(session);
  const isKepsekShell = isSingleModuleShellPeran(session?.peran);
  const availablePeriods = useAvailablePeriods(session);

  // Sesi di sessionStorage bisa sudah basi (token dicabut/kedaluwarsa di server, atau peran
  // /sekolah/cakupan user ini sudah diubah admin sejak login terakhir) tanpa browser tahu --
  // cek ke server begitu App dimuat, bukan cuma percaya isi sessionStorage begitu saja.
  useEffect(() => {
    if (!getSession()) return;
    let alive = true;
    refreshSession().then((fresh) => {
      if (!alive) return;
      if (!fresh) {
        clearSession();
        setSession(null);
        setLoginNotice("Sesi login sudah berakhir. Silakan masuk kembali.");
        return;
      }
      saveSession(fresh);
      setSession(fresh);
    });
    return () => { alive = false; };
  }, []);

  // Begitu daftar periode asli sekolah ini dimuat, ganti default palsu ("Juni 2026") ke
  // periode terbaru yang benar-benar punya data. Tidak menimpa pilihan manual user berikutnya.
  useEffect(() => {
    if (!isKepsekShell || availablePeriods.length === 0) return;
    setPeriod((prev) => (
      prev.type === "bulanan" && availablePeriods.includes(prev.period)
        ? prev
        : { type: "bulanan", period: availablePeriods[0] }
    ));
  }, [isKepsekShell, availablePeriods]);

  function handleLogin(newSession) {
    setLoginNotice("");
    setSession(newSession);
    setActiveTab(
      isSingleModuleShellPeran(newSession.peran) ? defaultModuleForPeran(newSession.peran) : "overview"
    );
  }
  function handleLogout() {
    logoutSupabase();
    setSession(null);
  }

  if (!session) return <LoginPage onLogin={handleLogin} notice={loginNotice} />;

  // Siswa dan OrangTua sama-sama peran yang di-scope ke satu murid_id (lihat CLAUDE.md:
  // mobile-first untuk keduanya) -- SiswaPage/BakatView cuma bergantung pada session.murid_id,
  // tidak pernah mengecek peran (lihat SiswaPage.jsx), jadi aman dipakai untuk keduanya. Akun
  // OrangTua yang dibuat otomatis saat approve MI (admin-actions ensureOrangTuaAccount) sempat
  // salah jatuh ke shell desktop generik (tab "mi" -> MIPage agregat sekolah, bukan laporan
  // individu anaknya) karena kondisi ini dulu cuma mengecek "Siswa".
  if (session.peran === "Siswa" || session.peran === "OrangTua") {
    return <SiswaPage session={session} onLogout={handleLogout} />;
  }

  if (session.peran === "AdminFammi") {
    return <AdminCmsPage session={session} onLogout={handleLogout} />;
  }

  const bulananOptions = availablePeriods.map((id) => ({ id, label: periodeLabel(id) }));
  const shellModules = (session.modules || []).filter((m) => m !== "overview");
  const modules = isKepsekShell
    ? (shellModules.length ? shellModules : [defaultModuleForPeran(session.peran)])
    : ["overview", ...(session.modules || [])];

  // PeriodPicker disembunyikan untuk Manajemen: daftar periode datang dari useAvailablePeriods
  // yang sumbernya masih tabel modul Karakter (karakter_summary/briefing/tindak_lanjut), belum
  // ada padanan tabel CW. Menampilkan picker kosong ke Manajemen cuma bikin bingung -- tampilkan
  // lagi begitu tabel CW dan hook periodenya ada.
  const showPeriodPicker = isKepsekShell && session.peran !== "Manajemen";

  const navBar = (
    <NavBar
      activeTab={activeTab}
      onTabChange={setActiveTab}
      modules={modules}
      pillNav={isKepsekShell}
    />
  );

  return (
    <div className={styles.app}>
      <Header
        userName={session.nama}
        role={session.peran}
        schoolName={overview.schoolName || ""}
        onLogout={handleLogout}
        period={period}
        onPeriodChange={setPeriod}
        showPeriod={showPeriodPicker}
        bulananOptions={bulananOptions}
        inlineNav={isKepsekShell ? navBar : null}
      />
      {!isKepsekShell && navBar}

      {!isKepsekShell && (
        <div className={styles.toolbar}>
          <div className={styles.toolbarInner}>
            <span className={styles.toolbarLabel}>Periode</span>
            <PeriodPicker
              selectedType={period.type}
              selectedPeriod={period.period}
              onSelect={setPeriod}
            />
          </div>
        </div>
      )}

      <main className={`${styles.main} ${isKepsekShell ? styles.mainFull : ""}`}>
        {activeTab === "overview" && (
          <OverviewTab overview={overview} period={period} />
        )}

        {activeTab === "mi" && (
          <MIPage session={session} periodeId={null} />
        )}

        {activeTab === "karakter" && (
          <KarakterPage session={session} periodeId={isKepsekShell ? period.period : null} />
        )}

        {activeTab === "cw" && <CwPage session={session} />}

        {activeTab === "screening" && (
          <div className={styles.placeholder}>
            <p className={styles.placeholderTab}>{activeTab}</p>
            <p className={styles.placeholderPeriod}>
              {period.type} · {period.period}
            </p>
            <p className={styles.placeholderNote}>Modul ini belum dibangun.</p>
          </div>
        )}
      </main>
    </div>
  );
}
