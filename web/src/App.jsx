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
import CwKaryawanPage from "./pages/cw/CwKaryawanPage";
import ScPage from "./pages/sc/ScPage";
import ScKaryawanPage from "./pages/sc/ScKaryawanPage";
import PaPage from "./pages/pa/PaPage";
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
// Manajemen (sisi pimpinan modul CW/SC) juga single-module, defaultnya "cw" atau "sc" tergantung
// session.modules (lihat defaultModuleForPeran).
// Karyawan SENGAJA TIDAK di sini -- dia dapat shell mandiri (CwKaryawanPage, mobile-only,
// pola sama dengan Siswa/OrangTua), bukan shell desktop generik ini. Lihat early-return di
// bawah, sebelum kode ini pernah dipakai.
/** Sub-tab pimpinan modul School Culture, dirender menyatu di baris Header saat modul SC aktif. */
const SC_SUB_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "individu", label: "Laporan Individu" },
];

function isSingleModuleShellPeran(peran) {
  return peran === "KepalaSekolah" || peran === "WakilKepalaSekolah" || peran === "WaliKelas"
    || peran === "Yayasan" || peran === "Manajemen";
}

// Urutan prioritas kalau session.modules punya lebih dari satu entitlement aktif -- dipakai
// supaya modul default begitu login stabil dan cocok dengan tab paling kiri yang terlihat di
// NavBar (lihat NAV_ITEMS di components/NavBar.jsx), bukan urutan acak dari database.
const URUTAN_MODUL_DEFAULT = ["karakter", "screening", "mi", "cw", "sc", "pa"];

/**
 * Modul default begitu login (atau kalau session.modules kosong). SEBELUMNYA hardcode
 * "karakter" untuk semua peran selain Manajemen, tidak peduli modul apa yang sungguhan aktif
 * untuk sekolah itu -- akun Yayasan yang cuma punya modul "pa" (mis. Sekolah Islam Athirah)
 * jadi mendarat di KarakterPage yang datanya memang tidak pernah ada untuk sekolah itu, muncul
 * sebagai "Gagal memuat data" yang membingungkan padahal bukan bug data, cuma salah landing.
 *
 * Sekarang: ikuti session.modules kalau ada isinya (peran mana pun, bukan cuma Manajemen),
 * lewat URUTAN_MODUL_DEFAULT supaya defaultnya stabil kalau lebih dari satu modul aktif.
 * Fallback "karakter" HANYA kalau modules benar-benar kosong (entitlement belum diatur sama
 * sekali) -- jaring pengaman lama, bukan asumsi modul yang benar.
 */
function defaultModuleForPeran(peran, modules = []) {
  const aktif = (modules || []).filter((m) => m !== "overview");
  if (peran === "Manajemen") {
    if (aktif.includes("sc")) return "sc";
    if (aktif.includes("cw")) return "cw";
    return "cw";
  }
  const terurut = URUTAN_MODUL_DEFAULT.filter((m) => aktif.includes(m));
  return terurut[0] || "karakter";
}

export default function App() {
  const [session, setSession]     = useState(() => getSession());
  const [activeTab, setActiveTab] = useState(() => {
    const initialSession = getSession();
    const peran = initialSession?.peran;
    return isSingleModuleShellPeran(peran)
      ? defaultModuleForPeran(peran, initialSession?.modules)
      : "overview";
  });
  const [period, setPeriod]       = useState({ type: "bulanan", period: "Juni 2026" });
  const [loginNotice, setLoginNotice] = useState("");
  // Sub-tab School Culture (Dashboard/Laporan Individu) -- diangkat ke sini (bukan state
  // internal ScPage.jsx) supaya bisa dirender menyatu di baris Header yang sama dengan nav
  // modul (inlineNav), persis instruksi pemilik produk.
  const [scTab, setScTab] = useState("dashboard");
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
      isSingleModuleShellPeran(newSession.peran)
        ? defaultModuleForPeran(newSession.peran, newSession.modules)
        : "overview"
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

  // Karyawan: padanan dari Siswa/OrangTua -- laporan pribadi, mobile-only, shell sendiri
  // sepenuhnya di luar Header/NavBar/main desktop di bawah. Lihat CwKaryawanPage.jsx untuk
  // kenapa ini WAJIB early-return, bukan cuma dikecilkan pakai CSS responsive.
  // Dua modul "budaya organisasi" berbagi peran Karyawan yang sama (CW korporat, SC sekolah) --
  // session.modules (entitlement school_modules) yang membedakan mana yang dirender untuk
  // sekolah/organisasi ini, fallback ke CW kalau tidak ada penanda "sc" (jaring pengaman lama).
  if (session.peran === "Karyawan") {
    return (session.modules || []).includes("sc")
      ? <ScKaryawanPage session={session} onLogout={handleLogout} />
      : <CwKaryawanPage session={session} onLogout={handleLogout} />;
  }

  if (session.peran === "AdminFammi") {
    return <AdminCmsPage session={session} onLogout={handleLogout} />;
  }

  const bulananOptions = availablePeriods.map((id) => ({ id, label: periodeLabel(id) }));
  const shellModules = (session.modules || []).filter((m) => m !== "overview");
  const modules = isKepsekShell
    ? (shellModules.length ? shellModules : [defaultModuleForPeran(session.peran, session.modules)])
    : ["overview", ...(session.modules || [])];

  // PeriodPicker disembunyikan untuk Manajemen: daftar periode datang dari useAvailablePeriods
  // yang sumbernya masih tabel modul Karakter (karakter_summary/briefing/tindak_lanjut), belum
  // ada padanan tabel CW. Menampilkan picker kosong cuma bikin bingung -- tampilkan lagi begitu
  // tabel CW dan hook periodenya ada. (Karyawan tidak pernah sampai sini, lihat early-return.)
  const showPeriodPicker = isKepsekShell && session.peran !== "Manajemen";

  const navBar = (
    <NavBar
      activeTab={activeTab}
      onTabChange={setActiveTab}
      modules={modules}
      pillNav={isKepsekShell}
    />
  );

  // Sub-tab School Culture, cuma tampil menyatu di baris Header yang sama saat modul SC aktif --
  // lihat catatan lengkap di deklarasi state scTab.
  const scSubNav = activeTab === "sc" ? (
    <NavBar
      items={SC_SUB_TABS}
      activeTab={scTab}
      onTabChange={setScTab}
      pillNav
    />
  ) : null;

  return (
    <div className={styles.app}>
      <Header
        userName={session.nama}
        role={session.peran}
        schoolName={overview.schoolName || ""}
        schoolLogoUrl={overview.schoolLogoUrl || null}
        onLogout={handleLogout}
        period={period}
        onPeriodChange={setPeriod}
        showPeriod={showPeriodPicker}
        bulananOptions={bulananOptions}
        inlineNav={isKepsekShell ? (<>{navBar}{scSubNav}</>) : null}
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

        {activeTab === "sc" && <ScPage session={session} tab={scTab} />}

        {/* Perilaku Anak: modul tampilan-dulu, data masih contoh (lihat pa/pa.mock.js).
            Aktif untuk sekolah yang punya penanda "pa" di school_modules. */}
        {activeTab === "pa" && <PaPage session={{ ...session, school_name: overview.schoolName }} />}

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
