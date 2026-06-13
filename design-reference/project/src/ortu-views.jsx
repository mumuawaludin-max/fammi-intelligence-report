const { useState: useStateOV } = React;

// ---- shared palettes for charts ----
const KAR_COLOR = {
  "Konsisten": "var(--ungu)",
  "Sering Muncul": "#8B5CF6",
  "Kadang Muncul": "var(--perhatian)",
  "Belum Muncul": "var(--ink-4)",
};
const INTEL_COLOR = { "Kuat": "var(--ungu)", "Sedang": "#A98AE6", "Berkembang": "var(--ink-4)" };
const WELL = { aman: 100, perhatian: 64, waspada: 28 };
const shortKar = (n) => (n === "7 Kebiasaan Anak Hebat" ? "7 Kebiasaan" : n);

function wellbeingScore() {
  const a = window.O_ASPEK;
  return Math.round(a.reduce((s, x) => s + (WELL[x.status] || 70), 0) / a.length);
}
const domIntel = () => window.O_INTEL.filter((i) => i.level === "Kuat");

// ============================================================
// HERO (summary) — adapts copy to the active product mix
// ============================================================
function OHero({ voice, ids }) {
  const c = window.CHILD;
  const has = (k) => ids.includes(k);
  const dom = window.O_DOMINAN.join(" & ");
  const bits = [];
  if (has("karakter")) bits.push(window.V(voice, "karakternya menguat", "karaktermu makin kuat"));
  if (has("bakat")) bits.push(window.V(voice, "bakatnya pada " + dom + " menonjol", "bakatmu di " + dom + " menonjol"));
  if (has("screening")) bits.push(window.V(voice, "dan ada satu hal soal perasaan yang baik untuk didampingi", "dan ada satu hal soal perasaan yang bisa kamu rawat"));
  const tail = bits.join(", ").replace(", dan", " dan");
  return (
    <section style={{ background: "linear-gradient(140deg, #6B2BE0 0%, #5316C0 100%)", borderRadius: "var(--radius-xl)", padding: "24px 22px", color: "#fff", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-hero)" }}>
      <div style={{ position: "absolute", right: -50, top: -55, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.15)", padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
          <window.IconCalmFace size={14} /> {window.V(voice, "Salam hangat dari Fammi", "Halo, " + c.panggilan + "!")}
        </div>
        <p style={{ margin: 0, fontSize: 18.5, lineHeight: 1.5, fontWeight: 600, letterSpacing: "-.01em", textWrap: "pretty" }}>
          {window.V(voice, <>Secara keseluruhan, <b style={{ fontWeight: 800 }}>{c.panggilan}</b> tumbuh dengan baik semester ini. </>, <>Kamu berkembang dengan baik semester ini. </>)}
          <span style={{ color: "#E9DDFF", fontWeight: 500 }}>{tail.charAt(0).toUpperCase() + tail.slice(1)}.</span>
        </p>
      </div>
    </section>
  );
}

// ============================================================
// RINGKASAN (multi-product summary) — only active modules shown
// ============================================================
function ORingkasan({ voice, setActiveView, ids }) {
  const c = window.CHILD;
  const has = (k) => ids.includes(k);
  const dom = domIntel();
  const perhatian = window.O_ASPEK.filter((a) => a.status === "perhatian");
  const well = wellbeingScore();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <OHero voice={voice} ids={ids} />

      {/* vital signs — only the active products */}
      <window.OCard style={{ padding: "20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {has("karakter")
            ? <window.RingGauge value={c.karakter} size={118} stroke={12} gradient={["#8B5CF6", "#5316C0"]} label="Karakter" />
            : has("screening")
            ? <window.RingGauge value={well} size={118} stroke={12} gradient={["#15A594", "#0B6E63"]} label="Perasaan" />
            : <window.RingGauge value={Math.round(dom[0].score / 25 * 100)} size={118} stroke={12} gradient={["#4F6BE0", "#2E40A8"]} label="Bakat" />}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 11 }}>
            {has("bakat") && <MiniStat Icon={window.IconBrain} label={window.V(voice, "Bakat menonjol", "Bakat menonjolmu")} value={dom.map((d) => d.name).join(" & ")} />}
            {has("screening") && <MiniStat Icon={window.IconShield} label="Kesejahteraan emosi" value={well + " / 100"} tone={perhatian.length ? "perhatian" : "aman"} />}
            {has("karakter") && !has("bakat") && <MiniStat Icon={window.IconHeart} label={window.V(voice, "Tren karakter", "Tren karaktermu")} value="Menguat semester ini" />}
            {has("karakter") && has("bakat") && !has("screening") && <MiniStat Icon={window.IconHeart} label="Karakter konsisten" value={window.O_KARAKTER.filter((k) => k.level === "Konsisten").length + " dari 6"} />}
          </div>
        </div>
      </window.OCard>

      {/* tap-through summary rows — one per active product */}
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {has("karakter") && <SummaryRow Icon={window.IconHeart} onOpen={() => setActiveView("karakter")} label={window.V(voice, "Karakter Ananda", "Karaktermu")} big={c.karakter + "%"} trend={c.karakterTrend} note={window.V(voice, "Menguat dari semester lalu", "Makin kuat dari sebelumnya")} />}
        {has("screening") && <SummaryRow Icon={window.IconShield} onOpen={() => setActiveView("emosi")} label="Perasaan & Pertemanan" big={perhatian.length === 0 ? "Baik" : "1 hal"} note={perhatian.length === 0 ? "Semua aspek berkembang baik" : "perlu sedikit pendampingan"} tone={perhatian.length ? "perhatian" : "aman"} />}
        {has("bakat") && <SummaryRow Icon={window.IconBrain} onOpen={() => setActiveView("bakat")} label={window.V(voice, "Bakat Ananda", "Bakatmu")} big={dom.length + " bakat"} note={"Menonjol: " + dom.map((d) => d.name).join(" & ")} />}
      </div>

      {/* quote — voice of the child, relevant whenever karakter/screening active */}
      {(has("karakter") || has("screening")) && (
        <window.OCard style={{ padding: "20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>{window.V(voice, "Kata Ananda", "Kata kamu sendiri")}</h3>
          <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
            <span style={{ fontSize: 40, lineHeight: .8, color: "var(--ungu-300)", fontWeight: 800, fontFamily: "Georgia, serif", flex: "none" }}>&ldquo;</span>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--ink)", fontWeight: 500, fontStyle: "italic" }}>{window.O_DUKUNGAN}</p>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "var(--ink-3)" }}>{window.V(voice, "Disampaikan langsung oleh " + c.panggilan + " saat asesmen.", "Ini yang kamu sampaikan saat asesmen. Terima kasih sudah jujur.")}</p>
        </window.OCard>
      )}

      {/* karakter menonjol mini — only if karakter active */}
      {has("karakter") && (
        <window.OCard style={{ padding: "20px 20px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>{window.V(voice, "Karakter menonjol", "Karaktermu yang menonjol")}</h3>
            <button onClick={() => setActiveView("karakter")} style={oLink}>Semua <window.IconArrowRight size={13} /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {window.O_KARAKTER.slice(0, 3).map((k) => <MiniCharRow key={k.name} k={k} />)}
          </div>
        </window.OCard>
      )}
    </div>
  );
}

const oLink = { display: "inline-flex", alignItems: "center", gap: 5, border: "none", background: "transparent", color: "var(--ungu)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0 };

function MiniStat({ Icon, label, value, tone }) {
  const col = tone === "perhatian" ? "var(--perhatian)" : "var(--ungu)";
  const bg = tone === "perhatian" ? "var(--perhatian-bg)" : "var(--ungu-050)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <span style={{ width: 36, height: 36, borderRadius: 11, background: bg, color: col, display: "grid", placeItems: "center", flex: "none" }}><Icon size={18} /></span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)" }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em", lineHeight: 1.25 }}>{value}</div>
      </div>
    </div>
  );
}

function SummaryRow({ Icon, label, big, trend, note, tone, onOpen }) {
  const col = tone === "perhatian" ? "var(--perhatian)" : "var(--ungu)";
  const bg = tone === "perhatian" ? "var(--perhatian-bg)" : "var(--ungu-050)";
  return (
    <button onClick={onOpen} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 14, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "15px 16px" }}>
      <span style={{ width: 46, height: 46, borderRadius: 14, background: bg, color: col, display: "grid", placeItems: "center", flex: "none" }}><Icon size={23} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)" }}>{label}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 2 }}>
          <span style={{ fontSize: 21, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>{big}</span>
          {trend && <window.OTrend t={trend} size={14} />}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{note}</div>
      </div>
      <window.IconArrowRight size={18} style={{ color: "var(--ink-4)", flex: "none" }} />
    </button>
  );
}

function MiniCharRow({ k }) {
  const ls = window.O_LEVEL[k.level];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{k.name}</span>
      <div style={{ width: 70, height: 6, background: "var(--ungu-050)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${k.val}%`, height: "100%", background: "var(--ungu-300)", borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: ls.fg, background: ls.bg, padding: "3px 9px", borderRadius: 99, minWidth: 88, textAlign: "center" }}>{k.level}</span>
    </div>
  );
}

function ChartLegend({ items }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 4 }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: "var(--ink-3)" }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: it.color, flex: "none" }} /> {it.label}
        </span>
      ))}
    </div>
  );
}

// ============================================================
// SINGLE-PRODUCT — branded hero so one module feels complete
// ============================================================
function OProductHero({ product, voice, children }) {
  const a = product.accent;
  const Icon = product.Icon;
  return (
    <section style={{ background: `linear-gradient(140deg, ${a.grad[0]} 0%, ${a.grad[1]} 100%)`, borderRadius: "var(--radius-xl)", padding: "22px 22px 24px", color: "#fff", position: "relative", overflow: "hidden", boxShadow: `0 18px 48px ${a.main}33` }}>
      <div style={{ position: "absolute", right: -46, top: -52, width: 168, height: 168, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
          <span style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,0.18)", display: "grid", placeItems: "center", flex: "none", border: "1px solid rgba(255,255,255,0.25)" }}><Icon size={23} /></span>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "rgba(255,255,255,0.78)" }}>{product.kicker}</div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.02em" }}>{product.name}</div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "rgba(255,255,255,0.92)", textWrap: "pretty" }}>{product.tagline}</p>
        {children && <div style={{ marginTop: 16 }}>{children}</div>}
      </div>
    </section>
  );
}

// headline stat band inside each product hero
function OHeroStat({ product, voice }) {
  const c = window.CHILD;
  if (product.id === "karakter") {
    const konsisten = window.O_KARAKTER.filter((k) => k.level === "Konsisten").length;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <window.RingGauge value={c.karakter} size={92} stroke={10} color="#fff" track="rgba(255,255,255,0.25)" label="Skor" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <HeroFig n={konsisten + " / 6"} t="karakter sudah konsisten" />
          <HeroFig n="Menguat" t="dibanding semester lalu" />
        </div>
      </div>
    );
  }
  if (product.id === "screening") {
    const well = wellbeingScore();
    const perhatian = window.O_ASPEK.filter((a) => a.status === "perhatian").length;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <window.RingGauge value={well} size={92} stroke={10} color="#fff" track="rgba(255,255,255,0.25)" suffix="" label="Sejahtera" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <HeroFig n={(window.O_ASPEK.length - perhatian) + " aspek"} t="berkembang baik" />
          <HeroFig n={perhatian + " aspek"} t="perlu didampingi" />
        </div>
      </div>
    );
  }
  const dom = domIntel();
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {dom.map((it) => (
        <div key={it.code} style={{ flex: 1, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 14, padding: "12px 13px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>{it.score}/25 · Kuat</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>{it.name}</div>
        </div>
      ))}
    </div>
  );
}
function HeroFig({ n, t }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1, letterSpacing: "-.01em" }}>{n}</div>
      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.82)", marginTop: 3 }}>{t}</div>
    </div>
  );
}

function OSingleProduct({ product, voice }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <OProductHero product={product} voice={voice}><OHeroStat product={product} voice={voice} /></OProductHero>
      {product.id === "karakter" && <OKarakter voice={voice} embedded />}
      {product.id === "screening" && <OEmosi voice={voice} embedded />}
      {product.id === "bakat" && <OBakat voice={voice} embedded />}
    </div>
  );
}

// ============================================================
// KARAKTER
// ============================================================
function OKarakter({ voice, embedded }) {
  const c = window.CHILD;
  const bloom = window.O_KARAKTER.map((k) => ({ label: shortKar(k.name), value: k.val, max: 100, color: KAR_COLOR[k.level] }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {!embedded && <window.OSectionHeading title={window.V(voice, "Karakter Ananda", "Karaktermu")} sub={window.V(voice, "Enam karakter yang dibiasakan di SMA Al Fath, dinilai bersama dari sekolah dan rumah.", "Enam kebiasaan baik yang kamu tumbuhkan di sekolah dan rumah.")} />}
      <window.OCard style={{ padding: "20px 18px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 6 }}>
          <window.RingGauge value={c.karakter} size={96} stroke={11} gradient={["#8B5CF6", "#5316C0"]} label="Total" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ungu)", textTransform: "uppercase", letterSpacing: ".05em" }}>Profil karakter</div>
            <p style={{ margin: "5px 0 0", fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>{window.V(voice, "Karakter " + c.panggilan + " menguat merata. Empat karakter sudah konsisten dan dua sedang dikuatkan.", "Karaktermu menguat merata. Beberapa sudah jadi kebiasaan, beberapa lagi sedang tumbuh.")}</p>
          </div>
        </div>
        <window.RadialBloom items={bloom} size={300} />
        <ChartLegend items={[{ color: "var(--ungu)", label: "Konsisten" }, { color: "#8B5CF6", label: "Sering muncul" }, { color: "var(--perhatian)", label: "Kadang muncul" }]} />
      </window.OCard>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {window.O_KARAKTER.map((k) => <CharCard key={k.name} k={k} />)}
      </div>
      <window.HomeTip voice={voice}>{window.V(voice, "Kesantunan " + c.panggilan + " sedang dibiasakan dan sudah menunjukkan kemajuan. Memberi contoh tutur kata yang lembut di rumah, serta apresiasi saat ia berhasil, akan sangat membantu.", "Kesantunanmu sedang tumbuh dan sudah makin baik. Coba perhatikan pilihan kata saat sedang kesal, pelan-pelan saja.")}</window.HomeTip>
    </div>
  );
}

function CharCard({ k }) {
  const ls = window.O_LEVEL[k.level];
  const idx = window.KAR_SCALE.indexOf(k.level);
  return (
    <window.OCard style={{ padding: "17px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>{k.name}</h3>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: ls.fg, background: ls.bg, padding: "5px 10px", borderRadius: 99, flex: "none" }}>{k.level} <window.OTrend t={k.trend} size={12} /></span>
      </div>
      <window.StepStrip steps={window.KAR_SCALE} active={idx} />
      <p style={{ margin: "11px 0 0", fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>{k.note}</p>
    </window.OCard>
  );
}

// ============================================================
// PERASAAN & PERTEMANAN
// ============================================================
function OEmosi({ voice, embedded }) {
  const c = window.CHILD;
  const perhatian = window.O_ASPEK.filter((a) => a.status === "perhatian");
  const aman = window.O_ASPEK.filter((a) => a.status === "aman");
  const well = wellbeingScore();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {!embedded && <window.OSectionHeading title="Perasaan & Pertemanan" sub={window.V(voice, "Gambaran lembut tentang kondisi sosial dan emosi " + c.panggilan + ". Bukan diagnosis, melainkan pijakan untuk mendampingi.", "Gambaran lembut tentang perasaan dan pertemananmu. Ini bukan penilaian, tapi cara mengenali diri.")} />}
      <window.OCard style={{ padding: "20px 18px 16px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <window.SemiGauge value={well} size={250} label="Kesejahteraan" sub={window.V(voice, "Kondisi sosial-emosi secara umum", "Kondisi perasaanmu secara umum")} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <StatPill big={aman.length} label="Berkembang baik" color="var(--aman)" bg="var(--aman-bg)" />
          <StatPill big={perhatian.length} label="Perlu didampingi" color="var(--perhatian)" bg="var(--perhatian-bg)" />
        </div>
        <ChartLegend items={[{ color: "var(--waspada)", label: "Perlu perhatian" }, { color: "var(--perhatian)", label: "Didampingi" }, { color: "var(--aman)", label: "Baik" }]} />
      </window.OCard>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {window.O_ASPEK.map((a) => <AspekRow key={a.name} a={a} voice={voice} />)}
      </div>
      {perhatian.map((a) => (
        <window.HomeTip key={a.name} voice={voice}>{window.V(voice, "Untuk sisi " + a.name.toLowerCase() + ": sediakan waktu mengobrol tanpa menghakimi, biarkan " + c.panggilan + " bercerita dengan caranya. Kehadiran yang tenang lebih menenangkan daripada banyak nasihat.", "Soal " + a.name.toLowerCase() + ": tidak apa-apa merasa banyak pikiran. Coba tulis perasaanmu atau cerita ke orang yang kamu percaya, sedikit demi sedikit.")}</window.HomeTip>
      ))}
      <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "13px 15px", background: "var(--surface-soft)", border: "1px solid var(--line)", borderRadius: 14, fontSize: 12, lineHeight: 1.5, color: "var(--ink-3)" }}>
        <window.IconShield size={15} style={{ color: "var(--ink-4)", flex: "none", marginTop: 1 }} />
        <span>Hasil ini bersifat indikatif. Bila perlu, guru BK sekolah siap mendampingi obrolan lebih lanjut.</span>
      </div>
    </div>
  );
}

function StatPill({ big, label, color, bg }) {
  return (
    <div style={{ flex: 1, background: bg, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 11 }}>
      <span style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: "-.02em", lineHeight: 1 }}>{big}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)", lineHeight: 1.25 }}>{label}</span>
    </div>
  );
}

function AspekRow({ a, voice }) {
  const st = window.O_STATUS[a.status];
  return (
    <window.OCard style={{ padding: "15px 17px", display: "flex", alignItems: "flex-start", gap: 13 }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, background: st.bg, color: st.fg, display: "grid", placeItems: "center", flex: "none" }}>
        {a.status === "aman" ? <window.IconCheckCircle size={20} /> : <window.IconHeart size={20} />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>{a.name}</span>
          <window.OStatusPill s={a.status} />
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>{window.V(voice, a.ortu, a.siswa)}</p>
      </div>
    </window.OCard>
  );
}

// ============================================================
// BAKAT
// ============================================================
function OBakat({ voice, embedded }) {
  const c = window.CHILD;
  const dom = domIntel();
  const r = window.O_REKOM;
  const axes = window.O_INTEL.map((it) => ({ label: it.name, short: it.code, value: it.score, max: 25 }));
  const bars = [...window.O_INTEL].sort((a, b) => b.score - a.score).map((it) => ({ label: it.name, value: it.score, max: 25, color: INTEL_COLOR[it.level], tag: it.level, Icon: window.INTEL_ICON[it.code] }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {!embedded && <window.OSectionHeading title={window.V(voice, "Bakat & Kecerdasan Ananda", "Bakat & Kecerdasanmu")} sub={window.V(voice, c.panggilan + " punya dua kecerdasan yang menonjol. Ini bisa jadi arah memilih kegiatan dan jurusan.", "Kamu punya dua kecerdasan yang menonjol. Ini bisa jadi petunjuk arah minatmu.")} />}
      <window.OCard style={{ padding: "18px 16px 14px" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>{window.V(voice, "Peta delapan kecerdasan", "Peta delapan kecerdasanmu")}</h3>
        <window.Radar axes={axes} size={290} />
        <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--ink-3)", textAlign: "center" }}>Semakin jauh dari pusat, semakin menonjol kecerdasan tersebut.</p>
      </window.OCard>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {dom.map((it) => {
          const MIc = window.INTEL_ICON[it.code];
          return (
            <window.OCard key={it.code} style={{ padding: "18px 18px", position: "relative", overflow: "hidden" }}>
              <span style={{ position: "absolute", right: -16, top: -16, width: 84, height: 84, borderRadius: "50%", background: "var(--ungu-050)" }} />
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 13, marginBottom: 11 }}>
                <span style={{ width: 48, height: 48, borderRadius: 14, background: "var(--ungu)", color: "#fff", display: "grid", placeItems: "center", flex: "none" }}><MIc size={24} /></span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ungu)", textTransform: "uppercase", letterSpacing: ".05em" }}>Kecerdasan menonjol · {it.score}/25</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>{it.name}</div>
                </div>
              </div>
              <p style={{ position: "relative", margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)" }}>{it.desc}</p>
            </window.OCard>
          );
        })}
      </div>
      <window.OCard style={{ padding: "20px 18px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>Peringkat kecerdasan</h3>
        <window.BarList rows={bars} />
      </window.OCard>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <RekomCard title={window.V(voice, "Arah jurusan & kuliah", "Arah belajar yang cocok")} Icon={window.IconBrain} items={[...r.jurusan, ...r.kuliah]} />
        <RekomCard title={window.V(voice, "Kemungkinan profesi", "Profesi yang bisa kamu jajaki")} Icon={window.IconSparkle} items={r.profesi} />
        <RekomCard title="Kegiatan & ekstrakurikuler" Icon={window.IconUsers} items={r.ekskul} />
        <RekomCard title="Lomba yang relevan" Icon={window.IconFlag} items={r.lomba} />
      </div>
      <window.HomeTip voice={voice}>{window.V(voice, "Bakat Interpersonal dan Spasial " + c.panggilan + " berpadu indah pada hal yang menggabungkan orang dan karya visual. Memberi ruang berkarya rupa sekaligus kesempatan berkegiatan bersama teman akan menumbuhkannya.", "Bakat Interpersonal dan Spasialmu cocok untuk hal yang memadukan orang dan karya visual. Teruslah berkarya rupa sambil aktif berkegiatan bareng teman.")}</window.HomeTip>
    </div>
  );
}

function RekomCard({ title, Icon, items }) {
  return (
    <window.OCard style={{ padding: "18px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--ungu-050)", color: "var(--ungu)", display: "grid", placeItems: "center", flex: "none" }}><Icon size={19} /></span>
        <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>{title}</h3>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((it, i) => (
          <span key={i} style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", background: "var(--surface-soft)", border: "1px solid var(--line)", padding: "7px 12px", borderRadius: 99 }}>{it}</span>
        ))}
      </div>
    </window.OCard>
  );
}

// ============================================================
// ROUTER (multi-product mode)
// ============================================================
function OViewRouter({ activeView, voice, setActiveView, ids }) {
  if (activeView === "karakter") return <OKarakter voice={voice} />;
  if (activeView === "emosi") return <OEmosi voice={voice} />;
  if (activeView === "bakat") return <OBakat voice={voice} />;
  return <ORingkasan voice={voice} setActiveView={setActiveView} ids={ids} />;
}

Object.assign(window, { OHero, ORingkasan, OKarakter, OEmosi, OBakat, OViewRouter, OProductHero, OSingleProduct });
