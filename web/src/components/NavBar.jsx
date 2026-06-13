import styles from "./NavBar.module.css";

const NAV_ITEMS = [
  { id: "overview", label: "Ringkasan" },
  { id: "karakter", label: "Rapor Karakter" },
  { id: "screening", label: "Screening" },
  { id: "mi", label: "Multiple Intelligence" },
];

/**
 * NavBar — tab navigasi modul di bawah Header.
 * activeTab: id tab yang sedang aktif.
 * onTabChange: callback(id).
 * modules: array id modul yang aktif (sesuai langganan sekolah).
 */
export default function NavBar({
  activeTab = "overview",
  onTabChange = () => {},
  modules = ["overview", "karakter", "screening", "mi"],
}) {
  const visible = NAV_ITEMS.filter((item) => modules.includes(item.id));

  return (
    <nav className={styles.nav} role="navigation" aria-label="Navigasi modul">
      <div className={styles.inner}>
        <ul className={styles.list} role="list">
          {visible.map((item) => (
            <li key={item.id}>
              <button
                className={`${styles.tab} ${activeTab === item.id ? styles.active : ""}`}
                onClick={() => onTabChange(item.id)}
                aria-current={activeTab === item.id ? "page" : undefined}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
