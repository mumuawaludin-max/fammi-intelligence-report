import styles from "./FollowupRibbon.module.css";
import SectionHeading from "./SectionHeading";
import FollowupCard from "./FollowupCard";
import SampleTag from "./SampleTag";

const URUTAN_PRIORITAS = { tinggi: 0, sedang: 1, rendah: 2 };

export default function FollowupRibbon({ items = [], isSample = false }) {
  const sorted = [...items].sort(
    (a, b) =>
      (URUTAN_PRIORITAS[a.priority] ?? 9) - (URUTAN_PRIORITAS[b.priority] ?? 9)
  );

  return (
    <section className={styles.ribbon}>
      <div className={styles.headingRow}>
        <SectionHeading
          title="Tindak Lanjut Prioritas"
          subtitle="Langkah konkret berdasarkan temuan periode ini"
        />
        {isSample && <SampleTag />}
      </div>

      {sorted.length === 0 ? (
        <p className={styles.empty}>Belum ada tindak lanjut untuk periode ini.</p>
      ) : (
        <div className={styles.grid}>
          {sorted.map((item) => (
            <FollowupCard
              key={item.id}
              action={item.action}
              trigger={item.trigger}
              module={item.module}
              priority={item.priority}
            />
          ))}
        </div>
      )}
    </section>
  );
}
