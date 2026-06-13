const { useState: useStateWV } = React;

// ---------- shared: MI level visuals ----------
const LEVEL_STYLE = {
  Kuat: { fg: "#fff", bg: "var(--ungu)", dot: "var(--ungu)" },
  Sedang: { fg: "var(--ungu-700)", bg: "var(--ungu-100)", dot: "var(--ungu-300)" },
  Berkembang: { fg: "var(--ink-3)", bg: "var(--bg-2)", dot: "var(--ink-4)" },
};

// ============================================================
// BRIEFING HERO (kelas)
// ============================================================
function WBriefingHero() {
  const b = window.W_CLASS.briefing;
  return (
    <section style={{ background: "linear-gradient(135deg, #6B2BE0 0%, #5316C0 100%)", borderRadius: "var(--radius-xl)", padding: "38px 40px", color: "#fff", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-hero)" }}>
      <div style={{ position: "absolute", right: -60, top: -70, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
      <div style={{ position: "absolute", right: 60, bottom: -120, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
      <div style={{ position: "relative", maxWidth: 820 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.14)", padding: "6px 13px", borderRadius: 99, fontSize: 12.5, fontWeight: 600, marginBottom: 20 }}>
          <window.IconSparkle size={15} /> Briefing dari Fammi
        </div>
        <p style={{ margin: 0, fontSize: 26, lineHeight: 1.45, fontWeight: 600, letterSpacing: "-.01em", textWrap: "pretty" }}>
          {b.lead} <span style={{ color: "#E9DDFF", fontWeight: 500 }}>{b.rest}</span>
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 22, color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 500 }}>
          <window.IconCalmFace size={16} /> {b.meta}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// RINGKASAN
// ============================================================
function WRingkasan({ openStudent, setActiveView, modIds }) {
  const C = window.W_CLASS;
  const has = (m) => !modIds || modIds.includes(m);
  const attention = window.STUDENTS.filter((s) => s.scr !== "aman")
    .sort((a, b) => (a.scr === "waspada" ? -1 : 1) - (b.scr === "waspada" ? -1 : 1));
  const top = window.classTopIntel();
  const strongChar = C.chars[0], weakChar = C.chars[C.chars.length - 1];

  // KPI tiles — only for active products
  const tiles = [{ label: "Siswa di kelas", value: C.siswa, note: "terpantau bulan ini", Icon: window.IconUsers }];
  if (has("karakter")) tiles.push({ label: "Capaian karakter kelas", value: C.karakter + "%", note: "terkuat: " + strongChar.name, Icon: window.IconHeart });
  if (has("screening")) tiles.push({ label: "Siswa berstatus Aman", value: C.aman, note: `dari ${C.siswa} siswa`, Icon: window.IconShield });
  if (has("screening")) tiles.push({ label: "Perlu perhatian Anda", value: C.perhatian + C.waspada, note: "lihat daftarnya di bawah", Icon: window.IconFlag, tone: "perhatian" });
  if (!has("screening") && has("mi")) tiles.push({ label: "Kecerdasan dominan", value: top[0].name, note: `${top[0].n} dari ${window.STUDENTS.length} siswa kuat`, Icon: window.IconBrain });

  // Sorotan cards
  const cards = [];
  if (has("karakter")) {
    cards.push({ Icon: window.IconHeart, label: "Karakter terkuat", value: strongChar.name, note: strongChar.val + "% capaian kelas", onOpen: () => setActiveView("karakter") });
    cards.push({ Icon: window.IconHeart, label: "Karakter perlu dibiasakan", value: weakChar.name, note: weakChar.val + "% · paling rendah", tone: "perhatian", onOpen: () => setActiveView("karakter") });
  }
  if (has("screening")) {
    const wk = [...C.aspects].sort((a, b) => (b.perhatian + b.waspada) - (a.perhatian + a.waspada))[0];
    cards.push({ Icon: window.IconShield, label: "Aspek paling perlu dijaga", value: wk.name, note: (wk.perhatian + wk.waspada) + " siswa perlu perhatian", tone: "perhatian", onOpen: () => setActiveView("screening") });
  }
  if (has("mi")) cards.push({ Icon: window.IconBrain, label: "Kecerdasan dominan kelas", value: top[0].name, note: `${top[0].n} dari ${window.STUDENTS.length} siswa kuat`, onOpen: () => setActiveView("mi") });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
      <WBriefingHero />

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(tiles.length, 4)}, 1fr)`, gap: 18 }}>
        {tiles.map((t, i) => <window.WStatTile key={i} label={t.label} value={t.value} note={t.note} Icon={t.Icon} tone={t.tone} />)}
      </div>

      {/* siswa perlu perhatian — screening */}
      {has("screening") && (
        <section>
          <window.WSectionHeading title="Siswa yang perlu perhatian Anda" sub="Mulai dari yang paling perlu didahulukan. Klik untuk membuka profil ringkas."
            right={<button onClick={() => setActiveView("siswa")} style={wLinkBtn}>Lihat semua siswa <window.IconArrowRight size={15} /></button>} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {attention.map((s) => <WAttentionCard key={s.id} s={s} onClick={() => openStudent(s.id)} />)}
          </div>
        </section>
      )}

      {/* sorotan kelas */}
      {cards.length > 0 && (
        <section>
          <window.WSectionHeading title="Sorotan kelas" sub="Hal yang baik untuk Anda ketahui tentang X-A." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {cards.map((c, i) => <HighlightCard key={i} Icon={c.Icon} label={c.label} value={c.value} note={c.note} tone={c.tone} onOpen={c.onOpen} />)}
          </div>
        </section>
      )}
    </div>
  );
}

const wLinkBtn = {
  display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid var(--line)", background: "var(--surface)",
  color: "var(--ungu)", fontSize: 12.5, fontWeight: 700, padding: "8px 14px", borderRadius: 99, cursor: "pointer",
};

function WAttentionCard({ s, onClick }) {
  const st = window.W_STATUS[s.scr];
  const [h, setH] = useStateWV(false);
  return (
    <article onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)", padding: "20px 22px",
      position: "relative", overflow: "hidden", cursor: "pointer", transition: "all .2s ease",
      boxShadow: h ? "var(--shadow-pop)" : "var(--shadow-card)", transform: h ? "translateY(-3px)" : "none",
    }}>
      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: st.fg }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14, flex: "none" }}>{initials(s.name)}</span>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--ink)", letterSpacing: "-.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</h3>
        </div>
        <window.WStatusPill s={s.scr} />
      </div>
      {s.scrNote && <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--ink-2)" }}><span style={{ fontWeight: 600, color: "var(--ink-3)" }}>Aspek: </span>{s.scrNote}</p>}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--line)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ink-2)" }}>Karakter <b style={{ color: "var(--ink)" }}>{s.kar}%</b> <window.WTrend t={s.karTrend} /></span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--ungu)", fontSize: 12.5, fontWeight: 700 }}>Profil <window.IconArrowRight size={14} /></span>
      </div>
    </article>
  );
}

function HighlightCard({ Icon, label, value, note, tone, onOpen }) {
  const c = tone === "perhatian" ? "var(--perhatian)" : "var(--ungu)";
  const bg = tone === "perhatian" ? "var(--perhatian-bg)" : "var(--ungu-050)";
  return (
    <article style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", padding: "22px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
      <span style={{ width: 44, height: 44, borderRadius: 13, background: bg, color: c, display: "grid", placeItems: "center" }}><Icon size={22} /></span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>{value}</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 3 }}>{note}</div>
      </div>
      <button onClick={onOpen} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", color: "var(--ungu)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>Lihat detail <window.IconArrowRight size={14} /></button>
    </article>
  );
}

function initials(name) {
  const p = name.split(" ").filter(Boolean);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase();
}

// ============================================================
// DAFTAR SISWA
// ============================================================
function WDaftarSiswa({ openStudent }) {
  const [q, setQ] = useStateWV("");
  const [filter, setFilter] = useStateWV("semua");
  let rows = window.STUDENTS.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
  if (filter !== "semua") rows = rows.filter((s) => s.scr === filter);

  const filters = [
    { id: "semua", label: "Semua" },
    { id: "aman", label: "Aman" },
    { id: "perhatian", label: "Perlu perhatian" },
    { id: "waspada", label: "Perlu diwaspadai" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 14px", minWidth: 280, boxShadow: "var(--shadow-card)" }}>
          <window.IconSearch size={17} style={{ color: "var(--ink-3)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama siswa…" style={{ border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: 13.5, color: "var(--ink)", width: "100%" }} />
        </div>
        <div style={{ display: "inline-flex", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 4, boxShadow: "var(--shadow-card)" }}>
          {filters.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              border: "none", background: filter === f.id ? "var(--ungu)" : "transparent", color: filter === f.id ? "#fff" : "var(--ink-2)",
              fontSize: 12.5, fontWeight: 600, padding: "8px 15px", borderRadius: 8, transition: "all .15s ease",
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--line)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "40px 2fr 1.4fr 1.5fr 1.4fr 110px", gap: 16, padding: "13px 24px", background: "var(--surface-soft)", borderBottom: "1px solid var(--line)" }}>
          {["No", "Nama siswa", "Capaian karakter", "Status Screening", "Kecerdasan dominan", ""].map((h, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</span>
          ))}
        </div>
        {rows.length === 0 && <div style={{ padding: "40px 24px", textAlign: "center", fontSize: 13.5, color: "var(--ink-3)" }}>Tidak ada siswa yang cocok dengan pencarian.</div>}
        {rows.map((s, i) => (
          <WStudentRow key={s.id} s={s} no={i + 1} last={i === rows.length - 1} onOpen={() => openStudent(s.id)} />
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "var(--ink-4)" }}>Menampilkan {rows.length} dari {window.STUDENTS.length} siswa.</p>
    </div>
  );
}

function WStudentRow({ s, no, last, onOpen }) {
  const [h, setH] = useStateWV(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onOpen} style={{
      display: "grid", gridTemplateColumns: "40px 2fr 1.4fr 1.5fr 1.4fr 110px", gap: 16, padding: "14px 24px", alignItems: "center",
      borderBottom: last ? "none" : "1px solid var(--line)", cursor: "pointer", background: h ? "var(--ungu-050)" : "transparent", transition: "background .14s ease",
    }}>
      <span style={{ fontSize: 12.5, color: "var(--ink-4)", fontWeight: 600 }}>{String(no).padStart(2, "0")}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12.5, flex: "none" }}>{initials(s.name)}</span>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
      </div>
      <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ flex: 1, height: 7, background: "var(--ungu-050)", borderRadius: 99, overflow: "hidden", minWidth: 36 }}>
          <div style={{ width: `${s.kar}%`, height: "100%", background: "var(--ungu-300)", borderRadius: 99 }} />
        </div>
        <b style={{ fontSize: 13, color: "var(--ink)" }}>{s.kar}%</b>
        <window.WTrend t={s.karTrend} />
      </span>
      <window.WStatusPill s={s.scr} />
      <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>{window.INTEL_NAME[s.kuat[0]]}</span>
      <button style={{ justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid " + (h ? "var(--ungu)" : "var(--line)"), background: h ? "var(--ungu)" : "var(--surface)", color: h ? "#fff" : "var(--ungu)", fontSize: 12.5, fontWeight: 700, padding: "7px 12px", borderRadius: 9, transition: "all .14s ease" }}>Profil <window.IconArrowRight size={13} /></button>
    </div>
  );
}

Object.assign(window, { WBriefingHero, WRingkasan, WDaftarSiswa, LEVEL_STYLE, initials });
