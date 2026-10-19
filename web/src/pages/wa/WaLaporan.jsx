// Cangkang laporan kelompok Wellbeing Assessment untuk Human Capital (desktop, tetap rapi di
// tablet dan ponsel). Enam tab: lima dari desain acuan ditambah "Temuan & Langkah" untuk insight,
// tindak lanjut, tema cerita, dan perbandingan kelompok yang ada di berkas olahan tapi belum punya
// layar di desain. Semua tab membaca satu cakupan (lembaga, jenjang, unit, atau kelompok jabatan)
// yang dipilih di bilah atas.

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Buildings, CaretDown, ClockCounterClockwise, Compass, UsersThree } from "@phosphor-icons/react";
import SampleTag from "../../components/SampleTag";
import { CAKUPAN, JUDUL_TAB_WELLBEING } from "./lib/waMeta";
import {
  cariKelompok, formatHari, individuDalam, keteranganPembaruan, labelPeriode, narasiKelompok, opsiCakupan, tanggalPembaruan,
} from "./lib/waAturan";
import { langkahHc } from "./lib/waTur";
import { IKON_TAB } from "./waIkon";
import { Petunjuk, Segmen } from "./WaUi";
import { EASE } from "./waGerak";
import WaRingkasan from "./WaRingkasan";
import WaWellbeing from "./WaWellbeing";
import WaKepuasan from "./WaKepuasan";
import WaSurvey from "./WaSurvey";
import WaTestimoni from "./WaTestimoni";
import WaTemuan from "./WaTemuan";
import WaProfilDialog from "./WaProfilDialog";
import WaTur from "./WaTur";
import { sudahDilihat, tandaiDilihat } from "./waSimpanan";
import swTokens from "../sw/swTokens.module.css";
import tokens from "./waTokens.module.css";
import styles from "./WaLaporan.module.css";

const TAB = [
  { id: "ringkasan", label: "Ringkasan", Isi: WaRingkasan },
  { id: "wellbeing", label: JUDUL_TAB_WELLBEING, Isi: WaWellbeing },
  { id: "kepuasan", label: "Kepuasan Kerja", Isi: WaKepuasan },
  { id: "survey", label: "Survey", Isi: WaSurvey },
  { id: "testimoni", label: "Testimoni", Isi: WaTestimoni },
  { id: "temuan", label: "Temuan & Langkah", Isi: WaTemuan },
];

/**
 * @param dataset dataset lengkap (pembaca berkas, data contoh, atau Supabase)
 * @param akses   { peran: 'hc', nama }
 * @param tabAtas tinggi header aplikasi di atasnya (px); bilah tab menempel tepat di bawahnya
 */
export default function WaLaporan({ dataset, akses, tabAtas = 0 }) {
  const [tab, setTab] = useState("ringkasan");
  const [jenis, setJenis] = useState("lembaga");
  const [kunci, setKunci] = useState("lembaga");
  const [profilId, setProfilId] = useState(null);
  // Panduan per tab. Panduan tab Ringkasan terbuka sendiri pada kunjungan pertama di perangkat ini.
  const [tur, setTur] = useState(() => (sudahDilihat("panduan-hc") ? null : "ringkasan"));

  const opsi = useMemo(() => opsiCakupan(dataset), [dataset]);
  const kelompok = useMemo(() => cariKelompok(dataset, kunci), [dataset, kunci]);
  const individu = useMemo(() => individuDalam(dataset, kelompok), [dataset, kelompok]);
  const narasi = useMemo(() => narasiKelompok(dataset, kelompok), [dataset, kelompok]);
  const profil = useMemo(() => dataset.individu.find((o) => o.id === profilId) || null, [dataset, profilId]);
  const pembaruan = useMemo(() => tanggalPembaruan(dataset), [dataset]);

  const gantiJenis = useCallback((j) => {
    setJenis(j);
    if (j === "lembaga") setKunci("lembaga");
    else setKunci(opsi.find((c) => c.kunci === j)?.opsi[0]?.kunci || "lembaga");
  }, [opsi]);

  const pilihCakupan = useCallback((k) => {
    const g = dataset.kelompok.find((x) => x.kunci === k);
    if (!g) return;
    setJenis(g.cakupan);
    setKunci(k);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [dataset]);

  const tutupTur = useCallback(() => {
    setTur(null);
    tandaiDilihat("panduan-hc");
  }, []);

  const keTab = useCallback((t) => {
    setTab(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const opsiJenis = CAKUPAN.filter((c) => c.kunci === "lembaga" || opsi.some((o) => o.kunci === c.kunci))
    .map((c) => ({ nilai: c.kunci, label: c.kunci === "kelompok_jabatan" ? "Jabatan" : c.label }));
  const pilihanJenis = opsi.find((c) => c.kunci === jenis)?.opsi || [];
  const TabAktif = TAB.find((t) => t.id === tab) || TAB[0];
  const ctx = { dataset, kelompok, individu, narasi, keTab, bukaProfil: setProfilId, pilihCakupan };

  return (
    <MotionConfig reducedMotion="user">
      <div className={`${swTokens.scope} ${tokens.scope} ${styles.halaman}`} style={{ "--wa-tab-atas": `${tabAtas}px` }}>
        <nav className={styles.tabBar} aria-label="Bagian laporan" data-tur-lekat>
          <div className={styles.tabBarDalam}>
            <div className={styles.tabDaftar} role="tablist" data-tur="tab-bar">
              {TAB.map((t) => {
                const Ikon = IKON_TAB[t.id];
                const aktif = t.id === tab;
                return (
                  <motion.button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={aktif}
                    className={`${styles.tab} ${aktif ? styles.tabAktif : ""}`}
                    onClick={() => keTab(t.id)}
                    whileTap={{ scale: 0.95 }}
                  >
                    {aktif && <motion.span layoutId="wa-tab-aktif" className={styles.tabLatar} transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                    <span className={styles.tabIsi}>
                      <Ikon size={17} weight="fill" aria-hidden="true" />
                      {t.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
            <motion.button
              type="button"
              className={styles.panduan}
              onClick={() => setTur(tab)}
              whileTap={{ scale: 0.93 }}
              whileHover={{ y: -1 }}
              title={`Panduan tab ${TabAktif.label}`}
            >
              <Compass size={17} weight="fill" aria-hidden="true" />
              <span>Panduan</span>
            </motion.button>
            <span className={styles.pengguna} title={akses?.nama}>
              <UsersThree size={17} weight="fill" aria-hidden="true" />
              {akses?.nama || "Human Capital"}
            </span>
          </div>
        </nav>

        <div className={styles.isi}>
          <motion.header className={styles.kepala} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
            <div className={styles.kepalaKiri}>
              <p className={styles.kecil}>
                <Buildings size={15} weight="fill" aria-hidden="true" />
                {dataset.meta.lembaga}
                {dataset.meta.periodeId && <> · {labelPeriode(dataset.meta.periodeId)}</>}
                {pembaruan.terakhir && (
                  <Petunjuk teks={keteranganPembaruan(pembaruan)}>
                    <span className={styles.diperbarui}>
                      <ClockCounterClockwise size={14} weight="bold" aria-hidden="true" />
                      Diperbarui {formatHari(pembaruan.terakhir)}
                    </span>
                  </Petunjuk>
                )}
                {dataset.meta.contoh && <SampleTag />}
              </p>
              <AnimatePresence mode="wait">
                <motion.h1 key={kelompok.kunci} className={styles.judul} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE }}>
                  {kelompok.cakupan === "lembaga" ? "Seluruh lembaga" : kelompok.nama}
                  <span className={styles.judulN}>{kelompok.nResponden} pegawai</span>
                </motion.h1>
              </AnimatePresence>
            </div>
            <div className={styles.cakupan} data-tur="cakupan">
              <Segmen id="wa-jenis-cakupan" label="Jenis cakupan" opsi={opsiJenis} nilai={jenis} onUbah={gantiJenis} kecil />
              <AnimatePresence initial={false}>
                {jenis !== "lembaga" && (
                  <motion.label
                    key="pilih"
                    className={styles.pilih}
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    <select value={kunci} onChange={(e) => setKunci(e.target.value)} aria-label={`Pilih ${opsiJenis.find((o) => o.nilai === jenis)?.label || "cakupan"}`}>
                      {pilihanJenis.map((o) => <option key={o.kunci} value={o.kunci}>{o.nama} ({o.n})</option>)}
                    </select>
                    <CaretDown size={14} weight="bold" aria-hidden="true" />
                  </motion.label>
                )}
              </AnimatePresence>
            </div>
          </motion.header>

          <AnimatePresence mode="popLayout" initial={false}>
            <motion.main
              key={`${tab}-${kelompok.kunci}`}
              className={styles.panel}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: EASE }}
              role="tabpanel"
            >
              <TabAktif.Isi {...ctx} />
            </motion.main>
          </AnimatePresence>

          <p className={styles.kaki}>
            Angka dibaca dari hasil olahan asesmen. Narasi tampil setelah ditinjau tim Fammi. Cerita pribadi pegawai tidak pernah ditampilkan di laporan ini.
          </p>
        </div>

        <WaProfilDialog orang={profil} onTutup={() => setProfilId(null)} />
        {tur && (
          <WaTur
            key={tur}
            judul={`Panduan ${TAB.find((t) => t.id === tur)?.label || ""}`}
            langkah={langkahHc(tur, { nResponden: kelompok.nResponden })}
            onTutup={tutupTur}
          />
        )}
      </div>
    </MotionConfig>
  );
}
