import { useState } from "react";
import { tahunAjaran } from "../pages/karakter/karakterMeta";
import styles from "./PeriodPicker.module.css";

// Cuma "bulanan". Sebelum ini ada juga "Mingguan" dan "Tahunan", dan keduanya diisi DAFTAR
// CONTOH yang ditulis langsung di kode ("Pekan 3 Juni 2026", "2025 / 2026") tanpa satu pun
// penanda contoh.
//
// Itu bukan sekadar tidak berguna, itu menyesatkan. Memilih salah satunya mengirim id periode
// yang tidak pernah cocok dengan periode_id mana pun di database, jadi halaman jatuh ke periode
// bawaannya -- dan ketiga "pekan" itu menampilkan angka yang sama persis. Pemakai membacanya
// sebagai "pekan 1, 2, dan 3 datanya sama", padahal tidak ada satu pun data pekanan di situ.
// Terlaporkan dari produksi 2026-08-28.
//
// Melanggar CLAUDE.md juga: "Jangan menampilkan angka contoh seolah temuan nyata."
//
// Tampilan pekanan sekarang ada di tempat yang benar: penyaring Per bulan / Per pekan pada
// grafik tren, yang datanya dari karakter_pekan_avg. Tahun ajaran jadi pengelompokan di daftar
// bulan di bawah, bukan tipe periode tersendiri.
// Tipe periode yang BENAR-BENAR punya data. "Mingguan" cuma muncul kalau sekolahnya memang
// mengisi pekan; "Tahunan" sudah dibuang sejak c7c3a64 dan tidak dihidupkan lagi karena tidak
// ada agregat setahun di mana pun.
//
// Ketiganya dulu diisi daftar CONTOH yang ditulis langsung di kode, tanpa penanda contoh. Itu
// menghasilkan tiga "Pekan Juni 2026" yang datanya sama persis karena id-nya tidak pernah cocok
// dengan periode mana pun (terlaporkan dari produksi 2026-08-28). Sekarang setiap pilihan di sini
// berasal dari baris yang ada di database.
const TYPE_BULANAN = { id: "bulanan", label: "Bulanan" };
const TYPE_MINGGUAN = { id: "mingguan", label: "Mingguan" };

/**
 * PeriodPicker — pemilih tipe dan label periode.
 * Mengontrol konteks seluruh halaman saat dipilih.
 *
 * selectedType: cuma "bulanan" (lihat PERIOD_TYPES di atas).
 * selectedPeriod: periode_id yang dipilih ("2026-08").
 * onSelect: callback({ type, period }).
 * bulananOptions: [{ id, label }] periode ASLI milik sekolah yang login, terbaru dulu. Kalau
 * kosong, daftarnya kosong dan pemakai diberi tahu -- BUKAN diisi contoh, karena contoh yang
 * tidak bertanda tidak bisa dibedakan dari data sungguhan.
 */
export default function PeriodPicker({
  selectedType = "bulanan",
  selectedPeriod = "",
  onSelect = () => {},
  bulananOptions,
  mingguanOptions,
}) {
  const [open, setOpen] = useState(false);
  const [activeType, setActiveType] = useState(selectedType);

  const opsiBulanan = bulananOptions && bulananOptions.length > 0 ? bulananOptions : [];
  const opsiMingguan = mingguanOptions && mingguanOptions.length > 0 ? mingguanOptions : [];
  // Tab Mingguan cuma ada kalau sekolahnya memang punya pekan. Tab yang selalu kosong lebih
  // membingungkan daripada tidak ada tabnya sama sekali.
  const tipeTersedia = opsiMingguan.length > 0 ? [TYPE_MINGGUAN, TYPE_BULANAN] : [TYPE_BULANAN];
  const tipeEfektif = tipeTersedia.some((t) => t.id === activeType) ? activeType : TYPE_BULANAN.id;
  const periodsForType = tipeEfektif === "mingguan" ? opsiMingguan : opsiBulanan;
  // Label di tombol dicari di KEDUA daftar: periode yang sedang aktif bisa saja mingguan
  // sementara panel kebetulan sedang menampilkan tab bulanan.
  const semuaOpsi = [...opsiMingguan, ...opsiBulanan];

  const selectedLabel = semuaOpsi.find((o) => o.id === selectedPeriod)?.label ?? selectedPeriod;

  /**
   * Bulan dikelompokkan per tahun ajaran (Juli sampai Juni), pilihan pemilik produk atas
   * penyaring tahun ajaran tersendiri: satu daftar, dengan judul kelompok.
   *
   * Kenapa penting: satu sekolah bisa memakai kerangka karakter yang BERBEDA antar tahun ajaran,
   * dan anak yang tahun lalu Kelas 1 tahun ini Kelas 2. Daftar bulan yang datar membuat
   * "Oktober 2025" dan "Agustus 2026" tampak sederajat padahal isinya tidak sebanding.
   *
   * Periode yang bentuknya bukan "YYYY-MM" (kalau ada, dari data lama) dikumpulkan di kelompok
   * tanpa judul di paling bawah, bukan dibuang -- data yang tidak dikenali tetap harus bisa
   * dipilih.
   */
  const grup = [];
  periodsForType.forEach((opt) => {
    // Id mingguan berbentuk "2026-08|P3"; ambil bagian bulannya dulu supaya pengelompokan tahun
    // ajaran berlaku untuk kedua tipe, bukan cuma bulanan.
    const ta = tahunAjaran(String(opt.id).split("|")[0]);
    const kunci = ta || "";
    let g = grup.find((x) => x.ta === kunci);
    if (!g) { g = { ta: kunci, items: [] }; grup.push(g); }
    g.items.push(opt);
  });
  // Tahun ajaran terbaru di atas, mengikuti urutan bulananOptions yang memang terbaru dulu.
  grup.sort((a, b) => (b.ta || "").localeCompare(a.ta || ""));

  function handleTypeClick(typeId) {
    setActiveType(typeId);
  }

  function handlePeriodClick(periodId) {
    onSelect({ type: tipeEfektif, period: periodId });
    setOpen(false);
  }

  return (
    <div className={styles.wrapper}>
      {/* Trigger */}
      <button
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={styles.triggerLabel}>
          <span className={styles.typeTag}>{selectedType === "mingguan" ? "Mingguan" : "Bulanan"}</span>
          <span className={styles.periodText}>{selectedLabel || "Pilih periode"}</span>
        </span>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} aria-hidden="true" />
          <div className={styles.panel} role="dialog" aria-label="Pilih periode">
            {/* Tipe periode */}
            <div className={styles.typeRow}>
              {tipeTersedia.map((t) => (
                <button
                  key={t.id}
                  className={`${styles.typeBtn} ${tipeEfektif === t.id ? styles.typeBtnActive : ""}`}
                  onClick={() => handleTypeClick(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Daftar periode */}
            <ul className={styles.list} role="listbox" aria-label="Pilih periode">
              {periodsForType.length === 0 ? (
                <li className={styles.emptyNote}>Belum ada periode dengan data untuk sekolah ini.</li>
              ) : grup.map((g) => (
                <li key={g.ta || "lainnya"}>
                  {/* Judul kelompok cuma ditulis kalau tahun ajarannya lebih dari satu. Sekolah
                      yang datanya masih dalam satu tahun ajaran tidak perlu melihat judul yang
                      tidak membedakan apa pun. */}
                  {grup.length > 1 && (
                    <p className={styles.groupHead}>{g.ta ? `Tahun Ajaran ${g.ta}` : "Periode lain"}</p>
                  )}
                  <ul className={styles.groupList}>
                    {g.items.map((opt) => (
                      <li key={opt.id} role="option" aria-selected={opt.id === selectedPeriod}>
                        <button
                          className={`${styles.item} ${opt.id === selectedPeriod ? styles.itemActive : ""}`}
                          onClick={() => handlePeriodClick(opt.id)}
                        >
                          {opt.label}
                          {opt.id === selectedPeriod && (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                              <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
