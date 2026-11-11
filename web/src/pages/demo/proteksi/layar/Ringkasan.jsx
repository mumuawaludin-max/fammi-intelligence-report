import { useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaKartu, Segmen } from "../komponen";
import {
  ALUR,
  ANGKA_KUNCI,
  ASPEK,
  CATATAN_KATEGORI,
  CATATAN_RENTANG,
  KATEGORI,
  KATEGORI_LENGKAP,
  KELAS,
  NILAI_ASPEK,
  NILAI_KATEGORI,
  PERHATIAN,
  PESAN_PENGINGAT,
  PESAN_UNDUH,
  PIL_STATUS_KELAS,
  RENTANG,
  SARINGAN_KELAS,
  STATUS_TAHAP,
  SUMBER,
  TAHAP,
} from "./ringkasanData";
import css from "./Ringkasan.module.css";

// Skala grafik dari desain: nilai acuan (32 anak, 3,4 laporan) setinggi 176px. Kategori bernilai 0
// tetap tampil sebagai garis 2px.
const TINGGI_ACUAN = 176;

/**
 * Grafik batang yang bisa diklik. Batang terpilih berwarna penuh dan menampilkan nilainya di atas
 * batang. nada "p" ungu (aspek) atau "o" jingga (kategori laporan).
 */
function GrafikBatang({ label, batang, aktif, nada, onPilih }) {
  const warna = nada === "p" ? "lp" : "lo";
  return (
    <div className="plot" role="group" aria-label={label}>
      {batang.map((b, i) => {
        const on = i === aktif;
        return (
          <button
            key={b.label}
            type="button"
            className="barcol"
            aria-label={b.aria}
            aria-pressed={on}
            onClick={() => onPilih(i)}
          >
            <span className="barzone">
              {on && <span className={`tip ${nada}`}>{b.teks}</span>}
              <span className={`bar ${warna}${on ? " on" : ""}`} style={{ height: b.tinggi }} />
            </span>
            <span className={`blabel${on ? ` ${nada}` : ""}`}>{b.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Layar 1 · Ringkasan sekolah, sudut pandang Kepala Sekolah: tahap program, cakupan skrining awal,
 * akses cepat, angka kunci, alur kasus beserta kasus yang perlu perhatian pimpinan, dua grafik
 * yang bisa diklik, dan peta kelas dengan saringan status.
 */
export default function Ringkasan() {
  const { pindah, toast } = useProteksi();
  const [sumber, setSumber] = useState("gab");
  const [pilihAspek, setPilihAspek] = useState(null);
  const [rentang, setRentang] = useState("all");
  const [pilihKategori, setPilihKategori] = useState(null);
  const [saring, setSaring] = useState("semua");

  // Tanpa pilihan, grafik aspek menyorot aspek terbanyak pada sumber itu; grafik kategori menyorot Fisik.
  const nilaiAspek = NILAI_ASPEK[sumber];
  const aspekAktif = pilihAspek ?? nilaiAspek.indexOf(Math.max(...nilaiAspek));
  const batangAspek = ASPEK.map((a, i) => ({
    label: a,
    teks: `${nilaiAspek[i]} anak`,
    tinggi: Math.round((nilaiAspek[i] / 32) * TINGGI_ACUAN),
    aria: `${a}: ${nilaiAspek[i]} anak`,
  }));

  const nilaiKategori = NILAI_KATEGORI[rentang];
  const kategoriAktif = pilihKategori ?? 1;
  const batangKategori = KATEGORI.map((k, i) => ({
    label: k,
    teks: `${nilaiKategori[i]} laporan`,
    tinggi: nilaiKategori[i] ? Math.round((nilaiKategori[i] / 3.4) * TINGGI_ACUAN) : 2,
    aria: `${KATEGORI_LENGKAP[i]}: ${nilaiKategori[i]} laporan`,
  }));

  const statusSaring = SARINGAN_KELAS.find((s) => s.id === saring)?.status;
  const barisKelas = KELAS.filter((k) => !statusSaring || k.status === statusSaring);

  function pilihSumber(id) {
    setSumber(id);
    setPilihAspek(null);
  }

  return (
    <div className={`isi ${css.layar}`}>
      <section className="titlerow">
        <div>
          <p className="eyebrow">Sekolah Proteksi · TK A sampai Kelas 4 · 288 anak</p>
          <h1 className="h1">Ringkasan perlindungan anak</h1>
          <p className="lead">Diperbarui Rabu, 11 November 2026, pukul 10.30 WIB</p>
        </div>
        <span className="pill gray sm">Data contoh untuk prototipe</span>
      </section>

      <section className="card">
        <div className="tophead" style={{ padding: "24px 24px 0" }}>
          <KepalaKartu ikon="bendera" judul={["Tahap Program", "Semester Ganjil 2026/2027"]} />
          <span className="mut" style={{ fontSize: 12 }}>
            Paket Tanggap · 5 Okt 2026 sampai Mar 2027
          </span>
        </div>
        <ol className="stages">
          {TAHAP.map((t, i) => {
            const status = STATUS_TAHAP[t.status];
            return (
              <li key={t.nama} className={`stage${t.status === "now" ? " now" : ""}`}>
                <span className={`sno ${t.status}`}>
                  {t.status === "done" ? <Ikon nama="centang" size={16} /> : i + 1}
                </span>
                <span className="stt">{t.nama}</span>
                <span className="std">{t.ket}</span>
                <span className={`pill sm ${status.pil}`}>{status.label}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="row2">
        <div className="card hero">
          <div className="herotop">
            <KepalaKartu ikon="skrining" nada="dark" judul={["Anak Terpetakan", "Skrining Awal"]} />
            <p className="herobig">276 anak</p>
          </div>
          <div className="herobot">
            <div>
              <div className="mini">
                <span className="ic">
                  <Ikon nama="pena" size={15} warna="#111" />
                </span>
                Formulir wali kelas
              </div>
              <p className="heroval">276 dari 288</p>
              <div className="hbar">
                <span className="pu" style={{ width: "96%" }} />
              </div>
              <p className="herosub">12 anak belum diisi · batas Jumat, 13 Nov</p>
            </div>
            <div>
              <div className="mini">
                <span className="ic">
                  <Ikon nama="kelompok" size={15} warna="#111" />
                </span>
                Formulir orang tua
              </div>
              <p className="heroval">
                <span>241 dari 288</span>
                <span className="dot" />
                <span className="o">47 belum</span>
              </p>
              <div className="hbar">
                <span className="or" style={{ width: "84%" }} />
              </div>
              <p className="herosub">Pengingat WhatsApp terakhir: Selasa, 10 Nov</p>
            </div>
          </div>
        </div>

        <div className="card akses">
          <KepalaKartu ikon="kisi" nada="black" judul={["Akses", "Cepat"]} />
          <div className="fgrid">
            <button type="button" className="fbtn" onClick={() => pindah("kasus", { jenis: "lapor" })}>
              <Ikon nama="lapor" size={22} warna="#D63CE0" />
              Lapor Kejadian
            </button>
            <button type="button" className="fbtn" onClick={() => toast(PESAN_PENGINGAT)}>
              <Ikon nama="kirim" size={22} warna="#5B5BF0" />
              Kirim Pengingat Skrining
            </button>
            <button type="button" className="fbtn" onClick={() => pindah("skrining")}>
              <Ikon nama="peta" size={22} warna="#3D8BF2" />
              Lihat Peta Skrining
            </button>
            <button type="button" className="fbtn" onClick={() => toast(PESAN_UNDUH)}>
              <Ikon nama="unduh" size={22} warna="#3BAA35" />
              Unduh Laporan Pimpinan
            </button>
          </div>
        </div>
      </section>

      <section className="row4">
        {ANGKA_KUNCI.map((k) => (
          <div key={k.angka} className="card kpi">
            <KepalaKartu ikon={k.ikon} judul={k.judul} as="h3" />
            <p className="num">{k.angka}</p>
            <p className={`ksub ${k.nada}`}>{k.ket}</p>
          </div>
        ))}
      </section>

      <section className="card tcard">
        <div className="tophead">
          <KepalaKartu ikon="tiket" judul={["Alur Penanganan", "Kasus"]} />
          <button type="button" className="ghost sm" onClick={() => pindah("kasus")}>
            Buka Kasus &amp; SLA
            <Ikon nama="keluar" size={16} />
          </button>
        </div>
        <div className="pipe">
          {ALUR.map((p, i) => (
            <div key={p.judul} className="pitem">
              <div className={`pst${p.nada ? ` ${p.nada}` : ""}`}>
                <span className="pl">{p.judul}</span>
                <span className="pn">{p.jumlah}</span>
                <span className="pd">{p.ket}</span>
                <span className="pw">{p.oleh}</span>
              </div>
              {i < ALUR.length - 1 && (
                <span className="pchev" aria-hidden="true">
                  <Ikon nama="kanan" size={20} />
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="att">
          <p className="atth">Perlu perhatian pimpinan sekarang</p>
          {PERHATIAN.map((a) => (
            <div key={a.id} className={`alert ${a.nada}`}>
              <span className={`pill sm ${a.pil}`}>{a.tingkat}</span>
              <div className="alm">
                <b>
                  {a.id} · {a.judul}
                </b>
                <span>{a.meta}</span>
              </div>
              <div className="als">
                <b className={a.warnaSla}>{a.sla}</b>
                <span>{a.oleh}</span>
              </div>
              <button
                type="button"
                className="ghost sm"
                aria-label={`Buka kasus ${a.id}`}
                onClick={() => pindah("kasus", { jenis: "kasus", id: a.id })}
              >
                Buka
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="row2">
        <div className="card chart">
          <div className="tophead">
            <KepalaKartu ikon="grafik" judul={["Hasil Pemetaan", "per Aspek"]} as="h3" />
            <Segmen label="Sumber penilaian" pilihan={SUMBER} nilai={sumber} onPilih={pilihSumber} />
          </div>
          <GrafikBatang
            label="Grafik jumlah anak per aspek, klik batang untuk melihat nilai"
            batang={batangAspek}
            aktif={aspekAktif}
            nada="p"
            onPilih={setPilihAspek}
          />
          <p className="chartnote">
            Jumlah anak yang aspeknya masuk kategori perlu dipantau atau perlu dukungan, dari 276 anak terpetakan. Satu
            anak bisa muncul di lebih dari satu aspek.
          </p>
        </div>

        <div className="card chart">
          <div className="tophead">
            <KepalaKartu ikon="lapor" judul={["Laporan Masuk", "per Kategori"]} as="h3" />
            <Segmen label="Rentang waktu laporan" pilihan={RENTANG} nilai={rentang} onPilih={setRentang} />
          </div>
          <GrafikBatang
            label="Grafik laporan per kategori, klik batang untuk melihat nilai"
            batang={batangKategori}
            aktif={kategoriAktif}
            nada="o"
            onPilih={setPilihKategori}
          />
          <p className="chartnote">{`${CATATAN_RENTANG[rentang]} ${CATATAN_KATEGORI}`}</p>
        </div>
      </section>

      <section className="card tcard">
        <div className="tophead">
          <KepalaKartu ikon="baris" judul={["Peta", "Kelas"]} />
          <Segmen label="Saring status kelas" pilihan={SARINGAN_KELAS} nilai={saring} onPilih={setSaring} />
        </div>
        <div className="tbox">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 52 }}>No</th>
                <th>Kelas</th>
                <th>Terpetakan</th>
                <th>Perlu dipantau</th>
                <th>Perlu dukungan</th>
                <th>Kasus aktif</th>
                <th>Status</th>
                <th>Tindak lanjut</th>
              </tr>
            </thead>
            <tbody>
              {barisKelas.map((r, i) => (
                <tr key={r.kelas}>
                  <td>{i + 1}</td>
                  <td>
                    <div className="cellbox">
                      <b>{r.kelas}</b>
                      <span className="mut">{r.wali}</span>
                    </div>
                  </td>
                  <td>
                    <span className={r.terpetakan < r.jumlah ? "o" : undefined}>{`${r.terpetakan} / ${r.jumlah}`}</span>
                  </td>
                  <td>{r.pantau}</td>
                  <td>{r.dukung}</td>
                  <td>{r.kasus}</td>
                  <td>
                    <span className={`pill ${PIL_STATUS_KELAS[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="rumus">{r.tindak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
