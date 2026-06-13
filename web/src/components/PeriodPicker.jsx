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

/**
 * PeriodPicker — pemilih tipe dan label periode.
 * Mengontrol konteks seluruh halaman saat dipilih.
 *
 * selectedType: "mingguan" | "bulanan" | "tahunan"
 * selectedPeriod: string label periode
 * onSelect: callback({ type, period })
 */
export default function PeriodPicker({
  selectedType = "bulanan",
  selectedPeriod = "Juni 2026",
  onSelect = () => {},
}) {
  const [open, setOpen] = useState(false);
  const [activeType, setActiveType] = useState(selectedType);

  const periodsForType = SAMPLE_PERIODS[activeType] || [];

  function handleTypeClick(typeId) {
    setActiveType(typeId);
  }

  function handlePeriodClick(period) {
    onSelect({ type: activeType, period });
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
          <span className={styles.periodText}>{selectedPeriod}</span>
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
              {periodsForType.map((p) => (
                <li key={p} role="option" aria-selected={p === selectedPeriod}>
                  <button
                    className={`${styles.item} ${p === selectedPeriod ? styles.itemActive : ""}`}
                    onClick={() => handlePeriodClick(p)}
                  >
                    {p}
                    {p === selectedPeriod && (
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
