import { useEffect, useState } from "react";
import { getSession, logoutSupabase, refreshSessionModules } from "./lib/auth";
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

// Peran yang memakai shell "satu modul (Rapor Karakter), periode di topbar, tanpa tab Ringkasan".
// Wali Kelas & Yayasan ikut shell ini karena modul yang dilihat cuma Rapor Karakter, sama seperti Kepsek.
function isKarakterShellPeran(peran) {
  return peran === "KepalaSekolah" || peran === "WakilKepalaSekolah" || peran === "WaliKelas" || peran === "Yayasan";
}

export default function App() {
  const [session, setSession]     = useState(() => getSession());
  const [activeTab, setActiveTab] = useState(() => (isKarakterShellPeran(getSession()?.peran) ? "karakter" : "overview"));
  const [period, setPeriod]       = useState({ type: "bulanan", period: "Juni 2026" });
  const overview = useOverviewBriefing(session);
  const isKepsekShell = isKarakterShellPeran(session?.peran);
  const availablePeriods = useAvailablePeriods(session);

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

  // session.modules dibaca sekali dari sessionStorage (lihat auth.js) -- kalau AdminFammi
  // meng-ON/OFF-kan modul sekolah setelah user ini login, muat ulang halaman biasa tidak
  // akan pernah mengambil perubahan itu tanpa baris ini, karena getSession() cuma baca cache
  // lokal. Refresh sekali tiap App dimuat cukup untuk kasus "admin baru saja aktifkan modul,
  // reload aja" tanpa perlu polling terus-menerus.
  useEffect(() => {
    if (!session) return;
    let alive = true;
    refreshSessionModules(session).then((next) => {
      if (alive && next !== session) setSession(next);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user_id]);

  function handleLogin(newSession) {
    setSession(newSession);
    setActiveTab(isKarakterShellPeran(newSession.peran) ? "karakter" : "overview");
  }
  function handleLogout() {
    logoutSupabase();
    setSession(null);
  }

  if (!session) return <LoginPage onLogin={handleLogin} />;

  if (session.peran === "Siswa") {
    return <SiswaPage session={session} onLogout={handleLogout} />;
  }

  if (session.peran === "AdminFammi") {
    return <AdminCmsPage session={session} onLogout={handleLogout} />;
  }

  const bulananOptions = availablePeriods.map((id) => ({ id, label: periodeLabel(id) }));
  const shellModules = (session.modules || []).filter((m) => m !== "overview");
  const modules = isKepsekShell
    ? (shellModules.length ? shellModules : ["karakter"])
    : ["overview", ...(session.modules || [])];

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
        showPeriod={isKepsekShell}
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
