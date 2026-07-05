import { useState } from "react";
import styles from "./PeriodPicker.module.css";

const PERIOD_TYPES = [
  { id: "mingguan", label: "Mingguan" },
  { id: "bulanan", label: "Bulanan" },
  { id: "tahunan", label: "Tahunan" },
];

const SAMPLE_PERIODS = {
  mingguan: ["Pekan 3 Juni 2026", "Pekan 2 Juni 2026", "Pekan 1 Juni 2026"],
  bulanan:  ["Juni 2026", "Mei 2026", "April 2026"],
  tahunan:  ["2025 / 2026", "2024 / 2025"],
};

function toOptionShape(values) {
  return values.map((v) => ({ id: v, label: v }));
}

/**
 * PeriodPicker — pemilih tipe dan label periode.
 * Mengontrol konteks seluruh halaman saat dipilih.
 *
 * selectedType: "mingguan" | "bulanan" | "tahunan"
 * selectedPeriod: id periode yang dipilih (string)
 * onSelect: callback({ type, period }) — period berupa id (periode_id asli kalau bulananOptions dipakai)
 * bulananOptions: opsional, [{ id, label }] data periode bulanan ASLI dari sekolah yang login.
 * Kalau tidak diisi, jatuh ke contoh statis (dipakai modul yang belum punya data periode nyata).
 */
export default function PeriodPicker({
  selectedType = "bulanan",
  selectedPeriod = "Juni 2026",
  onSelect = () => {},
  bulananOptions,
}) {
  const [open, setOpen] = useState(false);
  const [activeType, setActiveType] = useState(selectedType);

  const periodsForType =
    activeType === "bulanan" && bulananOptions && bulananOptions.length > 0
      ? bulananOptions
      : toOptionShape(SAMPLE_PERIODS[activeType] || []);

  const selectedLabel = periodsForType.find((o) => o.id === selectedPeriod)?.label ?? selectedPeriod;

  function handleTypeClick(typeId) {
    setActiveType(typeId);
  }

  function handlePeriodClick(periodId) {
    onSelect({ type: activeType, period: periodId });
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
          <span className={styles.typeTag}>{selectedType}</span>
          <span className={styles.periodText}>{selectedLabel}</span>
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
              {PERIOD_TYPES.map((t) => (
                <button
                  key={t.id}
                  className={`${styles.typeBtn} ${activeType === t.id ? styles.typeBtnActive : ""}`}
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
              ) : periodsForType.map((opt) => (
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
          </div>
        </>
      )}
    </div>
  );
}
