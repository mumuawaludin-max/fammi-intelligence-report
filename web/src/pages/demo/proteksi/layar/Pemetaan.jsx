import { useMemo, useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaKartu, KepalaLaci, Laci } from "../komponen";
import { ORANG } from "../layarProteksi";
import AlurBar from "../bersama/AlurBar";
import { HEART, metaStatus } from "../bersama/heart";
import { HurufHeart, PetaHati, PilStatus } from "../bersama/HeartKecil";
import { BatangTumpuk, Donat, KolomKelas, Legenda } from "../bersama/Grafik";
import { WARNA_STATUS } from "../bersama/grafikAlat";
import { KELAS, KELAS_WALAS, WALI } from "./skriningData";
import {
  PER_KELAS,
  SEMUA,
  anakUntuk,
  aspekAnak,
  ringkasan,
  tandaBahaya,
  temuan,
  tindakAnak,
  urutkan,
} from "./pemetaanData";
import FormTindakLanjut from "../bersama/FormTindakLanjut";
import { PEMILIK } from "../bersama/tindakLanjut";
import css from "./Pemetaan.module.css";

const IKON_TEMUAN = { ok: "sukses", warn: "info", bad: "peringatan", info: "jam" };

/** Pilihan saring status di daftar anak. */
function pilihanStatus(r, adaBaik) {
  return [
    { id: "ditandai", label: `Perlu dipantau ${r.waspada + r.perhatian}` },
    { id: "waspada", label: `Perlu Perhatian Lebih ${r.waspada}` },
    { id: "perhatian", label: `Perlu Diperhatikan ${r.perhatian}` },
    ...(adaBaik ? [{ id: "semua", label: "Semua" }] : []),
  ];
}

function cocokStatus(a, saring) {
  if (saring === "semua") return true;
  if (saring === "ditandai") return a.status === "waspada" || a.status === "perhatian";
  return a.status === saring;
}

/**
 * Hasil HEART: pemetaan hasil skrining dari tingkat sekolah sampai satu anak. Urutannya mengikuti
 * cara membaca laporan: ringkasan dan temuan dulu, lalu sebaran per aspek dan per kelas, baru daftar
 * anak; rincian satu anak terbuka di laci.
 *
 * Isinya menurut sudut pandang: Wali Kelas hanya melihat kelasnya (2B) dan mencari nama anak;
 * Kepala Sekolah dan Guru BK melihat seluruh sekolah dan bisa menyaring per kelas (lewat pemilih
 * kelas atau klik kolom grafik). Data contoh, dibaca dari pemetaanData.js.
 */
export default function Pemetaan() {
  const { peran, pindah } = useProteksi();
  const walas = peran === "walas";
  const [pilihKelas, setPilihKelas] = useState(SEMUA);
  const kelas = walas ? KELAS_WALAS : pilihKelas;
  const [cari, setCari] = useState("");
  const [saring, setSaring] = useState("ditandai");
  const [aspekDipilih, setAspekDipilih] = useState(null);
  const [anakBuka, setAnakBuka] = useState(null);

  const r = useMemo(() => ringkasan(kelas), [kelas]);
  const daftarTemuan = useMemo(() => temuan(r), [r]);
  const adaBaik = kelas === KELAS_WALAS;
  const semuaAnak = useMemo(() => urutkan(anakUntuk(kelas)), [kelas]);

  const kata = cari.trim().toLowerCase();
  const tampil = semuaAnak.filter((a) => {
    if (kata) return a.nama.toLowerCase().includes(kata);
    if (aspekDipilih && (!a.heart || a.heart[aspekDipilih] === "baik")) return false;
    return cocokStatus(a, saring);
  });

  function gantiKelas(k) {
    setPilihKelas(k);
    setAspekDipilih(null);
    setSaring("ditandai");
  }

  const dataDonat = [
    { id: "baik", label: "Aman", nilai: r.baik, warna: WARNA_STATUS.baik },
    { id: "perhatian", label: "Perlu Diperhatikan", nilai: r.perhatian, warna: WARNA_STATUS.perhatian },
    { id: "waspada", label: "Perlu Perhatian Lebih", nilai: r.waspada, warna: WARNA_STATUS.waspada },
    { id: "belum", label: "Belum ikut screening", nilai: r.belum, warna: WARNA_STATUS.belum },
  ];

  const barisAspek = HEART.map((a) => {
    const x = r.perAspek[a.id];
    return {
      id: a.id,
      label: a.nama,
      kiri: (
        <span className="hurufAspek" aria-hidden="true">
          {a.kode}
        </span>
      ),
      kanan: x.waspada + x.perhatian ? `${x.waspada + x.perhatian} anak` : "Semua Aman",
      bagian: [
        { id: "baik", label: "Aman", nilai: x.baik, warna: WARNA_STATUS.baik },
        { id: "perhatian", label: "Perlu Diperhatikan", nilai: x.perhatian, warna: WARNA_STATUS.perhatian },
        { id: "waspada", label: "Perlu Perhatian Lebih", nilai: x.waspada, warna: WARNA_STATUS.waspada },
      ],
    };
  });

  const kolomKelas = PER_KELAS.map((k) => ({
    id: k.kelas,
    label: k.kelas,
    atas: k.waspada + k.perhatian,
    bagian: [
      { id: "waspada", label: "Perlu Perhatian Lebih", nilai: k.waspada, warna: WARNA_STATUS.waspada },
      { id: "perhatian", label: "Perlu Diperhatikan", nilai: k.perhatian, warna: WARNA_STATUS.perhatian },
    ],
  }));

  const judulCakupan = kelas === SEMUA ? "Seluruh sekolah" : `Kelas ${kelas} · ${WALI[kelas]}`;
  const sisaBaik = kelas !== KELAS_WALAS ? r.baik : 0;

  return (
    <div className={`isi ${css.layar}`}>
      <AlurBar alur="cegah" aktif="hasil" />

      <section className="titlerow">
        <div>
          <p className="eyebrow">Alur pencegahan · Langkah 2</p>
          <h1 className="h1" data-judul-layar>
            Hasil HEART
          </h1>
          <p className="lead">{`${judulCakupan} · ${r.diskrining} dari ${r.anak} anak sudah ikut screening`}</p>
        </div>
      </section>

      <div className="pmkontrol">
        {!walas && (
          <div className="pmkelas" role="group" aria-label="Pilih kelas">
            {[{ kelas: SEMUA }, ...KELAS].map((k) => {
              const aktif = k.kelas === kelas;
              return (
                <button
                  key={k.kelas}
                  type="button"
                  className={`pmchip${aktif ? " on" : ""}`}
                  aria-pressed={aktif}
                  onClick={() => gantiKelas(k.kelas)}
                >
                  {k.kelas === SEMUA ? "Semua kelas" : k.kelas}
                </button>
              );
            })}
          </div>
        )}
        <label className="pmcari">
          <Ikon nama="cari" size={18} />
          <span className="sr">Cari nama anak</span>
          <input
            type="search"
            placeholder={walas ? "Cari nama anak di kelas 2B" : "Cari nama anak"}
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
        </label>
      </div>

      {/* Saat mencari nama, hanya hasil pencarian yang tampil supaya langsung terlihat di bawah kolom cari. */}
      {!kata && (
        <>
        <section className="card tcard pmringkas" aria-label="Ringkasan hasil">
          <div className="pmdonat">
            <Donat data={dataDonat} tengah={r.diskrining} sub="anak ikut screening" ukuran={156} label={`Hasil HEART ${judulCakupan}`} />
            <Legenda data={dataDonat} kolom />
          </div>
          <div className="pmtemuan">
            <h2 className="pmjudul">Yang perlu diketahui</h2>
            <ul>
              {daftarTemuan.map((t) => (
                <li key={t.teks} className={`pmt ${t.nada}`}>
                  <Ikon nama={IKON_TEMUAN[t.nada]} size={16} />
                  <span>{t.teks}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className={kelas === SEMUA ? "duakolom" : ""}>
          <section className="card tcard" aria-label="Hasil per aspek">
            <div className="tophead">
              <KepalaKartu ikon="hati" judul="Per aspek HEART" />
              {aspekDipilih ? (
                <button type="button" className="abtn" onClick={() => setAspekDipilih(null)}>
                  Semua aspek
                </button>
              ) : (
                <span className="pmket">Klik aspek untuk menyaring daftar</span>
              )}
            </div>
            <BatangTumpuk
              baris={barisAspek}
              terpilih={aspekDipilih}
              onPilih={(id) => setAspekDipilih((x) => (x === id ? null : id))}
            />
          </section>

          {kelas === SEMUA && (
            <section className="card tcard" aria-label="Anak yang perlu dipantau per kelas">
              <div className="tophead">
                <KepalaKartu ikon="kelompok" judul="Per kelas" />
                <span className="pmket">Klik kolom untuk membuka kelas</span>
              </div>
              <KolomKelas kolom={kolomKelas} onPilih={gantiKelas} tinggi={120} />
              <Legenda
                data={[
                  { id: "w", label: "Perlu Perhatian Lebih", nilai: r.waspada, warna: WARNA_STATUS.waspada },
                  { id: "p", label: "Perlu Diperhatikan", nilai: r.perhatian, warna: WARNA_STATUS.perhatian },
                ]}
              />
            </section>
          )}
        </div>
        </>
      )}

      <section className="card tcard" aria-label="Daftar anak" data-bagian="daftar">
        <div className="tophead">
          <KepalaKartu ikon="orang" judul={kata ? `Hasil pencarian "${cari.trim()}"` : "Daftar anak"} />
          {!kata && (
            <div className="seg" role="group" aria-label="Saring status">
              {pilihanStatus(r, adaBaik).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`segb${saring === p.id ? " active" : ""}`}
                  aria-pressed={saring === p.id}
                  onClick={() => setSaring(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {aspekDipilih && !kata && (
          <p className="pmket">{`Hanya anak yang ditandai pada ${HEART.find((a) => a.id === aspekDipilih).nama}.`}</p>
        )}
        {tampil.length === 0 ? (
          <p className="pmkosong">
            {kata ? "Tidak ada anak dengan nama itu di cakupan ini." : "Tidak ada anak pada saringan ini."}
          </p>
        ) : (
          <ul className="pmdaftar">
            {tampil.map((a) => (
              <li key={`${a.kelas}-${a.nama}`}>
                <button type="button" className="pmanak" onClick={() => setAnakBuka(a)}>
                  <span className={`av pmav ${a.status}`} aria-hidden="true">
                    {a.nama
                      .split(" ")
                      .slice(0, 2)
                      .map((k) => k[0])
                      .join("")}
                  </span>
                  <span className="pmnama">
                    <b>{a.nama}</b>
                    <span>{kelas === SEMUA ? `Kelas ${a.kelas}` : tindakAnak(a) || "Aman di semua aspek"}</span>
                  </span>
                  <span className="pmhuruf">{a.heart ? <HurufHeart heart={a.heart} /> : <span className="pmket">Belum ikut screening</span>}</span>
                  <PilStatus status={a.status} kecil />
                  <Ikon nama="kanan" size={18} className="pmchev" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {!kata && sisaBaik > 0 && (saring === "ditandai" || saring === "semua") && !aspekDipilih && (
          <p className="pmket">{`${sisaBaik} anak lain Aman di semua aspek.`}</p>
        )}
      </section>

      {anakBuka && (
        <LaciAnak
          anak={anakBuka}
          peran={peran}
          onTutup={() => setAnakBuka(null)}
          onLaporan={() => pindah("anak", { jenis: "gulir", id: "hasil" })}
          onSkrining={() => pindah("skrining")}
        />
      )}
    </div>
  );
}

/**
 * Rincian satu anak: status, peta hati, aspek yang ditandai, yang sedang dilakukan, catatan wali
 * kelas, dan tanda bahaya bila ada. Laporan lengkap (skor, indikator, saran) baru ada untuk Raka di
 * layar Laporan anak; anak lain cukup sampai di sini.
 */
function LaciAnak({ anak, peran, onTutup, onLaporan, onSkrining }) {
  const { checklistTambahan, tambahChecklist, toast } = useProteksi();
  const [formBuka, setFormBuka] = useState(false);
  const ditambah = checklistTambahan.filter((c) => c.anak === anak.nama && c.sumber);
  const menonjol = aspekAnak(anak);
  const tindak = tindakAnak(anak);
  const bahaya = tandaBahaya(anak.nama);
  const catatan = anak.data?.catatan;
  const laporanLengkap = anak.nama === "Raka Pratama";
  const meta = metaStatus(anak.status);

  return (
    <Laci label={`Hasil HEART ${anak.nama}`} onTutup={onTutup} lebar={480}>
      <KepalaLaci
        awal={
          <span className={`av pmav besar ${anak.status}`} aria-hidden="true">
            {anak.nama
              .split(" ")
              .slice(0, 2)
              .map((k) => k[0])
              .join("")}
          </span>
        }
        judul={anak.nama}
        sub={`Kelas ${anak.kelas} · Wali kelas ${WALI[anak.kelas]}`}
        onTutup={onTutup}
      >
        <PilStatus status={anak.status} kecil />
      </KepalaLaci>

      <div className="pmlaci">
        {anak.heart ? (
          <>
            <PetaHati hasil={anak.heart} berlabel lebar={190} label={`Peta HEART ${anak.nama}`} />
            <p className="pmarti">{meta.arti || "Hasil screening belum ada."}</p>
            {menonjol.length > 0 ? (
              <div className="pmblok">
                <h3>Aspek yang ditandai</h3>
                <ul className="pmaspek">
                  {menonjol.map((x) => (
                    <li key={x.aspek.id}>
                      <span>{x.aspek.nama}</span>
                      <PilStatus status={x.status} kecil />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <p className="pmarti">Formulir wali kelas untuk anak ini belum masuk, jadi hasilnya belum ada.</p>
        )}

        {tindak && (
          <div className="pmblok">
            <h3>Yang sedang dilakukan</h3>
            <p>{tindak}</p>
          </div>
        )}
        {catatan && (
          <div className="pmblok">
            <h3>Catatan wali kelas terakhir</h3>
            <p>{catatan}</p>
          </div>
        )}
        <div className="pmblok">
          <h3>Tindak lanjut tambahan sekolah</h3>
          <p className="pmket">Rekomendasi Fammi sudah ada di checklist anak. Tambah bila sekolah punya langkah lain.</p>
          {ditambah.length > 0 && (
            <ul className="pmaspek">
              {ditambah.map((c) => (
                <li key={c.id}>
                  <span>{c.judul}</span>
                  <span className="pmket">{`${PEMILIK[c.oleh].label} · ${c.waktu}`}</span>
                </li>
              ))}
            </ul>
          )}
          {formBuka ? (
            <FormTindakLanjut
              anak={anak.nama}
              aspekAwal={menonjol[0]?.aspek.id}
              oleh={ORANG[peran]?.nama || "Sekolah"}
              onTambah={(b) => {
                tambahChecklist([b]);
                setFormBuka(false);
                toast(`Tindak lanjut untuk ${anak.nama.split(" ")[0]} ditambahkan.`);
              }}
              onBatal={() => setFormBuka(false)}
            />
          ) : (
            <button type="button" className="ghost sm pmtambah" onClick={() => setFormBuka(true)}>
              <Ikon nama="tambah" size={16} />
              Tambah tindak lanjut sendiri
            </button>
          )}
        </div>
        {bahaya && (
          <div className="pmblok bahaya">
            <h3>Tanda bahaya dari formulir {bahaya.sumber.toLowerCase()}</h3>
            <p>{bahaya.selesai ? `Kasus ${bahaya.kasus} sudah selesai.` : `Ditangani sebagai kasus ${bahaya.kasus} oleh ${bahaya.oleh}.`}</p>
          </div>
        )}
      </div>

      <div className="pmkaki">
        {laporanLengkap ? (
          <button type="button" className="btnp" onClick={onLaporan}>
            Buka laporan lengkap
            <Ikon nama="kanan" size={16} />
          </button>
        ) : anak.data?.tindak?.jenis === "belum" && peran !== "walas" ? (
          <button type="button" className="btnp" onClick={onSkrining}>
            Susun tindak lanjut di Screening
            <Ikon nama="kanan" size={16} />
          </button>
        ) : (
          <span className="pmket">{`Dilihat sebagai ${ORANG[peran]?.peran || "sekolah"}.`}</span>
        )}
        <button type="button" className="ghost" onClick={onTutup}>
          Tutup
        </button>
      </div>
    </Laci>
  );
}
