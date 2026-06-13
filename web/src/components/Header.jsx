import styles from "./Header.module.css";

export default function Header({ userName = "Demo User", role = "Kepala Sekolah", schoolName = "SMA Contoh", onLogout }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>F</span>
          <span className={styles.logoText}>Fammi<em>IR</em></span>
        </div>

        <div className={styles.right}>
          <span className={styles.schoolName}>{schoolName}</span>
          <div className={styles.userChip}>
            <span className={styles.avatar}>{userName.charAt(0)}</span>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{userName}</span>
              <span className={styles.rolePill}>{role}</span>
            </div>
          </div>
          {onLogout && (
            <button className={styles.logoutBtn} onClick={onLogout} title="Keluar">
              Keluar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
