import { useState } from 'react';
import { useCms } from '../store/CmsStore';
import { LoadingCards } from '../components/LoadingCards';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { peranColor } from '../data/helpers';
import { IconMoreVertical } from '../components/icons';

const PERAN_ORDER = ['AdminFammi', 'Yayasan', 'KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'WaliKelas', 'OrangTua', 'Siswa'];

export function Pengguna() {
  const { data, loading, error, setAddUserOpen, refetch, bulkResetAndExport, bulkDeleteUsers, session } = useCms();
  const [selected, setSelected] = useState(new Set());
  const [sekolahFilter, setSekolahFilter] = useState('all');
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingCards rows={3} />;
  if (error) {
    return <ErrorState title="Gagal memuat pengguna" desc={error} cta="Muat ulang" onCta={refetch} />;
  }
  if (data.users.length === 0) {
    return <EmptyState title="Belum ada pengguna" desc="Tambah akun pertama untuk memulai." cta="Buat akun baru" onCta={() => setAddUserOpen(true)} />;
  }

  const peranCount = {};
  data.users.forEach(u => { peranCount[u.peran] = (peranCount[u.peran] || 0) + 1; });
  const peranSummary = PERAN_ORDER.map(p => ({ peran: p, count: peranCount[p] || 0, ...peranColor(p) }));

  const filtered = sekolahFilter === 'all' ? data.users : data.users.filter(u => u.sekolah === sekolahFilter);
  const sekolahOptions = [...new Set(data.users.map(u => u.sekolah).filter(Boolean))];

  const toggleOne = (id) => setSelected((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const allChecked = filtered.length > 0 && filtered.every(u => selected.has(u.id));
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(filtered.map(u => u.id)));

  const selectedUsers = data.users.filter(u => selected.has(u.id));
  const doExport = async () => {
    if (selectedUsers.length === 0) return;
    if (!window.confirm(
      `Reset kode khusus untuk ${selectedUsers.length} akun terpilih dan unduh file Excel berisi kode barunya?\n\n` +
      `Kode lama masing-masing akun langsung tidak berlaku setelah ini.`
    )) return;
    setBusy(true);
    try {
      await bulkResetAndExport(selectedUsers);
      setSelected(new Set());
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    const targets = selectedUsers.filter(u => u.id !== session?.user_id);
    if (targets.length === 0) return;
    const skippedSelf = selectedUsers.length !== targets.length;
    if (!window.confirm(
      `Hapus ${targets.length} akun terpilih? Aksi ini permanen: akun langsung tidak bisa login lagi dan tidak bisa dipulihkan.` +
      (skippedSelf ? '\n\n(Akunmu sendiri yang sedang login dilewati, tidak ikut dihapus.)' : '')
    )) return;
    setBusy(true);
    try {
      await bulkDeleteUsers(targets);
      setSelected(new Set());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: '22px 26px 40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 10, marginBottom: 18 }}>
        {peranSummary.map((p, i) => (
          <div key={i} className="card" style={{ padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span className="pill" style={{ background: p.bg, color: p.ink, fontSize: 10 }}>{p.label}</span>
            </div>
            <div className="disp" style={{ fontSize: 24, fontWeight: 700, color: p.ink, lineHeight: 1 }}>{p.count}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>akun</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select className="fld" style={{ width: 220 }} value={sekolahFilter} onChange={(e) => { setSekolahFilter(e.target.value); setSelected(new Set()); }}>
            <option value="all">Semua sekolah</option>
            {sekolahOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {selected.size > 0 && (
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{selected.size} akun dipilih</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {selected.size > 0 && (
            <>
              <button className="btn-secondary" onClick={doExport} disabled={busy}>
                {busy ? 'Memproses…' : `⬇ Reset & Export kode (${selected.size})`}
              </button>
              <button className="btn-secondary" style={{ color: 'var(--status-alert)' }} onClick={doDelete} disabled={busy}>
                {busy ? 'Memproses…' : `🗑 Hapus akun (${selected.size})`}
              </button>
            </>
          )}
          <button className="btn-primary" onClick={() => setAddUserOpen(true)}>+ Buat akun baru</button>
        </div>
      </div>

      <div style={{ padding: '10px 14px', background: 'var(--info-soft)', borderRadius: 8, fontSize: 11.5, color: 'var(--info)', marginBottom: 14, lineHeight: 1.4 }}>
        💡 Password lama tidak bisa diambil ulang (Supabase cuma simpan hash) — "Reset & Export" akan generate kode BARU untuk akun terpilih lalu unduh file Excel-nya. Kode lama langsung tidak berlaku.
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 32 }}><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>
                <th>Nama</th>
                <th>Peran</th>
                <th>Cakupan</th>
                <th>Sekolah</th>
                <th>Dibuat</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <UserRow key={u.id} u={u} checked={selected.has(u.id)} onToggle={() => toggleOne(u.id)} isSelf={u.id === session?.user_id} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--info-soft)', borderRadius: 8, fontSize: 11.5, color: 'var(--info)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 14 }}>ℹ</span>
        <div>
          Nilai peran ditegakkan lewat <span className="mono" style={{ fontSize: 11 }}>profiles_peran_check</span> constraint. Wajib PascalCase persis: <span className="mono" style={{ fontSize: 11 }}>'AdminFammi','Yayasan','KepalaSekolah','WakilKepalaSekolah','Manajemen','WaliKelas','OrangTua','Siswa'</span>. Nilai lain akan ditolak Postgres.
        </div>
      </div>
    </div>
  );
}

function UserRow({ u, checked, onToggle, isSelf }) {
  const { resetPassword, deleteUser, setEditUserTarget } = useCms();
  const pc = peranColor(u.peran);
  const initials = (u.nama || u.username).split(' ').slice(0, 2).map(x => x[0]).join('').toUpperCase();
  const [open, setOpen] = useState(false);

  const onReset = async () => {
    setOpen(false);
    if (!window.confirm(`Reset kode khusus untuk ${u.nama || u.username}? Kode lama langsung tidak berlaku.`)) return;
    await resetPassword(u.id, u.username);
  };

  const onEdit = () => {
    setOpen(false);
    setEditUserTarget(u);
  };

  const onDelete = async () => {
    setOpen(false);
    if (!window.confirm(`Hapus akun ${u.nama || u.username}? Aksi ini permanen: akun langsung tidak bisa login lagi dan tidak bisa dipulihkan.`)) return;
    await deleteUser(u.id, u.nama || u.username);
  };

  return (
    <tr className="hover-row">
      <td><input type="checkbox" checked={checked} onChange={onToggle} /></td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: pc.bg, color: pc.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: 12 }}>{initials}</div>
          <div>
            <div style={{ fontWeight: 700 }}>{u.nama || u.username}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{u.username}</div>
          </div>
        </div>
      </td>
      <td><span className="pill" style={{ background: pc.bg, color: pc.ink }}>{pc.label}</span></td>
      <td style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{u.cakupan || '—'}</td>
      <td className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{u.sekolah || '—'}</td>
      <td className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>{u.createdAt ? u.createdAt.slice(0, 10) : '—'}</td>
      <td style={{ textAlign: 'right', position: 'relative' }}>
        <button className="btn-ghost" style={{ padding: 4 }} onClick={() => setOpen((o) => !o)}>
          <IconMoreVertical size={14} stroke="#7C7689" />
        </button>
        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
            <div style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, boxShadow: '0 12px 28px rgba(33,27,46,.18)', zIndex: 50, minWidth: 160 }}>
              <button className="btn-ghost" style={{ width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: 12.5, borderRadius: 0 }} onClick={onEdit}>
                Edit pengguna
              </button>
              <button className="btn-ghost" style={{ width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: 12.5, borderRadius: 0 }} onClick={onReset}>
                Reset kode khusus
              </button>
              <button
                className="btn-ghost"
                style={{ width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: 12.5, borderRadius: 0, color: isSelf ? 'var(--ink-4)' : 'var(--status-alert)' }}
                onClick={onDelete}
                disabled={isSelf}
                title={isSelf ? 'Tidak bisa menghapus akun sendiri yang sedang login' : undefined}
              >
                Hapus pengguna
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
}
