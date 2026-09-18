// Tab Daftar Peserta sebagai ruang kendali.
// Human Capital: saringan dan ringkasan di layar, daftar nama dibuka di dialog.
// Yayasan dan kepala unit: jumlah per unit tanpa satu pun nama.
// Skor prioritas bukan kolom bawaan dan bukan urutan bawaan. Tidak ada unduh CSV: nama tidak
// boleh keluar dari layar yang dijaga RLS.

import { useMemo, useState } from "react";
import { CaretDown, CaretUp, Funnel, ListBullets, Question, SquaresFour, Warning } from "@phosphor-icons/react";
import {
  ALASAN, JALUR, JENJANG, KELOMPOK_UNIT, POLA, labelJalur, labelKelompok, labelPola,
} from "./lib/swMeta";
import {
  LABEL_STATUS_DATA, bolehLihat, formatAngka, formatPersen, hitungAlasan,
  jumlahUnitKecil, porsi, saringPeserta, saringUnitTampil, statusData, susunAlasan, urutPeserta,
} from "./lib/swAturan";
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

export default function SwDaftar({ data, peran, saringan, onSaringan, onBukaProfil }) {
  if (!bolehLihat(peran, "daftar.nama")) return <DaftarPerUnit data={data} peran={peran} saringan={saringan} onSaringan={onSaringan} />;
  return <DaftarBernama data={data} saringan={saringan} onSaringan={onSaringan} onBukaProfil={onBukaProfil} />;
}

function ubah(saringan, onSaringan, kunci) {
  return (nilai) => onSaringan({ ...saringan, [kunci]: nilai });
}

// ── Human Capital ───────────────────────────────────────────────────────────────────────────

function DaftarBernama({ data, saringan, onSaringan, onBukaProfil }) {
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

function DialogNama({ data, hasil, namaUnit, onTutup, onBukaProfil }) {
  const { asumsi } = data;
  const [urutan, setUrutan] = useState({ kunci: "unit", arah: "naik" });
  const [tampilSkor, setTampilSkor] = useState(false);
  const daftar = useMemo(() => urutPeserta(hasil, { ...urutan, namaUnit }), [hasil, urutan, namaUnit]);

  function klikJudul(kunci) {
    setUrutan((u) => (u.kunci === kunci ? { kunci, arah: u.arah === "naik" ? "turun" : "naik" } : { kunci, arah: kunci === "spa" ? "turun" : "naik" }));
  }

  const judulUrut = (kunci, isi) => {
    const aktif = urutan.kunci === kunci;
    return (
      <th scope="col" aria-sort={aktif ? (urutan.arah === "naik" ? "ascending" : "descending") : "none"}>
        <button type="button" className={styles.judulUrut} onClick={() => klikJudul(kunci)}>
          {isi}
          {aktif && (urutan.arah === "naik" ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />)}
        </button>
      </th>
    );
  };

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
      <table className={styles.tabel}>
        <thead>
          <tr>
            {judulUrut("nama", "Nama")}
            {judulUrut("unit", "Unit")}
            <th scope="col">Jabatan</th>
            <th scope="col">Jenjang</th>
            <th scope="col">Alasan</th>
            <th scope="col">Pandangan atasan</th>
            <th scope="col">Cara masuk</th>
            <th scope="col">Sumber data</th>
            {tampilSkor && judulUrut("spa", "Skor prioritas")}
          </tr>
        </thead>
        <tbody>
          {daftar.map((o) => (
            <tr
              key={o.id}
              className={styles.barisKlik}
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
              <td>{labelJalur(o.peserta?.jalur)}</td>
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

    </Dialog>
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
