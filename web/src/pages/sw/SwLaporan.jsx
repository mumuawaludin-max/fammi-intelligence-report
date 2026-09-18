// Cangkang laporan Screening Awal Wellbeing sebagai ruang kendali (yayasan, kepala unit, HC;
// pegawai memakai SwPegawaiLaporan yang mobile-first). Di layar laptop (lebar ≥ 1024px)
// tinggi modul dikunci ke sisa layar di bawah header aplikasi, jadi setiap tab muat tanpa gulir
// halaman; rincian panjang dibuka lewat dialog. Di layar sempit (ponsel) halaman mengalir biasa.

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Binoculars, ChartBar, ChatCenteredText, ListChecks, SquaresFour, User,
} from "@phosphor-icons/react";
import SampleTag from "../../components/SampleTag";
import { SARINGAN_KOSONG, bolehLihat, siapkanDataUntukPeran } from "./lib/swAturan";
import { KalimatFooter, KeadaanLayar, Pilihan } from "./SwUi";
import SwRingkasan from "./SwRingkasan";
import SwDaftar from "./SwDaftar";
import SwProfil from "./SwProfil";
import SwPetaUnit from "./SwPetaUnit";
import SwPimpinan from "./SwPimpinan";
import SwSuara from "./SwSuara";
import tokens from "./swTokens.module.css";
import styles from "./SwLaporan.module.css";

const TAB = [
  { id: "ringkasan", label: "Ringkasan", ikon: ChartBar },
  { id: "daftar", label: "Daftar Peserta", ikon: ListChecks },
  { id: "profil", label: "Profil Pegawai", ikon: User },
  { id: "peta", label: "Per Unit", ikon: SquaresFour },
  { id: "pimpinan", label: "Pandangan Atasan", ikon: Binoculars },
  { id: "suara", label: "Suara Pegawai", ikon: ChatCenteredText },
];

const LABEL_PERAN = {
  yayasan: "Yayasan",
  kepalaUnit: "Kepala unit",
  hc: "Human Capital",
  pegawai: "Pegawai",
};

function labelPeriode(periodeId) {
  if (!periodeId) return "";
  const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const [y, m] = periodeId.split("-").map(Number);
  return `${BULAN[m - 1] || ""} ${y}`.trim();
}

/** Kunci tinggi elemen ke sisa layar di bawahnya (mode ruang kendali). */
function useTinggiLayar(ref) {
  const [tinggi, setTinggi] = useState(null);
  useLayoutEffect(() => {
    function ukur() {
      const el = ref.current;
      if (!el) return;
      if (window.innerWidth < 1024 || window.innerHeight < 560) { setTinggi(null); return; }
      const atas = el.getBoundingClientRect().top + window.scrollY;
      setTinggi(Math.max(480, window.innerHeight - atas));
    }
    ukur();
    window.addEventListener("resize", ukur);
    return () => window.removeEventListener("resize", ukur);
  }, [ref]);
  return tinggi;
}

/**
 * @param dataset  dataset lengkap (dari Supabase atau berkas contoh)
 * @param akses    { peran, unitId, individuId, nama }
 * @param store    penyimpanan catatan tindak lanjut (lihat data/swStore.js)
 */
export default function SwLaporan({ dataset, akses, store }) {
  const data = useMemo(() => siapkanDataUntukPeran(dataset, akses), [dataset, akses]);
  const peran = akses?.peran;
  const tabTersedia = useMemo(() => TAB.filter((t) => bolehLihat(peran, `tab.${t.id}`)), [peran]);
  const [tab, setTab] = useState(() => tabTersedia[0]?.id || "ringkasan");
  const [saringan, setSaringan] = useState(SARINGAN_KOSONG);
  const [individuId, setIndividuId] = useState(peran === "pegawai" ? akses.individuId : null);
  const [subSuara, setSubSuara] = useState("kondisi");
  const [unitFokusId, setUnitFokusId] = useState("");
  const ref = useRef(null);
  const tinggi = useTinggiLayar(ref);

  const keDaftar = useCallback((awal) => {
    setSaringan({ ...SARINGAN_KOSONG, ...(awal || {}) });
    setTab("daftar");
  }, []);

  const bukaProfil = useCallback((id) => {
    setIndividuId(id);
    setTab("profil");
  }, []);

  const kelas = `${tokens.scope} ${styles.halaman} ${tinggi ? styles.pas : ""}`;
  const gaya = tinggi ? { height: tinggi } : undefined;

  if (!data || !tabTersedia.length) {
    return (
      <div ref={ref} className={kelas} style={gaya}>
        <KeadaanLayar
          jenis="kosong"
          judul={!data ? "Belum ada data Screening Awal Wellbeing" : "Modul ini tidak tersedia untuk peran Anda"}
          pesan={!data ? "Hasil screening lembaga ini belum diunggah." : undefined}
        />
      </div>
    );
  }

  // Kepala unit biasa punya satu unit; pimpinan (Direktur/Wakil Direktur) punya beberapa unit
  // binaan dan memilih satu unit untuk Ringkasan dan Suara Pegawai.
  const unitKepala = peran === "kepalaUnit" ? data.unit : [];
  const banyakUnit = unitKepala.length > 1;
  const unitFokus = unitKepala.find((u) => u.id === unitFokusId) || unitKepala[0] || null;
  const tabAktif = tabTersedia.some((t) => t.id === tab) ? tab : tabTersedia[0].id;
  const pemilihUnit = banyakUnit && (tabAktif === "ringkasan" || tabAktif === "suara");

  return (
    <div ref={ref} className={kelas} style={gaya}>
      <header className={styles.kepala}>
        <div className={styles.identitas}>
          <h1 className={styles.judul}>
            {data.meta?.lembaga}
            {data.meta?.contoh && <SampleTag />}
          </h1>
          <p className={styles.subjudul}>
            Screening Awal Wellbeing · {labelPeriode(data.meta?.periodeId)}
            {peran && <> · {LABEL_PERAN[peran]}</>}
            {unitFokus && (banyakUnit ? <> · {unitKepala.length} unit binaan</> : <> · {unitFokus.nama}</>)}
          </p>
        </div>
        <div className={styles.aksiKepala}>
        {pemilihUnit && (
          <Pilihan
            sebaris
            label="Unit"
            semua={null}
            nilai={unitFokus.id}
            onUbah={setUnitFokusId}
            opsi={unitKepala.map((u) => ({ nilai: u.id, label: u.nama }))}
          />
        )}
        {tabTersedia.length > 1 && (
          <nav className={styles.barTab} aria-label="Bagian laporan">
            <ul role="list">
              {tabTersedia.map((t) => {
                const Ikon = t.ikon;
                const aktif = t.id === tabAktif;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      className={`${styles.tab} ${aktif ? styles.tabAktif : ""}`}
                      aria-current={aktif ? "page" : undefined}
                      onClick={() => setTab(t.id)}
                    >
                      <Ikon size={18} weight={aktif ? "fill" : "regular"} aria-hidden="true" />
                      <span>{t.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
        </div>
      </header>

      <main className={styles.isi}>
        {tabAktif === "ringkasan" && <SwRingkasan data={data} peran={peran} unitFokus={unitFokus} onKeDaftar={keDaftar} />}
        {tabAktif === "daftar" && (
          <SwDaftar data={data} peran={peran} saringan={saringan} onSaringan={setSaringan} onBukaProfil={bukaProfil} />
        )}
        {tabAktif === "profil" && (
          <SwProfil data={data} akses={akses} store={store} individuId={individuId} onPilih={setIndividuId} />
        )}
        {tabAktif === "peta" && <SwPetaUnit data={data} peran={peran} />}
        {tabAktif === "pimpinan" && <SwPimpinan data={data} peran={peran} />}
        {tabAktif === "suara" && <SwSuara data={data} peran={peran} unitFokus={unitFokus} sub={subSuara} onSub={setSubSuara} />}
      </main>

      <footer className={styles.kaki}>
        <span>Yang diukur kondisi kerja, bukan kondisi pribadi pegawai.</span>
        <KalimatFooter />
      </footer>
    </div>
  );
}
