// Tab Pandangan Atasan sebagai ruang kendali. Hanya yayasan dan Human Capital.
// Kiri: seberapa sejalan tiap atasan dengan timnya. Kanan: cakupan dan gambaran lembaga.
// Rincian satu unit dan pola pengisian (hanya Human Capital) dibuka lewat dialog.
// Urutan ranah indikator: kekuatan lebih dulu, lalu beban, perubahan, situasi.

import { useState } from "react";
import { ClipboardText, Eye, Handshake, Info } from "@phosphor-icons/react";
import { FREKUENSI, KALIMAT_PIMPINAN, KUADRAN, SELISIH, indikatorPerRanah } from "./lib/swMeta";
import {
  bolehLihat, formatAngka, formatPersen, jumlahUnitTersembunyi, labelKeselarasan, porsi, saringUnitTampil,
} from "./lib/swAturan";
import {
  BarBaris, BarNilai, BarTumpuk, Catatan, CatatanUnitKecil, Dialog, Donat, Kartu, KeadaanLayar, KotakKuadran,
  Petunjuk, TabelPadanan, Tabel, Tombol,
} from "./SwUi";
import styles from "./SwPimpinan.module.css";

const WARNA_SELISIH = {
  Selaras: { latar: "var(--fm-ungu-muda)", teks: "var(--fm-ungu-tua)", bar: "var(--fm-ungu)" },
  Ringan: { latar: "var(--fm-ungu-sedang)", teks: "#FFFFFF", bar: "var(--fm-ungu-sedang)" },
  Sedang: { latar: "var(--fm-emas)", teks: "var(--fm-teks)", bar: "var(--fm-emas)" },
  Signifikan: { latar: "var(--fm-jingga)", teks: "#FFFFFF", bar: "var(--fm-jingga)" },
};
const WARNA_FREKUENSI = ["var(--fm-ungu)", "var(--fm-ungu-sedang)", "var(--fm-emas)", "var(--fm-jingga-muda)", "var(--ink-4)", "var(--fm-jalur-lintasan)"];
const ARTI = (label) => SELISIH[label]?.label || "-";

function ChipSelisih({ label, asumsi }) {
  const w = WARNA_SELISIH[label];
  if (!w) return <span className={styles.chip}>-</span>;
  return (
    <Petunjuk teks={SELISIH[label].panjang(asumsi.labelGap)}>
      <span className={styles.chip} style={{ background: w.latar, color: w.teks }}>{ARTI(label)}</span>
    </Petunjuk>
  );
}

export default function SwPimpinan({ data, peran }) {
  const { asumsi, lembaga } = data;
  const [dipilih, setDipilih] = useState(null);
  const [bukaCek, setBukaCek] = useState(false);
  const { tampil, disembunyikan } = saringUnitTampil(data.unit, peran, asumsi);
  const baris = tampil
    .filter((u) => u.pengamatan)
    .sort((a, b) => (b.pengamatan.gapTim ?? -1) - (a.pengamatan.gapTim ?? -1));
  const unitDipilih = baris.find((u) => u.id === dipilih) || null;
  const maksGap = Math.max(40, ...baris.map((u) => u.pengamatan.gapTim ?? 0));
  const pl = lembaga.pengamatan;
  const nKuadran = Object.values(pl?.kuadran || {}).reduce((a, b) => a + b, 0);

  if (!bolehLihat(peran, "tab.pimpinan")) {
    return <KeadaanLayar jenis="kosong" judul="Bagian ini tidak tersedia untuk peran Anda" />;
  }

  return (
    <div className={styles.tab}>
      <div className={styles.kotakWajib} role="note">
        <Info size={20} weight="fill" aria-hidden="true" />
        <p>{KALIMAT_PIMPINAN}</p>
      </div>

      <Kartu
        className={styles.kartuDaftar}
        judul="Seberapa sejalan atasan dan timnya"
        ikon={Handshake}
        aksi={(
          <>
            <span className={styles.petunjuk}>Dari selisih terbesar · klik unit untuk rincian</span>
            <TabelPadanan
              judul="Pandangan atasan per unit"
              kolom={["Unit", "Atasan", "Orang dinilai", "Tanda kekuatan", "Tanda beban", "Tanda perubahan", "Selisih", "Artinya"]}
              baris={[
                ...baris.map((u) => {
                  const p = u.pengamatan;
                  return [u.nama, p.pimpinan?.join(", ") || "-", p.nDinilai, formatAngka(p.rataCentang.kekuatan), formatAngka(p.rataCentang.beban), formatAngka(p.rataCentang.perubahan), formatAngka(p.gapTim), ARTI(labelKeselarasan(p.gapTim, asumsi))];
                }),
                ["Seluruh lembaga", "-", pl?.nDinilai ?? "-", formatAngka(pl?.rataCentang.kekuatan), formatAngka(pl?.rataCentang.beban), formatAngka(pl?.rataCentang.perubahan), formatAngka(pl?.gapTim), ARTI(labelKeselarasan(pl?.gapTim, asumsi))],
              ]}
            />
          </>
        )}
      >
        {baris.length === 0 ? <KeadaanLayar jenis="kosong" judul="Belum ada unit yang bisa ditampilkan" /> : (
          <div className={styles.gridUnit}>
            {baris.map((u) => {
              const label = labelKeselarasan(u.pengamatan.gapTim, asumsi);
              return (
                <button key={u.id} type="button" className={styles.barisUnit} onClick={() => setDipilih(u.id)}>
                  <span className={styles.namaUnit}>
                    <b title={u.nama}>{u.nama}</b>
                    <small title={u.pengamatan.pimpinan?.join(", ")}>{u.pengamatan.pimpinan?.join(", ") || "-"}</small>
                  </span>
                  <BarNilai nilai={u.pengamatan.gapTim} maks={maksGap} warna={WARNA_SELISIH[label]?.bar} />
                  <span className={styles.nilai}>{formatAngka(u.pengamatan.gapTim)}</span>
                  <ChipSelisih label={label} asumsi={asumsi} />
                </button>
              );
            })}
          </div>
        )}
        <Catatan>{`Selisih = jarak isian pegawai dengan penilaian atasannya. Sorot tanda "Sejalan", "Sedikit beda", dan seterusnya untuk batasnya.`}</Catatan>
        <CatatanUnitKecil jumlah={jumlahUnitTersembunyi(data, disembunyikan)} ambang={asumsi.minPengisiUnit} />
      </Kartu>

      <Kartu
        className={styles.kartuCakupan}
        judul="Sudah dinilai atasan"
        ikon={ClipboardText}
        warnaIkon="var(--fm-hijau)"
        aksi={bolehLihat(peran, "pimpinan.qc") && (
          <Tombol varian="garis" onClick={() => setBukaCek(true)}>
            <ClipboardText size={16} weight="bold" aria-hidden="true" /> Pola pengisian
          </Tombol>
        )}
      >
        <div className={styles.cakupanIsi}>
          <Donat
            nilai={lembaga.nUnitPengamatan}
            maks={lembaga.nUnit}
            ukuran={110}
            tebal={12}
            teks={lembaga.nUnitPengamatan}
            sub={`dari ${lembaga.nUnit} unit`}
            warna="var(--fm-hijau)"
          />
          <div className={styles.cakupanTeks}>
            <p className={styles.cakupanAngka}>
              <strong>{formatPersen(porsi(lembaga.nPegawaiPengamatan, lembaga.nPengisi))}</strong> pegawai sudah dinilai atasannya
            </p>
            {lembaga.unitTanpaPengamatan?.length > 0 && (
              <Petunjuk teks={`Belum dinilai atasan: ${lembaga.unitTanpaPengamatan.join(", ")}`} blok>
                <p className={styles.belum}>
                  <b>Belum:</b> {lembaga.unitTanpaPengamatan.join(", ")}
                </p>
              </Petunjuk>
            )}
          </div>
        </div>
      </Kartu>

      <Kartu
        className={styles.kartuLembaga}
        judul="Atasan melihat yang dirasakan?"
        ikon={Eye}
        warnaIkon="var(--fm-emas)"
        aksi={pl && (
          <TabelPadanan
            judul="Gambaran seluruh lembaga"
            kolom={["Keterangan", "Jumlah orang"]}
            baris={[
              ...KUADRAN.map((k) => [k.label, pl.kuadran?.[k.kunci] || 0]),
              ...FREKUENSI.map((f) => [`Bertemu: ${f}`, pl.frekuensi?.[f] || 0]),
            ]}
          />
        )}
      >
        {pl ? (
          <>
            <p className={styles.subJudul}>Seluruh lembaga · {nKuadran} orang · sorot kotak untuk artinya</p>
            <KotakKuadran jumlah={pl.kuadran} total={nKuadran} ringkas />
          </>
        ) : <KeadaanLayar jenis="kosong" judul="Belum ada penilaian atasan" />}
      </Kartu>

      {unitDipilih && <RincianPengamatan unit={unitDipilih} lembaga={lembaga} asumsi={asumsi} onTutup={() => setDipilih(null)} />}
      {bukaCek && <PolaPengisian units={data.unit} asumsi={asumsi} onTutup={() => setBukaCek(false)} />}
    </div>
  );
}

function RincianPengamatan({ unit, lembaga, asumsi, onTutup }) {
  const p = unit.pengamatan;
  const pl = lembaga.pengamatan;
  const nKuadran = Object.values(p.kuadran || {}).reduce((a, b) => a + b, 0);
  return (
    <Dialog
      lebar
      judul={`Yang ditandai atasan di ${unit.nama}`}
      keterangan={`${p.pimpinan?.join(", ") || "Atasan"} menilai ${p.nDinilai} orang · selisih ${formatAngka(p.gapTim)} (${ARTI(labelKeselarasan(p.gapTim, asumsi))})`}
      onTutup={onTutup}
    >
      <div className={styles.rincian}>
        <div className={styles.gridRanah}>
          {indikatorPerRanah().map((r) => (
            <section key={r.kunci} className={`${styles.ranah} ${r.kunci === "kekuatan" ? styles.ranahKekuatan : ""}`}>
              <Petunjuk teks={r.panjang}><h3>{r.label}</h3></Petunjuk>
              {r.indikator.map((i) => {
                const v = p.indikatorPorsi?.[i.kode] ?? 0;
                const l = pl?.indikatorPorsi?.[i.kode] ?? null;
                return (
                  <BarBaris
                    key={i.kode}
                    label={i.teks}
                    petunjuk={i.teks}
                    nilai={v * 100}
                    penanda={l !== null ? l * 100 : null}
                    labelPenanda="Rata-rata lembaga"
                    teks={formatPersen(v)}
                    lebarLabel="minmax(0, 1.4fr)"
                  />
                );
              })}
            </section>
          ))}
        </div>
        <p className={styles.kecil}>Persen anggota tim yang ditandai · garis tegak = rata-rata lembaga</p>
        <div className={styles.rincianBawah}>
          <section>
            <h3>Seberapa sering atasan bertemu timnya</h3>
            <BarTumpuk label="Frekuensi bertemu" segmen={FREKUENSI.map((f, i) => ({ kunci: f, label: f, jumlah: p.frekuensi?.[f] || 0, warna: WARNA_FREKUENSI[i], panjang: `Jawaban atasan tentang seberapa sering bertemu anggota tim: ${f.toLowerCase()}.` }))} />
          </section>
          <section>
            <h3>Apakah atasan melihat yang dirasakan ({nKuadran} orang)</h3>
            <KotakKuadran jumlah={p.kuadran} total={nKuadran} ringkas />
          </section>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * Cara tiap atasan mengisi Form B. Alat baca untuk Human Capital, bukan penilaian atasan: tiga
 * pola pengisian yang membuat angka tim perlu dibaca lebih hati-hati, dengan sumber data dan
 * batasnya dijelaskan di dalam dialog.
 */
function PolaPengisian({ units, asumsi, onTutup }) {
  const q = asumsi.qcPimpinan;
  const baris = units.flatMap((u) => (u.pengamatan?.qc || []).map((x) => ({ ...x, unit: u.nama })));
  const CEK = [
    { kunci: "terlaluBanyak", judul: "Menandai hampir semua orang", batas: `rata-rata ${formatPersen(q.banyakMin)} indikator atau lebih per orang`,
      arti: "hampir semua anggota diberi banyak tanda, jadi tanda tidak lagi membedakan siapa yang benar-benar perlu perhatian." },
    { kunci: "terlaluSedikit", judul: "Hampir tidak menandai", batas: `kurang dari ${formatAngka(q.sedikitMaks)} tanda per orang`,
      arti: "tim terlihat baik-baik saja di Form B; bisa memang begitu, bisa juga atasan jarang bertemu timnya atau ragu menandai." },
    { kunci: "memusat", judul: "Tanda menumpuk di sedikit orang", batas: `${formatPersen(q.pusatMin)} tanda atau lebih jatuh ke 20% nama, pada tim ${q.pusatTimMin} orang ke atas`,
      arti: "sebagian besar tanda jatuh ke orang yang sama; bisa memang begitu, bisa juga hanya orang yang paling dekat dengan atasan yang terlihat." },
  ];
  const pola = (b) => CEK.filter((c) => b[c.kunci]);
  const nAda = baris.filter((b) => pola(b).length).length;
  return (
    <Dialog
      lebar
      judul="Cara tiap atasan mengisi Form B"
      keterangan="Hanya untuk Human Capital. Ini tentang cara atasan mengisi, bukan tentang keadaan timnya, dan bukan penilaian atasan."
      onTutup={onTutup}
    >
      <div className={styles.polaPenjelasan}>
        <p><b>Dari mana datanya.</b> Form B (Leader Form): tiap atasan menandai 15 indikator (kekuatan, beban, perubahan, situasi) untuk setiap anggota timnya. Tabel di bawah merangkum berapa banyak tanda yang diberikan tiap atasan dan ke siapa saja tanda itu jatuh.</p>
        <p><b>Kenapa perlu dilihat.</b> Angka "pandangan atasan" sebuah tim hanya sebaik cara atasannya mengisi. Tiga pola berikut membuat angka tim itu perlu dibaca lebih hati-hati saat menyiapkan pendampingan. Batasnya masih usulan Fammi, belum ditetapkan tim ahli:</p>
        <ol>
          {CEK.map((c) => <li key={c.kunci}><b>{c.judul}</b> ({c.batas}): {c.arti}</li>)}
        </ol>
      </div>
      {baris.length === 0 ? <KeadaanLayar jenis="kosong" judul="Belum ada data" /> : (
        <Tabel
          kolom={["Atasan", "Unit", "Tim dinilai", "Tanda per orang (dari 15)", "Porsi indikator ditandai", "Tanda yang jatuh ke 20% nama teratas", "Pola yang muncul"]}
          baris={baris.map((b) => [
            b.pimpinan, b.unit, b.nDinilai,
            formatAngka(b.rataCentang),
            formatPersen(b.porsiIsi),
            `${formatPersen(b.pemusatan)} (${b.nTeratas} orang)`,
            pola(b).length
              ? <span className={styles.polaBeda}>{pola(b).map((c) => c.judul).join(" · ")}</span>
              : <span className={styles.polaBiasa}>Tidak ada, angka tim bisa dibaca apa adanya</span>,
          ])}
        />
      )}
      <p className={styles.kecil}>
        {`${nAda} dari ${baris.length} atasan punya salah satu pola di atas. Gunakan sebagai bahan percakapan pendampingan kepala unit, bukan sebagai penilaian kinerja.`}
      </p>
    </Dialog>
  );
}
