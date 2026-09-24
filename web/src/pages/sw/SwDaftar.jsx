// Tab Daftar Peserta sebagai ruang kendali.
// Human Capital punya dua sub-tampilan:
//   - Peserta asesmen lanjutan (200 orang): saringan dan ringkasan di layar, daftar nama di dialog.
//   - Semua pegawai: seluruh pengisi screening dalam satu tabel, satu saringan (unit), dan
//     ekspor Excel yang mengikuti saringan itu (permintaan pemilik produk 2026-09-23).
// Yayasan dan kepala unit: jumlah per unit tanpa satu pun nama, tanpa ekspor.
// Skor prioritas bukan kolom bawaan, bukan urutan bawaan, dan tidak pernah ikut diekspor.

import { useMemo, useState } from "react";
import {
  CaretDown, CaretUp, CheckCircle, Funnel, ListBullets, MicrosoftExcelLogo, Question, SquaresFour, UsersThree, Warning,
} from "@phosphor-icons/react";
import {
  ALASAN, JALUR, JENJANG, KELOMPOK_UNIT, POLA, labelJalur, labelKelompok, labelPola,
} from "./lib/swMeta";
import {
  LABEL_STATUS_DATA, URUTAN_SEMUA, barisEksporPegawai, bolehLihat, formatAngka, formatPersen, hitungAlasan,
  jumlahUnitKecil, labelPeriode, opsiUnitPegawai, porsi, saringPegawai, saringPeserta, saringUnitTampil, statusData,
  susunAlasan, urutPeserta,
} from "./lib/swAturan";
import { unduhDaftarPegawai } from "./lib/swEkspor";
import {
  AngkaKecil, BarBaris, BarNilai, BarTumpuk, Catatan, CatatanUnitKecil, Dialog, Kartu, KeadaanLayar,
  Lencana, Petunjuk, Pilihan, Sakelar, TabelPadanan, Tombol,
} from "./SwUi";
import { WARNA_ALASAN } from "./swWarna";
import styles from "./SwDaftar.module.css";

const OPSI_ALASAN = ALASAN.map((a) => ({ nilai: a.kunci, label: a.label }));
const OPSI_KELOMPOK = KELOMPOK_UNIT.map((k) => ({ nilai: k.kunci, label: k.label }));
const OPSI_JALUR = JALUR.map((j) => ({ nilai: j.kunci, label: j.label }));
const OPSI_POLA = [...POLA.map((p) => ({ nilai: p.kunci, label: p.label })), { nilai: "tanpa", label: "Belum dinilai atasan" }];
const OPSI_STATUS = Object.entries(LABEL_STATUS_DATA).map(([nilai, label]) => ({ nilai, label }));

export default function SwDaftar({
  data, peran, saringan, onSaringan, onBukaProfil, sub = "peserta", onSub, unitSemua = "", onUnitSemua,
}) {
  if (!bolehLihat(peran, "daftar.nama")) return <DaftarPerUnit data={data} peran={peran} saringan={saringan} onSaringan={onSaringan} />;

  const aktif = sub === "semua" ? "semua" : "peserta";
  // Pemilih tampilan duduk di kartu ringkasan paling atas, di posisi yang sama pada kedua
  // tampilan, supaya tidak menambah satu baris tinggi di layar laptop 1366x768.
  const pemilih = (
    <PemilihTampilan
      aktif={aktif}
      onSub={onSub}
      nPeserta={data.individu.filter((o) => o.peserta).length}
      nSemua={data.individu.length}
    />
  );

  return aktif === "semua"
    ? <DaftarSemua data={data} pemilih={pemilih} unitId={unitSemua} onUnit={onUnitSemua} onBukaProfil={onBukaProfil} />
    : <DaftarBernama data={data} pemilih={pemilih} saringan={saringan} onSaringan={onSaringan} onBukaProfil={onBukaProfil} />;
}

function PemilihTampilan({ aktif, onSub, nPeserta, nSemua }) {
  const SUB = [
    { id: "peserta", label: `Peserta asesmen lanjutan (${nPeserta})`, petunjuk: "Daftar undangan asesmen lanjutan, bukan peringkat." },
    { id: "semua", label: `Semua pegawai (${nSemua})`, petunjuk: "Seluruh pegawai yang mengisi screening, peserta maupun bukan, dengan ekspor Excel." },
  ];
  return (
    <div className={styles.subTab} role="tablist" aria-label="Tampilan daftar">
      {SUB.map((s) => (
        <button
          key={s.id}
          type="button"
          role="tab"
          aria-selected={aktif === s.id}
          className={aktif === s.id ? styles.subAktif : ""}
          title={s.petunjuk}
          onClick={() => onSub?.(s.id)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

function ubah(saringan, onSaringan, kunci) {
  return (nilai) => onSaringan({ ...saringan, [kunci]: nilai });
}

// ── Human Capital ───────────────────────────────────────────────────────────────────────────

function DaftarBernama({ data, pemilih, saringan, onSaringan, onBukaProfil }) {
  const { asumsi } = data;
  const [bukaNama, setBukaNama] = useState(false);

  const namaUnit = useMemo(() => Object.fromEntries(data.unit.map((u) => [u.id, u.nama])), [data.unit]);
  const peserta = useMemo(() => data.individu.filter((o) => o.peserta), [data.individu]);
  const hasil = useMemo(
    () => urutPeserta(saringPeserta(peserta, saringan, { units: data.unit, asumsi }), { kunci: "unit", namaUnit }),
    [peserta, saringan, data.unit, asumsi, namaUnit],
  );

  const opsiUnit = data.unit.map((u) => ({ nilai: u.id, label: u.nama })).sort((a, b) => a.label.localeCompare(b.label, "id"));
  const opsiJenjang = [...JENJANG.filter((j) => j !== "Lintas jenjang"), "Tanpa jenjang"].map((j) => ({ nilai: j, label: j }));
  const adaSaringan = Object.values(saringan).some(Boolean);
  const perAlasan = hitungAlasan(hasil, asumsi);
  const perUnit = Object.entries(hasil.reduce((m, o) => ({ ...m, [o.unitId]: (m[o.unitId] || 0) + 1 }), {}))
    .map(([id, n]) => ({ id, nama: namaUnit[id], n }))
    .sort((a, b) => b.n - a.n || a.nama.localeCompare(b.nama, "id"));
  const maksUnit = Math.max(1, ...perUnit.map((u) => u.n));

  return (
    <div className={styles.tab}>
      <Kartu
        className={styles.saringan}
        judul="Saring peserta"
        ikon={Funnel}
        aksi={adaSaringan && <Tombol varian="teks" onClick={() => onSaringan({})}>Hapus</Tombol>}
      >
        <Pilihan sebaris label="Alasan" nilai={saringan.alasan} onUbah={ubah(saringan, onSaringan, "alasan")} opsi={OPSI_ALASAN} />
        <Pilihan sebaris label="Unit" nilai={saringan.unit} onUbah={ubah(saringan, onSaringan, "unit")} opsi={opsiUnit} />
        <Pilihan sebaris label="Kelompok unit" nilai={saringan.kelompok} onUbah={ubah(saringan, onSaringan, "kelompok")} opsi={OPSI_KELOMPOK} />
        <Pilihan sebaris label="Jenjang" nilai={saringan.jenjang} onUbah={ubah(saringan, onSaringan, "jenjang")} opsi={opsiJenjang} />
        <Pilihan sebaris label="Cara masuk" nilai={saringan.jalur} onUbah={ubah(saringan, onSaringan, "jalur")} opsi={OPSI_JALUR} />
        <Pilihan sebaris label="Pandangan atasan" nilai={saringan.pola} onUbah={ubah(saringan, onSaringan, "pola")} opsi={OPSI_POLA} />
        <Pilihan sebaris label="Sumber data" nilai={saringan.status} onUbah={ubah(saringan, onSaringan, "status")} opsi={OPSI_STATUS} />
      </Kartu>

      <Kartu className={styles.hasil}>
        <div className={styles.hasilBaris}>
          {pemilih}
          <AngkaKecil nilai={hasil.length} label={adaSaringan ? `dari ${peserta.length} peserta` : "peserta"} />
          <AngkaKecil nilai={perUnit.length} label="unit terwakili" />
          <AngkaKecil nilai={hasil.filter((o) => o.diskorTanpaPengamatan).length} label="belum dinilai atasan" />
          <Tombol onClick={() => setBukaNama(true)} disabled={!hasil.length}>
            <ListBullets size={18} weight="bold" aria-hidden="true" /> Buka daftar nama ({hasil.length})
          </Tombol>
        </div>
      </Kartu>

      <Kartu
        className={styles.menurutAlasan}
        judul="Menurut alasan"
        ikon={Question}
        warnaIkon="var(--fm-emas)"
        aksi={<TabelPadanan judul="Peserta menurut alasan" kolom={["Alasan", "Jumlah orang"]} baris={ALASAN.map((a) => [a.label, perAlasan[a.kunci]])} />}
      >
        {hasil.length === 0 ? <KeadaanLayar jenis="kosong" judul="Tidak ada yang cocok" pesan="Ubah atau hapus saringan." /> : ALASAN.map((a) => (
          <BarBaris
            key={a.kunci}
            label={a.label}
            petunjuk={a.panjang}
            nilai={perAlasan[a.kunci]}
            maks={hasil.length}
            warna={WARNA_ALASAN[a.kunci]}
            teks={`${perAlasan[a.kunci]} · ${formatPersen(porsi(perAlasan[a.kunci], hasil.length))}`}
            lebarLabel="200px"
            aktif={saringan.alasan === a.kunci}
            onKlik={() => onSaringan({ ...saringan, alasan: saringan.alasan === a.kunci ? "" : a.kunci })}
          />
        ))}
      </Kartu>

      <Kartu
        className={styles.menurutUnit}
        judul="Menurut unit"
        ikon={SquaresFour}
        warnaIkon="var(--fm-ungu-sedang)"
        aksi={<TabelPadanan judul="Peserta menurut unit" kolom={["Unit", "Jumlah orang"]} baris={perUnit.map((u) => [u.nama, u.n])} />}
        isiClassName={styles.duaKolom}
      >
        {perUnit.map((u) => (
          <BarBaris
            key={u.id}
            label={u.nama}
            nilai={u.n}
            maks={maksUnit}
            teks={u.n}
            lebarLabel="minmax(0, 1.3fr)"
            aktif={saringan.unit === u.id}
            onKlik={() => onSaringan({ ...saringan, unit: saringan.unit === u.id ? "" : u.id })}
          />
        ))}
      </Kartu>

      {bukaNama && (
        <DialogNama
          data={data}
          hasil={hasil}
          namaUnit={namaUnit}
          onTutup={() => setBukaNama(false)}
          onBukaProfil={(id) => { setBukaNama(false); onBukaProfil(id); }}
        />
      )}
    </div>
  );
}

/**
 * Urutan tabel nama: klik judul yang sama membalik arah; skor prioritas mulai dari tertinggi,
 * prioritas mulai dari peserta.
 */
function useUrutan(awal = { kunci: "unit", arah: "naik" }) {
  const [urutan, setUrutan] = useState(awal);
  const klik = (kunci) => setUrutan((u) => (u.kunci === kunci
    ? { kunci, arah: u.arah === "naik" ? "turun" : "naik" }
    : { kunci, arah: kunci === "spa" ? "turun" : "naik" }));
  return [urutan, klik, setUrutan];
}

/**
 * Tabel nama bersama untuk dialog 200 peserta dan tampilan Semua pegawai. Kolomnya sama:
 * Nama, Unit, Jabatan, Jenjang, Alasan, Pandangan atasan, Cara masuk, Sumber data.
 * `tandaPeserta` (Semua pegawai): kolom Cara masuk menjadi "Asesmen lanjutan" berisi label
 * Peserta dan bisa diurutkan menurut prioritas; baris peserta diberi latar ungu muda.
 */
function TabelNama({
  daftar, namaUnit, asumsi, urutan, onUrut, onBukaProfil, tampilSkor = false, padat = false, tandaPeserta = false,
}) {
  const judulUrut = (kunci, isi) => {
    const aktif = urutan.kunci === kunci;
    return (
      <th scope="col" aria-sort={aktif ? (urutan.arah === "naik" ? "ascending" : "descending") : "none"}>
        <button type="button" className={styles.judulUrut} onClick={() => onUrut(kunci)}>
          {isi}
          {aktif && (urutan.arah === "naik" ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />)}
        </button>
      </th>
    );
  };

  return (
    <table className={`${styles.tabel} ${padat ? styles.tabelPadat : ""}`}>
      <thead>
        <tr>
          {judulUrut("nama", "Nama")}
          {judulUrut("unit", "Unit")}
          <th scope="col">Jabatan</th>
          <th scope="col">Jenjang</th>
          <th scope="col">Alasan</th>
          <th scope="col">Pandangan atasan</th>
          {tandaPeserta ? judulUrut("prioritas", "Asesmen lanjutan") : <th scope="col">Cara masuk</th>}
          <th scope="col">Sumber data</th>
          {tampilSkor && judulUrut("spa", "Skor prioritas")}
        </tr>
      </thead>
      <tbody>
        {daftar.map((o) => (
          <tr
            key={o.id}
            className={`${styles.barisKlik} ${tandaPeserta && o.peserta ? styles.barisPeserta : ""}`}
            tabIndex={0}
            onClick={() => onBukaProfil(o.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onBukaProfil(o.id); } }}
            aria-label={`Buka profil ${o.nama}`}
          >
            <th scope="row">
              {o.nama}
              {o.catatanData && <Warning size={14} weight="fill" className={styles.ikonCatatan} aria-label={o.catatanData} />}
            </th>
            <td>{namaUnit[o.unitId]}</td>
            <td>{o.jabatan}</td>
            <td>{o.jenjang || "-"}</td>
            <td><span className={styles.lencanaBaris}>{susunAlasan(o, asumsi).map((k) => <Lencana key={k} kunci={k} />)}</span></td>
            <td>{labelPola(o.pola)}</td>
            {tandaPeserta ? (
              <td>
                {o.peserta ? (
                  <span className={styles.tandaPeserta}>
                    <span className={styles.chipPeserta}><CheckCircle size={14} weight="fill" aria-hidden="true" />Peserta</span>
                    <small>{labelJalur(o.peserta.jalur)}</small>
                  </span>
                ) : <span className={styles.bukanPeserta}>-</span>}
              </td>
            ) : <td>{labelJalur(o.peserta?.jalur)}</td>}
            <td>
              <span className={statusData(o) === "lengkap" ? styles.statusLengkap : styles.statusDiri}>
                {LABEL_STATUS_DATA[statusData(o)]}
              </span>
            </td>
            {tampilSkor && <td className={styles.angka}>{formatAngka(o.spa)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DialogNama({ data, hasil, namaUnit, onTutup, onBukaProfil }) {
  const { asumsi } = data;
  const [urutan, klikJudul, setUrutan] = useUrutan();
  const [tampilSkor, setTampilSkor] = useState(false);
  const daftar = useMemo(() => urutPeserta(hasil, { ...urutan, namaUnit }), [hasil, urutan, namaUnit]);

  return (
    <Dialog
      lebar
      judul={`Daftar peserta asesmen lanjutan (${daftar.length})`}
      keterangan="Daftar undangan, bukan peringkat. Klik nama untuk membuka profilnya."
      onTutup={onTutup}
      aksi={(
        <>
          <Sakelar
            nyala={tampilSkor}
            onUbah={(v) => { setTampilSkor(v); if (!v && urutan.kunci === "spa") setUrutan({ kunci: "unit", arah: "naik" }); }}
            label="Tampilkan skor prioritas (internal)"
          />
          <span className={styles.pemisah} />
          <Tombol onClick={onTutup}>Tutup</Tombol>
        </>
      )}
    >
      {data.lembaga.pesertaInfo?.catatan && <Catatan nada="emas" ikon={Warning}>{data.lembaga.pesertaInfo.catatan}</Catatan>}
      <TabelNama
        daftar={daftar}
        namaUnit={namaUnit}
        asumsi={asumsi}
        urutan={urutan}
        onUrut={klikJudul}
        onBukaProfil={onBukaProfil}
        tampilSkor={tampilSkor}
      />
    </Dialog>
  );
}

// ── Human Capital: semua pegawai ────────────────────────────────────────────────────────────

/** Nama urutan untuk sheet Keterangan di berkas Excel. */
function labelUrutan(urutan) {
  const dasar = URUTAN_SEMUA.find((x) => x.nilai === urutan.kunci)?.label || urutan.kunci;
  return urutan.arah === "turun" ? `${dasar}, dibalik` : dasar;
}

function DaftarSemua({ data, pemilih, unitId, onUnit, onBukaProfil }) {
  const { asumsi } = data;
  // Bawaan prioritas: begitu satu unit dipilih, peserta asesmen lanjutan unit itu ada di atas.
  const [urutan, klikJudul, setUrutan] = useUrutan({ kunci: "prioritas", arah: "naik" });
  const [ekspor, setEkspor] = useState({ status: "siap", pesan: "" });

  const namaUnit = useMemo(() => Object.fromEntries(data.unit.map((u) => [u.id, u.nama])), [data.unit]);
  const opsiUnit = useMemo(() => opsiUnitPegawai(data.unit, data.individu), [data.unit, data.individu]);
  // Unit tersimpan yang tidak ada lagi di data (mis. sumber data berganti) dianggap "Semua unit".
  const unitAktif = opsiUnit.some((o) => o.nilai === unitId) ? unitId : "";
  const daftar = useMemo(
    () => urutPeserta(saringPegawai(data.individu, unitAktif), { ...urutan, namaUnit }),
    [data.individu, unitAktif, urutan, namaUnit],
  );
  const nPeserta = daftar.filter((o) => o.peserta).length;
  const unitNama = unitAktif ? namaUnit[unitAktif] : "";

  function gantiUnit(nilai) {
    setEkspor({ status: "siap", pesan: "" });
    onUnit?.(nilai);
  }

  async function unduh() {
    setEkspor({ status: "memuat", pesan: "" });
    try {
      const nama = await unduhDaftarPegawai({
        baris: barisEksporPegawai(daftar, { namaUnit, asumsi }),
        lembaga: data.meta?.lembaga,
        periodeId: data.meta?.periodeId,
        periode: labelPeriode(data.meta?.periodeId),
        unitNama,
        urutan: labelUrutan(urutan),
      });
      const tanda = nPeserta ? `, ${nPeserta} baris peserta berwarna ungu` : "";
      setEkspor({ status: "selesai", pesan: `${daftar.length} baris diunduh ke ${nama}${tanda}.` });
    } catch (e) {
      setEkspor({ status: "galat", pesan: `Berkas gagal dibuat: ${e?.message || e}` });
    }
  }

  return (
    <div className={styles.tabSemua}>
      <Kartu className={styles.hasil}>
        <div className={styles.hasilBaris}>
          {pemilih}
          <AngkaKecil nilai={daftar.length} label={unitAktif ? `dari ${data.individu.length} pegawai` : "pegawai"} />
          <AngkaKecil nilai={nPeserta} label="peserta asesmen lanjutan" />
          <AngkaKecil nilai={daftar.length - nPeserta} label="bukan peserta" />
        </div>
      </Kartu>
      <Kartu
        className={styles.kartuSemua}
        judul={unitNama ? `${unitNama} (${daftar.length})` : `Semua pegawai (${daftar.length})`}
        ikon={UsersThree}
        aksi={(
          <>
            <Pilihan sebaris label="Unit" semua="Semua unit" nilai={unitAktif} onUbah={gantiUnit} opsi={opsiUnit} />
            <Pilihan
              sebaris
              label="Urutan"
              semua={null}
              nilai={URUTAN_SEMUA.some((x) => x.nilai === urutan.kunci) ? urutan.kunci : "prioritas"}
              onUbah={(kunci) => setUrutan({ kunci, arah: "naik" })}
              opsi={URUTAN_SEMUA}
              petunjuk="Prioritas: peserta asesmen lanjutan di atas, diurutkan dari skor prioritas tertinggi, lalu pegawai lainnya."
            />
            <Tombol
              onClick={unduh}
              disabled={!daftar.length || ekspor.status === "memuat"}
              title={`Unduh ${daftar.length} baris yang sedang tampil (${unitNama || "semua unit"}) sebagai berkas Excel`}
            >
              <MicrosoftExcelLogo size={18} weight="bold" aria-hidden="true" />
              {ekspor.status === "memuat" ? "Menyiapkan…" : "Ekspor Excel"}
            </Tombol>
          </>
        )}
        isiClassName={styles.isiSemua}
      >
        <p className={styles.ringkasSemua} role="status">
          {ekspor.status === "galat" || ekspor.status === "selesai"
            ? <span className={ekspor.status === "galat" ? styles.pesanGalat : styles.pesanSelesai}>{ekspor.pesan}</span>
            : (
              <>
                <Petunjuk teks="Baris berlatar ungu muda masuk daftar 200 peserta asesmen lanjutan. Di berkas Excel barisnya juga berwarna dan kolom Peserta asesmen lanjutan berisi Ya.">
                  <i className={styles.kotakPeserta} aria-hidden="true" />
                </Petunjuk>
                {nPeserta} dari {daftar.length} pegawai{unitNama ? " unit ini" : ""} masuk daftar 200 peserta asesmen lanjutan. Klik nama untuk membuka profilnya.
              </>
            )}
        </p>
        {daftar.length === 0
          ? <KeadaanLayar jenis="kosong" judul="Belum ada pegawai" pesan="Unit ini belum punya pengisi screening." />
          : (
            <TabelNama
              daftar={daftar}
              namaUnit={namaUnit}
              asumsi={asumsi}
              urutan={urutan}
              onUrut={klikJudul}
              onBukaProfil={onBukaProfil}
              padat
              tandaPeserta
            />
          )}
      </Kartu>
    </div>
  );
}

// ── Yayasan dan kepala unit ─────────────────────────────────────────────────────────────────

/** Jumlah orang di beberapa unit (hitungan, bukan rata-rata). */
const jumlahkan = (units, ambil) => units.reduce((a, u) => a + (ambil(u) || 0), 0);

function DaftarPerUnit({ data, peran, saringan, onSaringan }) {
  const { asumsi, lembaga } = data;
  const tampil = saringUnitTampil(data.unit, peran, asumsi);
  const tersaring = tampil
    .filter((u) => (!saringan.kelompok || u.kelompok === saringan.kelompok) && (!saringan.jenjang || u.jenjang === saringan.jenjang))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  const alasanDipilih = saringan.alasan || "";
  const hitung = (u) => (alasanDipilih ? u.peserta.perAlasan[alasanDipilih] || 0 : u.peserta.total);
  const maks = Math.max(1, ...tersaring.map(hitung));

  if (peran === "kepalaUnit" && !tampil.length) {
    return (
      <KeadaanLayar
        jenis="kosong"
        judul="Unit Anda tidak ditemukan"
        pesan="Hubungi tim Fammi agar akun Anda ditautkan ke unit yang benar."
      />
    );
  }

  const segmen = (perAlasan) => ALASAN.map((a) => ({ kunci: a.kunci, label: a.label, jumlah: perAlasan[a.kunci] || 0, warna: WARNA_ALASAN[a.kunci], panjang: a.panjang }));

  return (
    <div className={styles.tabUnit}>
      <Kartu className={styles.saringan} judul="Saring" ikon={Funnel}>
        <Pilihan sebaris label="Alasan" nilai={saringan.alasan} onUbah={ubah(saringan, onSaringan, "alasan")} opsi={OPSI_ALASAN} />
        {peran === "yayasan" && (
          <>
            <Pilihan sebaris label="Kelompok unit" nilai={saringan.kelompok} onUbah={ubah(saringan, onSaringan, "kelompok")} opsi={OPSI_KELOMPOK} />
            <Pilihan sebaris label="Jenjang" nilai={saringan.jenjang} onUbah={ubah(saringan, onSaringan, "jenjang")} opsi={JENJANG.map((j) => ({ nilai: j, label: j }))} />
          </>
        )}
        <div className={styles.statVertikal}>
          {peran === "kepalaUnit" ? (
            <>
              <AngkaKecil
                nilai={jumlahkan(tampil, (u) => u.peserta.total)}
                label={`peserta dari ${jumlahkan(tampil, (u) => u.nPengisi)} pegawai ${tampil.length > 1 ? `${tampil.length} unit binaan` : "unit"}`}
              />
              <AngkaKecil nilai={jumlahkan(tampil, (u) => u.peserta.tanpaPengamatan ?? 0)} label="belum dinilai atasan" />
            </>
          ) : (
            <>
              <AngkaKecil nilai={lembaga.peserta.total} label={`peserta dari ${lembaga.nPengisi} pegawai`} />
              <AngkaKecil nilai={lembaga.pesertaInfo?.tanpaPengamatan ?? lembaga.peserta.tanpaPengamatan} label="belum dinilai atasan" />
            </>
          )}
        </div>
        <Catatan>Nama peserta dipegang tim Human Capital.</Catatan>
      </Kartu>

      <Kartu
        className={styles.perUnit}
        judul={alasanDipilih ? `Peserta dengan alasan "${ALASAN.find((a) => a.kunci === alasanDipilih)?.label}" per unit` : "Peserta per unit"}
        aksi={(
          <TabelPadanan
            judul="Peserta per unit"
            kolom={["Unit", "Kelompok", "Pegawai", "Peserta", ...ALASAN.map((a) => a.label)]}
            baris={[
              ...tersaring.map((u) => [u.nama, labelKelompok(u.kelompok), u.nPegawai, u.peserta.total, ...ALASAN.map((a) => u.peserta.perAlasan[a.kunci] || 0)]),
              ["Seluruh lembaga", "-", lembaga.nPengisi, lembaga.peserta.total, ...ALASAN.map((a) => lembaga.peserta.perAlasan[a.kunci] || 0)],
            ]}
          />
        )}
      >
        {!alasanDipilih && (
          <ul className={styles.legendaAlasan} aria-label="Warna alasan">
            {ALASAN.map((a) => (
              <li key={a.kunci}><Petunjuk teks={a.panjang}><i style={{ background: WARNA_ALASAN[a.kunci] }} aria-hidden="true" />{a.label}</Petunjuk></li>
            ))}
          </ul>
        )}
        <div className={styles.gridUnit}>
          {tersaring.map((u) => (
            <div key={u.id} className={styles.barisUnit}>
              <span className={styles.namaUnit} title={u.nama}>{u.nama}</span>
              {alasanDipilih
                ? <BarNilai nilai={hitung(u)} maks={maks} warna={WARNA_ALASAN[alasanDipilih]} />
                : <BarTumpuk legenda={false} label={u.nama} segmen={segmen(u.peserta.perAlasan)} />}
              <span className={styles.nilaiUnit}>{hitung(u)} <small>/ {u.nPengisi}</small></span>
            </div>
          ))}
          <div className={`${styles.barisUnit} ${styles.barisTotal}`}>
            <span className={styles.namaUnit}>{peran === "kepalaUnit" ? "Seluruh lembaga (pembanding)" : "Seluruh lembaga"}</span>
            {alasanDipilih
              ? <BarNilai nilai={lembaga.peserta.perAlasan[alasanDipilih] || 0} maks={lembaga.peserta.total} warna={WARNA_ALASAN[alasanDipilih]} />
              : <BarTumpuk legenda={false} label="Seluruh lembaga" segmen={segmen(lembaga.peserta.perAlasan)} />}
            <span className={styles.nilaiUnit}>{alasanDipilih ? lembaga.peserta.perAlasan[alasanDipilih] || 0 : lembaga.peserta.total} <small>/ {lembaga.nPengisi}</small></span>
          </div>
        </div>
        <CatatanUnitKecil jumlah={jumlahUnitKecil(tersaring, asumsi)} ambang={asumsi.minPengisiUnit} />
      </Kartu>
    </div>
  );
}
