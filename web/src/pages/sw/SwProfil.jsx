// Tab Profil Pegawai sebagai ruang kendali. Human Capital memilih pegawai lewat pemilih: unit
// dulu, lalu daftar nama yang bisa diurutkan menurut yang paling perlu didampingi. Kepala profil
// selalu terlihat; isinya dibagi ke empat sub-tab supaya setiap bagian muat satu layar: posisi
// dan harapan, pandangan atasan, jawaban dan dukungan, serta catatan tindak lanjut (hanya HC).

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowsDownUp, ChartPolar, ChatCircleText, CheckCircle, Eye, Funnel, HandHeart, Lightbulb, MagnifyingGlass, Scales, Smiley,
  SquaresFour, UsersThree, Warning,
} from "@phosphor-icons/react";
import {
  ALASAN, GAP_PANDANGAN, KALIMAT_BUKAN_DIAGNOSIS, KEBUTUHAN, POLA, SKALA_KONDISI, STATUS_TINJAUAN, SUBSKALA,
  URUTAN_PROFIL, indikatorPerRanah, infoKuadran, labelJalur, labelKondisi,
} from "./lib/swMeta";
import {
  LABEL_STATUS_DATA, bandingTigaLapis, bolehLihat, cariIndividu, daftarKategori, formatAngka, kalimatTigaLapis,
  kategoriKondisi, nilaiUrutan, statusData, susunAlasan, unitKecil, urutIndividu,
} from "./lib/swAturan";
import {
  BarNilai, ChipKategori, Dialog, Kartu, KeadaanLayar, KotakKuadran, Lencana, Petunjuk, Pilihan, Radar, Sakelar,
  TabelPadanan, Tombol,
} from "./SwUi";
import { IKON_ASPEK, IKON_KONDISI, TEKS_KONDISI, WARNA_KONDISI } from "./swWarna";
import styles from "./SwProfil.module.css";

const SUB = [
  { id: "posisi", label: "Posisi & harapan" },
  { id: "atasan", label: "Pandangan atasan" },
  { id: "jawaban", label: "Jawaban & dukungan" },
  { id: "catatan", label: "Catatan HC", hak: "profil.tinjauan" },
];

export default function SwProfil({ data, akses, store, individuId, onPilih }) {
  const peran = akses.peran;
  const orang = useMemo(() => data.individu.find((o) => o.id === individuId) || null, [data.individu, individuId]);
  const bolehCari = bolehLihat(peran, "profil.cari");

  if (!individuId || !orang) {
    if (individuId) {
      return <KeadaanLayar jenis="galat" judul="Profil tidak ditemukan" pesan="Profil ini tidak ada di data yang boleh Anda lihat." />;
    }
    if (!bolehCari) return <KeadaanLayar jenis="kosong" judul="Pilih pegawai dulu" pesan="Buka dari Daftar Peserta." />;
    return <PemilihPegawai data={data} onPilih={onPilih} />;
  }
  return <IsiProfil key={orang.id} data={data} akses={akses} store={store} orang={orang} onPilih={onPilih} bolehCari={bolehCari} />;
}

// ── Pemilih pegawai: unit dulu, lalu nama ───────────────────────────────────────────────────

const OPSI_URUT = URUTAN_PROFIL.map((u) => ({ nilai: u.kunci, label: u.label }));
const OPSI_ALASAN = ALASAN.map((a) => ({ nilai: a.kunci, label: a.label }));
const OPSI_POLA = [...POLA.map((p) => ({ nilai: p.kunci, label: p.label })), { nilai: "tanpa", label: "Belum dinilai atasan" }];
const BATAS_DAFTAR = 120;

function maksUrutan(kunci, daftar) {
  const u = URUTAN_PROFIL.find((x) => x.kunci === kunci);
  if (!u) return 100;
  if (u.satuan === "dari 5") return 5;
  if (u.satuan === "dari 100" || u.satuan.startsWith("skor ")) return 100;
  return Math.max(1, ...daftar.map((o) => u.nilai(o)).filter((v) => typeof v === "number"));
}

/**
 * Dua kartu berdampingan: daftar unit di kiri, daftar nama di kanan. Klik unit menyaring nama;
 * urutan bisa dipilih dari yang paling perlu didampingi. Dipakai sebagai layar awal tab Profil
 * dan di dalam dialog "Ganti pegawai".
 */
function PemilihPegawai({ data, onPilih, unitAwal = "", dalamDialog = false }) {
  const [unitId, setUnitId] = useState(unitAwal);
  const [urut, setUrut] = useState("spa");
  const [hanyaPeserta, setHanyaPeserta] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [kategori, setKategori] = useState("");
  const [pola, setPola] = useState("");
  const [semuaBaris, setSemuaBaris] = useState(false);
  const opsiKategori = useMemo(() => daftarKategori(data.asumsi).map((k) => ({ nilai: k.kunci, label: k.label })), [data.asumsi]);
  // Saringan: peserta, alasan, kategori skor, dan pandangan atasan; semuanya bisa digabung.
  const semua = useMemo(() => data.individu.filter((o) => (!hanyaPeserta || o.peserta)
    && (!alasan || susunAlasan(o, data.asumsi).includes(alasan))
    && (!kategori || kategoriKondisi(o.indeks, data.asumsi)?.kunci === kategori)
    && (!pola || (o.pola || "tanpa") === pola)), [data.individu, data.asumsi, hanyaPeserta, alasan, kategori, pola]);
  const units = useMemo(() => [...data.unit]
    .map((u) => ({ ...u, n: semua.filter((o) => o.unitId === u.id).length }))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id")), [data.unit, semua]);
  const unit = units.find((u) => u.id === unitId) || null;
  const daftar = useMemo(() => urutIndividu(semua.filter((o) => !unitId || o.unitId === unitId), urut), [semua, unitId, urut]);
  const infoUrut = URUTAN_PROFIL.find((u) => u.kunci === urut);
  const maks = maksUrutan(urut, daftar);
  const namaUnit = Object.fromEntries(data.unit.map((u) => [u.id, u.nama]));
  // Daftar panjang dipotong dulu supaya layar tetap ringan; pilih unit atau buka semua.
  const tampil = semuaBaris ? daftar : daftar.slice(0, BATAS_DAFTAR);

  return (
    <div className={`${styles.pemilih} ${dalamDialog ? styles.pemilihDialog : ""}`}>
      <Kartu judul="Saring, lalu pilih unit" ikon={Funnel} isiClassName={styles.daftarUnit}>
        <div className={styles.saringPemilih}>
          <Sakelar nyala={hanyaPeserta} onUbah={setHanyaPeserta} label="Hanya peserta asesmen lanjutan" />
          <Pilihan sebaris label="Alasan" nilai={alasan} onUbah={setAlasan} opsi={OPSI_ALASAN} />
          <Pilihan sebaris label="Kategori" nilai={kategori} onUbah={setKategori} opsi={opsiKategori} />
          <Pilihan sebaris label="Atasan" nilai={pola} onUbah={setPola} opsi={OPSI_POLA} petunjuk="Pandangan atasan dari Form B." />
        </div>
        <p className={styles.judulUnit}><SquaresFour size={14} weight="bold" aria-hidden="true" /> Unit</p>
        <button type="button" className={`${styles.tombolUnit} ${!unitId ? styles.tombolUnitAktif : ""}`} onClick={() => setUnitId("")}>
          <span>Seluruh lembaga</span><b>{semua.length}</b>
        </button>
        {units.map((u) => (
          <button key={u.id} type="button" className={`${styles.tombolUnit} ${unitId === u.id ? styles.tombolUnitAktif : ""}`} onClick={() => setUnitId(u.id)}>
            <span title={u.nama}>{u.nama}</span><b>{u.n}</b>
          </button>
        ))}
      </Kartu>

      <Kartu
        judul={`${unit ? unit.nama : "Seluruh lembaga"} · ${daftar.length} pegawai`}
        ikon={UsersThree}
        warnaIkon="var(--fm-ungu-sedang)"
        isiClassName={styles.daftarOrangIsi}
        aksi={<Pilihan sebaris label="Urutkan" nilai={urut} onUbah={setUrut} opsi={OPSI_URUT} semua={null} />}
      >
        <p className={styles.kecilUrut}><ArrowsDownUp size={14} weight="bold" aria-hidden="true" /> {infoUrut?.panjang}</p>
        {daftar.length === 0 ? <KeadaanLayar jenis="kosong" judul="Tidak ada pegawai yang cocok" /> : (
          <ol className={styles.daftarOrang}>
            {tampil.map((o, i) => {
              const v = nilaiUrutan(o, urut);
              return (
                <li key={o.id}>
                  <button type="button" className={styles.barisOrang} onClick={() => onPilih(o.id)}>
                    <span className={styles.nomorOrang}>{i + 1}</span>
                    <span className={styles.namaOrang}>
                      <b>{o.nama}</b>
                      <small>{o.jabatan || "-"}{!unitId ? ` · ${namaUnit[o.unitId]}` : ""}{o.peserta ? " · peserta asesmen" : ""}</small>
                    </span>
                    <ChipKategori nilai={o.indeks} asumsi={data.asumsi} />
                    {v ? (
                      <span className={styles.nilaiOrang}>
                        <BarNilai nilai={v.nilai} maks={maks} warna={infoUrut.arah === "turun" ? "var(--fm-jingga)" : "var(--fm-ungu)"} />
                        <b>{formatAngka(v.nilai)}</b>
                        <small>{v.satuan}</small>
                      </span>
                    ) : <span className={styles.nilaiOrang} />}
                  </button>
                </li>
              );
            })}
          </ol>
        )}
        {!semuaBaris && daftar.length > BATAS_DAFTAR && (
          <Tombol varian="teks" onClick={() => setSemuaBaris(true)}>Tampilkan semua {daftar.length} pegawai</Tombol>
        )}
      </Kartu>
    </div>
  );
}

function Pencarian({ data, onPilih }) {
  const [kata, setKata] = useState("");
  const hasil = cariIndividu(data.individu, kata);
  const namaUnit = Object.fromEntries(data.unit.map((u) => [u.id, u.nama]));
  return (
    <div className={styles.cari}>
      <MagnifyingGlass size={18} aria-hidden="true" />
      <input
        type="search"
        value={kata}
        onChange={(e) => setKata(e.target.value)}
        placeholder={`Cari dari ${data.individu.length} pegawai`}
        aria-label="Cari nama pegawai"
      />
      {hasil.length > 0 && (
        <ul className={styles.hasilCari} role="listbox" aria-label="Hasil pencarian">
          {hasil.map((o) => (
            <li key={o.id}>
              <button type="button" onClick={() => { onPilih(o.id); setKata(""); }}>
                <strong>{o.nama}</strong>
                <span>{namaUnit[o.unitId]} · {o.jabatan}{o.peserta ? " · peserta" : ""}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {kata.trim().length >= 2 && hasil.length === 0 && <p className={styles.tanpaHasil}>Tidak ada nama yang cocok.</p>}
    </div>
  );
}

// ── Isi profil ──────────────────────────────────────────────────────────────────────────────

function IsiProfil({ data, akses, store, orang, onPilih, bolehCari }) {
  const { asumsi, lembaga } = data;
  const peran = akses.peran;
  const [sub, setSub] = useState("posisi");
  const [bukaPemilih, setBukaPemilih] = useState(false);
  const unit = data.unit.find((u) => u.id === orang.unitId) || null;
  const namaUnit = unit?.nama || data.unitSendiri?.nama || "-";
  const pembanding = unit && (peran === "hc" || !unitKecil(unit, asumsi)) ? unit : null;
  const alasan = susunAlasan(orang, asumsi);
  const subTersedia = SUB.filter((s) => !s.hak || bolehLihat(peran, s.hak));
  const tampilAlasan = orang.peserta || peran === "hc";

  return (
    <article className={styles.profil} aria-labelledby="sw-profil-nama">
      <header className={styles.kepala}>
        <div className={styles.kepalaKiri}>
          <div className={styles.namaBaris}>
            <h2 id="sw-profil-nama" className={styles.nama}>{orang.nama}</h2>
            <Petunjuk teks={statusData(orang) === "lengkap" ? "Ada isian pegawai (Form A) dan penilaian atasan (Form B)." : "Hanya ada isian pegawai sendiri; atasannya belum mengisi Form B."}>
              <span className={statusData(orang) === "lengkap" ? styles.statusLengkap : styles.statusDiri}>
                {LABEL_STATUS_DATA[statusData(orang)]}
              </span>
            </Petunjuk>
            <span className={orang.peserta ? styles.statusPeserta : styles.statusBukan}>
              {orang.peserta ? `Disarankan asesmen · ${labelJalur(orang.peserta.jalur).toLowerCase()}` : "Tidak masuk daftar asesmen"}
            </span>
          </div>
          <p className={styles.meta}>
            {namaUnit} · {orang.jabatan || "-"} · {orang.jenjang || "tanpa jenjang"} · masa kerja {orang.masaKerja || "-"} · atasan {orang.atasan || "-"}
          </p>
          <div className={styles.lencanaBaris}>
            {tampilAlasan && alasan.map((k) => <Lencana key={k} kunci={k} />)}
            {orang.catatanData && (
              <Petunjuk teks={orang.catatanData}>
                <span className={styles.peringatan}><Warning size={14} weight="fill" aria-hidden="true" /> Nama sama dengan pegawai lain</span>
              </Petunjuk>
            )}
          </div>
        </div>
        <div className={styles.kepalaKanan}>
          {bolehCari && (
            <div className={styles.barisCari}>
              <Pencarian data={data} onPilih={onPilih} />
              <Tombol varian="garis" onClick={() => setBukaPemilih(true)}>
                <SquaresFour size={16} weight="bold" aria-hidden="true" /> Pilih dari unit
              </Tombol>
            </div>
          )}
          <div className={styles.subTab} role="tablist" aria-label="Bagian profil">
            {subTersedia.map((s) => (
              <button key={s.id} type="button" role="tab" aria-selected={sub === s.id} className={sub === s.id ? styles.subAktif : ""} onClick={() => setSub(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className={styles.isi}>
        {sub === "posisi" && (
          <Posisi orang={orang} unit={pembanding} lembaga={lembaga} asumsi={asumsi} peran={peran}
            unitAda={Boolean(unit) || Boolean(data.unitKecilMilikSendiri)} />
        )}
        {sub === "atasan" && <PandanganAtasan orang={orang} />}
        {sub === "jawaban" && <JawabanDukungan orang={orang} unit={pembanding} lembaga={lembaga} />}
        {sub === "catatan" && bolehLihat(peran, "profil.tinjauan") && <CatatanHc orang={orang} store={store} akses={akses} />}
      </div>

      {bukaPemilih && (
        <Dialog lebar judul="Pilih pegawai" keterangan="Klik unit di kiri, lalu klik nama. Urutan bisa diganti." onTutup={() => setBukaPemilih(false)}>
          <PemilihPegawai data={data} unitAwal={orang.unitId} dalamDialog onPilih={(id) => { setBukaPemilih(false); onPilih(id); }} />
        </Dialog>
      )}
    </article>
  );
}

// ── Posisi & harapan ────────────────────────────────────────────────────────────────────────

const LAPIS = [
  { kunci: "diri", warna: "var(--fm-ungu)", tebal: true },
  { kunci: "unit", label: "Unit", panjang: "Rata-rata unit", warna: "var(--fm-emas)" },
  { kunci: "lembaga", label: "Lembaga", panjang: "Rata-rata lembaga", warna: "var(--ink-4, #a8a2b4)" },
];

/** Lima wajah: sekarang (nyala) dan harapan 3 bulan lagi (garis emas). */
export function SkalaKondisi({ kondisi, target, sebaran, lingkup }) {
  return (
    <div className={styles.skala}>
      {SKALA_KONDISI.map((s) => {
        const Ikon = IKON_KONDISI[s.nilai];
        const kini = kondisi === s.nilai;
        const harapan = target === s.nilai;
        const n = sebaran?.[s.nilai] || 0;
        return (
          <Petunjuk key={s.nilai} teks={`${s.panjang}${sebaran ? ` ${n} orang di ${lingkup} memilih angka ini.` : ""}`} blok>
            <div className={`${styles.skalaItem} ${kini ? styles.skalaKini : ""} ${harapan && !kini ? styles.skalaTarget : ""}`}>
              <span className={styles.skalaIkon} style={kini ? { background: WARNA_KONDISI[s.nilai], color: TEKS_KONDISI[s.nilai] } : undefined}>
                <Ikon size={22} weight="fill" aria-hidden="true" />
              </span>
              <span className={styles.skalaAngka}>{s.nilai}</span>
              <span className={styles.skalaLabel}>{s.label}</span>
              <span className={styles.skalaTanda}>{kini ? "Sekarang" : harapan ? "Harapan" : sebaran ? `${n} orang` : ""}</span>
            </div>
          </Petunjuk>
        );
      })}
    </div>
  );
}

function Posisi({ orang, unit, lembaga, asumsi, peran, unitAda }) {
  const baris = bandingTigaLapis(orang, unit, lembaga);
  const kalimat = kalimatTigaLapis(baris);
  const lapis = LAPIS.map((l) => (l.kunci === "diri" ? { ...l, label: peran === "pegawai" ? "Anda" : "Pegawai ini" } : l));
  const acuan = unit || lembaga;
  const sebaran = acuan.kondisi || {};
  const selisih = typeof orang.target === "number" && typeof orang.kondisi === "number" ? orang.target - orang.kondisi : null;
  const sumbu = SUBSKALA.map((s) => ({ kunci: s.kunci, label: s.huruf }));
  const lapisRadar = lapis
    .filter((l) => baris.some((b) => b[l.kunci] !== null))
    .map((l) => ({ ...l, nilai: Object.fromEntries(baris.map((b) => [b.kunci, b[l.kunci]])) }));
  // Keterangan unit kecil ikut di judul supaya kartu tetap muat satu layar.
  let judulArti = "Artinya";
  if (!unit && unitAda) judulArti = `Artinya · dibanding lembaga, unit di bawah ${asumsi.minPengisiUnit} pengisi`;
  else if (unit && unitKecil(unit, asumsi)) judulArti = `Artinya · unit di bawah ${asumsi.minPengisiUnit} pengisi, rata-ratanya mudah berubah`;

  return (
    <div className={styles.gridPosisi}>
      <Kartu
        className={styles.kartuLapis}
        judul="Dibanding rekan unit dan lembaga"
        ikon={ChartPolar}
        aksi={(
          <TabelPadanan
            judul="Dibanding rekan unit dan lembaga"
            kolom={["Aspek", "Pegawai", "Rata-rata unit", "Rata-rata lembaga", "Selisih dengan unit", "Selisih dengan lembaga"]}
            baris={baris.map((b) => [b.label, formatAngka(b.diri), formatAngka(b.unit), formatAngka(b.lembaga), formatAngka(b.selisihUnit), formatAngka(b.selisihLembaga)])}
          />
        )}
      >
        <div className={styles.lapisIsi}>
          <div className={styles.radarKotak}>
            <Radar sumbu={sumbu} lapis={lapisRadar} ukuran={150} labelLebar={22} />
          </div>
          <div className={styles.lapis} role="img" aria-label={baris.map((b) => `${b.label}: ${formatAngka(b.diri)}, unit ${formatAngka(b.unit)}, lembaga ${formatAngka(b.lembaga)}`).join("; ")}>
            <div className={`${styles.barisLapis} ${styles.kepalaLapis}`} aria-hidden="true">
              <span>Aspek</span>
              <span>Kategori</span>
              {lapis.map((l) => <span key={l.kunci} title={l.panjang}><i style={{ background: l.warna }} />{l.label}</span>)}
            </div>
            {baris.map((b) => {
              const Ikon = IKON_ASPEK[b.kunci];
              return (
                <div key={b.kunci} className={`${styles.barisLapis} ${b.kunci === "indeks" ? styles.barisTotal : ""}`}>
                  <Petunjuk teks={b.panjang || SUBSKALA.find((s) => s.kunci === b.kunci)?.panjang} blok>
                    <span className={styles.labelLapis}>
                      {Ikon && <Ikon size={15} weight="fill" aria-hidden="true" />}
                      {SUBSKALA.find((s) => s.kunci === b.kunci) && <em>{SUBSKALA.find((s) => s.kunci === b.kunci).huruf}</em>}
                      {SUBSKALA.find((s) => s.kunci === b.kunci)?.pendek || b.pendek || b.label}
                    </span>
                  </Petunjuk>
                  <span><ChipKategori nilai={b.diri} asumsi={asumsi} /></span>
                  {lapis.map((l) => (
                    <div key={l.kunci} className={styles.batangBaris}>
                      <span className={styles.jalur}>
                        {b[l.kunci] !== null && <span style={{ width: `${b[l.kunci]}%`, background: l.warna }} />}
                      </span>
                      <span className={styles.nilaiLapis} style={l.kunci === "diri" ? { color: "var(--fm-ungu-tua)" } : undefined}>
                        {b[l.kunci] === null ? "-" : formatAngka(b[l.kunci])}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </Kartu>

      <Kartu className={styles.kartuArti} judul={judulArti} ikon={Lightbulb} warnaIkon="var(--fm-hijau)">
        <ul className={styles.kalimat}>
          {kalimat.map((k) => <li key={k}>{k}</li>)}
        </ul>
      </Kartu>

      <Kartu
        className={styles.kartuHarapan}
        judul="Rasanya bekerja sekarang dan harapannya"
        ikon={Smiley}
        warnaIkon="var(--fm-emas)"
        aksi={(
          <TabelPadanan
            judul="Rasanya bekerja 4 pekan terakhir"
            kolom={["Angka", "Arti", `Jumlah orang di ${unit ? "unit" : "lembaga"}`]}
            baris={SKALA_KONDISI.map((s) => [s.nilai, s.label, sebaran[s.nilai] || 0])}
          />
        )}
      >
        <SkalaKondisi kondisi={orang.kondisi} target={orang.target} sebaran={sebaran} lingkup={unit ? "unitnya" : "lembaga"} />
        <p className={styles.ringkasHarapan}>
          Sekarang <b>{orang.kondisi ?? "-"}</b> ({labelKondisi(orang.kondisi).toLowerCase()}), harapan 3 bulan lagi <b>{orang.target ?? "-"}</b>
          {orang.kondisi === 5 ? " · sudah tertinggi" : selisih !== null && <> · ingin naik <b>{selisih > 0 ? `+${selisih}` : selisih}</b></>}
        </p>
      </Kartu>

      <p className={styles.bukanDiagnosis}>{KALIMAT_BUKAN_DIAGNOSIS}</p>
    </div>
  );
}

// ── Pandangan atasan ────────────────────────────────────────────────────────────────────────

function PandanganAtasan({ orang }) {
  const p = orang.pengamatan;
  if (!p) {
    return <KeadaanLayar jenis="kosong" judul="Atasan belum menilai pegawai ini" pesan="Hasilnya hanya dari isian pegawai sendiri." />;
  }
  const kuadran = infoKuadran(p.kuadran);
  return (
    <div className={styles.gridAtasan}>
      <Kartu className={styles.kartuKuadran} judul="Apakah atasan melihat yang dirasakan?" ikon={Eye} warnaIkon="var(--fm-emas)">
        <KotakKuadran aktif={p.kuadran} x={p.kebutuhanTeramati} y={p.kebutuhanDirasakan} />
        <p className={styles.teksKuadran}><strong>{kuadran?.label}.</strong> {kuadran?.arti}</p>
      </Kartu>

      <Kartu
        className={styles.kartuGap}
        judul="Di mana pandangannya berbeda"
        ikon={Scales}
        warnaIkon="var(--fm-ungu-sedang)"
        aksi={<TabelPadanan judul="Selisih pandangan" kolom={["Aspek", "Selisih"]} baris={GAP_PANDANGAN.map((g) => [g.label, formatAngka(p.gap?.[g.kunci])])} />}
      >
        <p className={styles.meta}>Dinilai {p.pimpinan?.join(", ") || "atasan"} · bertemu {p.frekuensi.toLowerCase()}</p>
        {GAP_PANDANGAN.map((g) => <BarDuaArah key={g.kunci} {...g} nilai={p.gap?.[g.kunci]} />)}
      </Kartu>

      <Kartu className={styles.kartuRanah} judul="Yang ditandai atasan" ikon={CheckCircle} warnaIkon="var(--fm-hijau)">
        <div className={styles.gridRanah}>
          {indikatorPerRanah().map((r) => {
            const dicentang = r.indikator.filter((i) => p.indikator.includes(i.kode));
            return (
              <div key={r.kunci} className={`${styles.ranah} ${r.kunci === "kekuatan" ? styles.ranahKekuatan : ""}`}>
                <Petunjuk teks={r.panjang} blok>
                  <p className={styles.ranahJudul}>{r.label} <span>{dicentang.length}/{r.indikator.length}</span></p>
                </Petunjuk>
                {dicentang.length ? (
                  <ul>{dicentang.map((i) => <li key={i.kode} title={i.teks}>{i.teks}</li>)}</ul>
                ) : <p className={styles.tidakAda}>Tidak ada.</p>}
              </div>
            );
          })}
        </div>
      </Kartu>
    </div>
  );
}

export function BarDuaArah({ label, kiri, kanan, nilai, panjang }) {
  const v = typeof nilai === "number" ? Math.max(-100, Math.min(100, nilai)) : null;
  return (
    <div className={styles.duaArah}>
      <div className={styles.duaArahKepala}>
        <Petunjuk teks={panjang}><strong>{label}</strong></Petunjuk>
        <span>{v === null ? "-" : formatAngka(v)}</span>
      </div>
      <div className={styles.duaArahJalur}>
        <span className={styles.duaArahTengah} aria-hidden="true" />
        {v !== null && v !== 0 && (
          <span
            className={styles.duaArahIsi}
            style={v < 0
              ? { right: "50%", width: `${(-v / 100) * 50}%`, background: "var(--fm-emas)" }
              : { left: "50%", width: `${(v / 100) * 50}%`, background: "var(--fm-ungu)" }}
          />
        )}
      </div>
      <div className={styles.duaArahUjung}>
        <span>← {kiri}</span>
        <span>{kanan} →</span>
      </div>
    </div>
  );
}

// ── Jawaban & dukungan ──────────────────────────────────────────────────────────────────────

const PERTANYAAN = [
  { kunci: "bertahan", label: "Yang membuat bertahan", tema: "bertahan" },
  { kunci: "menaikkan", label: "Yang bisa membuat lebih baik", tema: null },
  { kunci: "menguras", label: "Yang paling menguras tenaga", tema: "menguras" },
  { kunci: "diperbaiki", label: "Yang paling ingin diperbaiki", tema: "diperbaiki" },
];

// Jawaban panjang dipotong sebatas kartu; teks utuhnya dibuka lewat dialog.
function KartuJawaban({ q, isi, tema }) {
  const ref = useRef(null);
  const [terpotong, setTerpotong] = useState(false);
  const [buka, setBuka] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const cek = () => setTerpotong(el.scrollHeight > el.clientHeight + 1);
    cek();
    const pengamat = new ResizeObserver(cek);
    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, [isi]);
  return (
    <Kartu
      className={styles.jawaban}
      judul={q.label}
      ikon={ChatCircleText}
      warnaIkon="var(--fm-ungu-sedang)"
      aksi={terpotong && <Tombol varian="garis" onClick={() => setBuka(true)}>Baca lengkap</Tombol>}
    >
      <blockquote ref={ref} className={`${isi ? "" : styles.tidakAda} ${terpotong ? styles.terpotong : ""}`}>
        {isi || "Tidak diisi."}
      </blockquote>
      <p className={styles.tema}><span>Tema</span>{q.tema ? (tema || "Lainnya") : "Tidak dikelompokkan"}</p>
      {buka && (
        <Dialog judul={q.label} keterangan="Jawaban pegawai apa adanya." onTutup={() => setBuka(false)}>
          <blockquote className={styles.jawabanPenuh}>{isi}</blockquote>
        </Dialog>
      )}
    </Kartu>
  );
}

function JawabanDukungan({ orang, unit, lembaga }) {
  const acuan = unit || lembaga;
  const milik = new Set(orang.kebutuhan || []);
  // Satu daftar: tujuh pilihan diurutkan dari yang paling banyak dipilih di unit/lembaga,
  // pilihan pegawai ini ditandai centang.
  const semua = KEBUTUHAN.map((k, i) => ({ ...k, i, jumlah: acuan.kebutuhan?.[k.kunci] || 0 }))
    .sort((a, b) => b.jumlah - a.jumlah || a.i - b.i);
  return (
    <div className={styles.gridJawaban}>
      {PERTANYAAN.map((q) => (
        <KartuJawaban key={q.kunci} q={q} isi={orang.jawaban?.[q.kunci]} tema={q.tema ? orang.tema?.[q.tema] : null} />
      ))}
      <Kartu className={styles.kartuDukungan} judul="Dukungan yang dibutuhkan" ikon={HandHeart} warnaIkon="var(--fm-emas)">
        <p className={styles.subJudul}>
          {milik.size ? `Centang = pilihan pegawai · angka = pemilih di ${unit ? "unitnya" : "lembaga"}` : "Pegawai tidak memilih dukungan apa pun."}
        </p>
        <ul className={styles.kebutuhan}>
          {semua.map((k) => (
            <li key={k.kunci} className={milik.has(k.kunci) ? styles.kebutuhanDipilih : ""}>
              {milik.has(k.kunci)
                ? <CheckCircle size={18} weight="fill" aria-label="Dipilih pegawai" />
                : <span className={styles.titikKosong} aria-hidden="true" />}
              <span>{k.label}</span>
              <b>{k.jumlah}</b>
            </li>
          ))}
        </ul>
      </Kartu>
    </div>
  );
}

// ── Catatan Human Capital ───────────────────────────────────────────────────────────────────

function CatatanHc({ orang, store, akses }) {
  const [isi, setIsi] = useState(null);
  const [status, setStatus] = useState({ jenis: "memuat", pesan: "" });

  useEffect(() => {
    let hidup = true;
    store.bacaTinjauan(orang.id)
      .then((r) => {
        if (!hidup) return;
        setIsi({
          status: r?.status || "belum",
          peninjau: r?.peninjau || akses.nama || "",
          tanggal: r?.tanggal || new Date().toLocaleDateString("sv-SE"),
          catatan: r?.catatan || "",
          diubah_pada: r?.diubah_pada || null,
        });
        setStatus({ jenis: "siap", pesan: "" });
      })
      .catch((e) => hidup && setStatus({ jenis: "galat", pesan: e.message }));
    return () => { hidup = false; };
  }, [orang.id, store, akses.nama]);

  async function simpan(e) {
    e.preventDefault();
    setStatus({ jenis: "menyimpan", pesan: "" });
    try {
      const r = await store.simpanTinjauan(orang.id, isi);
      setIsi((x) => ({ ...x, diubah_pada: r?.diubah_pada || new Date().toISOString() }));
      setStatus({ jenis: "tersimpan", pesan: "Catatan tersimpan." });
    } catch (err) {
      setStatus({ jenis: "galat", pesan: err.message });
    }
  }

  if (status.jenis === "memuat") return <KeadaanLayar jenis="memuat" judul="Memuat catatan" />;
  if (!isi) return <KeadaanLayar jenis="galat" judul="Catatan gagal dimuat" pesan={status.pesan} />;

  return (
    <Kartu className={styles.kartuCatatan} judul="Catatan tindak lanjut · hanya terlihat oleh Human Capital">
      <form className={styles.form} onSubmit={simpan}>
        <Pilihan label="Status" nilai={isi.status} onUbah={(v) => setIsi({ ...isi, status: v })} opsi={STATUS_TINJAUAN.map((s) => ({ nilai: s.kunci, label: s.label }))} semua={null} />
        <label>
          <span>Ditangani oleh</span>
          <input value={isi.peninjau} onChange={(e) => setIsi({ ...isi, peninjau: e.target.value })} required />
        </label>
        <label>
          <span>Tanggal</span>
          <input type="date" value={isi.tanggal} onChange={(e) => setIsi({ ...isi, tanggal: e.target.value })} required />
        </label>
        <label className={styles.lebar}>
          <span>Catatan</span>
          <textarea value={isi.catatan} onChange={(e) => setIsi({ ...isi, catatan: e.target.value })} />
        </label>
        <div className={`${styles.lebar} ${styles.aksiForm}`}>
          <Tombol type="submit" disabled={status.jenis === "menyimpan"}>
            {status.jenis === "menyimpan" ? "Menyimpan…" : "Simpan catatan"}
          </Tombol>
          <span role="status" className={status.jenis === "galat" ? styles.pesanGalat : styles.pesan}>
            {status.pesan || (isi.diubah_pada ? `Terakhir diubah ${new Date(isi.diubah_pada).toLocaleString("id-ID")}` : "Belum ada catatan.")}
          </span>
        </div>
      </form>
    </Kartu>
  );
}
