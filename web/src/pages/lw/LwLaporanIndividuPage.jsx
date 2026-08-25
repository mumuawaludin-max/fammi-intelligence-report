import { useMemo, useState } from "react";
import { LwReveal } from "./LwReveal";
import { warnaKategori, latarKategori, PROTEK_URUTAN } from "./lwMeta";
import tokens from "./lwTokens.module.css";
import styles from "./LwLaporanIndividuPage.module.css";

function inisial(nama) {
  return nama.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

/**
 * LwLaporanIndividuPage -- layar keempat: profil satu guru, dibuka saat pimpinan akan
 * mengajaknya bicara. Radar enam dimensi dibandingkan dengan rata-rata yayasan, grafik
 * perjalanan skor total terhadap ambang Baik, catatan pendampingan, dan refleksi yang guru
 * tulis sendiri.
 */
export function LwLaporanIndividuPage({ laporan, guruId, onPilihGuru }) {
  const { guru, guruById, kini, meta } = laporan;
  const [cariUnit, setCariUnit] = useState("semua");

  const aktif = guruById[guruId] || guru[0];
  const unitList = Array.from(new Set(guru.map((g) => g.unit)));
  const daftar = guru.filter((g) => cariUnit === "semua" || g.unit === cariUnit);

  const rataYayasan = useMemo(() => {
    const peta = {};
    for (const d of kini.dimensi) peta[d.kode] = d.nilai;
    return peta;
  }, [kini.dimensi]);

  if (!aktif) {
    return <p className={styles.kosong}>Belum ada data guru untuk periode ini.</p>;
  }

  const adaWaspada = aktif.dimensi.some((d) => d.kategori === "Waspada");
  const adaLemah = aktif.lemah.length > 0;
  const warnaUtama = adaWaspada
    ? "var(--lw-protek-waspada)"
    : adaLemah ? "var(--lw-protek-perlu-perhatian)" : "var(--lw-protek-baik)";
  const latarUtama = adaWaspada
    ? "var(--lw-protek-waspada-bg)"
    : adaLemah ? "var(--lw-protek-perlu-perhatian-bg)" : "var(--lw-protek-baik-bg)";

  // ── Radar ──────────────────────────────────────────────────────────────────
  const CX = 168, CY = 150, R = 108;
  const sudut = (i) => (Math.PI * 2 * i) / PROTEK_URUTAN.length - Math.PI / 2;
  const titik = (i, rasio) => {
    const a = sudut(i);
    const r = R * Math.max(0.06, rasio);
    return [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
  };
  const poligon = (rasios) => rasios.map((v, i) => titik(i, v).map((n) => n.toFixed(1)).join(",")).join(" ");
  const rasioGuru = aktif.dimensi.map((d) => d.nilai / 42);
  const rasioRata = aktif.dimensi.map((d) => (rataYayasan[d.kode] ?? 0) / 42);

  // ── Perjalanan skor total ──────────────────────────────────────────────────
  const LO = 120, HI = 252;
  const W = 392, tinggiPlot = 118;
  const tx = (i) => 46 + (i * (W - 92)) / Math.max(1, aktif.tren.length - 1);
  const ty = (v) => tinggiPlot - ((v - LO) / (HI - LO)) * 96;
  const naik = aktif.selisih > 0;
  const warnaTren = naik ? "var(--lw-protek-baik)" : aktif.selisih === 0 ? "var(--lw-muted-2)" : "var(--lw-protek-waspada)";
  const garisTren = aktif.tren.map((x, i) => `${tx(i)},${ty(x.total)}`).join(" ");

  return (
    <div className={`${tokens.scope} ${styles.layar}`}>
      <div className={styles.pemilih}>
        <span className={styles.pemilihLabel}>Guru</span>
        <div className={styles.filterUnit}>
          {["semua", ...unitList].map((u) => (
            <button
              key={u}
              type="button"
              className={`${styles.unitChip} ${cariUnit === u ? styles.unitChipAktif : ""}`}
              aria-pressed={cariUnit === u}
              onClick={() => setCariUnit(u)}
            >
              {u === "semua" ? "Semua jenjang" : u.replace(" Fammi", "")}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.daftarChip}>
        {daftar.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`${styles.guruChip} ${g.id === aktif.id ? styles.guruChipAktif : ""}`}
            aria-pressed={g.id === aktif.id}
            onClick={() => onPilihGuru(g.id)}
          >
            <span className={styles.guruChipTitik} style={{
              background: g.tingkat === "segera" ? "var(--lw-protek-waspada)"
                : g.tingkat === "pendampingan" ? "var(--lw-protek-perlu-perhatian)"
                : "var(--lw-protek-baik)",
            }} />
            {g.nama.split(",")[0]}
          </button>
        ))}
      </div>

      <div className={styles.utama}>
        <LwReveal className={styles.profilKartu}>
          <div className={styles.profilHead}>
            <span className={styles.avatar} style={{ background: latarUtama, color: warnaUtama }}>
              {inisial(aktif.nama)}
            </span>
            <div className={styles.profilTeks}>
              <h1 className={styles.profilNama}>{aktif.nama}</h1>
              <p className={styles.profilMeta}>
                {aktif.isKepsek ? "Kepala sekolah" : "Guru"} &middot; {aktif.unit} &middot; Asesmen {kini.label}
              </p>
              <div className={styles.pilRow}>
                <span className={styles.pil} style={{ background: latarKategori(aktif.kategoriTotal) }}>
                  <span className={styles.pilLabel} style={{ color: warnaKategori(aktif.kategoriTotal) }}>Kondisi keseluruhan</span>
                  <span className={styles.pilNilai} style={{ color: warnaKategori(aktif.kategoriTotal) }}>{aktif.kategoriTotal}</span>
                </span>
                <span className={styles.pil} style={{ background: "#f5f1ea" }}>
                  <span className={styles.pilLabel}>Skor total</span>
                  <span className={styles.pilNilai}>{aktif.total} / 252</span>
                </span>
                <span className={styles.pil} style={{ background: naik ? "var(--lw-protek-baik-bg)" : "var(--lw-protek-waspada-bg)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={warnaTren} strokeWidth="3"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                    style={naik ? undefined : { transform: "rotate(180deg)" }}>
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                  <span className={styles.pilNilai} style={{ color: warnaTren }}>
                    {aktif.selisih > 0 ? "+" : ""}{aktif.selisih} poin sejak {aktif.tren[0]?.label}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className={styles.radarBlok}>
            <svg className={styles.radar} viewBox="0 0 336 300" role="img"
              aria-label={`Profil enam dimensi PROTEK untuk ${aktif.nama}`}>
              {[0.25, 0.5, 0.75, 1].map((f) => (
                <polygon key={f} points={poligon(aktif.dimensi.map(() => f))} fill="none"
                  stroke={f === 1 ? "#ded8ce" : "#efeae2"} strokeWidth="1" />
              ))}
              {aktif.dimensi.map((_, i) => {
                const [x, y] = titik(i, 1);
                return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#eae5dd" strokeWidth="1" />;
              })}
              <polygon points={poligon(rasioRata)} fill="none" stroke="var(--lw-muted-2)" strokeWidth="1.8" strokeDasharray="5 4" />
              <polygon points={poligon(rasioGuru)} fill={`color-mix(in srgb, ${warnaUtama} 16%, transparent)`}
                stroke={warnaUtama} strokeWidth="2.5" strokeLinejoin="round" />
              {aktif.dimensi.map((d, i) => {
                const [x, y] = titik(i, d.nilai / 42);
                return <circle key={d.kode} cx={x} cy={y} r="5" fill="#fff" stroke={warnaKategori(d.kategori)} strokeWidth="2.5" />;
              })}
              {aktif.dimensi.map((d, i) => {
                const [x, y] = titik(i, 1.2);
                return (
                  <text key={d.kode} x={x} y={y + 4} fontSize="12" fontWeight="740" fill={warnaKategori(d.kategori)}
                    textAnchor={Math.abs(x - CX) < 6 ? "middle" : x > CX ? "start" : "end"}>
                    {d.kode}
                  </text>
                );
              })}
            </svg>

            <div className={styles.dimList}>
              <p className={styles.blokJudul}>Enam dimensi PROTEK</p>
              {aktif.dimensi.map((d) => (
                <div className={styles.dimBaris} key={d.kode}>
                  <span className={styles.dimHuruf} style={{
                    background: latarKategori(d.kategori),
                    color: warnaKategori(d.kategori),
                  }}>{d.kode}</span>
                  <div className={styles.dimIsiKolom}>
                    <p className={styles.dimNama}>{d.label}</p>
                    <div className={styles.dimTrack}>
                      <div className={styles.dimIsi} style={{
                        width: `${(d.nilai / 42) * 100}%`,
                        background: warnaKategori(d.kategori),
                      }} />
                      <div className={styles.dimPenanda} style={{ left: `${((rataYayasan[d.kode] ?? 0) / 42) * 100}%` }} />
                    </div>
                  </div>
                  <div className={styles.dimAngka}>
                    <span className={styles.dimNilai} style={{ color: warnaKategori(d.kategori) }}>{d.nilai}</span>
                    <span className={styles.dimKat} style={{ color: warnaKategori(d.kategori) }}>{d.kategori}</span>
                  </div>
                </div>
              ))}
              <p className={styles.catatanKecil}>
                Garis putus-putus dan penanda gelap adalah rata-rata yayasan sebagai pembanding.
              </p>
            </div>
          </div>
        </LwReveal>

        <div className={styles.sisiKanan}>
          <LwReveal className={styles.catatanKartu} delay={0.04} style={{ background: latarUtama }}>
            <p className={styles.catatanEyebrow} style={{ color: warnaUtama }}>
              {adaWaspada ? "Perlu ditangani lebih dulu" : adaLemah ? "Catatan pendampingan" : "Catatan penguatan"}
            </p>
            {aktif.catatan ? (
              <p className={styles.catatanTeks}>{aktif.catatan}</p>
            ) : (
              <p className={styles.catatanKosong}>
                Belum ada catatan pendampingan tertulis untuk guru ini pada periode ini.
              </p>
            )}
          </LwReveal>

          <LwReveal className={styles.kartu} delay={0.05}>
            <p className={styles.blokJudul}>Perjalanan {aktif.tren.length} periode</p>
            <p className={styles.blokSub}>Skor total dari 252.</p>
            <svg className={styles.trenGrafik} viewBox="0 0 392 150" role="img"
              aria-label={`Perjalanan skor total ${aktif.nama} selama ${aktif.tren.length} periode`}>
              <line x1="0" y1={tinggiPlot} x2={W} y2={tinggiPlot} stroke="#eae5dd" strokeWidth="1" />
              <line x1="0" y1={ty(141)} x2={W} y2={ty(141)} stroke="var(--lw-protek-waspada)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={W} y={ty(141) - 6} textAnchor="end" fontSize="10.5" fontWeight="700" fill="var(--lw-protek-waspada)">
                ambang Baik 141
              </text>
              <polyline points={`${tx(0)},${tinggiPlot} ${garisTren} ${tx(aktif.tren.length - 1)},${tinggiPlot}`}
                fill={`color-mix(in srgb, ${warnaTren} 13%, transparent)`} stroke="none" />
              <polyline points={garisTren} fill="none" stroke={warnaTren} strokeWidth="2.8"
                strokeLinecap="round" strokeLinejoin="round" />
              {aktif.tren.map((x, i) => (
                <g key={x.periodeId}>
                  <circle cx={tx(i)} cy={ty(x.total)} r={i === aktif.tren.length - 1 ? 6.5 : 5}
                    fill="#fff" stroke={warnaTren} strokeWidth="3" />
                  <text x={tx(i)} y={ty(x.total) - 15} textAnchor="middle" fontSize="12.5" fontWeight="790" fill={warnaTren}>
                    {x.total}
                  </text>
                  <text x={tx(i)} y="140" textAnchor="middle" fontSize="11.5" fontWeight="640" fill="var(--lw-muted-2)">
                    {x.label}
                  </text>
                </g>
              ))}
            </svg>
          </LwReveal>

          {aktif.langkah.length > 0 && (
            <LwReveal className={styles.kartu} delay={0.06}>
              <p className={styles.blokJudul}>Langkah yang disarankan</p>
              {aktif.langkah.map((teks, i) => (
                <div className={styles.langkahBaris} key={i}>
                  <span className={styles.langkahNo}>{i + 1}</span>
                  <p className={styles.langkahTeks}>{teks}</p>
                </div>
              ))}
            </LwReveal>
          )}
        </div>
      </div>

      {aktif.refleksi.length > 0 && (
        <LwReveal className={styles.kartu} delay={0.06}>
          <p className={styles.blokJudul}>Refleksi yang ditulis sendiri</p>
          <p className={styles.blokSub}>Jawaban terbuka pada asesmen periode ini, ditampilkan apa adanya.</p>
          <div className={styles.refleksiGrid}>
            {aktif.refleksi.map((r, i) => (
              <div className={styles.refleksiKartu} key={i}>
                <p className={styles.refleksiTema}>{r.tema}</p>
                <p className={styles.refleksiIsi}>{r.isi}</p>
              </div>
            ))}
          </div>
        </LwReveal>
      )}

      <p className={styles.catatanKaki}>
        Laporan individu hanya dapat dibuka pimpinan yayasan dan kepala sekolah unit terkait. Skor dan kategori
        berasal dari asesmen yang sudah diskoring psikolog Fammi, bukan diagnosis klinis. Periode asesmen
        terakhir: {meta.labelPeriodeTerakhir}.
      </p>
    </div>
  );
}
