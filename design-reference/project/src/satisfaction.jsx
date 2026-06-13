const { useState: useStateSAT } = React;

// ============================================================
// KEPUASAN — data contoh (diolah dari survei adopsi & kepuasan
// Rapor Karakter Fammi, 135 responden). Sentimen orang tua
// mengikuti pola laporan "Keberhasilan Sekolah di Mata Orang Tua".
// ============================================================

// Mutu laporan Fammi — proporsi penilaian positif (skor 4-5 dari 5)
const SAT_METRICS = [
  { label: "Kualitas komunikasi Tim Fammi", pct: 92, avg: 4.5, note: "responsif, sopan, dan membantu" },
  { label: "Kelengkapan data laporan", pct: 87, avg: 4.3, note: "informasi dinilai cukup menyeluruh" },
  { label: "Ketepatan waktu pengiriman", pct: 84, avg: 4.2, note: "laporan tiba sesuai jadwal" },
  { label: "Kemudahan laporan dipahami", pct: 81, avg: 4.0, note: "bahasa dan tampilan mudah dibaca" },
  { label: "Relevansi indikator karakter", pct: 74, avg: 4.0, note: "sesuai kondisi nyata di kelas" },
  { label: "Kejelasan rekomendasi tindak lanjut", pct: 74, avg: 4.0, note: "arahan mudah ditindaklanjuti" },
];
const SAT_OVERALL = 4.2;   // rata-rata keseluruhan dari 5
const SAT_READ = 83;       // % responden membaca laporan secara lengkap

// Sentimen orang tua — "Keberhasilan Sekolah di Mata Orang Tua"
const PARENT_WINS = [
  { text: "Senang melihat Ananda mulai menumbuhkan kebiasaan positif", pct: 87 },
  { text: "Merasa terbantu karena sekolah memberi perhatian yang konsisten", pct: 48 },
  { text: "Menyaksikan perubahan kecil pada Ananda yang mengharukan", pct: 39 },
  { text: "Merasa guru dan sekolah peduli sehingga lebih tenang", pct: 47 },
  { text: "Bersyukur ada momen kecil yang mendekatkan kembali dengan Ananda", pct: 38 },
  { text: "Bersyukur bisa belajar lebih memahami Ananda", pct: 23 },
];

// Kategori isi testimoni
const SAT_CATEGORIES = [
  { label: "Terima kasih", pct: 99, color: "var(--aman)" },
  { label: "Saran & masukan", pct: 1, color: "var(--ungu)" },
  { label: "Harapan", pct: 0, color: "var(--perhatian)" },
  { label: "Kritik", pct: 0, color: "var(--ink-4)" },
];

// Testimoni orang tua (data contoh, nada mengikuti laporan asli)
const PARENT_VOICES = [
  { name: "Orang tua Ananda Shakil", kelas: "Kelompok Shafa Marwah", text: "Terima kasih kepada guru dan pihak sekolah yang sudah memberikan pendampingan penuh perhatian. Proses belajar yang hangat dan konsisten membuat kami merasa tenang dan sangat terbantu." },
  { name: "Orang tua Ananda Aleeya", kelas: "Kelompok Hamzah", text: "Terima kasih, Ibu Guru. Terima kasih selalu menemani tumbuh kembang Aleeya, sudah mendidik dan memberikan pendidikan yang baik." },
  { name: "Orang tua Ananda Alifa", kelas: "Kelompok Mina Arafah", text: "Terima kasih untuk Bu Guru di sekolah yang sudah membimbing dengan sabar. Banyak perubahan positif dari anak saya, terutama hafalan doa dan kebiasaan mandiri." },
  { name: "Orang tua Ananda Army", kelas: "Kelompok Ali bin Abi Thalib", text: "Terima kasih atas kemudahan dan fleksibilitas sekolah yang diberikan untuk Army. Kami mohon dukungannya untuk kegiatan yang bisa dilakukan di rumah." },
];

// Testimoni dari guru / staf tentang laporan Fammi (kutipan nyata, dirapikan)
const STAFF_VOICES = [
  { role: "Wali Kelas", text: "Laporan ini sangat membantu kami sebagai guru untuk memahami karakter anak ketika di rumah." },
  { role: "Wakil Kepala Sekolah", text: "Menyampaikan informasi keadaan siswa secara detail dan dari berbagai sisi." },
  { role: "Wali Kelas", text: "Memudahkan kami memetakan siswa yang perlu ditindaklanjuti, lalu menyesuaikan pendekatan di kelas." },
];

// Cakupan per peran
const SAT_SCOPE = {
  yayasan: { responden: 118, sekolah: 6, totalParents: 940, ket: "6 sekolah dalam naungan" },
  kepala:  { responden: 22,  sekolah: 1, totalParents: 125, ket: "SMA Al Fath Cireundeu" },
  wali:    { responden: 22,  sekolah: 1, totalParents: 23,  ket: "Kelas X-A · SMA Al Fath Cireundeu" },
};

// ---------- visual bits ----------
const Star = ({ size = 16, on = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={on ? "#F6B500" : "none"} stroke={on ? "#F6B500" : "var(--ink-4)"} strokeWidth="1.5" strokeLinejoin="round">
    <path d="M12 3.2l2.6 5.5 5.9.8-4.3 4.1 1.1 5.9L12 16.8 6.7 19.6l1.1-5.9L3.5 9.5l5.9-.8z" />
  </svg>
);
const Stars = ({ n = 5, size = 16 }) => (
  <span style={{ display: "inline-flex", gap: 3 }}>{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={size} on={i < n} />)}</span>
);

function SatSectionHeading({ title, sub, right }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 13 }}>
        <span style={{ width: 4, borderRadius: 99, background: "var(--ungu)", flex: "none", alignSelf: "stretch", minHeight: 34 }} />
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-.015em", color: "var(--ink)" }}>{title}</h2>
          {sub && <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--ink-3)" }}>{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

// ============================================================
// MAIN VIEW
// ============================================================
function SatisfactionView({ scope = "kepala" }) {
  const s = SAT_SCOPE[scope] || SAT_SCOPE.kepala;
  const pc = (pct) => Math.round(pct / 100 * s.totalParents);
  const respFmt = s.responden.toLocaleString("id-ID");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
      {/* hero */}
      <section style={{ background: "linear-gradient(135deg, #6B2BE0 0%, #5316C0 100%)", borderRadius: "var(--radius-xl)", padding: "34px 38px", color: "#fff", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-hero)" }}>
        <div style={{ position: "absolute", right: -60, top: -70, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 30, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.14)", padding: "6px 13px", borderRadius: 99, fontSize: 12.5, fontWeight: 600, marginBottom: 16 }}>
              <window.IconSparkle size={15} /> Kepuasan terhadap Laporan Fammi
            </div>
            <p style={{ margin: 0, fontSize: 23, lineHeight: 1.45, fontWeight: 600, letterSpacing: "-.01em", textWrap: "pretty" }}>
              Sebagian besar pengguna menilai Laporan Karakter Fammi membantu, dan orang tua memberi tanggapan yang hangat untuk sekolah.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.12)", borderRadius: 20, padding: "20px 26px", flex: "none" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1 }}>{SAT_OVERALL.toFixed(1)}</div>
              <div style={{ fontSize: 12, color: "#E9DDFF", marginTop: 4 }}>dari 5,0</div>
            </div>
            <div>
              <Stars n={4} size={18} />
              <div style={{ fontSize: 12.5, color: "#E9DDFF", marginTop: 8 }}>{respFmt} responden · {s.sekolah} sekolah</div>
            </div>
          </div>
        </div>
      </section>

      {/* product quality metrics */}
      <section>
        <SatSectionHeading title="Mutu Laporan Karakter Fammi"
          sub={`Penilaian dari ${respFmt} guru dan pimpinan di ${s.ket}.`}
          right={<span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: "var(--aman)", background: "var(--aman-bg)", padding: "6px 13px", borderRadius: 99 }}><window.IconCheckCircle size={15} /> {SAT_READ}% membaca laporan lengkap</span>} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {SAT_METRICS.map((m, i) => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "var(--ungu)", letterSpacing: "-.02em" }}>{m.pct}%</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)" }}><Star size={13} /> {m.avg.toFixed(1)}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 12 }}>{m.note}</div>
              <div style={{ height: 7, background: "var(--ungu-050)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${m.pct}%`, height: "100%", background: "var(--ungu-300)", borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* parent wins */}
      <section>
        <SatSectionHeading title="Keberhasilan Sekolah di Mata Orang Tua"
          sub={`Tanggapan yang dipilih oleh ${s.totalParents.toLocaleString("id-ID")} orang tua di ${s.ket}.`} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {PARENT_WINS.map((w, i) => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid var(--line)", flex: 1 }}>
                <Stars n={5} size={15} />
                <p style={{ margin: "12px 0 0", fontSize: 14.5, lineHeight: 1.5, color: "var(--ink)", fontWeight: 600, textWrap: "pretty" }}>{w.text}</p>
              </div>
              <div style={{ padding: "14px 20px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--aman)", background: "var(--aman-bg)", padding: "5px 11px", borderRadius: 8 }}>{w.pct}%</span>
                  <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{pc(w.pct).toLocaleString("id-ID")} orang tua</span>
                </div>
                <div style={{ height: 8, background: "var(--aman-bg)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${w.pct}%`, height: "100%", background: "var(--aman)", borderRadius: 99 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* testimonials + categories */}
      <section>
        <SatSectionHeading title="Suara Orang Tua" sub="Apa kata orang tua terhadap layanan sekolah." />
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.55fr) minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
          {/* testimonials */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {PARENT_VOICES.map((v, i) => (
              <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, color: "#fff", background: "var(--aman)", padding: "5px 11px", borderRadius: 99, alignSelf: "flex-start" }}><window.IconHeart size={13} /> Terima kasih</span>
                <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 38, lineHeight: .7, color: "var(--ungu-300)", fontWeight: 800, fontFamily: "Georgia, serif", flex: "none" }}>&ldquo;</span>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)", textWrap: "pretty" }}>{v.text}</p>
                </div>
                <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{v.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{v.kelas}</div>
                </div>
              </div>
            ))}
          </div>
          {/* category breakdown */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: "22px 24px" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>Nada testimoni</h3>
            <p style={{ margin: "0 0 18px", fontSize: 12.5, color: "var(--ink-3)" }}>Hampir seluruh pesan bernada apresiasi.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {SAT_CATEGORIES.map((c, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>{c.label}</span>
                    <b style={{ color: "var(--ink-2)" }}>{c.pct}%</b>
                  </div>
                  <div style={{ height: 9, background: "var(--surface-soft)", border: "1px solid var(--line)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${c.pct}%`, height: "100%", background: c.color, borderRadius: 99, transition: "width .4s ease" }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 20, padding: "13px 15px", background: "var(--ungu-050)", borderRadius: 14, fontSize: 12, lineHeight: 1.5, color: "var(--ink-2)" }}>
              <window.IconSparkle size={15} style={{ color: "var(--ungu)", flex: "none", marginTop: 1 }} />
              <span>Nada ini dirangkum otomatis oleh Fammi dari pesan terbuka orang tua.</span>
            </div>
          </div>
        </div>
      </section>

      {/* staff voices */}
      <section>
        <SatSectionHeading title="Kata Guru & Pimpinan tentang Laporan Fammi" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {STAFF_VOICES.map((v, i) => (
            <div key={i} style={{ background: "var(--surface-soft)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
              <Stars n={5} size={14} />
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--ink)", fontWeight: 500, fontStyle: "italic", textWrap: "pretty" }}>&ldquo;{v.text}&rdquo;</p>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ungu)" }}>{v.role}</div>
            </div>
          ))}
        </div>
      </section>

      <p style={{ margin: 0, fontSize: 12, color: "var(--ink-4)" }}>Seluruh angka dan kutipan adalah data contoh untuk keperluan rancangan.</p>
    </div>
  );
}

Object.assign(window, { SatisfactionView, SAT_METRICS, SAT_SCOPE });
