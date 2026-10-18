// Tab Temuan & Langkah. Tidak ada di desain acuan; dibuat untuk isi berkas olahan yang belum punya
// layar: insight lintas data, tindak lanjut per pihak, tema cerita (tanpa kutipan), sebaran
// wellbeing terhadap kepuasan per orang, dan perbandingan antarkelompok yang bisa diklik untuk
// berpindah cakupan.

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Buildings, CaretDown, ChartScatter, CheckCircle, Flag, Lightbulb, LockKey, UserCircleGear, UsersThree,
} from "@phosphor-icons/react";
import { CAKUPAN, KATEGORI_PROTEK, PRIORITAS, infoKategoriProtek, labelTerkait } from "./lib/waMeta";
import { formatAngka, formatPersen, kataKorelasi } from "./lib/waAturan";
import { Bar, Bertahap, Chip, Grid, JudulBagian, Kartu, KeadaanKosong, Muncul, Segmen, Tombol } from "./WaUi";
import { EASE } from "./waGerak";
import t from "./WaTab.module.css";

const IKON_UNTUK = { "Human Capital": UserCircleGear, "Pimpinan unit": UsersThree, Direksi: Buildings };

export default function WaTemuan({ dataset, kelompok, individu, narasi, bukaProfil, pilihCakupan }) {
  const insight = narasi?.insight || [];
  const tindak = narasi?.tindak_lanjut || [];
  const temaCerita = narasi?.tema_cerita || [];
  return (
    <Bertahap className={t.halaman}>
      <section data-tur="insight">
        <JudulBagian keterangan="Pola yang baru terlihat kalau beberapa sumber data dibaca bersamaan.">Temuan utama</JudulBagian>
        {insight.length ? (
          <Grid kolom={insight.length > 2 ? 3 : 2}>
            {insight.map((x, i) => <KartuInsight key={x.judul} nomor={i + 1} insight={x} />)}
          </Grid>
        ) : <Kartu><KeadaanKosong ikon={Lightbulb} judul="Temuan belum tersedia untuk cakupan ini" pesan="Temuan ditulis untuk lembaga dan kelompok berisi lima pegawai atau lebih." /></Kartu>}
      </section>

      <TindakLanjut daftar={tindak} />

      {temaCerita.length > 0 && <TemaCerita daftar={temaCerita} n={kelompok.nCerita} />}

      <Sebaran individu={individu} korelasi={kelompok.korelasiProtekKepuasan} bukaProfil={bukaProfil} />

      <Perbandingan dataset={dataset} aktif={kelompok.kunci} pilihCakupan={pilihCakupan} />
    </Bertahap>
  );
}

// ── Insight ─────────────────────────────────────────────────────────────────────────────────

function KartuInsight({ nomor, insight }) {
  const [buka, setBuka] = useState(false);
  return (
    <Kartu className={t.insight} naik>
      <span className={t.insightNomor}>{String(nomor).padStart(2, "0")}</span>
      <h3>{insight.judul}</h3>
      <p>{insight.isi}</p>
      {insight.bukti && (
        <>
          <motion.button type="button" className={t.insightTombol} onClick={() => setBuka((v) => !v)} whileTap={{ scale: 0.95 }} aria-expanded={buka}>
            {buka ? "Sembunyikan angka pendukung" : "Lihat angka pendukung"}
            <motion.span animate={{ rotate: buka ? 180 : 0 }} style={{ display: "inline-flex" }}><CaretDown size={14} weight="bold" /></motion.span>
          </motion.button>
          <AnimatePresence initial={false}>
            {buka && (
              <motion.p className={t.insightBukti} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                {insight.bukti}
              </motion.p>
            )}
          </AnimatePresence>
        </>
      )}
    </Kartu>
  );
}

// ── Tindak lanjut ───────────────────────────────────────────────────────────────────────────

function TindakLanjut({ daftar }) {
  const [untuk, setUntuk] = useState("");
  const [buka, setBuka] = useState(0);
  const urut = useMemo(() => {
    const peringkat = Object.fromEntries(PRIORITAS.map((p, i) => [p.kunci, i]));
    return [...daftar].sort((a, b) => (peringkat[a.prioritas] ?? 9) - (peringkat[b.prioritas] ?? 9));
  }, [daftar]);
  const pihak = [...new Set(urut.map((x) => x.untuk).filter(Boolean))];
  const tampil = urut.filter((x) => !untuk || x.untuk === untuk);
  return (
    <section data-tur="tindak">
      <JudulBagian
        keterangan="Usulan langkah yang sudah ditinjau. Klik satu kartu untuk melihat langkah dan cara mengukur keberhasilannya."
        aksi={pihak.length > 1 && (
          <Segmen id="wa-untuk" label="Saring pihak" kecil nilai={untuk} onUbah={(v) => { setUntuk(v); setBuka(0); }}
            opsi={[{ nilai: "", label: "Semua", jumlah: urut.length }, ...pihak.map((p) => ({ nilai: p, label: p, jumlah: urut.filter((x) => x.untuk === p).length }))]} />
        )}
      >
        Langkah tindak lanjut
      </JudulBagian>
      {tampil.length === 0 ? (
        <Kartu><KeadaanKosong ikon={Flag} judul="Belum ada tindak lanjut untuk cakupan ini" /></Kartu>
      ) : (
        <Bertahap className={t.tindakDaftar} jeda={0.06}>
          {tampil.map((x, i) => {
            const p = PRIORITAS.find((q) => q.kunci === x.prioritas);
            const Ikon = IKON_UNTUK[x.untuk] || UsersThree;
            const terbuka = buka === i;
            return (
              <Kartu key={`${x.judul}-${i}`} className={`${t.tindak} ${terbuka ? t.tindakBuka : ""}`} style={{ "--w": p?.warna || "var(--fm-ungu)" }} layout>
                <motion.button type="button" className={t.tindakKepala} onClick={() => setBuka(terbuka ? -1 : i)} aria-expanded={terbuka} whileTap={{ scale: 0.99 }}>
                  <span className={t.tindakMeta}>
                    {p && <Chip warna={p.warna} teks={x.prioritas === "sedang" ? "#222222" : "#ffffff"}>{p.label}</Chip>}
                    <span className={t.tindakUntuk}><Ikon size={16} weight="fill" aria-hidden="true" /> {x.untuk}</span>
                  </span>
                  <span className={t.tindakJudul}>{x.judul}</span>
                  <motion.span className={t.tindakPanah} animate={{ rotate: terbuka ? 180 : 0 }}><CaretDown size={18} weight="bold" /></motion.span>
                </motion.button>
                <AnimatePresence initial={false}>
                  {terbuka && (
                    <motion.div className={t.tindakIsi} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                      <p className={t.tindakMengapa}>{x.mengapa}</p>
                      <div className={t.tindakDua}>
                        <div>
                          <h4>Langkah</h4>
                          <ol className={t.langkah}>
                            {(x.langkah || []).map((l, j) => (
                              <motion.li key={j} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + j * 0.08 }}>
                                <span>{j + 1}</span>{l}
                              </motion.li>
                            ))}
                          </ol>
                        </div>
                        <div>
                          <h4>Tanda berhasil</h4>
                          <ul className={t.indikator}>
                            {(x.indikator || []).map((l, j) => (
                              <motion.li key={j} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + j * 0.08 }}>
                                <CheckCircle size={18} weight="fill" aria-hidden="true" />{l}
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {x.terkait && (
                        <div className={t.terkait}>
                          <span>Berangkat dari:</span>
                          {labelTerkait(x.terkait).map((l) => <span key={l} className={t.terkaitChip}>{l}</span>)}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Kartu>
            );
          })}
        </Bertahap>
      )}
    </section>
  );
}

// ── Tema cerita ─────────────────────────────────────────────────────────────────────────────

function TemaCerita({ daftar, n }) {
  const maks = Math.max(...daftar.map((x) => x.jumlah), 1);
  return (
    <section data-tur="tema-cerita">
      <JudulBagian keterangan={`Dirangkum dari ${n ?? "sejumlah"} cerita yang ditulis pegawai. Tanpa kutipan dan tanpa nama; isi cerita hanya dibaca tim pendamping.`}>
        Yang sering diceritakan pegawai
      </JudulBagian>
      <Kartu className={t.temaCerita}>
        <span className={t.temaCeritaKunci}><LockKey size={16} weight="fill" aria-hidden="true" /> Hanya tema dengan lima orang atau lebih</span>
        <Bertahap jeda={0.06}>
          {daftar.map((x, i) => (
            <Muncul key={x.tema} className={t.temaCeritaBaris}>
              <span className={t.temaCeritaNama}>{x.tema}</span>
              <Bar pct={(x.jumlah / maks) * 100} warna={i === 0 ? "var(--fm-ungu)" : "var(--fm-ungu-sedang)"} tunda={0.1 + i * 0.07} />
              <span className={t.temaCeritaAngka}>{x.jumlah} orang</span>
            </Muncul>
          ))}
        </Bertahap>
      </Kartu>
    </section>
  );
}

// ── Sebaran wellbeing vs kepuasan ───────────────────────────────────────────────────────────

const LEBAR = 1040;
const TINGGI = 320;
const PAD = { kiri: 44, kanan: 16, atas: 16, bawah: 36 };

function Sebaran({ individu, korelasi, bukaProfil }) {
  const [sorot, setSorot] = useState(null);
  const titik = individu.filter((o) => typeof o.protek.pct === "number" && typeof o.kepuasan.rata === "number");
  if (titik.length < 5) return null;
  const xMin = Math.max(0, Math.floor(Math.min(...titik.map((o) => o.protek.pct)) / 10) * 10);
  const x = (v) => PAD.kiri + ((v - xMin) / (100 - xMin)) * (LEBAR - PAD.kiri - PAD.kanan);
  const y = (v) => PAD.atas + (1 - (v - 1) / 4) * (TINGGI - PAD.atas - PAD.bawah);
  const garisX = [];
  for (let v = xMin; v <= 100; v += 10) garisX.push(v);
  const kata = kataKorelasi(korelasi);
  const o = titik.find((p) => p.id === sorot);

  return (
    <section data-tur="sebaran">
      <JudulBagian
        keterangan="Satu titik satu pegawai. Makin ke kanan makin baik wellbeing-nya, makin ke atas makin puas. Klik titik untuk profil singkat."
        aksi={typeof korelasi === "number" && (
          <Chip warna="var(--fm-ungu-tua)" petunjuk="Koefisien korelasi dari berkas olahan. Makin mendekati 1, makin searah kedua ukuran bergerak.">
            Keterkaitan {kata}, r = {formatAngka(korelasi, 2)}
          </Chip>
        )}
      >
        Wellbeing dan kepuasan, apakah bergerak bersama?
      </JudulBagian>
      <Kartu className={t.sebaran}>
        <svg viewBox={`0 0 ${LEBAR} ${TINGGI}`} className={t.sebaranSvg} role="img" aria-label={`Sebaran ${titik.length} pegawai menurut skor wellbeing dan rata-rata kepuasan`}>
          {garisX.map((v) => (
            <g key={v}>
              <line x1={x(v)} x2={x(v)} y1={PAD.atas} y2={TINGGI - PAD.bawah} stroke="var(--fm-abu-garis)" />
              <text x={x(v)} y={TINGGI - PAD.bawah + 18} textAnchor="middle" fontSize="12" fill="var(--fm-teks-lembut)">{v}%</text>
            </g>
          ))}
          {[1, 2, 3, 4, 5].map((v) => (
            <g key={v}>
              <line x1={PAD.kiri} x2={LEBAR - PAD.kanan} y1={y(v)} y2={y(v)} stroke="var(--fm-abu-garis)" />
              <text x={PAD.kiri - 10} y={y(v) + 4} textAnchor="end" fontSize="12" fill="var(--fm-teks-lembut)">{v}</text>
            </g>
          ))}
          {titik.map((p, i) => {
            const k = infoKategoriProtek(p.protek.kategori);
            return (
              <motion.circle
                key={p.id}
                cx={x(p.protek.pct)}
                cy={y(p.kepuasan.rata)}
                r={sorot === p.id ? 8 : 5.5}
                fill={k?.warna || "var(--fm-ungu)"}
                fillOpacity={0.78}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + Math.min(i, 120) * 0.006, type: "spring", stiffness: 300, damping: 18 }}
                style={{ cursor: "pointer", transformOrigin: `${x(p.protek.pct)}px ${y(p.kepuasan.rata)}px` }}
                onMouseEnter={() => setSorot(p.id)}
                onMouseLeave={() => setSorot(null)}
                onFocus={() => setSorot(p.id)}
                onBlur={() => setSorot(null)}
                onClick={() => bukaProfil(p.id)}
                tabIndex={0}
                role="button"
                aria-label={`${p.nama}, wellbeing ${formatPersen(p.protek.pct)}, kepuasan ${formatAngka(p.kepuasan.rata, 2)}`}
              />
            );
          })}
        </svg>
        <div className={t.sebaranBawah}>
          <ul className={t.sebaranLegenda}>
            {KATEGORI_PROTEK.map((k) => <li key={k.kunci} style={{ "--w": k.warna }}><span />{k.label}</li>)}
          </ul>
          <AnimatePresence mode="wait">
            {o ? (
              <motion.p key={o.id} className={t.sebaranInfo} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <b>{o.nama}</b> · {o.unit} · wellbeing {formatPersen(o.protek.pct)} · kepuasan {formatAngka(o.kepuasan.rata, 2)}
              </motion.p>
            ) : (
              <motion.p key="kosong" className={t.sebaranInfo} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ChartScatter size={16} weight="fill" aria-hidden="true" /> Arahkan kursor ke titik
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </Kartu>
    </section>
  );
}

// ── Perbandingan kelompok ───────────────────────────────────────────────────────────────────

function Perbandingan({ dataset, aktif, pilihCakupan }) {
  const jenisAda = CAKUPAN.filter((c) => c.kunci !== "lembaga" && dataset.kelompok.some((k) => k.cakupan === c.kunci));
  const [jenis, setJenis] = useState(jenisAda[0]?.kunci || "jenjang");
  const [semua, setSemua] = useState(false);
  const lembaga = dataset.kelompok.find((k) => k.cakupan === "lembaga");
  const baris = useMemo(
    () => dataset.kelompok.filter((k) => k.cakupan === jenis).sort((a, b) => (b.protek.pct ?? 0) - (a.protek.pct ?? 0)),
    [dataset, jenis],
  );
  if (!jenisAda.length) return null;
  const tampil = semua ? baris : baris.slice(0, 8);
  return (
    <section data-tur="banding">
      <JudulBagian
        keterangan="Diurutkan dari skor wellbeing tertinggi. Garis tipis menandai angka lembaga. Klik satu baris untuk membuka laporan kelompok itu."
        aksi={<Segmen id="wa-banding" label="Jenis kelompok" kecil nilai={jenis} onUbah={(v) => { setJenis(v); setSemua(false); }}
          opsi={jenisAda.map((c) => ({ nilai: c.kunci, label: c.kunci === "kelompok_jabatan" ? "Jabatan" : c.label }))} />}
      >
        Perbandingan antarkelompok
      </JudulBagian>
      <Kartu className={t.banding}>
        <div className={t.bandingKepala} aria-hidden="true">
          <span>Kelompok</span>
          <span>Skor wellbeing</span>
          <span>Rata-rata kepuasan</span>
        </div>
        <AnimatePresence mode="popLayout">
          {tampil.map((k, i) => (
            <motion.button
              key={k.kunci}
              layout
              type="button"
              className={`${t.bandingBaris} ${k.kunci === aktif ? t.bandingAktif : ""}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
              exit={{ opacity: 0 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => pilihCakupan(k.kunci)}
            >
              <span className={t.bandingNama}>
                <b>{k.nama}</b>
                <small>{k.nResponden} pegawai</small>
              </span>
              <span className={t.bandingNilai}>
                <span className={t.bandingBar}>
                  <Bar pct={k.protek.pct} warna="var(--fm-ungu)" tunda={0.1 + i * 0.04} />
                  {lembaga && <span className={t.bandingPenanda} style={{ left: `${lembaga.protek.pct}%` }} />}
                </span>
                <b>{formatPersen(k.protek.pct, 1)}</b>
              </span>
              <span className={t.bandingNilai}>
                <span className={t.bandingBar}>
                  <Bar pct={(k.kepuasan.rata / 5) * 100} warna="var(--fm-hijau)" tunda={0.15 + i * 0.04} />
                  {lembaga && <span className={t.bandingPenanda} style={{ left: `${(lembaga.kepuasan.rata / 5) * 100}%` }} />}
                </span>
                <b>{formatAngka(k.kepuasan.rata, 2)}</b>
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
        {baris.length > 8 && (
          <div className={t.lebih}>
            <Tombol varian="lembut" ukuran="kecil" onClick={() => setSemua((v) => !v)}>
              {semua ? "Tampilkan delapan teratas" : `Tampilkan semua ${baris.length} kelompok`}
            </Tombol>
          </div>
        )}
      </Kartu>
    </section>
  );
}
