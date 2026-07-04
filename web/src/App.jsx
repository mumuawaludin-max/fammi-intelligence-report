import { useState } from "react";
import { getSession, logoutSupabase } from "./lib/auth";
import { useOverviewBriefing } from "./hooks/useOverviewBriefing";
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

export default function App() {
  const [session, setSession]     = useState(() => getSession());
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod]       = useState({ type: "bulanan", period: "Juni 2026" });
  const overview = useOverviewBriefing(session);

  function handleLogin(newSession) { setSession(newSession); }
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

  return (
    <div className={styles.app}>
      <Header
        userName={session.nama}
        role={session.peran}
        schoolName={overview.schoolName || ""}
        onLogout={handleLogout}
      />
      <NavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        modules={["overview", ...(session.modules || [])]}
      />

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

      <main className={styles.main}>
        {activeTab === "overview" && (
          <OverviewTab overview={overview} period={period} />
        )}

        {activeTab === "mi" && (
          <MIPage session={session} periodeId={null} />
        )}

        {activeTab === "karakter" && (
          <KarakterPage session={session} />
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
