const { useState: useStateWM } = React;

// ============================================================
// STUDENT PROFILE MODAL
// ============================================================
function WStudentModal({ id, onClose }) {
  const s = window.STUDENTS.find((x) => x.id === id);
  if (!s) return null;
  const st = window.W_STATUS[s.scr];
  const intels = [...window.INTEL].map((i) => ({ ...i, level: window.intelLevel(s, i.code) }))
    .sort((a, b) => order(b.level) - order(a.level));

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(28,20,46,0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 24px", overflowY: "auto", animation: "fadeIn .16s ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-pop)", width: "100%", maxWidth: 720, overflow: "hidden" }}>
        {/* header */}
        <div style={{ padding: "26px 30px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 15, minWidth: 0 }}>
            <span style={{ width: 52, height: 52, borderRadius: 15, background: "var(--ungu)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 18, flex: "none" }}>{window.initials(s.name)}</span>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>{s.name}</h2>
              <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--ink-3)" }}>Kelas X-A · SMA Al Fath Cireundeu</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <window.WStatusPill s={s.scr} />
            <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: 11, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div style={{ padding: "24px 30px 30px", display: "flex", flexDirection: "column", gap: 22 }}>
          {/* karakter + screening */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "var(--surface-soft)", border: "1px solid var(--line)", borderRadius: 14, padding: "18px 18px" }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>Capaian karakter</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 30, fontWeight: 800, color: "var(--ungu)", letterSpacing: "-.02em", lineHeight: 1 }}>{s.kar}%</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "var(--ink-3)" }}><window.WTrend t={s.karTrend} /> {s.karTrend}</span>
              </div>
              <div style={{ height: 8, background: "var(--ungu-050)", borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${s.kar}%`, height: "100%", background: "var(--ungu-300)", borderRadius: 99 }} /></div>
            </div>
            <div style={{ background: st.bg, border: "1px solid " + st.bg, borderRadius: 14, padding: "18px 18px" }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>Status Screening</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: st.fg, marginBottom: 6 }}>{st.label}</div>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)" }}>{s.scrNote ? <>Aspek yang perlu dijaga: <b style={{ color: "var(--ink)" }}>{s.scrNote}</b>.</> : "Tidak ada aspek yang menonjol perlu perhatian."}</p>
            </div>
          </div>

          {/* MI profile */}
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>Profil kecerdasan</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 28px" }}>
              {intels.map((it) => {
                const ls = window.LEVEL_STYLE[it.level];
                const MIc = window.INTEL_ICON[it.code];
                return (
                  <div key={it.code} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
                      <span style={{ width: 28, height: 28, borderRadius: 8, background: ls.bg, color: it.level === "Berkembang" ? "var(--ink-3)" : "var(--ungu)", display: "grid", placeItems: "center", flex: "none" }}><MIc size={16} /></span> {it.name}
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: ls.fg, background: ls.bg, padding: "3px 10px", borderRadius: 99 }}>{it.level}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* support */}
          <div style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "16px 18px", background: "var(--ungu-050)", borderRadius: 14 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: "#fff", color: "var(--ungu)", display: "grid", placeItems: "center", flex: "none" }}><window.IconHeart size={17} /></span>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>Dukungan yang dibutuhkan di rumah</div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>{s.support}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
const order = (l) => l === "Kuat" ? 2 : l === "Sedang" ? 1 : 0;

// ============================================================
// KARAKTER (kelas)
// ============================================================
function WKarakterView() {
  const C = window.W_CLASS;
  const sortedKar = [...window.STUDENTS].sort((a, b) => b.kar - a.kar);
  const best = sortedKar.slice(0, 5);
  const attn = sortedKar.slice(-5).reverse();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <FocusIntro Icon={window.IconHeart} title="Rapor Karakter" text="Enam karakter custom SMA Al Fath, dinilai bersama dari sekolah dan rumah. Berikut capaian kelas X-A beserta siswa yang menonjol dan yang perlu didampingi." />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "24px 24px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>Capaian per karakter</h3>
            <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Rata-rata kelas <b style={{ color: "var(--ink)" }}>{C.karakter}%</b></span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {C.chars.map((c, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "190px 1fr 96px", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{c.name}</span>
                <div style={{ height: 8, background: "var(--ungu-050)", borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${c.val}%`, height: "100%", background: i === 0 ? "var(--ungu)" : "var(--ungu-300)", borderRadius: 99 }} /></div>
                <span style={{ fontSize: 12.5, textAlign: "right", color: "var(--ink-2)" }}><b style={{ color: "var(--ink)" }}>{c.val}%</b> <window.WTrend t={c.trend} /></span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <MiniHL label="Tertinggi" name={C.chars[0].name} val={C.chars[0].val} />
            <MiniHL label="Perlu dibiasakan" name={C.chars[C.chars.length - 1].name} val={C.chars[C.chars.length - 1].val} tone="perhatian" />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <RankList title="Siswa terbaik" rows={best} tone="aman" />
          <RankList title="Siswa perlu perhatian" rows={attn} tone="perhatian" />
        </div>
      </div>
    </div>
  );
}

function MiniHL({ label, name, val, tone }) {
  const c = tone === "perhatian" ? "var(--perhatian)" : "var(--aman)";
  const bg = tone === "perhatian" ? "var(--perhatian-bg)" : "var(--aman-bg)";
  return (
    <div style={{ flex: 1, background: bg, borderRadius: 13, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: c, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 5 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>{name}</span>
        <span style={{ fontSize: 14.5, fontWeight: 800, color: c }}>{val}%</span>
      </div>
    </div>
  );
}

function RankList({ title, rows, tone }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "20px 22px" }}>
      <h3 style={{ margin: "0 0 14px", fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {rows.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 22, fontSize: 12, fontWeight: 700, color: "var(--ink-4)" }}>{i + 1}</span>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 11, flex: "none" }}>{window.initials(s.name)}</span>
            <span style={{ flex: 1, fontSize: 13, color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
            <b style={{ fontSize: 13, color: tone === "perhatian" ? "var(--perhatian)" : "var(--ink)" }}>{s.kar}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SCREENING (kelas)
// ============================================================
function WScreeningView({ openStudent }) {
  const C = window.W_CLASS;
  const flagged = window.STUDENTS.filter((s) => s.scr !== "aman");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <FocusIntro Icon={window.IconShield} title="Screening Perilaku & Mental" text="Lima aspek HEART untuk menjaga kesehatan perilaku dan mental siswa. Status disajikan ringkas; pembahasan tiap anak sebaiknya bersama guru BK." />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "24px 24px" }}>
          <h3 style={{ margin: "0 0 18px", fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>Sebaran status per aspek</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {C.aspects.map((a, i) => {
              const t = a.aman + a.perhatian + a.waspada;
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "150px 1fr 130px", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{a.name}</span>
                  <window.WSplit amanPct={a.aman / t * 100} perhatianPct={a.perhatian / t * 100} waspadaPct={a.waspada / t * 100} />
                  <span style={{ fontSize: 11.5, color: "var(--ink-3)", textAlign: "right" }}>{a.aman} aman · {a.waspada} waspada</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            {[["Aman", "var(--aman)"], ["Perlu perhatian", "var(--perhatian)"], ["Perlu diwaspadai", "var(--waspada)"]].map(([l, c]) => (
              <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}><window.WDot color={c} size={9} /> {l}</span>
            ))}
          </div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "22px 22px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>Siswa yang perlu didampingi</h3>
          <p style={{ margin: "0 0 16px", fontSize: 12.5, color: "var(--ink-3)" }}>Klik untuk membuka profil ringkas.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {flagged.map((s) => (
              <button key={s.id} onClick={() => openStudent(s.id)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface-soft)", cursor: "pointer", textAlign: "left", transition: "all .14s ease" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--ungu-050)"} onMouseLeave={(e) => e.currentTarget.style.background = "var(--surface-soft)"}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 11.5, flex: "none" }}>{window.initials(s.name)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                  <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{s.scrNote}</span>
                </span>
                <window.WStatusPill s={s.scr} />
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 16, padding: "12px 14px", background: "var(--waspada-bg)", borderRadius: 12, fontSize: 12, lineHeight: 1.5, color: "var(--ink-2)" }}>
            <window.IconShield size={15} style={{ color: "var(--waspada)", flex: "none", marginTop: 1 }} />
            <span>Topik ini sensitif. Mohon dibahas secara terbatas bersama guru BK dan orang tua.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MULTIPLE INTELLIGENCE (kelas) — tabel pemetaan + dukungan
// ============================================================
function WMIView() {
  const top = window.classTopIntel();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <FocusIntro Icon={window.IconBrain} title="Bakat & Kecerdasan" text="Pemetaan delapan kecerdasan untuk membantu Anda merancang strategi pembelajaran yang lebih cocok untuk kelas X-A." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {top.map((t, i) => {
          const MIc = window.INTEL_ICON[t.code];
          return (
          <div key={t.code} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ width: 44, height: 44, borderRadius: 13, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center" }}><MIc size={23} /></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)" }}>Dominan #{i + 1}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>{t.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: "var(--ungu)" }}>{t.pct}%</span>
              <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{t.n} dari {window.STUDENTS.length} siswa kuat</span>
            </div>
          </div>
          );
        })}
      </div>

      {/* legenda kode kecerdasan */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "18px 22px" }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 14 }}>Keterangan kode kecerdasan</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px 22px" }}>
          {window.INTEL.map((it) => {
            const MIc = window.INTEL_ICON[it.code];
            return (
              <div key={it.code} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", flex: "none" }}><MIc size={20} /></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{it.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600, letterSpacing: ".02em" }}>Kode: {it.code}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* tabel pemetaan */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "18px 24px", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>Pemetaan kecerdasan tiap siswa</h3>
            <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--ink-3)" }}>Delapan kecerdasan untuk 23 siswa kelas X-A.</p>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {["Kuat", "Sedang", "Berkembang"].map((l) => (
              <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: window.LEVEL_STYLE[l].dot }} /> {l}
              </span>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 760 }}>
            <div style={{ display: "grid", gridTemplateColumns: "34px minmax(180px, 1.6fr) repeat(8, 1fr)", gap: 0, padding: "11px 20px", background: "var(--surface-soft)", borderBottom: "1px solid var(--line)" }}>
              <span style={miHead}>No</span>
              <span style={miHead}>Nama siswa</span>
              {window.INTEL.map((it) => {
                const MIc = window.INTEL_ICON[it.code];
                return (
                  <span key={it.code} title={it.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center" }}><MIc size={17} /></span>
                    <span style={{ ...miHead, textAlign: "center" }}>{it.code}</span>
                  </span>
                );
              })}
            </div>
            {window.STUDENTS.map((s, i) => (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "34px minmax(180px, 1.6fr) repeat(8, 1fr)", gap: 0, padding: "9px 20px", alignItems: "center", borderBottom: i < window.STUDENTS.length - 1 ? "1px solid var(--line)" : "none" }}>
                <span style={{ fontSize: 12, color: "var(--ink-4)", fontWeight: 600 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12 }}>{s.name}</span>
                {window.INTEL.map((it) => {
                  const lvl = window.intelLevel(s, it.code);
                  const ls = window.LEVEL_STYLE[lvl];
                  return (
                    <span key={it.code} style={{ display: "grid", placeItems: "center" }} title={it.name + " · " + lvl}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, background: lvl === "Berkembang" ? "var(--bg-2)" : ls.dot }} />
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* dukungan yang dibutuhkan */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "22px 24px" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>Dukungan yang dibutuhkan siswa</h3>
        <p style={{ margin: "0 0 18px", fontSize: 12.5, color: "var(--ink-3)" }}>Disampaikan langsung oleh siswa, berguna untuk obrolan dengan orang tua.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px 28px" }}>
          {window.STUDENTS.map((s) => (
            <div key={s.id} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 11, flex: "none" }}>{window.initials(s.name)}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)" }}>{s.name}</div>
                <p style={{ margin: "2px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)" }}>{s.support}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const miHead = { fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".04em" };

function FocusIntro({ Icon, title, text }) {
  return (
    <div style={{ display: "flex", gap: 15, alignItems: "flex-start", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "22px 24px" }}>
      <span style={{ width: 48, height: 48, borderRadius: 14, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", flex: "none" }}><Icon size={24} /></span>
      <div>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>{title}</h2>
        <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 820, textWrap: "pretty" }}>{text}</p>
      </div>
    </div>
  );
}

// ============================================================
// ROUTER
// ============================================================
function WViewRouter({ activeView, openStudent, setActiveView, modIds }) {
  if (activeView === "siswa") return <window.WDaftarSiswa openStudent={openStudent} />;
  if (activeView === "kepuasan") return <window.SatisfactionView scope="wali" />;
  if (activeView === "karakter") return <WKarakterView />;
  if (activeView === "screening") return <WScreeningView openStudent={openStudent} />;
  if (activeView === "mi") return <WMIView />;
  return <window.WRingkasan openStudent={openStudent} setActiveView={setActiveView} modIds={modIds} />;
}

Object.assign(window, { WStudentModal, WKarakterView, WScreeningView, WMIView, FocusIntro, WViewRouter });
