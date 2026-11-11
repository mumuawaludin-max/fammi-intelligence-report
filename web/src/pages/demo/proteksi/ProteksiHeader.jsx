import { Fragment, useRef, useState } from "react";
import { useProteksi } from "./konteks";
import { Ikon } from "./komponen";
import { LAYAR, ORANG, PERAN } from "./layarProteksi";
import dasar from "./proteksi.module.css";

// Menu dikelompokkan menurut `grup` registri, urutan sesuai registri.
const GRUP_MENU = LAYAR.reduce((acc, l) => {
  const grup = acc.find((g) => g.nama === l.grup);
  if (grup) grup.layar.push(l);
  else acc.push({ nama: l.grup, layar: [l] });
  return acc;
}, []);

/**
 * Header yang sama di semua layar (desain): kiri tombol menu "Your School" dengan daftar layar,
 * kanan tombol sudut pandang ("Lihat sebagai") dan Lapor Kejadian. Lapor Kejadian membuka
 * formulir lapor di layar Kasus & SLA dari layar mana pun; di aplikasi orang tua tombol ini
 * disembunyikan karena ponsel punya Lapor Aman sendiri.
 */
export default function ProteksiHeader() {
  const { layar, peran, pindah, hitungKasus } = useProteksi();
  const [buka, setBuka] = useState(null);
  const menuRef = useRef(null);
  const peranRef = useRef(null);
  const orang = ORANG[peran] || ORANG.kepsek;

  function tutup(kembalikanFokus) {
    const asal = buka === "nav" ? menuRef.current : peranRef.current;
    setBuka(null);
    if (kembalikanFokus) asal?.focus();
  }

  function pilihLayar(id, aksi) {
    setBuka(null);
    pindah(id, aksi);
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
        <div className="hgroup">
          <button
            ref={menuRef}
            type="button"
            className="hbtn menu"
            aria-expanded={buka === "nav"}
            aria-controls={buka === "nav" ? "sp-menu" : undefined}
            onClick={() => setBuka(buka === "nav" ? null : "nav")}
          >
            <Ikon nama="menu" size={22} />
            <span className="brand">Your School</span>
          </button>
          {buka === "nav" && (
            <nav id="sp-menu" className={`dd ${dasar.menuMasuk}`} style={{ left: 0, width: 272 }} aria-label="Menu Sekolah Proteksi">
              {GRUP_MENU.map((g) => (
                <Fragment key={g.nama}>
                  <span className="ddl">{g.nama}</span>
                  {g.layar.map((l) => {
                    const aktif = l.id === layar;
                    const hitung = l.id === "kasus" && hitungKasus != null ? hitungKasus : l.hitung;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        className={`navitem${aktif ? " active" : ""}`}
                        aria-current={aktif ? "page" : undefined}
                        onClick={() => pilihLayar(l.id)}
                      >
                        <Ikon nama={l.ikon} size={18} />
                        {l.label}
                        {hitung ? <span className="cnt" aria-label={`${hitung} kasus aktif`}>{hitung}</span> : null}
                      </button>
                    );
                  })}
                </Fragment>
              ))}
            </nav>
          )}
        </div>

        <div className="hgroup right">
          <div style={{ position: "relative", flex: "1 1 auto", display: "flex" }}>
            <button
              ref={peranRef}
              type="button"
              className="hbtn peran"
              aria-expanded={buka === "peran"}
              aria-controls={buka === "peran" ? "sp-peran" : undefined}
              aria-label={`Ganti sudut pandang, sekarang ${orang.peran}`}
              onClick={() => setBuka(buka === "peran" ? null : "peran")}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="av">{orang.inisial}</span>
                <span className="who">
                  <b>{orang.nama}</b>
                  <span>{orang.peran}</span>
                </span>
              </span>
              <Ikon nama="turun" size={22} />
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
                      onClick={() => pilihLayar(p.layar)}
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
            <button type="button" className="hbtn lapor" onClick={() => pilihLayar("kasus", { jenis: "lapor" })}>
              <span className="tile red hdr">
                <Ikon nama="lapor" size={16} />
              </span>
              Lapor Kejadian
            </button>
          )}
        </div>
      </header>
    </>
  );
}
