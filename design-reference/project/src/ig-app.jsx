// ============================================================
// INTELI-GEN · APP — role switcher + scope-aware rendering.
// ============================================================
const { useState: useStateApp } = React;

function scopeMeta(role) {
  if (role === "siswa") {
    const S = window.STUDENT;
    return { scopeKicker: "Siswa", scopeName: S.nama, parentName: `${S.kelas} · ${S.sekolah}` };
  }
  if (role === "ortu") {
    const S = window.STUDENT;
    return { scopeKicker: "Orang Tua", scopeName: `Ananda ${S.nama}`, parentName: `${S.kelas} · ${S.sekolah}` };
  }
  const D = window.COHORTS[role];
  return { scopeKicker: D.scopeKicker, scopeName: D.scopeName, parentName: D.parentName };
}

function App() {
  const [role, setRole] = useStateApp("siswa");
  const meta = scopeMeta(role);

  let body;
  if (role === "siswa") body = <window.IndividualView voice="siswa" />;
  else if (role === "ortu") body = <window.IndividualView voice="ortu" />;
  else body = <window.CohortView scope={role} />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-2)" }}>
      <window.AppBar role={role} setRole={setRole} {...meta} />
      <main key={role} style={{ ...window.SHELL_IG, padding: "30px 32px 90px", animation: "igFade .35s ease" }}>
        {body}
      </main>
      <footer style={{ borderTop: "1px solid var(--line-warm)", background: "var(--bg)" }}>
        <div style={{ ...window.SHELL_IG, padding: "22px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--ink-4)" }}>Fammi INTELI-GEN · Peta Kecerdasan &amp; Belajar · Data contoh untuk peragaan desain.</span>
          <span style={{ fontSize: 12, color: "var(--ink-4)" }}>PT. Fammi Edutech Indonesia · 2026</span>
        </div>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
