import './admin.css';
import { CmsProvider, useCms } from './store/CmsStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ToastHost } from './components/ToastHost';
import { ApprovalDrawer } from './components/ApprovalDrawer';
import { AddSchoolDialog } from './components/AddSchoolDialog';
import { AddYayasanDialog } from './components/AddYayasanDialog';
import { AddUserDialog } from './components/AddUserDialog';
import { EditUserDialog } from './components/EditUserDialog';
import { Dashboard } from './screens/Dashboard';
import { Antrian } from './screens/Antrian';
import { PersetujuanMi } from './screens/PersetujuanMi';
import { Upload } from './screens/Upload';
import { Gemini } from './screens/Gemini';
import { Sekolah } from './screens/Sekolah';
import { Pengguna } from './screens/Pengguna';

function Screen({ name }) {
  switch (name) {
    case 'dashboard': return <Dashboard />;
    case 'antrian': return <Antrian />;
    case 'persetujuan-mi': return <PersetujuanMi />;
    case 'upload': return <Upload />;
    case 'gemini': return <Gemini />;
    case 'sekolah': return <Sekolah />;
    case 'pengguna': return <Pengguna />;
    default: return <Dashboard />;
  }
}

// key={state.screen} me-remount ErrorBoundary tiap ganti layar, supaya pindah ke layar lain
// dan balik lagi otomatis coba render ulang dari nol (bukan tersangkut di fallback error lama).
function ScreenSwitch() {
  const { state } = useCms();
  return (
    <ErrorBoundary key={state.screen}>
      <Screen name={state.screen} />
    </ErrorBoundary>
  );
}

function Shell({ session, onLogout }) {
  // Sidebar/Topbar/tiap layar mengasumsikan `data` sudah terisi (mis. Sidebar.jsx:16
  // `data.antrian.length` tanpa null-check) -- `data` dari useAdminCmsData mulai sebagai
  // `null` sampai fetch pertama (13 query paralel) selesai. Tanpa gerbang ini, Shell tetap
  // me-render Sidebar dkk selagi `data` masih null, meng-crash SELURUH tree (tidak ada
  // ErrorBoundary di luar area ini) -- gejala nyata: halaman putih kosong total, bukan cuma
  // layar kontennya, dan begitu React unmount karena error tidak tertangani ia TIDAK
  // otomatis render ulang lagi walau datanya sudah siap sepersekian detik kemudian, jadi
  // makin lambat/lag jaringannya, makin sering muncul. Refetch di kemudian hari aman (data
  // lama tetap dipertahankan sampai data baru datang, lihat useAdminCmsData fetchAll), jadi
  // gerbang ini cukup untuk load PERTAMA saja.
  const { loading, error, data, refetch } = useCms();
  if (!data && loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--ink-3)', fontSize: 13.5 }}>
        Memuat CMS Admin Fammi…
      </div>
    );
  }
  if (!data && error) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 12, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Gagal memuat data CMS</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', maxWidth: 420 }}>{error}</div>
        <button className="btn-primary" onClick={refetch}>Coba lagi</button>
      </div>
    );
  }

  return (
    <div className="admin-cms-root" style={{ display: 'grid', gridTemplateColumns: '236px 1fr', height: '100vh', minHeight: 720 }}>
      <Sidebar session={session} onLogout={onLogout} />
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
          <ScreenSwitch />
        </div>
      </div>
      <ApprovalDrawer />
      <AddSchoolDialog />
      <AddYayasanDialog />
      <AddUserDialog />
      <EditUserDialog />
      <ToastHost />
    </div>
  );
}

export default function AdminCmsPage({ session, onLogout }) {
  return (
    <CmsProvider session={session}>
      <Shell session={session} onLogout={onLogout} />
    </CmsProvider>
  );
}
