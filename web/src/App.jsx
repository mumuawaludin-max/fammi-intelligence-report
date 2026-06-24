import { useState } from "react";
import { getSession, clearSession } from "./lib/auth";
import { gasClient } from "./lib/gasClient";
import LoginPage from "./pages/LoginPage";
import Header from "./components/Header";
import NavBar from "./components/NavBar";
import PeriodPicker from "./components/PeriodPicker";
import BriefingHero from "./components/BriefingHero";
import FollowupRibbon from "./components/FollowupRibbon";
import MIPage from "./pages/mi/MIPage";
import SiswaPage from "./pages/siswa/SiswaPage";
import styles from "./App.module.css";

const SAMPLE_BRIEFING = {
  teks:
    "Secara umum, SMA Harapan Bangsa menunjukkan perkembangan yang stabil pada periode ini. " +
    "Aspek tanggung jawab dan disiplin masih perlu perhatian di beberapa kelas, " +
    "sementara kecerdasan musikal dan interpersonal mencatat pertumbuhan positif.",
  sumber: ["Rapor Karakter", "Screening", "Multiple Intelligence"],
};

const SAMPLE_FOLLOWUP = [
  {
    id: "TL001",
    action: "Jadwalkan sesi refleksi kelompok untuk kelas dengan skor tanggung jawab di bawah rata-rata sekolah.",
    trigger: "4 kelas mencatat skor tanggung jawab < 60",
    module: "karakter",
    priority: "tinggi",
  },
  {
    id: "TL002",
    action: "Koordinasikan dengan guru BK untuk tindak lanjut siswa dengan indikator risiko pada modul Screening.",
    trigger: "12 siswa teridentifikasi perlu perhatian",
    module: "screening",
    priority: "tinggi",
  },
  {
    id: "TL003",
    action: "Sediakan kegiatan pengayaan berbasis kecerdasan musikal di jam ekstrakurikuler semester depan.",
    trigger: "Kecerdasan musikal mendominasi 38% siswa",
    module: "mi",
    priority: "sedang",
  },
  {
    id: "TL004",
    action: "Diskusikan hasil profil karakter bersama wali kelas pada rapat bulanan pekan ini.",
    trigger: "Laporan bulanan sudah final dan siap dibagikan",
    module: "karakter",
    priority: "sedang",
  },
  {
    id: "TL005",
    action: "Bagikan ringkasan hasil Multiple Intelligence ke orang tua melalui grup komunikasi kelas.",
    trigger: "Data MI periode ini sudah disetujui",
    module: "mi",
    priority: "rendah",
  },
];

export default function App() {
  const [session, setSession]     = useState(() => getSession());
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod]       = useState({ type: "bulanan", period: "Juni 2026" });

  function handleLogin(newSession) { setSession(newSession); }
  function handleLogout() {
    // Cabut token di server (best-effort), lalu bersihkan sesi lokal apa pun hasilnya.
    const token = session?.token;
    if (token) gasClient.post("logout", { token }).catch(() => {});
    clearSession();
    setSession(null);
  }

  if (!session) return <LoginPage onLogin={handleLogin} />;

  if (session.peran === "Siswa") {
    return <SiswaPage session={session} onLogout={handleLogout} />;
  }

  return (
    <div className={styles.app}>
      <Header
        userName={session.nama}
        role={session.peran}
        schoolName="SMA Harapan Bangsa"
        onLogout={handleLogout}
      />
      <NavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        modules={["overview", "karakter", "screening", "mi"]}
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
          <>
            <BriefingHero
              teks={SAMPLE_BRIEFING.teks}
              periode={period.period}
              tipePeriode={period.type}
              sumber={SAMPLE_BRIEFING.sumber}
              isSample
            />
            <FollowupRibbon items={SAMPLE_FOLLOWUP} isSample />
          </>
        )}

        {activeTab === "mi" && (
          <MIPage session={session} periodeId={null} />
        )}

        {(activeTab === "karakter" || activeTab === "screening") && (
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
