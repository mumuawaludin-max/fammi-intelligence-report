import { IconAlertCircle } from './icons';

export function ErrorState({ title, desc, cta, onCta }) {
  return (
    <div style={{ padding: '80px 26px', textAlign: 'center' }}>
      <div style={{ width: 78, height: 78, borderRadius: '50%', background: 'var(--status-alert-bg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <IconAlertCircle size={34} stroke="var(--status-alert)" strokeWidth={1.8} />
      </div>
      <div className="disp" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 460, margin: '0 auto', lineHeight: 1.55 }}>{desc}</div>
      {cta && <button className="btn-primary" style={{ marginTop: 18 }} onClick={onCta}>{cta}</button>}
    </div>
  );
}
