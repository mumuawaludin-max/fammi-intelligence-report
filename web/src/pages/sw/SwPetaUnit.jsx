// Tab Per Unit sebagai ruang kendali: tabel warna dipecah dua kolom supaya semua unit muat satu
// layar, dua daftar unit di kanan, rincian satu unit dibuka lewat dialog. Kepala unit langsung
// melihat rincian unitnya.

import { useState } from "react";
import { CaretDown, CaretUp, HandHeart, Sparkle } from "@phosphor-icons/react";
import { ALASAN, BARIS_SKOR, JENJANG, KELOMPOK_UNIT, SKALA_KONDISI, SUBSKALA } from "./lib/swMeta";
import {
  daftarKategori, formatAngka, formatPersen, jumlahUnitKecil, kategoriKondisi, porsi,
  saringUnitTampil, unitKecil,
} from "./lib/swAturan";
import {
  AngkaKecil, BarBaris, BarTumpuk, CatatanUnitKecil, ChipKategori, Dialog, Kartu, KeadaanLayar, Pilihan,
  TabelPadanan, Petunjuk,
} from "./SwUi";
import { WARNA_ALASAN } from "./swWarna";
import styles from "./SwPetaUnit.module.css";

const nilaiKolom = (u, kunci) => (kunci === "indeks" ? u.indeks : kunci === "nama" ? u.nama : u.skor?.[kunci]);
const HURUF = { energi: "E", fungsi: "K", beban: "B", dukungan: "D", makna: "M", indeks: "T" };
const WARNA_KONDISI = ["var(--fm-jingga)", "var(--fm-jingga-muda)", "var(--fm-emas)", "var(--fm-ungu-sedang)", "var(--fm-ungu)"];

export default function SwPetaUnit({ data, peran }) {
  const { asumsi, lembaga } = data;
  const [kelompok, setKelompok] = useState("");
  const [jenjang, setJenjang] = useState("");
  const [urutan, setUrutan] = useState({ kunci: "indeks", arah: "naik" });
  const [dipilih, setDipilih] = useState(null);

  const tampil = saringUnitTampil(data.unit, peran, asumsi);
  const kali = urutan.arah === "naik" ? 1 : -1;
  const baris = tampil
    .filter((u) => (!kelompok || u.kelompok === kelompok) && (!jenjang || u.jenjang === jenjang))
    .sort((a, b) => {
      const va = nilaiKolom(a, urutan.kunci);
      const vb = nilaiKolom(b, urutan.kunci);
      if (typeof va === "string") return kali * va.localeCompare(vb, "id");
      return kali * ((va ?? -1) - (vb ?? -1)) || a.nama.localeCompare(b.nama, "id");
    });
  const kepalaUnit = peran === "kepalaUnit";
  const unitDipilih = data.unit.find((u) => u.id === dipilih) || null;
  const kategori = daftarKategori(asumsi);
  // Peringkat samping hanya dari unit di atas ambang: unit 3 orang mudah memuncaki atau menutup
  // peringkat karena satu isian. Unit kecil tetap ada di tabel kiri.
  const barisPeringkat = baris.filter((u) => !unitKecil(u, asumsi));
  const urutSkor = [...(barisPeringkat.length ? barisPeringkat : baris)].sort((a, b) => b.indeks - a.indeks);

  if (kepalaUnit) {
    if (!tampil.length) {
      return (
        <KeadaanLayar
          jenis="kosong"
          judul="Unit Anda tidak ditemukan"
          pesan="Hubungi tim Fammi agar akun Anda ditautkan ke unit yang benar."
        />
      );
    }
    return <RincianUnit unit={tampil[0]} lembaga={lembaga} asumsi={asumsi} />;
  }

  function klikJudul(kunci) {
    setUrutan((u) => (u.kunci === kunci ? { kunci, arah: u.arah === "naik" ? "turun" : "naik" } : { kunci, arah: "naik" }));
  }

  const separuh = Math.ceil(baris.length / 2);
  const kolomTabel = [baris.slice(0, separuh), baris.slice(separuh)];

  return (
    <div className={styles.tab}>
      <Kartu
        className={styles.kartuPeta}
        judul="Skor tiap unit"
        aksi={(
          <>
            <Pilihan sebaris label="Kelompok" nilai={kelompok} onUbah={setKelompok} opsi={KELOMPOK_UNIT.map((k) => ({ nilai: k.kunci, label: k.label }))} />
            <Pilihan sebaris label="Jenjang" nilai={jenjang} onUbah={setJenjang} opsi={JENJANG.map((j) => ({ nilai: j, label: j }))} />
            <TabelPadanan
              judul="Skor tiap unit"
              kolom={["Unit", "Pengisi", ...BARIS_SKOR.map((s) => s.label)]}
              baris={[...baris, { ...lembaga, nama: "Seluruh lembaga" }].map((u) => [u.nama, u.nPengisi, ...BARIS_SKOR.map((s) => formatAngka(nilaiKolom(u, s.kunci)))])}
            />
          </>
        )}
      >
        {baris.length === 0 ? <KeadaanLayar jenis="kosong" judul="Tidak ada unit yang cocok" /> : (
          <div className={styles.duaTabel}>
            {kolomTabel.map((isi, i) => isi.length > 0 && (
              <table key={i} className={styles.peta}>
                <thead>
                  <tr>
                    <JudulKolom kunci="nama" urutan={urutan} onKlik={klikJudul} kiri>Unit</JudulKolom>
                    {BARIS_SKOR.map((s) => (
                      <JudulKolom key={s.kunci} kunci={s.kunci} urutan={urutan} onKlik={klikJudul} judul={s.label}>{HURUF[s.kunci]}</JudulKolom>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isi.map((u) => (
                    <tr
                      key={u.id}
                      tabIndex={0}
                      className={styles.barisKlik}
                      onClick={() => setDipilih(u.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDipilih(u.id); } }}
                    >
                      <th scope="row" title={`${u.nama} · ${u.nPengisi} pengisi`}>
                        {u.nama}
                        <small>{` · ${u.nPengisi}${unitKecil(u, asumsi) ? " (kecil)" : ""}`}</small>
                      </th>
                      {BARIS_SKOR.map((s) => <SelNilai key={s.kunci} nilai={nilaiKolom(u, s.kunci)} asumsi={asumsi} total={s.kunci === "indeks"} />)}
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
        )}
        <div className={styles.barisLembaga}>
          <span>Seluruh lembaga · {lembaga.nPengisi}</span>
          {BARIS_SKOR.map((s) => {
            const kat = kategoriKondisi(nilaiKolom(lembaga, s.kunci), asumsi);
            return (
              <span key={s.kunci} className={styles.selLembaga} style={{ background: kat?.warna, color: kat?.teks }}>
                {HURUF[s.kunci]} {formatAngka(nilaiKolom(lembaga, s.kunci))}
              </span>
            );
          })}
        </div>
        <p className={styles.legenda}>
          {BARIS_SKOR.map((s) => (
            <Petunjuk key={s.kunci} teks={s.panjang}><span><b>{HURUF[s.kunci]}</b> {s.pendek}</span></Petunjuk>
          ))}
          <span className={styles.pisah} />
          {kategori.map((k) => (
            <Petunjuk key={k.kunci} teks={`${k.label}: skor ${k.min} sampai ${k.max} dari 100.`}><span><i style={{ background: k.warna }} />{k.label}</span></Petunjuk>
          ))}
        </p>
        <CatatanUnitKecil jumlah={jumlahUnitKecil(baris, asumsi)} ambang={asumsi.minPengisiUnit} />
      </Kartu>

      <DaftarUnit className={styles.atas} judul="Unit yang praktiknya layak dipelajari" ikon={Sparkle} warnaIkon="var(--fm-hijau)" daftar={urutSkor.slice(0, 5)} asumsi={asumsi} onPilih={setDipilih} />
      <DaftarUnit className={styles.bawah} judul="Unit yang paling perlu dukungan" ikon={HandHeart} warnaIkon="var(--fm-jingga)" daftar={[...urutSkor].reverse().slice(0, 5)} asumsi={asumsi} onPilih={setDipilih} />

      {unitDipilih && (
        <Dialog lebar judul={unitDipilih.nama} keterangan={`${unitDipilih.nPengisi} dari ${unitDipilih.nPegawai} pegawai mengisi`} onTutup={() => setDipilih(null)}>
          <RincianUnit unit={unitDipilih} lembaga={lembaga} asumsi={asumsi} dalamDialog />
        </Dialog>
      )}
    </div>
  );
}

function JudulKolom({ kunci, urutan, onKlik, children, judul, kiri = false }) {
  const aktif = urutan.kunci === kunci;
  return (
    <th scope="col" className={kiri ? styles.kiri : ""} aria-sort={aktif ? (urutan.arah === "naik" ? "ascending" : "descending") : "none"}>
      <button type="button" className={styles.judulUrut} onClick={() => onKlik(kunci)} title={judul ? `Urutkan menurut ${judul}` : "Urutkan menurut nama"}>
        {children}
        {aktif && (urutan.arah === "naik" ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />)}
      </button>
    </th>
  );
}

function SelNilai({ nilai, asumsi, total }) {
  const kat = kategoriKondisi(nilai, asumsi);
  return (
    <td className={`${styles.sel} ${total ? styles.selTotal : ""}`} style={kat ? { background: kat.warna, color: kat.teks } : undefined} title={kat?.label}>
      {formatAngka(nilai)}
    </td>
  );
}

function DaftarUnit({ judul, daftar, asumsi, onPilih, className, ikon, warnaIkon }) {
  return (
    <Kartu className={className} judul={judul} ikon={ikon} warnaIkon={warnaIkon}>
      <ol className={styles.daftar}>
        {daftar.map((u) => (
          <li key={u.id}>
            <button type="button" onClick={() => onPilih(u.id)}>
              <span title={u.nama}>{u.nama}</span>
              <strong>{formatAngka(u.indeks)}</strong>
              <ChipKategori nilai={u.indeks} asumsi={asumsi} />
            </button>
          </li>
        ))}
      </ol>
    </Kartu>
  );
}

/** Rincian satu unit, dipakai di dialog (yayasan, Human Capital) dan langsung di layar (kepala unit). */
function RincianUnit({ unit, lembaga, asumsi, dalamDialog = false }) {
  const p = unit.pengamatan;
  const kondisi = SKALA_KONDISI.map((s) => ({ kunci: String(s.nilai), label: s.label, jumlah: unit.kondisi?.[s.nilai] || 0, warna: WARNA_KONDISI[s.nilai - 1] }));
  return (
    <div className={`${styles.rincian} ${dalamDialog ? styles.rincianDialog : ""}`}>
      <Kartu
        judul="Skor dibanding lembaga"
        aksi={(
          <TabelPadanan
            judul={`Skor ${unit.nama}`}
            kolom={["Aspek", "Unit", "Lembaga"]}
            baris={BARIS_SKOR.map((s) => [s.label, formatAngka(nilaiKolom(unit, s.kunci)), formatAngka(nilaiKolom(lembaga, s.kunci))])}
          />
        )}
      >
        <div className={styles.skorBaris}>
          <strong>{formatAngka(unit.indeks)}</strong>
          <div>
            <ChipKategori nilai={unit.indeks} asumsi={asumsi} />
            <span>Lembaga {formatAngka(lembaga.indeks)}</span>
          </div>
        </div>
        {SUBSKALA.map((s) => (
          <BarBaris
            key={s.kunci}
            label={s.pendek}
            nilai={unit.skor[s.kunci]}
            warna={kategoriKondisi(unit.skor[s.kunci], asumsi)?.warna}
            penanda={lembaga.skor[s.kunci]}
            labelPenanda="Lembaga"
            lebarLabel="118px"
          />
        ))}
        <p className={styles.kecil}>
          Garis tegak = rata-rata lembaga
          {unitKecil(unit, asumsi) && ` · pengisi di bawah ${asumsi.minPengisiUnit} orang, angkanya mudah berubah`}
        </p>
      </Kartu>

      <Kartu judul="Rasanya bekerja 4 pekan terakhir">
        <BarTumpuk label="Rasanya bekerja" segmen={kondisi} />
        <p className={styles.subJudul}>Dukungan paling dibutuhkan</p>
        <ol className={styles.kebutuhan}>
          {unit.kebutuhanTop.map((k) => <li key={k.kunci}>{k.label} <span>({k.jumlah})</span></li>)}
        </ol>
        <div className={styles.angkaBaris}>
          <AngkaKecil nilai={formatPersen(porsi(unit.nPengisi, unit.nPegawai))} label="pegawai mengisi" />
          <AngkaKecil nilai={p ? "Sudah" : "Belum"} label="dinilai atasan" catatan={p ? `${p.nDinilai} orang` : undefined} />
        </div>
      </Kartu>

      <Kartu
        judul={`${unit.peserta.total} disarankan asesmen`}
        aksi={(
          <TabelPadanan
            judul={`Alasan di ${unit.nama}`}
            kolom={["Alasan", "Jumlah orang", "Porsi"]}
            baris={ALASAN.map((a) => [a.label, unit.peserta.perAlasan[a.kunci] || 0, formatPersen(porsi(unit.peserta.perAlasan[a.kunci] || 0, unit.peserta.total))])}
          />
        )}
      >
        {ALASAN.map((a) => {
          const n = unit.peserta.perAlasan[a.kunci] || 0;
          return (
            <BarBaris key={a.kunci} label={a.label} nilai={n} maks={Math.max(1, unit.peserta.total)} warna={WARNA_ALASAN[a.kunci]} teks={n} lebarLabel="150px" />
          );
        })}
        <p className={styles.kecil}>Satu orang bisa punya beberapa alasan</p>
      </Kartu>
    </div>
  );
}
