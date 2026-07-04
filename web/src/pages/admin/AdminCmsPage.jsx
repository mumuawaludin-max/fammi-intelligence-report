import './admin.css';
import { CmsProvider, useCms } from './store/CmsStore';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ToastHost } from './components/ToastHost';
import { ApprovalDrawer } from './components/ApprovalDrawer';
import { AddSchoolDialog } from './components/AddSchoolDialog';
import { AddUserDialog } from './components/AddUserDialog';
import { EditUserDialog } from './components/EditUserDialog';
import { Dashboard } from './screens/Dashboard';
import { Antrian } from './screens/Antrian';
import { Upload } from './screens/Upload';
import { Gemini } from './screens/Gemini';
import { Sekolah } from './screens/Sekolah';
import { Pengguna } from './screens/Pengguna';

function ScreenSwitch() {
  const { state } = useCms();
  switch (state.screen) {
    case 'dashboard': return <Dashboard />;
    case 'antrian': return <Antrian />;
    case 'upload': return <Upload />;
    case 'gemini': return <Gemini />;
    case 'sekolah': return <Sekolah />;
    case 'pengguna': return <Pengguna />;
    default: return <Dashboard />;
  }
}

function Shell({ session, onLogout }) {
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
