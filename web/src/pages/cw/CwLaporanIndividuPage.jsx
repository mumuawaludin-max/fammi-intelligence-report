import { useState } from "react";
import CultureRadarChart from "./CultureRadarChart";
import CwDetailDialog from "./CwDetailDialog";
import { KATEGORI_KESEJAHTERAAN_COLOR } from "./cwColors";
import {
  TIPE_BUDAYA_INFO, arahTeks, ARAH_ICON, interpretasiKesejahteraan,
} from "./cwMeta";
import { useReveal, useCountUp } from "./cwHooks";
import styles from "./CwLaporanIndividuPage.module.css";

/** Palet pastel token FIR untuk kartu tipe budaya (grid 2x2 ala "Quick actions" benchmark). */
const CULTURE_STYLE = [
  { bg: "var(--lilac-soft)", ink: "var(--lilac-ink)" },
  { bg: "var(--sun-soft)", ink: "var(--sun-ink)" },
  { bg: "var(--mint-soft)", ink: "var(--mint-ink)" },
  { bg: "var(--sky-soft)", ink: "var(--sky-ink)" },
];

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function periodeLabel(periodeId) {
  if (!periodeId) return "";
  const [y, m] = String(periodeId).split("-").map(Number);
  return `${BULAN[m - 1] || ""} ${y}`.trim();
}

function fmtGap(n) {
  return n == null ? "—" : `${n > 0 ? "+" : ""}${n}`;
}

function inisial(nama) {
  return String(nama || "?").trim().charAt(0).toUpperCase();
}

/** Reveal halus saat elemen masuk viewport. */
function Reveal({ children, delay = 0, className = "" }) {
  const [ref, shown] = useReveal();
  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${shown ? styles.revealShown : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * Hero gelap: indeks kesejahteraan besar di tengah + baris pintasan bulat di bawahnya.
 * Bentuknya mengikuti kartu saldo di benchmark (angka besar terpusat, tiga tombol bulat,
 * satu di antaranya beraksen), warna memakai token FIR.
 */
function HeroIndeks({ indeks, kategori, onOpenIndeks, onJump }) {
  const [ref, shown] = useReveal();
  const counted = useCountUp(indeks, shown);
  const warna = KATEGORI_KESEJAHTERAAN_COLOR[kategori] || "var(--ink-4)";

  return (
    <div ref={ref} className={`${styles.hero} ${styles.reveal} ${shown ? styles.revealShown : ""}`}>
      <button type="button" className={styles.heroTop} onClick={onOpenIndeks}>
        <span className={styles.heroLabel}>Indeks Kesejahteraan Anda</span>
        <span className={styles.heroValue}>{counted}</span>
        <span className={styles.heroBadge} style={{ background: warna }}>{kategori}</span>
      </button>

      <div className={styles.heroActions}>
        {[
          { id: "budaya", ikon: "🧭", label: "Budaya" },
          { id: "kesejahteraan", ikon: "💚", label: "Kesejahteraan", utama: true },
          { id: "aksi", ikon: "🎯", label: "Rencana Aksi" },
        ].map((a) => (
          <button
            key={a.id}
            type="button"
            className={styles.heroAction}
            onClick={() => onJump(a.id)}
          >
            <span className={`${styles.heroActionIcon} ${a.utama ? styles.heroActionIconUtama : ""}`}>
              {a.ikon}
            </span>
            <span className={styles.heroActionLabel}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Bar tersegmentasi warna, meniru ringkasan pengeluaran per kategori di benchmark. */
function SegmentBar({ items }) {
  const total = items.reduce((s, i) => s + i.nilai, 0) || 1;
  return (
    <div className={styles.segmentBar}>
      {items.map((it) => (
        <span
          key={it.kode}
          className={styles.segment}
          style={{
            width: `${(it.nilai / total) * 100}%`,
            background: KATEGORI_KESEJAHTERAAN_COLOR[it.kategori] || "var(--ink-4)",
          }}
          title={`${it.label}: ${it.nilai}%`}
        />
      ))}
    </div>
  );
}

/** Kotak informasi kuning, meniru callout "Smart category" di benchmark. */
function InfoCallout({ ikon = "💡", judul, children }) {
  return (
    <div className={styles.info}>
      <p className={styles.infoJudul}><span aria-hidden="true">{ikon}</span> {judul}</p>
      <p className={styles.infoTeks}>{children}</p>
    </div>
  );
}

function DialogSection({ title, children }) {
  return (
    <section>
      <p className={styles.dialogSectionTitle}>{title}</p>
      {children}
    </section>
  );
}

function DialogStats({ items }) {
  return (
    <div className={styles.dialogStats}>
      {items.map((s) => (
        <div className={styles.dialogStat} key={s.label}>
          <span className={styles.dialogStatValue} style={s.color ? { color: s.color } : undefined}>{s.value}</span>
          <span className={styles.dialogStatLabel}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function DialogCallout({ tone = "netral", icon, children }) {
  return (
    <div className={`${styles.callout} ${styles[`callout_${tone}`]}`}>
      {icon && <span className={styles.calloutIcon} aria-hidden="true">{icon}</span>}
      <p className={styles.calloutText}>{children}</p>
    </div>
  );
}

/**
 * CwLaporanIndividuPage -- laporan Culture & Wellbeing untuk satu karyawan, MOBILE-FIRST.
 *
 * Tata letak, bentuk kartu, dan radius mengikuti pola aplikasi mobile di benchmark
 * (design-reference/.../corporate culture benchmark): kartu hero gelap dengan angka besar dan
 * baris tombol bulat, grid 2x2 kartu pastel, bar tersegmentasi, callout kuning, dan daftar
 * tugas ber-icon-chip. Warna seluruhnya token FIR.
 *
 * Isinya mengikuti 6 bagian skema JSON baku (header, bagian_budaya, bagian_kesejahteraan,
 * bagian_cermin, bagian_refleksi, footer) plus rencana_aksi -- lihat catatan ASUMSI di
 * cw.types.ts untuk field yang bukan bagian kontrak asli.
 *
 * Semua kartu data bisa diklik dan membuka dialog yang menjelaskan angkanya dengan bahasa
 * sehari-hari, karena pembacanya karyawan biasa, bukan HR atau psikolog.
 */
export default function CwLaporanIndividuPage({ laporan }) {
  const { meta, header, bagian_budaya, bagian_kesejahteraan, bagian_cermin, bagian_refleksi, rencana_aksi, footer } = laporan;

  const [budayaDipilih, setBudayaDipilih] = useState(null);
  const [subdimensiDipilih, setSubdimensiDipilih] = useState(null);
  const [aksiDipilih, setAksiDipilih] = useState(null);
  const [infoDipilih, setInfoDipilih] = useState(null);

  const gapByLabel = Object.fromEntries((bagian_budaya.tabel_gap || []).map((g) => [g.label, g]));
  const subdimensi = bagian_kesejahteraan.chart_data || [];
  const urut = [...subdimensi].sort((a, b) => a.nilai - b.nilai);
  const terlemah = urut[0];
  const terkuat = urut[urut.length - 1];
  const gapTerbesar = [...(bagian_budaya.tabel_gap || [])]
    .sort((a, b) => Math.abs(b.nilai_gap ?? 0) - Math.abs(a.nilai_gap ?? 0))[0];
  const kesejahteraanWarna = KATEGORI_KESEJAHTERAAN_COLOR[bagian_kesejahteraan.kategori] || "var(--ink-4)";

  function jumpTo(id) {
    const el = document.getElementById(`cw-sec-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className={styles.page}>
      {/* ── Sapaan + identitas ─────────────────────────────────────────────── */}
      <Reveal>
        <div className={styles.greet}>
          <span className={styles.avatar}>{inisial(meta.nama_responden)}</span>
          <div className={styles.greetBody}>
            <p className={styles.greetHalo}>Halo,</p>
            <p className={styles.greetNama}>{meta.nama_responden}</p>
            <div className={styles.chips}>
              {meta.jabatan && <span className={styles.chip}>{meta.jabatan}</span>}
              {meta.unit && <span className={styles.chip}>{meta.unit}</span>}
            </div>
          </div>
          <span className={styles.periodePill}>{periodeLabel(meta.periode_id)}</span>
        </div>
      </Reveal>

      {/* ── Pesan pembuka ──────────────────────────────────────────────────── */}
      <Reveal delay={60}>
        <div className={styles.hookCard}>
          <p className={styles.hookText}>{header.hook}</p>
          <p className={styles.hookSub}>{header.sub_hook}</p>
        </div>
      </Reveal>

      {/* ── Hero indeks ────────────────────────────────────────────────────── */}
      <HeroIndeks
        indeks={bagian_kesejahteraan.indeks}
        kategori={bagian_kesejahteraan.kategori}
        onOpenIndeks={() => setInfoDipilih("indeks")}
        onJump={jumpTo}
      />

      {/* ── Sorotan cepat ──────────────────────────────────────────────────── */}
      <Reveal delay={60}>
        <div className={styles.sorotanGrid}>
          <button type="button" className={styles.sorotanCard} onClick={() => terkuat && setSubdimensiDipilih(terkuat)}>
            <span className={styles.sorotanIkon} style={{ background: "var(--status-safe-bg)" }}>✓</span>
            <span className={styles.sorotanLabel}>Kekuatan Anda</span>
            <span className={styles.sorotanNilai}>{terkuat?.label}</span>
            <span className={styles.sorotanSub}>{terkuat?.nilai}% · {terkuat?.kategori}</span>
          </button>
          <button type="button" className={styles.sorotanCard} onClick={() => terlemah && setSubdimensiDipilih(terlemah)}>
            <span className={styles.sorotanIkon} style={{ background: "var(--status-warn-bg)" }}>!</span>
            <span className={styles.sorotanLabel}>Perlu perhatian</span>
            <span className={styles.sorotanNilai}>{terlemah?.label}</span>
            <span className={styles.sorotanSub}>{terlemah?.nilai}% · {terlemah?.kategori}</span>
          </button>
        </div>
      </Reveal>

      {/* ── Budaya ─────────────────────────────────────────────────────────── */}
      <section id="cw-sec-budaya" className={styles.section}>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Budaya Kerja</h3>
          <span className={styles.sectionHint}>Ketuk kartu</span>
        </div>

        <Reveal>
          <div className={styles.budayaGrid}>
            {(bagian_budaya.chart_data || []).map((c, i) => {
              const s = CULTURE_STYLE[i % CULTURE_STYLE.length];
              const g = gapByLabel[c.tipe];
              const info = TIPE_BUDAYA_INFO[c.tipe] || {};
              return (
                <button
                  type="button"
                  key={c.tipe}
                  className={styles.budayaCard}
                  style={{ background: s.bg, animationDelay: `${80 + i * 80}ms` }}
                  onClick={() => setBudayaDipilih({ ...c, gap: g, info })}
                >
                  <span className={styles.budayaIkon} style={{ background: "rgba(255,255,255,0.55)" }}>
                    {info.icon}
                  </span>
                  <span className={styles.budayaNama} style={{ color: s.ink }}>{c.tipe}</span>
                  <span className={styles.budayaRingkas} style={{ color: s.ink }}>{info.ringkas}</span>
                  <span className={styles.budayaNilai} style={{ color: s.ink }}>{c.saat_ini}%</span>
                  <span className={styles.budayaGap} style={{ color: s.ink }}>
                    {ARAH_ICON[g?.arah] || ""} {fmtGap(g?.nilai_gap)} vs harapan
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={60}>
          <button type="button" className={styles.radarCard} onClick={() => setInfoDipilih("radar")}>
            <div className={styles.radarWrap}>
              <CultureRadarChart data={bagian_budaya.chart_data} size={230} />
            </div>
            <p className={styles.radarHint}>
              Garis penuh = yang Anda rasakan, putus-putus = yang Anda harapkan.
              <span className={styles.radarCta}> Cara membaca ›</span>
            </p>
          </button>
        </Reveal>

        {gapTerbesar && (
          <Reveal delay={90}>
            <InfoCallout judul="Yang paling menonjol dari jawaban Anda">
              Selisih terbesar ada di <strong>{gapTerbesar.label}</strong> ({fmtGap(gapTerbesar.nilai_gap)} poin).{" "}
              {arahTeks(gapTerbesar.arah).replace("Karyawan berharap", "Anda berharap")}
            </InfoCallout>
          </Reveal>
        )}
      </section>

      {/* ── Kesejahteraan ──────────────────────────────────────────────────── */}
      <section id="cw-sec-kesejahteraan" className={styles.section}>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Kesejahteraan Anda</h3>
          <span className={styles.sectionHint}>Ketuk kartu</span>
        </div>

        <Reveal>
          <SegmentBar items={subdimensi} />
        </Reveal>

        <Reveal delay={60}>
          <div className={styles.subGrid}>
            {subdimensi.map((it) => {
              const warna = KATEGORI_KESEJAHTERAAN_COLOR[it.kategori] || "var(--ink-4)";
              return (
                <button
                  type="button"
                  key={it.kode}
                  className={styles.subCard}
                  onClick={() => setSubdimensiDipilih(it)}
                >
                  <span className={styles.subTop}>
                    <span className={styles.subDot} style={{ background: warna }} />
                    <span className={styles.subLabel}>{it.label}</span>
                  </span>
                  <span className={styles.subNilai}>{it.nilai}%</span>
                  <span className={styles.subKategori} style={{ color: warna }}>{it.kategori}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={90}>
          <InfoCallout ikon="💚" judul={`Kesejahteraan Anda: ${bagian_kesejahteraan.kategori}`}>
            {interpretasiKesejahteraan(bagian_kesejahteraan.kategori)}
          </InfoCallout>
        </Reveal>
      </section>

      {/* ── Rencana aksi ───────────────────────────────────────────────────── */}
      {rencana_aksi?.length > 0 && (
        <section id="cw-sec-aksi" className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>
              Rencana Aksi
              <span className={styles.countBadge}>{rencana_aksi.length}</span>
            </h3>
            <span className={styles.sectionHint}>Ketuk untuk detail</span>
          </div>

          <div className={styles.aksiList}>
            {rencana_aksi.map((a, i) => (
              <AksiRow key={a.id} aksi={a} delay={i * 60} onClick={() => setAksiDipilih(a)} />
            ))}
          </div>
        </section>
      )}

      {/* ── Cermin & refleksi ──────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Kata Rekan Kerja</h3>
        </div>
        <Reveal>
          <div className={styles.cermin}>
            <span className={styles.cerminKutip} aria-hidden="true">"</span>
            <p className={styles.cerminTeks}>{bagian_cermin}</p>
          </div>
        </Reveal>
      </section>

      <Reveal>
        <div className={styles.refleksi}>
          <p className={styles.refleksiLabel}>Bahan renungan</p>
          <p className={styles.refleksiTeks}>{bagian_refleksi}</p>
        </div>
      </Reveal>

      <p className={styles.disclaimer}>{footer.disclaimer}</p>

      {/* ── Dialog: tipe budaya ────────────────────────────────────────────── */}
      {budayaDipilih && (
        <CwDetailDialog
          icon={budayaDipilih.info?.icon}
          eyebrow="Tipe Budaya"
          title={budayaDipilih.tipe}
          subtitle={budayaDipilih.info?.ringkas}
          onClose={() => setBudayaDipilih(null)}
        >
          <DialogSection title="Apa artinya">
            <p className={styles.dialogText}>{budayaDipilih.info?.deskripsi}</p>
          </DialogSection>

          <DialogSection title="Jawaban Anda">
            <DialogStats
              items={[
                { value: `${budayaDipilih.saat_ini}%`, label: "Anda rasakan" },
                { value: `${budayaDipilih.harapan}%`, label: "Anda harapkan" },
                { value: `${ARAH_ICON[budayaDipilih.gap?.arah] || ""} ${fmtGap(budayaDipilih.gap?.nilai_gap)}`, label: "Selisih" },
              ]}
            />
            <p className={styles.dialogText}>
              {arahTeks(budayaDipilih.gap?.arah).replace("Karyawan berharap", "Anda berharap").replace("Harapan karyawan", "Harapan Anda")}
            </p>
          </DialogSection>

          <p className={styles.dialogFootnote}>
            Angka 0-100 menunjukkan seberapa kuat tipe budaya ini Anda rasakan, bukan nilai
            baik atau buruk. Keempat tipe selalu ada di tiap organisasi, yang berbeda porsinya.
          </p>
        </CwDetailDialog>
      )}

      {/* ── Dialog: subdimensi ─────────────────────────────────────────────── */}
      {subdimensiDipilih && (() => {
        const warna = KATEGORI_KESEJAHTERAAN_COLOR[subdimensiDipilih.kategori] || "var(--ink-4)";
        const selisih = subdimensiDipilih.nilai - bagian_kesejahteraan.indeks;
        const tone = ["Sangat Rendah", "Rendah"].includes(subdimensiDipilih.kategori)
          ? "waspada" : subdimensiDipilih.kategori === "Sedang" ? "netral" : "baik";
        const aksiTerkait = (rencana_aksi || []).filter((a) => a.terkait === subdimensiDipilih.label);
        return (
          <CwDetailDialog
            icon="💚"
            eyebrow="Kesejahteraan"
            title={subdimensiDipilih.label}
            subtitle={`${subdimensiDipilih.nilai}% · ${subdimensiDipilih.kategori}`}
            onClose={() => setSubdimensiDipilih(null)}
          >
            <DialogSection title="Angka Anda">
              <DialogStats
                items={[
                  { value: `${subdimensiDipilih.nilai}%`, label: "Skor Anda", color: warna },
                  { value: subdimensiDipilih.kategori, label: "Kategori", color: warna },
                  { value: `${selisih > 0 ? "+" : ""}${selisih}`, label: "vs indeks Anda" },
                ]}
              />
            </DialogSection>

            <DialogSection title="Apa artinya buat Anda">
              <DialogCallout tone={tone} icon={tone === "waspada" ? "⚠️" : tone === "baik" ? "✓" : "•"}>
                {interpretasiKesejahteraan(subdimensiDipilih.kategori)}
              </DialogCallout>
            </DialogSection>

            {aksiTerkait.length > 0 && (
              <DialogSection title="Langkah yang disarankan untuk ini">
                <ol className={styles.langkahList}>
                  {aksiTerkait.map((a) => (
                    <li className={styles.langkahItem} key={a.id}>
                      <span className={styles.langkahIkon} aria-hidden="true">{a.ikon}</span>
                      <span className={styles.langkahText}>
                        <strong>{a.judul}</strong>
                        <span className={styles.langkahJangka}>{a.jangka}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </DialogSection>
            )}

            <p className={styles.dialogFootnote}>
              Skor ini berasal dari jawaban Anda sendiri di asesmen periode ini. Satu angka rendah
              tidak berarti ada yang salah dengan Anda, lihat bersama subdimensi lain.
            </p>
          </CwDetailDialog>
        );
      })()}

      {/* ── Dialog: aksi pribadi ───────────────────────────────────────────── */}
      {aksiDipilih && (
        <CwDetailDialog
          icon={aksiDipilih.ikon}
          eyebrow={`Rencana Aksi · ${aksiDipilih.jangka}`}
          title={aksiDipilih.judul}
          subtitle={`Terkait: ${aksiDipilih.terkait}`}
          onClose={() => setAksiDipilih(null)}
        >
          <DialogSection title="Kenapa ini disarankan untuk Anda">
            <p className={styles.dialogText}>{aksiDipilih.alasan}</p>
          </DialogSection>

          <DialogSection title="Kapan sebaiknya dimulai">
            <DialogCallout tone="aksi" icon="🕒">
              {aksiDipilih.jangka}. Mulai dari langkah paling kecil yang bisa Anda kendalikan
              sendiri, tanpa menunggu keputusan pihak lain.
            </DialogCallout>
          </DialogSection>

          <p className={styles.dialogFootnote}>
            Saran ini disusun dari pola jawaban Anda, bukan penilaian kinerja. Anda bebas
            menyesuaikan atau melewatinya bila tidak relevan dengan kondisi Anda saat ini.
          </p>
        </CwDetailDialog>
      )}

      {/* ── Dialog: indeks & radar ─────────────────────────────────────────── */}
      {infoDipilih === "indeks" && (
        <CwDetailDialog
          icon="💚"
          eyebrow="Indeks Kesejahteraan"
          title={`${bagian_kesejahteraan.indeks} · ${bagian_kesejahteraan.kategori}`}
          subtitle={periodeLabel(meta.periode_id)}
          onClose={() => setInfoDipilih(null)}
        >
          <DialogSection title="Cara membacanya">
            <p className={styles.dialogText}>
              Angka ini gabungan dari {subdimensi.length} aspek kesejahteraan, skalanya 0-100 dan
              makin tinggi makin baik. Berguna untuk melihat gambaran umum, tapi yang lebih
              berguna ditindaklanjuti adalah aspek mana yang paling menariknya turun.
            </p>
          </DialogSection>

          <DialogSection title="Yang menopang dan yang menekan">
            <DialogStats
              items={[
                { value: `${terkuat?.nilai}%`, label: `Terkuat: ${terkuat?.label}`, color: "var(--cw-nilai-sangat-tinggi)" },
                { value: `${terlemah?.nilai}%`, label: `Terlemah: ${terlemah?.label}`, color: "var(--cw-nilai-rendah)" },
                { value: bagian_kesejahteraan.indeks, label: "Indeks gabungan", color: kesejahteraanWarna },
              ]}
            />
            <p className={styles.dialogText}>{bagian_kesejahteraan.narasi}</p>
          </DialogSection>

          <p className={styles.dialogFootnote}>
            Laporan ini rahasia. Atasan Anda melihat angka gabungan seluruh unit, bukan jawaban
            pribadi Anda satu per satu.
          </p>
        </CwDetailDialog>
      )}

      {infoDipilih === "radar" && (
        <CwDetailDialog
          icon="🧭"
          eyebrow="Profil Budaya"
          title="Cara membaca grafik ini"
          subtitle="Empat tipe budaya organisasi"
          onClose={() => setInfoDipilih(null)}
        >
          <DialogSection title="Dua garis, dua makna">
            <p className={styles.dialogText}>
              <strong>Garis penuh</strong> adalah budaya yang Anda RASAKAN sekarang.{" "}
              <strong>Garis putus-putus</strong> adalah budaya yang Anda HARAPKAN. Jarak antara
              keduanya di satu sumbu itulah yang disebut selisih atau gap.
            </p>
          </DialogSection>

          <DialogSection title="Empat sumbu">
            <div className={styles.axisList}>
              {(bagian_budaya.chart_data || []).map((c) => {
                const info = TIPE_BUDAYA_INFO[c.tipe] || {};
                const g = gapByLabel[c.tipe];
                return (
                  <div className={styles.axisRow} key={c.tipe}>
                    <span className={styles.axisIcon} aria-hidden="true">{info.icon}</span>
                    <div>
                      <p className={styles.axisTitle}>{c.tipe}<span className={styles.axisRingkas}>{info.ringkas}</span></p>
                      <p className={styles.axisMeta}>
                        Dirasakan {c.saat_ini}% → diharapkan {c.harapan}% ({ARAH_ICON[g?.arah] || ""} {fmtGap(g?.nilai_gap)})
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogSection>

          <p className={styles.dialogFootnote}>
            Tidak ada tipe budaya yang paling benar. Yang berguna dibaca adalah selisih antara
            yang Anda rasakan dan yang Anda harapkan.
          </p>
        </CwDetailDialog>
      )}
    </div>
  );
}

/** Satu baris rencana aksi, pola "PENDING TASKS" di benchmark. */
function AksiRow({ aksi, delay, onClick }) {
  const [ref, shown] = useReveal();
  return (
    <button
      type="button"
      ref={ref}
      className={`${styles.aksiRow} ${styles.reveal} ${shown ? styles.revealShown : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <span className={styles.aksiIkon} aria-hidden="true">{aksi.ikon}</span>
      <span className={styles.aksiBody}>
        <span className={styles.aksiJudul}>{aksi.judul}</span>
        <span className={styles.aksiMeta}>
          <span className={styles.aksiTag}>{aksi.terkait}</span>
          <span className={styles.aksiJangka}>{aksi.jangka}</span>
        </span>
      </span>
      <span className={styles.aksiChevron} aria-hidden="true">›</span>
    </button>
  );
}
