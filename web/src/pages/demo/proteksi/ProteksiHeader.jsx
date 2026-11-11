import { useRef, useState } from "react";
import { useProteksi } from "./konteks";
import { Ikon } from "./komponen";
import { cariLayar, LAYAR, ORANG, PERAN, TAB } from "./layarProteksi";
import dasar from "./proteksi.module.css";

const HITUNG_KASUS_AWAL = LAYAR.find((l) => l.id === "kasus")?.hitung ?? null;

/**
 * Header ringkas yang menempel di atas saat digulir: merek, tab yang selalu terlihat (Ringkasan,
 * Pencegahan, Kejadian, Orang tua, Panduan), lalu lonceng notifikasi, sudut pandang ("Lihat
 * sebagai"), dan Lapor kejadian. Lapor kejadian membuka formulir di layar Kasus dari layar mana
 * pun; di aplikasi orang tua tombol ini disembunyikan karena ponsel punya Lapor Aman sendiri.
 */
export default function ProteksiHeader() {
  const { layar, peran, pindah, hitungKasus, notifikasi, bacaNotifikasi, bacaSemua } = useProteksi();
  const [buka, setBuka] = useState(null);
  const loncengRef = useRef(null);
  const peranRef = useRef(null);
  const orang = ORANG[peran] || ORANG.kepsek;
  const tabAktif = cariLayar(layar)?.tab;
  const jumlahKasus = hitungKasus ?? HITUNG_KASUS_AWAL;

  const milikSaya = notifikasi.filter((n) => n.peran === peran);
  const belumDibaca = milikSaya.filter((n) => !n.dibaca).length;

  function tutup(kembalikanFokus) {
    const asal = buka === "lonceng" ? loncengRef.current : peranRef.current;
    setBuka(null);
    if (kembalikanFokus) asal?.focus();
  }

  function pilih(id, aksi) {
    setBuka(null);
    pindah(id, aksi);
  }

  function bukaNotifikasi(n) {
    bacaNotifikasi(n.id);
    setBuka(null);
    if (n.tujuan) pindah(n.tujuan.layar, n.tujuan.aksi);
  }

  return (
    <>
      {buka && <button type="button" className="backdrop" aria-label="Tutup menu" tabIndex={-1} onClick={() => tutup(false)} />}
      <header
        className="header"
        onKeyDown={(e) => {
          if (e.key === "Escape" && buka) {
            e.stopPropagation();
            tutup(true);
          }
        }}
      >
        <div className="hkiri">
          <span className="hmerek">
            <span className="tile dark hdr">
              <Ikon nama="perisai" size={15} />
            </span>
            <span className="brand">Sekolah Proteksi</span>
          </span>
          <nav className="htabs" aria-label="Menu Sekolah Proteksi">
            {TAB.map((t) => {
              const aktif = t.id === tabAktif;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`htab${aktif ? " active" : ""}`}
                  aria-current={aktif ? "page" : undefined}
                  onClick={() => pilih(t.layar)}
                >
                  {t.label}
                  {t.hitung && jumlahKasus ? (
                    <span className="cnt" aria-label={`${jumlahKasus} kasus aktif`}>
                      {jumlahKasus}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hkanan">
          <div className="hpos">
            <button
              ref={loncengRef}
              type="button"
              className="hikon"
              aria-expanded={buka === "lonceng"}
              aria-controls={buka === "lonceng" ? "sp-notif" : undefined}
              aria-label={belumDibaca ? `Notifikasi, ${belumDibaca} belum dibaca` : "Notifikasi"}
              onClick={() => setBuka(buka === "lonceng" ? null : "lonceng")}
            >
              <Ikon nama="lonceng" size={20} />
              {belumDibaca > 0 && (
                <span className="hbadge" aria-hidden="true">
                  {belumDibaca}
                </span>
              )}
            </button>
            {buka === "lonceng" && (
              <div id="sp-notif" className={`npanel ${dasar.menuMasuk}`} role="dialog" aria-label={`Notifikasi ${orang.nama}`}>
                <div className="nhead">
                  <b>Notifikasi</b>
                  <span className="mut">{orang.nama}</span>
                  {belumDibaca > 0 && (
                    <button type="button" className="nsemua" onClick={() => bacaSemua(peran)}>
                      Tandai semua dibaca
                    </button>
                  )}
                </div>
                {milikSaya.length === 0 ? (
                  <p className="nkosong">Belum ada notifikasi.</p>
                ) : (
                  <ul className="nlist">
                    {milikSaya.map((n) => (
                      <li key={n.id}>
                        <button type="button" className={`nitem${n.dibaca ? "" : " baru"}`} onClick={() => bukaNotifikasi(n)}>
                          <span className={`tile ${n.nada} nikon`}>
                            <Ikon nama={n.ikon} size={16} />
                          </span>
                          <span className="nteks">
                            <b>{n.judul}</b>
                            <span>{n.isi}</span>
                            <span className="nwaktu">{n.waktu}</span>
                          </span>
                          {!n.dibaca && <span className="ntitik" aria-label="Belum dibaca" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="hpos">
            <button
              ref={peranRef}
              type="button"
              className="hbtn peran"
              aria-expanded={buka === "peran"}
              aria-controls={buka === "peran" ? "sp-peran" : undefined}
              aria-label={`Ganti sudut pandang, sekarang ${orang.peran}`}
              onClick={() => setBuka(buka === "peran" ? null : "peran")}
            >
              <span className="av">{orang.inisial}</span>
              <span className="who">
                <b>{orang.nama}</b>
                <span>{orang.peran}</span>
              </span>
              <Ikon nama="turun" size={20} />
            </button>
            {buka === "peran" && (
              <nav id="sp-peran" className={`dd ${dasar.menuMasuk}`} style={{ right: 0, width: 284 }} aria-label="Lihat sebagai">
                <span className="ddl">Lihat sebagai</span>
                {PERAN.map((p) => {
                  const aktif = p.id === peran;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`navitem${aktif ? " active" : ""}`}
                      aria-current={aktif ? "true" : undefined}
                      onClick={() => pilih(p.layar)}
                    >
                      {p.label}
                      <span className="sub">{p.sub}</span>
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          {layar !== "orangtua" && (
            <button type="button" className="hbtn lapor" onClick={() => pilih("kasus", { jenis: "lapor" })}>
              <Ikon nama="lapor" size={17} />
              Lapor kejadian
            </button>
          )}
        </div>
      </header>
    </>
  );
}
