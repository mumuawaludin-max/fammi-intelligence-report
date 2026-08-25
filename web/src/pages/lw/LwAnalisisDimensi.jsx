import { useMemo, useState } from "react";
import { LwReveal } from "./LwReveal";
import { katDimensi, warnaKategori, latarKategori, warnaPeta, SKALA_PETA } from "./lwMeta";
import tokens from "./lwTokens.module.css";
import styles from "./LwAnalisisDimensi.module.css";

const satu = (v) => (v ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * LwAnalisisDimensi -- layar kedua: di dimensi dan jenjang mana persoalannya. Satu state
 * pemilih dimensi mengendalikan tiga blok sekaligus (sebaran titik, perbandingan antarjenjang,
 * dan sorotan kolom di peta), supaya pembaca tidak perlu mencocokkan sendiri antarbagian.
 */
export function LwAnalisisDimensi({ laporan, periodeId }) {
  const { perPeriode, awal } = laporan;
  const kini = perPeriode.find((p) => p.periodeId === periodeId) || perPeriode[perPeriode.length - 1];

  // Dimensi dengan guru non-Baik terbanyak yang jadi sorotan awal.
  const [dipilih, setDipilih] = useState(() => {
    const terburuk = kini.dimensi.reduce(
      (a, b) => (b.perluPerhatian.jumlah + b.waspada.jumlah > a.perluPerhatian.jumlah + a.waspada.jumlah ? b : a),
      kini.dimensi[0],
    );
    return terburuk.kode;
  });

  const sel = kini.dimensi.find((d) => d.kode === dipilih) || kini.dimensi[0];
  const dasarAwal = awal.dimensi.find((d) => d.kode === sel.kode)?.nilai ?? sel.nilai;

  // ── Sebaran titik tiap guru pada dimensi terpilih ──────────────────────────
  const sebaran = useMemo(() => {
    const nilai = kini.guru
      .map((g) => ({
        nama: g.nama,
        unit: g.unit,
        v: (g.protek_dimensi || []).find((d) => d.kode === sel.kode)?.nilai ?? 0,
      }))
      .sort((a, b) => a.v - b.v);

    const LO = 15, HI = 43, W = 1000;
    const px = (v) => ((v - LO) / (HI - LO)) * W;
    const tumpuk = {};
    const titik = nilai.map((n) => {
      tumpuk[n.v] = (tumpuk[n.v] || 0) + 1;
      const kat = katDimensi(n.v);
      return {
        ...n,
        kat,
        x: px(n.v),
        y: 100 - (tumpuk[n.v] - 1) * 17,
        isi: kat === "Baik" ? "#ffffff" : warnaKategori(kat),
        garis: kat === "Baik" ? "var(--lw-protek-baik)" : warnaKategori(kat),
      };
    });
    return {
      titik, px, W,
      xRata: px(sel.nilai),
      zona: [
        { x: px(18.5), teks: "Waspada", warna: "var(--lw-protek-waspada)" },
        { x: px(25.5), teks: "Perlu Perhatian", warna: "var(--lw-protek-perlu-perhatian)" },
        { x: px(35.5), teks: "Baik", warna: "var(--lw-protek-baik)" },
      ],
      pita: [
        { x: 0, w: px(22.5), warna: "var(--lw-protek-waspada-bg)" },
        { x: px(22.5), w: px(28.5) - px(22.5), warna: "var(--lw-protek-perlu-perhatian-bg)" },
        { x: px(28.5), w: W - px(28.5), warna: "var(--lw-protek-baik-bg)" },
      ],
      sumbu: [18, 22, 26, 30, 34, 38, 42].map((v) => ({ v, x: px(v) })),
    };
  }, [kini.guru, sel]);

  // ── Temuan spesifik dimensi terpilih ───────────────────────────────────────
  const temuan = kini.temuanSpesifik.filter((t) => t.dimensi === sel.label);

  // ── Peta jenjang x dimensi ─────────────────────────────────────────────────
  const kolomTerlemah = kini.dimensi.reduce((a, b) => (b.nilai < a.nilai ? b : a), kini.dimensi[0]);
  const barisTerlemah = kini.perUnit.reduce((a, b) => (b.indeks < a.indeks ? b : a), kini.perUnit[0]);
  const unitTerlemahKolom = kini.perUnit.reduce((a, b) => {
    const nb = b.dimensi.find((d) => d.kode === kolomTerlemah.kode)?.nilai ?? 0;
    const na = a.dimensi.find((d) => d.kode === kolomTerlemah.kode)?.nilai ?? 0;
    return nb < na ? b : a;
  }, kini.perUnit[0]);
  const jumlahUnitTerlemah = kini.perUnit.filter((u) => {
    const nilaiKolom = u.dimensi.find((d) => d.kode === kolomTerlemah.kode)?.nilai ?? 0;
    return u.dimensi.every((d) => nilaiKolom <= d.nilai);
  }).length;
  const nilaiTerendah = unitTerlemahKolom.dimensi.find((d) => d.kode === kolomTerlemah.kode)?.nilai ?? 0;

  const bacaan = unitTerlemahKolom.unit === barisTerlemah.unit
    ? `${kolomTerlemah.label} jadi kolom terlemah di ${jumlahUnitTerlemah} dari ${kini.perUnit.length} jenjang, jadi ini persoalan organisasi dan bukan kasus per orang. Titik paling merah bertemu di ${barisTerlemah.unit} pada angka ${satu(nilaiTerendah)}, dan baris jenjang itu juga paling gelap secara keseluruhan. Dukungan sebaiknya dimulai dari sana.`
    : `${kolomTerlemah.label} jadi kolom terlemah di ${jumlahUnitTerlemah} dari ${kini.perUnit.length} jenjang, jadi ini persoalan organisasi dan bukan kasus per orang. Sel paling merah ada di ${unitTerlemahKolom.unit} pada angka ${satu(nilaiTerendah)}, sementara baris paling gelap secara keseluruhan adalah ${barisTerlemah.unit}.`;

  return (
    <div className={`${tokens.scope} ${styles.layar}`}>
      <div className={styles.judulBlok}>
        <h1 className={styles.judul}>Analisis enam dimensi PROTEK</h1>
        <p className={styles.subjudul}>
          Pilih satu dimensi untuk melihat sebaran tiap guru, perbandingan antarjenjang, dan pernyataan spesifik yang paling sering muncul.
        </p>
      </div>

      <LwReveal className={styles.kartuGrid} delay={0.02}>
        {kini.dimensi.map((d) => {
          const aktif = d.kode === dipilih;
          const nonBaik = d.perluPerhatian.jumlah + d.waspada.jumlah;
          const dasar = awal.dimensi.find((x) => x.kode === d.kode)?.nilai ?? d.nilai;
          const dd = Math.round((d.nilai - dasar) * 10) / 10;
          const turun = dd < 0;
          return (
            <button
              key={d.kode}
              type="button"
              className={`${styles.dimKartu} ${aktif ? styles.dimKartuAktif : ""}`}
              aria-pressed={aktif}
              onClick={() => setDipilih(d.kode)}
            >
              <div className={styles.dimKartuHead}>
                <span className={styles.dimBadge} style={{
                  background: aktif ? "var(--lw-primary)" : turun ? "var(--lw-protek-waspada-bg)" : "var(--lw-soft)",
                  color: aktif ? "#fff" : turun ? "var(--lw-protek-waspada)" : "var(--lw-primary)",
                }}>{d.kode}</span>
                <span className={styles.dimDelta} style={{
                  color: turun ? "var(--lw-protek-waspada)" : "var(--lw-protek-baik)",
                }}>{dd > 0 ? "+" : ""}{satu(dd)}</span>
              </div>
              <p className={styles.dimLabel}>{d.label}</p>
              <p className={styles.dimNilai} style={{ color: aktif ? "var(--lw-primary)" : "var(--lw-heading)" }}>
                {satu(d.nilai)}
              </p>
              <div className={styles.dimTrack}>
                <div className={styles.dimIsi} style={{
                  width: `${(d.nilai / 42) * 100}%`,
                  background: turun ? "var(--lw-protek-waspada)" : d.nilai >= 35 ? "var(--lw-protek-baik)" : "var(--lw-primary)",
                }} />
              </div>
              <p className={styles.dimStatus} style={{
                color: nonBaik === 0 ? "var(--lw-protek-baik)" : nonBaik >= 4 ? "var(--lw-protek-waspada)" : "var(--lw-protek-perlu-perhatian)",
              }}>
                {nonBaik === 0 ? "Seluruhnya Baik" : `${nonBaik} guru di bawah Baik`}
              </p>
            </button>
          );
        })}
      </LwReveal>

      <div className={styles.detailGrid}>
        <LwReveal className={styles.kartu} delay={0.04}>
          <div className={styles.detailHead}>
            <div>
              <p className={styles.eyebrow}>Dimensi terpilih</p>
              <h2 className={styles.detailJudul}>{sel.label}</h2>
              <p className={styles.detailDeskripsi}>{sel.deskripsi}</p>
            </div>
            <div className={styles.detailAngka}>
              <span className={styles.detailNilai} style={{
                color: sel.nilai >= 33 ? "var(--lw-protek-baik)" : sel.nilai >= 30 ? "var(--lw-protek-perlu-perhatian)" : "var(--lw-protek-waspada)",
              }}>{satu(sel.nilai)}</span>
              <span className={styles.detailSkala}>rata-rata dari 42</span>
              <span className={styles.detailSejak}>
                {sel.nilai - dasarAwal >= 0 ? "+" : ""}{satu(sel.nilai - dasarAwal)} sejak {awal.labelPendek}
              </span>
            </div>
          </div>

          <p className={styles.blokJudul}>Sebaran {kini.jumlahGuru} guru pada dimensi ini</p>
          <p className={styles.blokSub}>Satu titik satu guru. Titik berwarna penuh berarti berada di bawah kategori Baik.</p>

          <svg className={styles.sebaran} viewBox="0 0 1000 172" role="img"
            aria-label={`Sebaran skor ${sel.label} untuk ${kini.jumlahGuru} guru`}>
            {sebaran.pita.map((p, i) => (
              <rect key={i} x={p.x} y={92} width={p.w} height={16}
                rx={i === 0 || i === sebaran.pita.length - 1 ? 8 : 0} fill={p.warna} />
            ))}
            {sebaran.sumbu.map((s) => (
              <text key={s.v} x={s.x} y={130} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--lw-muted-2)">{s.v}</text>
            ))}
            <line x1={sebaran.xRata} y1={26} x2={sebaran.xRata} y2={116} stroke="var(--lw-heading)" strokeWidth="1.5" strokeDasharray="4 4" />
            <text x={sebaran.xRata} y={18} textAnchor="middle" fontSize="11.5" fontWeight="750" fill="var(--lw-heading)">
              rata-rata {satu(sel.nilai)}
            </text>
            {sebaran.titik.map((t, i) => (
              <circle key={i} cx={t.x} cy={t.y} r="7" fill={t.isi} stroke={t.garis} strokeWidth="2">
                <title>{`${t.nama} (${t.unit}): ${t.v} — ${t.kat}`}</title>
              </circle>
            ))}
            {sebaran.zona.map((z) => (
              <text key={z.teks} x={z.x} y={154} textAnchor="middle" fontSize="11.5" fontWeight="720" fill={z.warna}>{z.teks}</text>
            ))}
          </svg>

          <p className={styles.blokJudul}>Perbandingan antarjenjang</p>
          <div className={styles.unitList}>
            {kini.perUnit.map((u) => {
              const d = u.dimensi.find((x) => x.kode === sel.kode);
              const kat = katDimensi(d.nilai);
              return (
                <div className={styles.unitBaris} key={u.unit}>
                  <span className={styles.unitNama}>{u.unit}</span>
                  <div className={styles.unitTrack}>
                    <div className={styles.unitIsi} style={{
                      width: `${(d.nilai / 42) * 100}%`,
                      background: d.nilai >= 35 ? "var(--lw-protek-baik)" : d.nilai >= 31 ? "var(--lw-primary)" : d.nilai >= 29 ? "var(--lw-protek-perlu-perhatian)" : "var(--lw-protek-waspada)",
                    }} />
                    <div className={styles.unitPenanda} style={{ left: `${(sel.nilai / 42) * 100}%` }} />
                  </div>
                  <div className={styles.unitAngka}>
                    <span className={styles.unitNilai}>{satu(d.nilai)}</span>
                    <span className={styles.unitTag} style={{ background: latarKategori(kat), color: warnaKategori(kat) }}>{kat}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className={styles.catatanKecil}>Garis vertikal gelap pada tiap batang adalah rata-rata yayasan untuk dimensi ini.</p>
        </LwReveal>

        <div className={styles.sisiKanan}>
          <LwReveal className={styles.kartu} delay={0.05}>
            <p className={styles.eyebrow}>Yang guru rasakan</p>
            <p className={styles.blokSub}>Pernyataan yang paling sering disetujui pada dimensi ini.</p>
            {temuan.length > 0 ? (
              temuan.map((t, i) => (
                <div className={styles.temuanItem} key={i}>
                  <p className={styles.temuanTeks}>&ldquo;{t.pernyataan}&rdquo;</p>
                  <div className={styles.temuanBar}>
                    <div className={styles.temuanTrack}>
                      <div className={styles.temuanIsi} style={{ width: `${t.persen}%` }} />
                    </div>
                    <span className={styles.temuanAngka}>{t.persen}% &middot; {t.jumlah} guru</span>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.temuanKosong}>
                Tidak ada pernyataan bermasalah yang menonjol di dimensi ini pada periode ini.
              </p>
            )}
          </LwReveal>

          <LwReveal className={styles.artiKartu} delay={0.06}>
            <p className={styles.artiEyebrow}>Apa artinya bagi yayasan</p>
            <p className={styles.artiTeks}>{sel.arti}</p>
          </LwReveal>
        </div>
      </div>

      <LwReveal className={styles.kartu} delay={0.06}>
        <div className={styles.petaHead}>
          <div>
            <h2 className={styles.kartuJudul}>Peta jenjang &times; dimensi</h2>
            <p className={styles.kartuSub}>Satu tampilan untuk melihat titik lemah organisasi. Makin merah, makin butuh perhatian.</p>
          </div>
          <div className={styles.skalaWarna}>
            <span>lemah</span>
            {[...SKALA_PETA].reverse().map((s, i) => (
              <span key={i} className={styles.skalaKotak} style={{ background: s.bg }} />
            ))}
            <span>kuat</span>
          </div>
        </div>

        <div className={styles.petaWrap}>
          <div className={styles.petaBaris}>
            <span />
            {kini.dimensi.map((d) => (
              <span key={d.kode} className={styles.petaHeadSel} style={{
                color: d.kode === dipilih ? "var(--lw-primary)" : "var(--lw-muted)",
                fontWeight: d.kode === dipilih ? 780 : 650,
              }}>{d.kode} &middot; {d.pendek}</span>
            ))}
            <span className={styles.petaHeadIndeks}>Indeks</span>
          </div>

          {kini.perUnit.map((u) => (
            <div className={styles.petaBaris} key={u.unit}>
              <span className={styles.petaUnit}>{u.unit}</span>
              {u.dimensi.map((d) => {
                const w = warnaPeta(d.nilai);
                return (
                  <div
                    key={d.kode}
                    className={`${styles.petaSel} ${d.kode === dipilih ? styles.petaSelFokus : ""}`}
                    style={{ background: w.bg, color: w.ink }}
                    title={`${u.unit} — ${d.label}: ${satu(d.nilai)} dari 42`}
                  >
                    {satu(d.nilai)}
                  </div>
                );
              })}
              <span className={styles.petaIndeks}>{satu(u.indeks)}</span>
            </div>
          ))}

          <div className={`${styles.petaBaris} ${styles.petaFooter}`}>
            <span className={styles.petaUnit}>Rata-rata</span>
            {kini.dimensi.map((d) => (
              <span key={d.kode} className={styles.petaRata} style={{ color: warnaPeta(d.nilai).ink }}>{satu(d.nilai)}</span>
            ))}
            <span className={styles.petaIndeks}>{satu(kini.indeks)}</span>
          </div>
        </div>

        <p className={styles.bacaan}>
          <strong>Cara membacanya:</strong> {bacaan}
        </p>
      </LwReveal>

      <p className={styles.catatanKaki}>
        Dua skala dipakai berdampingan. Ambang per dimensi (skala 0&ndash;42): Baik 29 ke atas, Perlu Perhatian 23&ndash;28,
        Waspada 22 ke bawah. Ambang skor total (skala 1&ndash;252) mengikuti instrumen aslinya: Baik 141 ke atas. Karena
        keduanya diturunkan dari sumber yang berbeda, seorang guru bisa berkategori Baik pada skor total sekaligus punya
        dimensi yang tertinggal. Skor dan kategori berasal dari asesmen yang sudah diskoring psikolog Fammi.
      </p>
    </div>
  );
}
