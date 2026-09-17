// Komponen dasar modul Screening Awal Wellbeing, disusun untuk tampilan ruang kendali: setiap tab
// muat di satu layar laptop (1366x768), rincian panjang dibuka lewat dialog. Grafik dibangun dari
// CSS dan SVG sebaris; semua progress bar memakai satu tebal (--fm-bar). Setiap grafik muncul
// dengan animasi singkat saat tab dibuka (keyframes di SwUi.module.css), dan setiap legenda
// punya tooltip penjelas (Petunjuk).

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CaretDown, HourglassMedium, Info, Table, Warning, X } from "@phosphor-icons/react";
import { ALASAN, KALIMAT_FOOTER, KUADRAN } from "./lib/swMeta";
import { formatAngka, formatPersen, kategoriKondisi, porsi } from "./lib/swAturan";
import { IKON_ALASAN, IKON_KUADRAN, WARNA_ALASAN, WARNA_KUADRAN } from "./swWarna";
import styles from "./SwUi.module.css";

// ── Tooltip ─────────────────────────────────────────────────────────────────────────────────

/**
 * Tooltip penjelas untuk legenda, chip, dan label. Isinya dirender lewat portal ke dialog yang
 * sedang terbuka (kalau ada) atau ke body, supaya tidak terpotong kartu yang overflow-nya
 * disembunyikan. Muncul saat disorot atau difokus lewat keyboard.
 */
export function Petunjuk({ teks, children, blok = false, className = "", style, fokus = true }) {
  const ref = useRef(null);
  const id = useId();
  const [pos, setPos] = useState(null);
  if (!teks) return children;

  function buka() {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const bawah = r.top < 96;
    setPos({
      x: Math.max(150, Math.min(window.innerWidth - 150, r.left + r.width / 2)),
      y: bawah ? r.bottom + 8 : r.top - 8,
      bawah,
      wadah: ref.current.closest("dialog") || document.body,
    });
  }
  const tutup = () => setPos(null);

  return (
    <>
      <span
        ref={ref}
        className={`${blok ? styles.petunjukBlok : styles.petunjuk} ${className}`}
        style={style}
        tabIndex={fokus ? 0 : -1}
        aria-describedby={pos ? id : undefined}
        onMouseEnter={buka}
        onMouseLeave={tutup}
        onFocus={buka}
        onBlur={tutup}
      >
        {children}
      </span>
      {pos && createPortal(
        <span
          role="tooltip"
          id={id}
          className={`${styles.petunjukIsi} ${pos.bawah ? styles.petunjukIsiBawah : ""}`}
          style={{ left: pos.x, top: pos.y }}
        >
          {teks}
        </span>,
        pos.wadah,
      )}
    </>
  );
}

// ── Kartu dan keadaan ───────────────────────────────────────────────────────────────────────

/** Kartu dengan judul opsional, ikon berwarna opsional. Isi kartu mengisi sisa tinggi kartu. */
export function Kartu({ judul, aksi, ikon: Ikon, warnaIkon = "var(--fm-ungu)", children, className = "", isiClassName = "", as: Tag = "section", ...rest }) {
  return (
    <Tag className={`${styles.kartu} ${className}`} {...rest}>
      {(judul || aksi) && (
        <header className={styles.kartuKepala}>
          {judul && (
            <h3 className={styles.kartuJudul} title={typeof judul === "string" ? judul : undefined}>
              {Ikon && (
                <span className={styles.kartuIkon} style={{ "--w": warnaIkon }} aria-hidden="true">
                  <Ikon size={14} weight="fill" />
                </span>
              )}
              <span>{judul}</span>
            </h3>
          )}
          {aksi && <div className={styles.kartuAksi}>{aksi}</div>}
        </header>
      )}
      <div className={`${styles.kartuIsi} ${isiClassName}`}>{children}</div>
    </Tag>
  );
}

const IKON_KEADAAN = { memuat: HourglassMedium, galat: Warning, kosong: Info };

/** Keadaan memuat, galat, dan kosong. Dipakai di setiap layar modul. */
export function KeadaanLayar({ jenis = "kosong", judul, pesan, children }) {
  const Ikon = IKON_KEADAAN[jenis] || Info;
  return (
    <div className={`${styles.keadaan} ${styles[`keadaan_${jenis}`] || ""}`} role={jenis === "galat" ? "alert" : "status"}>
      <Ikon size={28} weight="duotone" aria-hidden="true" />
      <p className={styles.keadaanJudul}>{judul}</p>
      {pesan && <p className={styles.keadaanPesan}>{pesan}</p>}
      {children}
    </div>
  );
}

/** Catatan satu baris berikon. */
export function Catatan({ children, nada = "netral", ikon: Ikon = Info }) {
  return (
    <p className={`${styles.catatan} ${styles[`catatan_${nada}`] || ""}`}>
      <Ikon size={16} weight="bold" aria-hidden="true" />
      <span title={typeof children === "string" ? children : undefined}>{children}</span>
    </p>
  );
}

// ── Bar ─────────────────────────────────────────────────────────────────────────────────────

/** Bar tunggal 0-maks dengan penanda opsional (mis. posisi lembaga). Tebal selalu --fm-bar. */
export function BarNilai({ nilai, warna = "var(--fm-ungu)", penanda = null, labelPenanda = "", maks = 100 }) {
  const p = Math.max(0, Math.min(1, (nilai ?? 0) / maks));
  return (
    <span className={styles.bar}>
      <span className={styles.barIsi} style={{ width: `${p * 100}%`, background: warna }} />
      {penanda !== null && penanda !== undefined && (
        <Petunjuk teks={`${labelPenanda} ${formatAngka(penanda)}`}>
          <span
            className={styles.barPenanda}
            style={{ left: `${Math.max(0, Math.min(1, penanda / maks)) * 100}%` }}
            aria-label={`${labelPenanda} ${formatAngka(penanda)}`}
          />
        </Petunjuk>
      )}
    </span>
  );
}

/**
 * Satu baris bar: label, bar, nilai. Dipakai untuk semua daftar berbatang supaya ukuran bar di
 * seluruh modul sama. `petunjuk` menambah tooltip pada labelnya.
 */
export function BarBaris({ label, nilai, maks = 100, warna, teks, penanda, labelPenanda, onKlik, aktif = false, lebarLabel, petunjuk, ikon: Ikon }) {
  const teksLabel = (
    <span className={styles.barBarisLabel} title={typeof label === "string" && !petunjuk ? label : undefined}>
      {Ikon && <Ikon size={15} weight="fill" aria-hidden="true" className={styles.barBarisIkon} style={{ color: warna }} />}
      {label}
    </span>
  );
  const isi = (
    <>
      {petunjuk ? <Petunjuk teks={petunjuk} blok>{teksLabel}</Petunjuk> : teksLabel}
      <BarNilai nilai={nilai} maks={maks} warna={warna} penanda={penanda} labelPenanda={labelPenanda} />
      <span className={styles.barBarisNilai}>{teks ?? formatAngka(nilai)}</span>
    </>
  );
  const gaya = lebarLabel ? { "--lebar-label": lebarLabel } : undefined;
  if (onKlik) {
    return (
      <button type="button" className={`${styles.barBaris} ${styles.barBarisKlik} ${aktif ? styles.barBarisAktif : ""}`} style={gaya} onClick={onKlik} aria-pressed={aktif}>
        {isi}
      </button>
    );
  }
  return <div className={styles.barBaris} style={gaya}>{isi}</div>;
}

/** Legenda berwarna; tiap butir punya tooltip kalau `panjang` diisi. */
export function Legenda({ item, dasar, satuan = "orang", kecil = false }) {
  return (
    <ul className={`${styles.legenda} ${kecil ? styles.legendaKecil : ""}`}>
      {item.map((s) => {
        const isi = (
          <>
            <span className={styles.legendaTitik} style={{ background: s.warna }} aria-hidden="true" />
            <span>{s.label}</span>
            {typeof s.jumlah === "number" && dasar > 0 && <b>{formatPersen(porsi(s.jumlah, dasar))}</b>}
            {typeof s.jumlah === "number" && <span className={styles.lembut}>({s.jumlah}{satuan ? "" : ""})</span>}
          </>
        );
        return (
          <li key={s.kunci}>
            {s.panjang ? <Petunjuk teks={s.panjang}>{isi}</Petunjuk> : isi}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Bar bertumpuk mendatar, tebal sama dengan bar lain. Angka ada di legenda (persen dan jumlah).
 * Tiap segmen boleh membawa `panjang` untuk tooltip.
 */
export function BarTumpuk({ segmen, total, label, legenda = true, satuan = "orang", totalLegenda }) {
  const jumlahTotal = total ?? segmen.reduce((a, s) => a + s.jumlah, 0);
  const dasarLegenda = totalLegenda ?? jumlahTotal;
  return (
    <div className={styles.barTumpuk}>
      <div
        className={styles.barTumpukJalur}
        role="img"
        aria-label={`${label ? `${label}: ` : ""}${segmen.map((s) => `${s.label} ${s.jumlah} ${satuan}`).join(", ")}`}
      >
        {segmen.map((s) => {
          const p = porsi(s.jumlah, jumlahTotal);
          if (p === 0) return null;
          return (
            <Petunjuk key={s.kunci} teks={`${s.label}: ${s.jumlah} ${satuan} (${formatPersen(p)})${s.panjang ? `. ${s.panjang}` : ""}`} className={styles.barTumpukBungkus} style={{ width: `${p * 100}%` }}>
              <span className={styles.barTumpukSegmen} style={{ background: s.warna }} />
            </Petunjuk>
          );
        })}
      </div>
      {legenda && <Legenda item={segmen} dasar={dasarLegenda} satuan={satuan} />}
    </div>
  );
}

// ── Grafik lain ─────────────────────────────────────────────────────────────────────────────

/** Donat nilai 0-100 dengan angka di tengah. `teks`/`sub` mengganti isi tengah. */
export function Donat({ nilai, asumsi, ukuran = 120, tebal = 14, teks, sub = "dari 100", warna, maks = 100 }) {
  const kat = kategoriKondisi(nilai, asumsi);
  const r = (ukuran - tebal) / 2;
  const keliling = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, (nilai ?? 0) / maks));
  return (
    <figure className={styles.donat} style={{ width: ukuran }}>
      <svg width={ukuran} height={ukuran} viewBox={`0 0 ${ukuran} ${ukuran}`} role="img"
        aria-label={`${teks ?? formatAngka(nilai)} ${sub}${kat ? `, ${kat.label}` : ""}`}>
        <circle cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none" stroke="var(--fm-jalur-lintasan)" strokeWidth={tebal} />
        <circle
          cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none"
          stroke={warna || kat?.warna || "var(--fm-ungu)"} strokeWidth={tebal} strokeLinecap="round"
          strokeDasharray={`${keliling * p} ${keliling}`}
          transform={`rotate(-90 ${ukuran / 2} ${ukuran / 2})`}
          className={styles.donatIsi}
          style={{ "--dash": keliling * p }}
        />
      </svg>
      <figcaption className={styles.donatTengah}>
        <strong>{teks ?? formatAngka(nilai)}</strong>
        <span>{sub}</span>
      </figcaption>
    </figure>
  );
}

/**
 * Radar lima sumbu (atau lebih). `sumbu` = [{kunci, label}], `lapis` = [{kunci, label, warna,
 * nilai: {kunci sumbu: angka 0-maks}}]. Lapis pertama digambar paling atas.
 */
export function Radar({ sumbu, lapis, ukuran = 220, maks = 100, labelLebar = 72 }) {
  const tengah = ukuran / 2;
  const r = ukuran / 2 - 8;
  const n = sumbu.length;
  const sudut = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const titik = (i, v) => {
    const jarak = (Math.max(0, Math.min(maks, v ?? 0)) / maks) * r;
    return [tengah + jarak * Math.cos(sudut(i)), tengah + jarak * Math.sin(sudut(i))];
  };
  const lingkar = [0.25, 0.5, 0.75, 1].map((f) => sumbu.map((_, i) => titik(i, f * maks).join(",")).join(" "));
  const lebarTotal = ukuran + labelLebar * 2;
  return (
    <svg
      viewBox={`${-labelLebar} -20 ${lebarTotal} ${ukuran + 40}`}
      className={styles.radar}
      role="img"
      aria-label={lapis.map((l) => `${l.label}: ${sumbu.map((s) => `${s.label} ${formatAngka(l.nilai[s.kunci])}`).join(", ")}`).join("; ")}
    >
      {lingkar.map((p, i) => <polygon key={i} points={p} fill={i === 3 ? "var(--fm-abu-latar)" : "none"} stroke="var(--fm-jalur-lintasan)" strokeWidth="1" />)}
      {sumbu.map((s, i) => {
        const [x, y] = titik(i, maks);
        return <line key={s.kunci} x1={tengah} y1={tengah} x2={x} y2={y} stroke="var(--fm-jalur-lintasan)" strokeWidth="1" />;
      })}
      {[...lapis].reverse().map((l) => {
        const pts = sumbu.map((s, i) => titik(i, l.nilai[s.kunci]));
        return (
          <g key={l.kunci} className={styles.radarLapis}>
            <polygon points={pts.map((p) => p.join(",")).join(" ")} fill={l.warna} fillOpacity={l.tebal ? 0.22 : 0.1} stroke={l.warna} strokeWidth={l.tebal ? 2.5 : 1.5} strokeLinejoin="round" />
            {l.tebal && pts.map((p, i) => <circle key={sumbu[i].kunci} cx={p[0]} cy={p[1]} r="3.5" fill="#ffffff" stroke={l.warna} strokeWidth="2" />)}
          </g>
        );
      })}
      {sumbu.map((s, i) => {
        const [x, y] = titik(i, maks * 1.2);
        const cos = Math.cos(sudut(i));
        const anchor = Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
        return (
          <text key={s.kunci} x={x} y={y + 4} fontSize="13" fontWeight="600" textAnchor={anchor} fill="var(--fm-teks)">
            {s.label}
          </text>
        );
      })}
    </svg>
  );
}

/**
 * Wafel 10x10: seratus kotak, tiap kotak = 1% dari total. Segmen dengan sisa pembulatan terbesar
 * mendapat kotak tambahan supaya jumlahnya pas seratus.
 */
export function Wafel({ segmen, total, label, kolom = 10, sebaris = false, lebar = 120 }) {
  const jumlahTotal = total ?? segmen.reduce((a, s) => a + s.jumlah, 0);
  const seratus = 100;
  const mentah = segmen.map((s) => (jumlahTotal ? (s.jumlah / jumlahTotal) * seratus : 0));
  const bulat = mentah.map(Math.floor);
  let sisa = seratus - bulat.reduce((a, b) => a + b, 0);
  const urutSisa = mentah.map((v, i) => ({ i, sisa: v - Math.floor(v) })).sort((a, b) => b.sisa - a.sisa);
  for (const { i } of urutSisa) { if (sisa <= 0) break; if (segmen[i].jumlah > 0) { bulat[i] += 1; sisa -= 1; } }
  const kotak = segmen.flatMap((s, i) => Array.from({ length: bulat[i] }, (_, k) => ({ kunci: `${s.kunci}-${k}`, warna: s.warna })));
  return (
    <div className={`${styles.wafelBungkus} ${sebaris ? styles.wafelSebaris : ""}`} style={{ "--wafel": `${lebar}px` }}>
      <div
        className={styles.wafel}
        style={{ gridTemplateColumns: `repeat(${kolom}, 1fr)` }}
        role="img"
        aria-label={`${label ? `${label}: ` : ""}${segmen.map((s) => `${s.label} ${s.jumlah} (${formatPersen(porsi(s.jumlah, jumlahTotal))})`).join(", ")}`}
      >
        {kotak.map((k, i) => <span key={k.kunci} style={{ background: k.warna, animationDelay: `${i * 6}ms` }} />)}
      </div>
      <Legenda item={segmen} dasar={jumlahTotal} />
    </div>
  );
}

/**
 * Kotak 2x2 pandangan pegawai dan atasan, dibangun dari HTML supaya teksnya membungkus rapi.
 * `jumlah` = {kunci: n} menampilkan angka per kelompok (tab Pandangan Atasan); `aktif` menyalakan
 * satu kelompok saja (Profil Pegawai), dengan titik di dalamnya menurut `x` (dilihat atasan) dan
 * `y` (dirasakan pegawai), keduanya 0-100.
 */
export function KotakKuadran({ jumlah, total, aktif, x, y, ringkas = false }) {
  const urut = [...KUADRAN].sort((a, b) => a.posisi.baris - b.posisi.baris || a.posisi.kolom - b.posisi.kolom);
  const modeJumlah = Boolean(jumlah);
  return (
    <div className={`${styles.kuadranBungkus} ${ringkas ? styles.kuadranRingkas : ""}`}>
      <span className={styles.kuadranSumbuY} aria-hidden="true">dirasakan pegawai: makin berat ↑</span>
      <div
        className={styles.kuadran}
        role="img"
        aria-label={modeJumlah
          ? KUADRAN.map((k) => `${k.label}: ${jumlah[k.kunci] || 0} orang`).join(", ")
          : `Kelompok ${KUADRAN.find((k) => k.kunci === aktif)?.label || "belum ada"}`}
      >
        {urut.map((k) => {
          const Ikon = IKON_KUADRAN[k.kunci];
          const w = WARNA_KUADRAN[k.kunci];
          const n = jumlah?.[k.kunci] || 0;
          const nyala = modeJumlah ? n > 0 : k.kunci === aktif;
          const gaya = nyala
            ? { background: w.latar, color: w.teks, "--ikon": w.teks }
            : { background: "var(--fm-abu-latar)", color: "var(--fm-teks-lembut)", "--ikon": "var(--fm-teks-lembut)" };
          return (
            <Petunjuk key={k.kunci} teks={k.arti} blok className={styles.selKuadranBungkus}>
              <div className={`${styles.selKuadran} ${nyala ? styles.selKuadranNyala : ""}`} style={gaya}>
                <span className={styles.selKuadranAtas}>
                  <Ikon size={ringkas ? 16 : 18} weight="fill" aria-hidden="true" />
                  {modeJumlah && <strong>{n}</strong>}
                </span>
                <span className={styles.selKuadranLabel}>{k.label}</span>
                {modeJumlah && total > 0 && <span className={styles.selKuadranPorsi}>{formatPersen(porsi(n, total))}</span>}
                {!modeJumlah && k.kunci === aktif && typeof x === "number" && typeof y === "number" && (
                  <span
                    className={styles.kuadranTitik}
                    style={{ left: `${8 + Math.max(0, Math.min(100, x)) * 0.84}%`, top: `${92 - Math.max(0, Math.min(100, y)) * 0.84}%` }}
                    aria-hidden="true"
                  />
                )}
              </div>
            </Petunjuk>
          );
        })}
      </div>
      <span className={styles.kuadranSumbuX} aria-hidden="true">dilihat atasan: makin berat →</span>
    </div>
  );
}

// ── Chip, lencana, kendali ──────────────────────────────────────────────────────────────────

/** Chip kategori: warna selalu disertai label, warna teks mengikuti latarnya. */
export function ChipKategori({ nilai, asumsi, awalan = "" }) {
  const kat = kategoriKondisi(nilai, asumsi);
  if (!kat) return null;
  return (
    <Petunjuk teks={`${kat.label}: skor ${kat.min} sampai ${kat.max} dari 100.`}>
      <span className={styles.chip} style={{ background: kat.warna, color: kat.teks }}>
        {awalan}{kat.label}
      </span>
    </Petunjuk>
  );
}

export function Lencana({ kunci }) {
  const info = ALASAN.find((a) => a.kunci === kunci);
  const Ikon = IKON_ALASAN[kunci];
  if (!info) return null;
  return (
    <Petunjuk teks={info.panjang || info.penjelas}>
      <span className={styles.lencana}>
        {Ikon && <Ikon size={14} weight="bold" aria-hidden="true" style={{ color: WARNA_ALASAN[kunci] }} />}
        {info.label}
      </span>
    </Petunjuk>
  );
}

export function Sakelar({ nyala, onUbah, label }) {
  const id = useId();
  return (
    <div className={styles.sakelarBaris}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={nyala}
        className={`${styles.sakelar} ${nyala ? styles.sakelarNyala : ""}`}
        onClick={() => onUbah(!nyala)}
      >
        <span className={styles.sakelarTombol} />
      </button>
      <label htmlFor={id} className={styles.sakelarLabel}>{label}</label>
    </div>
  );
}

/** Dropdown bergaya modul: tanpa garis tepi, bayangan tipis, panah sendiri. */
export function Pilihan({ label, nilai, onUbah, opsi, semua = "Semua", sebaris = false, petunjuk }) {
  const id = useId();
  const teksLabel = <label htmlFor={id}>{label}</label>;
  return (
    <div className={`${styles.pilihan} ${sebaris ? styles.pilihanSebaris : ""}`}>
      {petunjuk ? <Petunjuk teks={petunjuk}>{teksLabel}</Petunjuk> : teksLabel}
      <span className={styles.pilihanKotak}>
        <select id={id} value={nilai} onChange={(e) => onUbah(e.target.value)}>
          {semua !== null && <option value="">{semua}</option>}
          {opsi.map((o) => <option key={o.nilai} value={o.nilai}>{o.label}</option>)}
        </select>
        <CaretDown size={14} weight="bold" aria-hidden="true" className={styles.pilihanPanah} />
      </span>
    </div>
  );
}

export function AngkaKecil({ label, nilai, catatan, petunjuk }) {
  const isi = (
    <div className={styles.angka}>
      <span className={styles.angkaNilai}>{nilai}</span>
      <span className={styles.angkaLabel}>{label}</span>
      {catatan && <span className={styles.angkaCatatan}>{catatan}</span>}
    </div>
  );
  return petunjuk ? <Petunjuk teks={petunjuk} blok>{isi}</Petunjuk> : isi;
}

// ── Tabel dan dialog ────────────────────────────────────────────────────────────────────────

/** Tabel biasa, dipakai di dalam dialog. */
export function Tabel({ kolom, baris }) {
  return (
    <table className={styles.tabel}>
      <thead>
        <tr>{kolom.map((k) => <th key={k} scope="col">{k}</th>)}</tr>
      </thead>
      <tbody>
        {baris.map((b, i) => (
          <tr key={i}>{b.map((sel, j) => (j === 0 ? <th key={j} scope="row">{sel}</th> : <td key={j}>{sel}</td>))}</tr>
        ))}
      </tbody>
    </table>
  );
}

/** Padanan tabel untuk setiap grafik: tombol kecil yang membuka tabel di dialog. */
export function TabelPadanan({ judul = "Data dalam tabel", kolom, baris }) {
  const [buka, setBuka] = useState(false);
  return (
    <>
      <button type="button" className={styles.tombolTabel} onClick={() => setBuka(true)} title="Lihat dalam bentuk tabel">
        <Table size={16} weight="bold" aria-hidden="true" /> Tabel
      </button>
      {buka && (
        <Dialog judul={judul} onTutup={() => setBuka(false)}>
          <Tabel kolom={kolom} baris={baris} />
        </Dialog>
      )}
    </>
  );
}

export function Dialog({ judul, keterangan, onTutup, children, aksi, lebar = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
    return () => el?.open && el.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${lebar ? styles.dialogLebar : ""}`}
      onCancel={(e) => { e.preventDefault(); onTutup(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onTutup(); }}
      aria-label={judul}
    >
      <div className={styles.dialogBingkai}>
        <div className={styles.dialogKepala}>
          <div>
            <h2>{judul}</h2>
            {keterangan && <p>{keterangan}</p>}
          </div>
          <button type="button" className={styles.tombolIkon} onClick={onTutup} aria-label="Tutup">
            <X size={18} weight="bold" />
          </button>
        </div>
        <div className={styles.dialogIsi}>{children}</div>
        {aksi && <div className={styles.dialogAksi}>{aksi}</div>}
      </div>
    </dialog>
  );
}

export function Tombol({ children, varian = "utama", ...rest }) {
  return <button type="button" className={`${styles.tombol} ${styles[`tombol_${varian}`] || ""}`} {...rest}>{children}</button>;
}

export function TombolIkon({ children, ...rest }) {
  return <button type="button" className={styles.tombolIkon} {...rest}>{children}</button>;
}

export function KalimatFooter() {
  return <span className={styles.footer}>{KALIMAT_FOOTER}</span>;
}

/** Catatan satu baris untuk unit yang tidak ditampilkan sendiri. */
export function CatatanUnitKecil({ jumlah, ambang }) {
  if (!jumlah) return null;
  return <Catatan>{`${jumlah} unit di bawah ${ambang} pengisi tidak ditampilkan sendiri, tetapi tetap dihitung di total.`}</Catatan>;
}
