import { useProteksi } from "../konteks";
import { Ikon, KepalaKartu } from "../komponen";
import { ORANG } from "../layarProteksi";
import { PilStatus } from "../bersama/HeartKecil";
import { HEART, LAPORAN_RAKA, URUTAN_STATUS, cariAspek } from "../bersama/heart";
import { LABEL_ALUR, PEMILIK, checklistAnak } from "../bersama/tindakLanjut";
import { EVALUASI, TUJUAN } from "./profilAnakData";

const NAMA_ANAK = LAPORAN_RAKA.anak.nama;
const BUTIR = checklistAnak(NAMA_ANAK);

/**
 * Butir checklist Raka dikelompokkan: per aspek HEART (status terberat dulu), lalu yang berlaku untuk
 * semua aspek, lalu penugasan dari tiap kasus (alur kejadian) secara terpisah.
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
  const umum = butir.filter((c) => !c.kasus && c.aspek === null);
  if (umum.length) grup.push({ id: "semua", judul: "Semua aspek", butir: umum });
  for (const kasus of [...new Set(butir.filter((c) => c.kasus).map((c) => c.kasus))]) {
    grup.push({ id: kasus, judul: `Dari kasus ${kasus}`, kasus, butir: butir.filter((c) => c.kasus === kasus) });
  }
  return grup;
}

const GRUP = kelompokkan(BUTIR);

/**
 * Tindak lanjut dan checklist Raka (langkah "Tindak lanjut" di alur pencegahan). Tiap butir bisa
 * dicentang hanya oleh pemiliknya; centang hidup di konteks prototipe sehingga ikut terlihat di
 * Ruang wali kelas dan aplikasi orang tua. Setiap butir yang diselesaikan memberi tahu Guru BK.
 */
export default function ProfilAnakTindak() {
  const { peran, pindah, toast, beriTahu, centang, ubahCentang } = useProteksi();
  const selesai = (c) => centang[c.id] ?? c.selesai;
  const jumlahSelesai = BUTIR.filter(selesai).length;
  const namaSaya = ORANG[peran]?.nama ?? "Wali kelas";

  function ubah(c, nilai) {
    ubahCentang(c.id, nilai);
    if (!nilai) {
      toast(`Centang dibatalkan: ${c.judul}.`);
      return;
    }
    toast(`Checklist selesai: ${c.judul}. ${PEMILIK.bk.orang} diberi tahu.`);
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
    <section className="card tcard tl" data-bagian="tindak" aria-label="Tindak lanjut dan checklist Raka">
      <div className="tophead">
        <KepalaKartu ikon="ceklis" judul="Tindak lanjut & checklist" />
        <div className="tlprog">
          <span className="tlbatang" aria-hidden="true">
            <span style={{ width: `${(jumlahSelesai / BUTIR.length) * 100}%` }} />
          </span>
          <span>
            <b>{jumlahSelesai}</b> dari {BUTIR.length} selesai
          </span>
        </div>
      </div>

      <div className="tlinfo">
        <p>
          <b>Tujuan 4 minggu:</b> {TUJUAN}
        </p>
        <p className="tlevaluasi">
          <Ikon nama="jam" size={15} />
          {EVALUASI.ket}: <b>{EVALUASI.tanggal}</b>
        </p>
      </div>

      <div className="tlgrid">
        {GRUP.map((g) => {
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
                  <button
                    type="button"
                    className="tlkbuka"
                    onClick={() => pindah("kasus", { jenis: "kasus", id: g.kasus })}
                  >
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
                  <Butir key={c.id} c={c} selesai={selesai(c)} bisa={PEMILIK[c.oleh].peran === peran} onUbah={ubah} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="tlcatatan">
        Centang hanya butir bertanda <b>Tugas Anda</b>. Butir lain dicentang pemiliknya dan langsung terlihat di sini.
      </p>
    </section>
  );
}

/** Satu butir checklist: kotak centang, judul, pemilik dan orangnya, waktu, penanda alur. */
function Butir({ c, selesai, bisa, onUbah }) {
  const pemilik = PEMILIK[c.oleh];
  const idMeta = `anak-butir-${c.id}`;
  const aspek = c.aspek ? cariAspek(c.aspek) : null;
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
      <span className={`tlalur ${c.alur}`} title={aspek ? `${LABEL_ALUR[c.alur]} ${aspek.nama}` : LABEL_ALUR[c.alur]}>
        {LABEL_ALUR[c.alur]}
      </span>
      <p id={idMeta} className="tlmeta">
        <span className={bisa ? "tlsaya" : "tllain"}>{bisa ? "Tugas Anda" : `Tugas ${pemilik.label}`}</span>
        {` · ${pemilik.orang} · ${c.waktu}`}
        {c.ket ? ` · ${c.ket}` : ""}
      </p>
    </li>
  );
}
