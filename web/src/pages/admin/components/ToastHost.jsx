import { useCms } from '../store/CmsStore';

const DOT_COLOR = {
  alert: '#FF7A8E',
  warn: '#FDD57C',
  safe: '#7EE8B5',
  info: '#9FB8F0',
};

export function ToastHost() {
  const { state } = useCms();
  const toast = state.toast;
  if (!toast) return null;

  return (
    <div className="toast-enter" style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--ink)', color: '#fff', padding: '12px 20px', borderRadius: 12,
      fontSize: 13, fontWeight: 600, boxShadow: '0 12px 32px rgba(33,27,46,.28)', zIndex: 100,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 99, background: DOT_COLOR[toast.kind] || DOT_COLOR.safe }} />
      {toast.msg}
    </div>
  );
}
