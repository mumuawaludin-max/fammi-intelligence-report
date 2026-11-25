import { useMemo, useState } from "react";
import { useProteksi } from "../konteks";
import { Ikon, KepalaKartu, KepalaLaci, Laci } from "../komponen";
import { ORANG } from "../layarProteksi";
import { PilStatus } from "../bersama/HeartKecil";
import { HEART, LAPORAN_RAKA, URUTAN_STATUS, cariAspek } from "../bersama/heart";
import { LABEL_ALUR, PEMILIK, checklistAnak } from "../bersama/tindakLanjut";
import { KasusAktif } from "./ProfilAnakKasus";
import { EVALUASI, TUJUAN } from "./profilAnakData";
import FormTindakLanjut from "../bersama/FormTindakLanjut";
import { KartuPantau } from "../bersama/KartuPantau";
import { PANTAU_RAKA, perkembangan } from "../bersama/pantau";

const NAMA_ANAK = LAPORAN_RAKA.anak.nama;
const BUTIR_AWAL = checklistAnak(NAMA_ANAK);

/**
 * Butir checklist Raka dikelompokkan: per aspek HEART (status terberat dulu), lalu yang berlaku untuk
 * semua aspek, lalu tugas dari tiap kasus (alur kejadian) secara terpisah.
 */
function kelompokkan(butir) {
  const aspekDipakai = HEART.filter((a) => butir.some((c) => !c.kasus && c.aspek === a.id)).sort(
    (a, b) =>
      URUTAN_STATUS.indexOf(LAPORAN_RAKA.aspek[b.id].status) - URUTAN_STATUS.indexOf(LAPORAN_RAKA.aspek[a.id].status),
  );
  const grup = aspekDipakai.map((a) => ({
    id: a.id,
    judul: a.nama,
    kode: a.kode,
    status: LAPORAN_RAKA.aspek[a.id].status,
    butir: butir.filter((c) => !c.kasus && c.aspek === a.id),
  }));
  const umum = butir.filter((c) => !c.kasus && !c.aspek);
  if (umum.length) grup.push({ id: "semua", judul: "Semua aspek", butir: umum });
  for (const kasus of [...new Set(butir.filter((c) => c.kasus).map((c) => c.kasus))]) {
    grup.push({ id: kasus, judul: `Dari kasus ${kasus}`, kasus, butir: butir.filter((c) => c.kasus === kasus) });
  }
  return grup;
}

/** Ringkas jumlah tugas orang lain yang belum selesai, mis. "Guru BK 2, Orang tua 2". */
function ringkasPemilik(butir) {
  const hitung = new Map();
  for (const c of butir) hitung.set(c.oleh, (hitung.get(c.oleh) ?? 0) + 1);
  return [...hitung].map(([oleh, n]) => `${PEMILIK[oleh].label} ${n}`).join(", ");
}

/**
 * Kartu paling atas Laporan anak (langkah "Tindak lanjut" di alur pencegahan): kasus aktif bila ada,
 * lalu tugas Anda yang belum selesai. Tugas orang lain cukup dihitung; seluruh checklist per aspek,
 * tujuan 4 minggu, dan tugas dari kasus terbuka di laci "Lihat semua tindak lanjut".
 *
 * Butir dibaca dari CHECKLIST ditambah butir yang disusun di layar Skrining selama demo
 * (`checklistTambahan` di konteks). Tiap butir hanya bisa dicentang pemiliknya; centang hidup di
 * konteks prototipe sehingga ikut terlihat di Ruang wali kelas dan aplikasi orang tua. Setiap butir
 * yang diselesaikan memberi tahu Guru BK.
 */
export default function ProfilAnakTindak() {
  const { peran, toast, beriTahu, centang, ubahCentang, checklistTambahan, pantauRaka } = useProteksi();
  const [laci, setLaci] = useState(false);
  // Butir yang dicentang di layar ini tetap tampil (dicoret) supaya centang bisa dibatalkan.
  const [dicentangDiSini, setDicentangDiSini] = useState(() => new Set());
  const namaSaya = ORANG[peran]?.nama ?? "Wali kelas";

  const butir = useMemo(() => {
    const tambahan = checklistTambahan.filter((c) => c.anak === NAMA_ANAK);
    const idTambahan = new Set(tambahan.map((c) => c.id));
    return [...BUTIR_AWAL.filter((c) => !idTambahan.has(c.id)), ...tambahan];
  }, [checklistTambahan]);
  const grup = useMemo(() => kelompokkan(butir), [butir]);

  const selesai = (c) => centang[c.id] ?? c.selesai;
  const milikSaya = (c) => PEMILIK[c.oleh]?.peran === peran;
  const jumlahSelesai = butir.filter(selesai).length;
  const punyaTugas = butir.some(milikSaya);
  // Sudut pandang tanpa tugas (mis. Kepala Sekolah) melihat semua yang belum selesai, hanya baca.
  // Tugas dari kasus punya batas waktu hari ini, jadi tampil paling atas.
  const tampil = butir
    .filter((c) => (punyaTugas ? milikSaya(c) : true) && (!selesai(c) || dicentangDiSini.has(c.id)))
    .sort((a, b) => Number(Boolean(b.kasus)) - Number(Boolean(a.kasus)));
  const lainBelum = punyaTugas ? butir.filter((c) => !milikSaya(c) && !selesai(c)) : [];

  function ubah(c, nilai) {
    ubahCentang(c.id, nilai);
    setDicentangDiSini((lama) => new Set(lama).add(c.id));
    if (!nilai) {
      toast(`Centang dibatalkan: ${c.judul}.`);
      return;
    }
    toast(`Selesai: ${c.judul}. ${PEMILIK.bk.orang} diberi tahu.`);
    beriTahu({
      peran: "bk",
      ikon: "ceklis",
      nada: "ok",
      judul: `${namaSaya} menyelesaikan checklist`,
      isi: c.judul,
      tujuan: { layar: "anak", aksi: { jenis: "gulir", id: "tindak" } },
    });
  }

  return (
    <section className="card tcard tl" data-bagian="tindak" aria-label="Yang perlu dilakukan untuk Raka">
      <div className="tophead">
        <KepalaKartu ikon="ceklis" judul="Yang perlu dilakukan" />
        <div className="tlprog">
          <span className="tlbatang" aria-hidden="true">
            <span style={{ width: `${(jumlahSelesai / butir.length) * 100}%` }} />
          </span>
          <span>
            <b>{jumlahSelesai}</b> dari {butir.length} selesai
          </span>
        </div>
      </div>

      <KasusAktif />

      <div className="tldelta" aria-label="Perkembangan sejak screening dari cek mingguan orang tua">
        <span className="tlsub">Sejak screening</span>
        {Object.keys(pantauRaka).map((id) => {
          const p = perkembangan(id, pantauRaka[id]);
          return (
            <span key={id} className={`tldchip ${p.arah}`}>
              {`${cariAspek(id).nama} ${p.awal} ke ${p.akhir}`}
              <b>{p.arah === "membaik" ? `membaik ${p.selisih}` : p.arah === "tetap" ? "tetap" : `naik ${-p.selisih}`}</b>
            </span>
          );
        })}
      </div>

      <div className="tlblok">
        <h3 className="tlsub">{punyaTugas ? "Tugas Anda" : "Belum selesai"}</h3>
        {tampil.length ? (
          <ul className="tldaftar">
            {tampil.map((c) => (
              <Butir key={c.id} c={c} selesai={selesai(c)} bisa={milikSaya(c)} ringkas onUbah={ubah} />
            ))}
          </ul>
        ) : (
          <p className="tlkosong">
            <Ikon nama="centang" size={16} />
            {punyaTugas ? "Semua tugas Anda untuk Raka sudah selesai." : "Semua tindak lanjut Raka sudah selesai."}
          </p>
        )}
      </div>

      <div className="tlbawah">
        <div className="tlbawahteks">
          <p className="tlevaluasi">
            <Ikon nama="jam" size={15} />
            {EVALUASI.ket}: <b>{EVALUASI.tanggal}</b>
          </p>
          {lainBelum.length > 0 && <p className="tllainbelum">Tugas orang lain belum selesai: {ringkasPemilik(lainBelum)}.</p>}
        </div>
        <button type="button" className="ghost sm" aria-haspopup="dialog" onClick={() => setLaci(true)}>
          Lihat semua tindak lanjut ({butir.length})
          <Ikon nama="kanan" size={16} />
        </button>
      </div>

      {laci && (
        <LaciSemua grup={grup} selesai={selesai} milikSaya={milikSaya} onUbah={ubah} onTutup={() => setLaci(false)} />
      )}
    </section>
  );
}

/** Laci seluruh checklist Raka: tujuan 4 minggu, jadwal evaluasi, lalu butir per aspek dan per kasus. */
function LaciSemua({ grup, selesai, milikSaya, onUbah, onTutup }) {
  const { pindah, peran, tambahChecklist, beriTahu, toast, pantauRaka } = useProteksi();
  const [tambah, setTambah] = useState(false);
  const penambah = ORANG[peran]?.nama || "Sekolah";

  // Butir tambahan sekolah masuk checklist Raka (konteks): ikut terlihat di layar wali kelas, Guru BK,
  // dan, bila untuk orang tua, di aplikasi orang tua.
  function simpanTambahan(butir) {
    tambahChecklist([butir]);
    setTambah(false);
    toast(`Tindak lanjut ditambahkan ke checklist ${PEMILIK[butir.oleh].label.toLowerCase()}.`);
    if (butir.oleh === "ortu") {
      beriTahu({
        peran: "ortu",
        ikon: "ceklis",
        nada: "p",
        judul: "Tugas rumah baru untuk Raka",
        isi: `${butir.judul} (ditambah ${penambah}).`,
        tujuan: { layar: "orangtua", aksi: { jenis: "buka", id: "checklist" } },
      });
    }
  }
  return (
    <Laci label="Semua tindak lanjut Raka" labelTutup="Tutup tindak lanjut" lebar={600} className="lacitl" onTutup={onTutup}>
      <KepalaLaci
        awal={
          <div className="tile p">
            <Ikon nama="ceklis" size={22} />
          </div>
        }
        judul="Semua tindak lanjut"
        sub={`${NAMA_ANAK} · centang butir bertanda Tugas Anda`}
        onTutup={onTutup}
      />
      <div className="tlinfo">
        <p>
          <b>Tujuan 4 minggu:</b> {TUJUAN}
        </p>
        <p className="tlsumber">Butir di bawah rekomendasi Fammi dari hasil screening. Sekolah boleh menambah sendiri.</p>
        <p className="tlevaluasi">
          <Ikon nama="jam" size={15} />
          {EVALUASI.ket}: <b>{EVALUASI.tanggal}</b>
        </p>
      </div>

      <div className="tlpantau">
        <h3 className="tlkjudul">Perkembangan dari cek mingguan Ibu Dewi</h3>
        {Object.keys(pantauRaka).map((id) => (
          <KartuPantau key={id} idAspek={id} tanya={PANTAU_RAKA[id].tanya} riwayat={pantauRaka[id]} />
        ))}
      </div>

      {tambah ? (
        <FormTindakLanjut anak={NAMA_ANAK} aspekAwal="relasi" oleh={penambah} onTambah={simpanTambahan} onBatal={() => setTambah(false)} />
      ) : (
        <button type="button" className="ghost tltambah" onClick={() => setTambah(true)}>
          <Ikon nama="tambah" size={16} />
          Tambah tindak lanjut sendiri
        </button>
      )}

      {grup.map((g) => {
        const beres = g.butir.filter(selesai).length;
        return (
          <div key={g.id} className={`tlkel${g.kasus ? " kasus" : ""}`}>
            <div className="tlkkepala">
              {g.kode ? (
                <span className={`tlkode st-${g.status}`} aria-hidden="true">
                  {g.kode}
                </span>
              ) : (
                <span className={`tlkode ${g.kasus ? "kasus" : "umum"}`} aria-hidden="true">
                  <Ikon nama={g.kasus ? "tiket" : "hati"} size={14} />
                </span>
              )}
              <h3 className="tlkjudul">{g.judul}</h3>
              {g.status && <PilStatus status={g.status} kecil />}
              {g.kasus && (
                <button type="button" className="tlkbuka" onClick={() => pindah("kasus", { jenis: "kasus", id: g.kasus })}>
                  Buka kasus
                  <Ikon nama="kanan" size={14} />
                </button>
              )}
              <span className="tlkhitung">
                {beres}/{g.butir.length}
              </span>
            </div>
            <ul className="tldaftar">
              {g.butir.map((c) => (
                <Butir key={c.id} c={c} selesai={selesai(c)} bisa={milikSaya(c)} onUbah={onUbah} />
              ))}
            </ul>
          </div>
        );
      })}
    </Laci>
  );
}

/**
 * Satu butir checklist: kotak centang, judul, penanda alur, lalu pemilik dan waktu. `ringkas` (daftar
 * Tugas Anda) tidak mengulang nama pemilik.
 */
function Butir({ c, selesai, bisa, ringkas = false, onUbah }) {
  const pemilik = PEMILIK[c.oleh];
  const idMeta = `anak-butir-${ringkas ? "r" : "s"}-${c.id}`;
  const aspek = c.aspek ? cariAspek(c.aspek) : null;
  const rincian = (ringkas ? [aspek?.nama, c.waktu, c.ket] : [pemilik.orang, c.waktu, c.ket]).filter(Boolean).join(" · ");
  return (
    <li className={`tlbutir${selesai ? " beres" : ""}${bisa ? "" : " kunci"}`}>
      <label className="tllabel">
        <input
          type="checkbox"
          checked={selesai}
          disabled={!bisa}
          aria-describedby={idMeta}
          onChange={(e) => onUbah(c, e.target.checked)}
        />
        <span className="tljudul">{c.judul}</span>
      </label>
      {c.sumber ? <span className="tltambahan">{`Ditambah ${c.sumber}`}</span> : null}
      <span className={`tlalur ${c.alur}`} title={aspek ? `${LABEL_ALUR[c.alur]} ${aspek.nama}` : LABEL_ALUR[c.alur]}>
        {LABEL_ALUR[c.alur]}
      </span>
      <p id={idMeta} className="tlmeta">
        {!ringkas && (
          <>
            <span className={bisa ? "tlsaya" : "tllain"}>{bisa ? "Tugas Anda" : `Tugas ${pemilik.label}`}</span>
            {" · "}
          </>
        )}
        {rincian}
      </p>
    </li>
  );
}
