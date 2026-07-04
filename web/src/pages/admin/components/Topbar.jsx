import { useCms } from '../store/CmsStore';
import { IconRefresh, IconSearch } from './icons';

const TITLES = {
  dashboard: { title: 'Dashboard Ringkasan', subtitle: () => 'Status seluruh sekolah, upload terbaru, antrean persetujuan' },
  antrian: { title: 'Antrian Persetujuan', subtitle: (n) => n + ' draf menunggu tinjauan · gerbang tayang ke sekolah' },
  upload: { title: 'Upload Data', subtitle: () => 'Import Excel ke Supabase · Karakter · MI · Screening' },
  gemini: { title: 'Trigger & Antrian Gemini', subtitle: () => 'Picu draf briefing/tindak_lanjut on-demand via Edge Function' },
  sekolah: { title: 'Sekolah & Modul', subtitle: () => 'CRUD schools, school_modules, konfigurasi aspek per sekolah' },
  pengguna: { title: 'Pengguna & Peran', subtitle: () => 'Akun per sekolah, PascalCase enum · profiles_peran_check' },
};

export function Topbar() {
  const { data, state, refetch } = useCms();
  const totalPending = data.antrian.length;
  const screenInfo = TITLES[state.screen];

  return (
    <div style={{ height: 60, background: 'var(--surface)', borderBottom: '1px solid var(--line)', padding: '0 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="disp" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{screenInfo.title}</div>
        <span style={{ width: 1, height: 16, background: 'var(--line)' }} />
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{screenInfo.subtitle(totalPending)}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-soft)', padding: '6px 10px 6px 12px', borderRadius: 10, boxShadow: 'inset 0 0 0 1px var(--line)', width: 280 }}>
          <IconSearch size={14} stroke="#7C7689" strokeWidth={2.2} />
          <input className="fld" style={{ background: 'transparent', boxShadow: 'none', padding: 0, fontSize: 12.5 }} placeholder="Cari sekolah, ID, nama…" />
          <span className="kbd">⌘K</span>
        </div>
        <button className="btn-ghost" onClick={refetch} title="Muat ulang data">
          <IconRefresh size={14} />Refresh
        </button>
      </div>
    </div>
  );
}
